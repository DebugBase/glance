import type { Page } from 'playwright-core';
import type { AssertionType, ConsoleMessage } from '../types.js';

export interface AssertionInput {
  type: AssertionType;
  selector?: string;
  expected?: string | number;
  attribute?: string;
}

export interface AssertionResult {
  pass: boolean;
  message: string;
  actual?: string | number | boolean;
}

export async function runAssertion(
  page: Page,
  input: AssertionInput,
  consoleMessages: ConsoleMessage[] = []
): Promise<AssertionResult> {
  const { type, selector, expected, attribute } = input;

  try {
    switch (type) {
      case 'exists': {
        const count = await page.locator(selector!).count();
        return {
          pass: count > 0,
          message: count > 0 ? `Element "${selector}" exists (${count} found)` : `Element "${selector}" not found`,
          actual: count,
        };
      }

      case 'notExists': {
        const count = await page.locator(selector!).count();
        return {
          pass: count === 0,
          message: count === 0 ? `Element "${selector}" does not exist` : `Element "${selector}" exists (${count} found)`,
          actual: count,
        };
      }

      case 'textContains': {
        const text = await page.locator(selector!).first().innerText();
        const contains = text.includes(String(expected));
        return {
          pass: contains,
          message: contains
            ? `Element "${selector}" contains "${expected}"`
            : `Element "${selector}" text "${text.slice(0, 100)}" does not contain "${expected}"`,
          actual: text.slice(0, 200),
        };
      }

      case 'textEquals': {
        const text = await page.locator(selector!).first().innerText();
        const equals = text.trim() === String(expected).trim();
        return {
          pass: equals,
          message: equals
            ? `Element "${selector}" text equals "${expected}"`
            : `Element "${selector}" text "${text.slice(0, 100)}" does not equal "${expected}"`,
          actual: text.slice(0, 200),
        };
      }

      case 'hasAttribute': {
        const value = await page.locator(selector!).first().getAttribute(attribute!);
        const matches = value === String(expected);
        return {
          pass: matches,
          message: matches
            ? `Element "${selector}" has ${attribute}="${expected}"`
            : `Element "${selector}" ${attribute}="${value}" (expected "${expected}")`,
          actual: value ?? undefined,
        };
      }

      case 'hasClass': {
        const classes = await page.locator(selector!).first().getAttribute('class');
        const has = classes?.split(/\s+/).includes(String(expected)) ?? false;
        return {
          pass: has,
          message: has
            ? `Element "${selector}" has class "${expected}"`
            : `Element "${selector}" classes "${classes}" do not include "${expected}"`,
          actual: classes ?? '',
        };
      }

      case 'isVisible': {
        const visible = await page.locator(selector!).first().isVisible();
        return {
          pass: visible,
          message: visible ? `Element "${selector}" is visible` : `Element "${selector}" is not visible`,
          actual: visible,
        };
      }

      case 'isEnabled': {
        const enabled = await page.locator(selector!).first().isEnabled();
        return {
          pass: enabled,
          message: enabled ? `Element "${selector}" is enabled` : `Element "${selector}" is disabled`,
          actual: enabled,
        };
      }

      case 'urlContains': {
        const url = page.url();
        const contains = url.includes(String(expected));
        return {
          pass: contains,
          message: contains
            ? `URL "${url}" contains "${expected}"`
            : `URL "${url}" does not contain "${expected}"`,
          actual: url,
        };
      }

      case 'urlEquals': {
        const url = page.url();
        const equals = url === String(expected);
        return {
          pass: equals,
          message: equals
            ? `URL equals "${expected}"`
            : `URL "${url}" does not equal "${expected}"`,
          actual: url,
        };
      }

      case 'countEquals': {
        const count = await page.locator(selector!).count();
        const equals = count === Number(expected);
        return {
          pass: equals,
          message: equals
            ? `Found ${count} elements matching "${selector}"`
            : `Found ${count} elements matching "${selector}" (expected ${expected})`,
          actual: count,
        };
      }

      case 'consoleNoErrors': {
        const errors = consoleMessages.filter((m) => m.type === 'error');
        return {
          pass: errors.length === 0,
          message: errors.length === 0
            ? 'No console errors'
            : `Found ${errors.length} console errors:\n${errors.map((e) => `  - ${e.text}`).join('\n')}`,
          actual: errors.length,
        };
      }

      default:
        return { pass: false, message: `Unknown assertion type: ${type}` };
    }
  } catch (err: any) {
    return { pass: false, message: `Assertion error: ${err.message}` };
  }
}
