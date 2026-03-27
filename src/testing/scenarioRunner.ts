import type { Page } from 'playwright-core';
import type {
  TestScenario, TestStep, StepResult, ScenarioResult, ConsoleMessage,
} from '../types.js';
import { runAssertion } from './assertions.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

let _activeScenario: {
  scenario: TestScenario;
  results: StepResult[];
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
} | null = null;

export function getActiveScenarioStatus(): {
  name: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  results: StepResult[];
} | null {
  if (!_activeScenario) return null;
  return {
    name: _activeScenario.scenario.name,
    status: _activeScenario.status,
    currentStep: _activeScenario.results.length,
    totalSteps: _activeScenario.scenario.steps.length,
    results: _activeScenario.results,
  };
}

export async function runScenario(
  page: Page,
  scenario: TestScenario,
  sessionsDir: string,
  consoleMessages: ConsoleMessage[] = []
): Promise<ScenarioResult> {
  const startTime = Date.now();
  const results: StepResult[] = [];

  _activeScenario = {
    scenario,
    results,
    status: 'running',
    startedAt: startTime,
  };

  // Create scenario screenshots directory
  const scenarioDir = join(sessionsDir, 'scenarios', `${scenario.name.replace(/\s+/g, '-')}-${Date.now()}`);
  await mkdir(join(scenarioDir, 'screenshots'), { recursive: true });

  let failed = false;

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];
    const stepStart = Date.now();

    if (failed) {
      results.push({
        stepIndex: i,
        stepName: step.name,
        action: step.action,
        status: 'skip',
        duration: 0,
      });
      continue;
    }

    try {
      const screenshotPath = await executeStep(page, step, scenario.baseUrl, scenarioDir, i, consoleMessages);

      results.push({
        stepIndex: i,
        stepName: step.name,
        action: step.action,
        status: 'pass',
        duration: Date.now() - stepStart,
        screenshotPath,
      });
    } catch (err: any) {
      // Take error screenshot
      let errorScreenshotPath: string | undefined;
      try {
        const errBuf = await page.screenshot({ type: 'png' });
        errorScreenshotPath = join(scenarioDir, 'screenshots', `${i}-ERROR-${step.action}.png`);
        await writeFile(errorScreenshotPath, errBuf);
      } catch {}

      results.push({
        stepIndex: i,
        stepName: step.name,
        action: step.action,
        status: 'fail',
        duration: Date.now() - stepStart,
        error: err.message,
        screenshotPath: errorScreenshotPath,
      });

      // Only stop execution for action failures (navigate, click, type etc.)
      // Assertion failures should not block subsequent steps
      if (step.action !== 'assert') {
        failed = true;
      }
    }
  }

  const passedSteps = results.filter((r) => r.status === 'pass').length;
  const failedSteps = results.filter((r) => r.status === 'fail').length;
  const skippedSteps = results.filter((r) => r.status === 'skip').length;

  _activeScenario.status = failed ? 'failed' : 'completed';

  const result: ScenarioResult = {
    scenarioName: scenario.name,
    status: failed ? 'fail' : 'pass',
    totalSteps: scenario.steps.length,
    passedSteps,
    failedSteps,
    skippedSteps,
    duration: Date.now() - startTime,
    steps: results,
  };

  // Save result
  await writeFile(join(scenarioDir, 'result.json'), JSON.stringify(result, null, 2));

  _activeScenario = null;
  return result;
}

async function executeStep(
  page: Page,
  step: TestStep,
  baseUrl: string | undefined,
  scenarioDir: string,
  index: number,
  consoleMessages: ConsoleMessage[]
): Promise<string | undefined> {
  const timeout = step.timeout || 10000;

  switch (step.action) {
    case 'navigate': {
      let url = step.url!;
      if (baseUrl && url.startsWith('/')) {
        url = baseUrl + url;
      }
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      break;
    }

    case 'click':
      await page.click(step.selector!, { timeout });
      break;

    case 'type':
      await page.fill(step.selector!, step.value!, { timeout });
      break;

    case 'select':
      await page.selectOption(step.selector!, step.value!, { timeout });
      break;

    case 'hover':
      await page.hover(step.selector!, { timeout });
      break;

    case 'scroll':
      if (step.selector) {
        await page.locator(step.selector).scrollIntoViewIfNeeded({ timeout });
      } else {
        await page.mouse.wheel(0, step.pixels || 300);
      }
      break;

    case 'press':
      await page.keyboard.press(step.key!);
      break;

    case 'waitForSelector':
      await page.waitForSelector(step.selector!, { timeout });
      break;

    case 'waitForText':
      await page.waitForFunction(
        (t: string) => document.body.innerText.includes(t),
        step.expected as string,
        { timeout }
      );
      break;

    case 'waitForNavigation':
      await page.waitForNavigation({ timeout });
      break;

    case 'waitForNetworkIdle':
      await page.waitForLoadState('networkidle', { timeout });
      break;

    case 'assert': {
      const result = await runAssertion(page, {
        type: step.type!,
        selector: step.selector,
        expected: step.expected,
        attribute: step.attribute,
      }, consoleMessages);

      if (!result.pass) {
        throw new Error(`Assertion failed: ${result.message}`);
      }
      break;
    }

    case 'screenshot': {
      const buf = await page.screenshot({ type: 'png' });
      const path = join(scenarioDir, 'screenshots', `${index}-${step.screenshotName || step.action}.png`);
      await writeFile(path, buf);
      return path;
    }

    case 'evaluate':
      await page.evaluate(step.script!);
      break;

    case 'sleep':
      await new Promise((r) => setTimeout(r, step.ms || 1000));
      break;

    default:
      throw new Error(`Unknown step action: ${step.action}`);
  }

  return undefined;
}

export function formatScenarioResult(result: ScenarioResult): string {
  const lines: string[] = [
    `Scenario: ${result.scenarioName}`,
    `Status: ${result.status === 'pass' ? 'PASS' : 'FAIL'}`,
    `Duration: ${result.duration}ms`,
    `Steps: ${result.passedSteps} passed, ${result.failedSteps} failed, ${result.skippedSteps} skipped / ${result.totalSteps} total`,
    '',
    'Step Results:',
  ];

  for (const step of result.steps) {
    const icon = step.status === 'pass' ? 'PASS' : step.status === 'fail' ? 'FAIL' : 'SKIP';
    let line = `  [${icon}] ${step.stepIndex + 1}. ${step.stepName} (${step.action}) - ${step.duration}ms`;
    if (step.error) {
      line += `\n         Error: ${step.error}`;
    }
    if (step.screenshotPath) {
      line += `\n         Screenshot: ${step.screenshotPath}`;
    }
    lines.push(line);
  }

  return lines.join('\n');
}
