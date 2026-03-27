import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getActivePage, getConsoleMessages } from '../browser/manager.js';
import { runScenario, getActiveScenarioStatus, formatScenarioResult } from '../testing/scenarioRunner.js';
import { runAssertion } from '../testing/assertions.js';
import { fillForm, runAuthFlow } from '../testing/formFiller.js';
import type { BrowserConfig, TestScenario, AssertionType } from '../types.js';

const stepSchema = z.object({
  name: z.string(),
  action: z.enum([
    'navigate', 'click', 'type', 'select', 'hover', 'scroll', 'press',
    'waitForSelector', 'waitForText', 'waitForNavigation', 'waitForNetworkIdle',
    'assert', 'screenshot', 'evaluate', 'sleep',
  ]),
  selector: z.string().optional(),
  value: z.string().optional(),
  url: z.string().optional(),
  key: z.string().optional(),
  pixels: z.number().optional(),
  timeout: z.number().optional(),
  type: z.enum([
    'exists', 'notExists', 'textContains', 'textEquals',
    'hasAttribute', 'hasClass', 'isVisible', 'isEnabled',
    'urlContains', 'urlEquals', 'countEquals', 'consoleNoErrors',
  ]).optional(),
  expected: z.union([z.string(), z.number()]).optional(),
  attribute: z.string().optional(),
  script: z.string().optional(),
  ms: z.number().optional(),
  screenshotName: z.string().optional(),
});

export function registerTestingTools(server: McpServer, config: BrowserConfig) {
  server.tool(
    'test_scenario_run',
    {
      name: z.string().describe('Scenario name'),
      baseUrl: z.string().optional().describe('Base URL (e.g., http://localhost:3000)'),
      steps: z.array(stepSchema).describe('Array of test steps to execute'),
    },
    async ({ name, baseUrl, steps }) => {
      try {
        const page = await getActivePage();
        const scenario: TestScenario = { name, baseUrl, steps: steps as any };
        const consoleMessages = getConsoleMessages();
        const result = await runScenario(page, scenario, config.sessionsDir, consoleMessages);
        const text = formatScenarioResult(result);

        // Take final screenshot for visual confirmation
        let screenshotContent: any[] = [];
        try {
          const buf = await page.screenshot({ type: 'png' });
          screenshotContent = [{
            type: 'image' as const,
            data: buf.toString('base64'),
            mimeType: 'image/png',
          }];
        } catch {}

        return {
          content: [
            { type: 'text' as const, text },
            ...screenshotContent,
          ],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Scenario failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'test_scenario_status',
    {},
    async () => {
      const status = getActiveScenarioStatus();
      if (!status) {
        return { content: [{ type: 'text' as const, text: 'No scenario is currently running.' }] };
      }
      const lines = [
        `Scenario: ${status.name}`,
        `Status: ${status.status}`,
        `Progress: ${status.currentStep}/${status.totalSteps} steps`,
      ];
      for (const r of status.results) {
        const icon = r.status === 'pass' ? 'PASS' : r.status === 'fail' ? 'FAIL' : 'SKIP';
        lines.push(`  [${icon}] ${r.stepName}`);
      }
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  server.tool(
    'test_assert',
    {
      type: z.enum([
        'exists', 'notExists', 'textContains', 'textEquals',
        'hasAttribute', 'hasClass', 'isVisible', 'isEnabled',
        'urlContains', 'urlEquals', 'countEquals', 'consoleNoErrors',
      ]).describe('Assertion type'),
      selector: z.string().optional().describe('CSS selector'),
      expected: z.union([z.string(), z.number()]).optional().describe('Expected value'),
      attribute: z.string().optional().describe('Attribute name (for hasAttribute)'),
    },
    async ({ type, selector, expected, attribute }) => {
      try {
        const page = await getActivePage();
        const consoleMessages = getConsoleMessages();
        const result = await runAssertion(page, {
          type: type as AssertionType,
          selector,
          expected,
          attribute,
        }, consoleMessages);

        const status = result.pass ? 'PASS' : 'FAIL';
        return {
          content: [{
            type: 'text' as const,
            text: `[${status}] ${result.message}${result.actual !== undefined ? `\nActual: ${result.actual}` : ''}`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Assertion error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'test_fill_form',
    {
      fields: z.array(z.object({
        selector: z.string().describe('CSS selector of the form field'),
        value: z.string().describe('Value to fill'),
        type: z.enum(['text', 'select', 'checkbox', 'radio']).optional().describe('Field type (default: text)'),
      })).describe('Array of form fields to fill'),
    },
    async ({ fields }) => {
      try {
        const page = await getActivePage();
        const result = await fillForm(page, fields);
        const text = `Filled ${result.filled}/${fields.length} fields.${
          result.errors.length > 0 ? `\nErrors:\n${result.errors.map((e) => `  - ${e}`).join('\n')}` : ''
        }`;
        return { content: [{ type: 'text' as const, text }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Form fill failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'test_auth_flow',
    {
      url: z.string().describe('Login page URL'),
      usernameSelector: z.string().describe('CSS selector for username/email input'),
      usernameValue: z.string().describe('Username or email'),
      passwordSelector: z.string().describe('CSS selector for password input'),
      passwordValue: z.string().describe('Password'),
      submitSelector: z.string().describe('CSS selector for submit/login button'),
      waitForSelector: z.string().optional().describe('Wait for this element after login'),
      waitForUrl: z.string().optional().describe('Wait for URL to match after login'),
    },
    async ({ url, usernameSelector, usernameValue, passwordSelector, passwordValue, submitSelector, waitForSelector, waitForUrl }) => {
      try {
        const page = await getActivePage();
        const result = await runAuthFlow(page, {
          url, usernameSelector, usernameValue, passwordSelector, passwordValue,
          submitSelector, waitForSelector, waitForUrl,
        });

        // Take screenshot of final state
        let screenshotContent: any[] = [];
        try {
          const buf = await page.screenshot({ type: 'png' });
          screenshotContent = [{
            type: 'image' as const,
            data: buf.toString('base64'),
            mimeType: 'image/png',
          }];
        } catch {}

        const status = result.success ? 'SUCCESS' : 'FAILED';
        return {
          content: [
            { type: 'text' as const, text: `Auth Flow: ${status}\nFinal URL: ${result.finalUrl}${result.error ? `\nError: ${result.error}` : ''}` },
            ...screenshotContent,
          ],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Auth flow failed: ${err.message}` }], isError: true };
      }
    }
  );
}
