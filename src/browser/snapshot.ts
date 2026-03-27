import { getActivePage } from './manager.js';

export async function captureSnapshot(): Promise<string> {
  const page = await getActivePage();

  // Use page.accessibility.snapshot() if available (older Playwright),
  // otherwise fall back to aria snapshot via locator
  try {
    if (page.accessibility && typeof page.accessibility.snapshot === 'function') {
      const snapshot = await page.accessibility.snapshot();
      if (snapshot) {
        return formatA11yTree(snapshot, 0);
      }
    }
  } catch {
    // Fall through to ariaSnapshot approach
  }

  // Playwright 1.49+ uses locator.ariaSnapshot()
  try {
    const snapshot = await page.locator('body').ariaSnapshot();
    if (snapshot) {
      return snapshot;
    }
  } catch {
    // Fall through to DOM extraction
  }

  // Final fallback: extract a useful DOM summary via JS
  const domSnapshot = await page.evaluate(() => {
    const walk = (el: Element, depth: number): string => {
      const indent = '  '.repeat(depth);
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || '';
      const label = el.getAttribute('aria-label') || el.getAttribute('alt') || '';
      const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? (el.childNodes[0] as Text).textContent?.trim().slice(0, 80) || ''
        : '';

      const interactable = ['a', 'button', 'input', 'select', 'textarea'].includes(tag);
      const hasRole = !!role;
      const hasText = !!text;

      if (!interactable && !hasRole && !hasText && el.children.length === 0) return '';

      let line = `${indent}[${role || tag}]`;
      if (label) line += ` "${label}"`;
      if (text && !label) line += ` "${text}"`;
      if (tag === 'a') line += ` href="${(el as HTMLAnchorElement).href}"`;
      if (tag === 'input') {
        const inp = el as HTMLInputElement;
        line += ` type="${inp.type}" value="${inp.value}"`;
      }

      const parts = [line];
      for (const child of el.children) {
        const childResult = walk(child, depth + 1);
        if (childResult) parts.push(childResult);
      }
      return parts.join('\n');
    };
    return walk(document.body, 0);
  });

  return domSnapshot || 'No snapshot available for this page.';
}

function formatA11yTree(node: any, depth: number): string {
  const indent = '  '.repeat(depth);
  const parts: string[] = [];

  let line = `${indent}[${node.role}]`;

  if (node.name) {
    line += ` "${node.name}"`;
  }

  if (node.value) {
    line += ` value="${node.value}"`;
  }

  if (node.description) {
    line += ` desc="${node.description}"`;
  }

  const flags: string[] = [];
  if (node.focused) flags.push('focused');
  if (node.disabled) flags.push('disabled');
  if (node.checked !== undefined) flags.push(node.checked ? 'checked' : 'unchecked');
  if (node.expanded !== undefined) flags.push(node.expanded ? 'expanded' : 'collapsed');
  if (node.selected) flags.push('selected');
  if (node.required) flags.push('required');

  if (flags.length > 0) {
    line += ` (${flags.join(', ')})`;
  }

  parts.push(line);

  if (node.children) {
    for (const child of node.children) {
      parts.push(formatA11yTree(child, depth + 1));
    }
  }

  return parts.join('\n');
}
