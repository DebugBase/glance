import type { Page } from 'playwright-core';

export interface FormField {
  selector: string;
  value: string;
  type?: 'text' | 'select' | 'checkbox' | 'radio';
}

export interface AuthFlowInput {
  url: string;
  usernameSelector: string;
  usernameValue: string;
  passwordSelector: string;
  passwordValue: string;
  submitSelector: string;
  waitForSelector?: string;
  waitForUrl?: string;
}

export async function fillForm(
  page: Page,
  fields: FormField[]
): Promise<{ filled: number; errors: string[] }> {
  const errors: string[] = [];
  let filled = 0;

  for (const field of fields) {
    try {
      switch (field.type || 'text') {
        case 'text':
          await page.fill(field.selector, field.value, { timeout: 5000 });
          break;
        case 'select':
          await page.selectOption(field.selector, field.value, { timeout: 5000 });
          break;
        case 'checkbox':
          if (field.value === 'true') {
            await page.check(field.selector, { timeout: 5000 });
          } else {
            await page.uncheck(field.selector, { timeout: 5000 });
          }
          break;
        case 'radio':
          await page.check(field.selector, { timeout: 5000 });
          break;
      }
      filled++;
    } catch (err: any) {
      errors.push(`${field.selector}: ${err.message}`);
    }
  }

  return { filled, errors };
}

export async function runAuthFlow(
  page: Page,
  input: AuthFlowInput
): Promise<{ success: boolean; finalUrl: string; error?: string }> {
  try {
    // Navigate to login page
    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Fill credentials
    await page.fill(input.usernameSelector, input.usernameValue, { timeout: 5000 });
    await page.fill(input.passwordSelector, input.passwordValue, { timeout: 5000 });

    // Click submit
    await page.click(input.submitSelector, { timeout: 5000 });

    // Wait for navigation/result
    if (input.waitForUrl) {
      await page.waitForURL(input.waitForUrl, { timeout: 15000 });
    } else if (input.waitForSelector) {
      await page.waitForSelector(input.waitForSelector, { timeout: 15000 });
    } else {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }

    return { success: true, finalUrl: page.url() };
  } catch (err: any) {
    return { success: false, finalUrl: page.url(), error: err.message };
  }
}
