import type { Page } from 'playwright-core';
import { getActivePage } from './manager.js';

export async function navigate(url: string): Promise<{ url: string; title: string }> {
  const page = await getActivePage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return { url: page.url(), title: await page.title() };
}

export async function click(selector: string): Promise<void> {
  const page = await getActivePage();

  // Detect whether this is a CSS/Playwright selector or plain text.
  // CSS selectors start with: # . [ tag: or contain combinators like > ~ + >>
  const cssPatterns = /^[#.\[]|^[a-z][\w-]*(\s*[>~+,\s]|$|\[|\.|#|:)|>>|^text=|^role=/i;
  const hasSpaces = /\s/.test(selector.trim());
  const startsWithTag = /^[a-z][\w-]*(\[|\.|#|:|$)/i.test(selector);
  const looksLikeCSS = (cssPatterns.test(selector) && !hasSpaces) || startsWithTag || selector.startsWith('text=') || selector.includes('>>');

  if (looksLikeCSS) {
    await page.click(selector, { timeout: 10000 });
  } else {
    // Try clicking by text content using Playwright's text selector
    try {
      await page.getByText(selector, { exact: false }).first().click({ timeout: 10000 });
    } catch {
      // Fallback: try role-based matching
      try {
        await page.getByRole('link', { name: selector }).first().click({ timeout: 5000 });
      } catch {
        await page.getByRole('button', { name: selector }).first().click({ timeout: 5000 });
      }
    }
  }
}

export async function type(selector: string, value: string): Promise<void> {
  const page = await getActivePage();
  await page.fill(selector, value, { timeout: 10000 });
}

export async function hover(selector: string): Promise<void> {
  const page = await getActivePage();
  await page.hover(selector, { timeout: 10000 });
}

export async function drag(
  sourceSelector: string,
  targetSelector: string
): Promise<void> {
  const page = await getActivePage();
  await page.dragAndDrop(sourceSelector, targetSelector, { timeout: 10000 });
}

export async function selectOption(selector: string, value: string): Promise<string[]> {
  const page = await getActivePage();
  return page.selectOption(selector, value, { timeout: 10000 });
}

export async function pressKey(key: string): Promise<void> {
  const page = await getActivePage();
  await page.keyboard.press(key);
}

export async function scroll(options: {
  selector?: string;
  x?: number;
  y?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  pixels?: number;
}): Promise<void> {
  const page = await getActivePage();

  if (options.selector) {
    await page.locator(options.selector).scrollIntoViewIfNeeded({ timeout: 10000 });
    return;
  }

  const deltaX = options.x || 0;
  let deltaY = options.y || 0;

  if (options.direction) {
    const amount = options.pixels || 300;
    switch (options.direction) {
      case 'down': deltaY = amount; break;
      case 'up': deltaY = -amount; break;
    }
  }

  await page.mouse.wheel(deltaX, deltaY);
}

export async function goBack(): Promise<{ url: string; title: string }> {
  const page = await getActivePage();
  await page.goBack({ waitUntil: 'domcontentloaded' });
  return { url: page.url(), title: await page.title() };
}

export async function goForward(): Promise<{ url: string; title: string }> {
  const page = await getActivePage();
  await page.goForward({ waitUntil: 'domcontentloaded' });
  return { url: page.url(), title: await page.title() };
}

export async function evaluate(script: string): Promise<unknown> {
  const page = await getActivePage();
  return page.evaluate(script);
}

export async function takeScreenshot(options?: {
  fullPage?: boolean;
  selector?: string;
}): Promise<Buffer> {
  const page = await getActivePage();

  if (options?.selector) {
    const el = page.locator(options.selector);
    return el.screenshot({ type: 'png' }) as Promise<Buffer>;
  }

  return page.screenshot({
    type: 'png',
    fullPage: options?.fullPage || false,
  }) as Promise<Buffer>;
}

export async function waitForSelector(selector: string, timeout?: number): Promise<void> {
  const page = await getActivePage();
  await page.waitForSelector(selector, { timeout: timeout || 30000 });
}

export async function waitForText(text: string, timeout?: number): Promise<void> {
  const page = await getActivePage();
  await page.waitForFunction(
    (t: string) => document.body.innerText.includes(t),
    text,
    { timeout: timeout || 30000 }
  );
}

export async function waitForNetworkIdle(timeout?: number): Promise<void> {
  const page = await getActivePage();
  await page.waitForLoadState('networkidle', { timeout: timeout || 30000 });
}
