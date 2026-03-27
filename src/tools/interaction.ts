import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { click, type as typeAction, hover, drag, selectOption, pressKey, scroll } from '../browser/actions.js';

export function registerInteractionTools(server: McpServer) {
  server.tool(
    'browser_click',
    { selector: z.string().describe('CSS selector or text to click') },
    async ({ selector }) => {
      try {
        await click(selector);
        return { content: [{ type: 'text' as const, text: `Clicked: ${selector}` }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Click failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_type',
    {
      selector: z.string().describe('CSS selector of the input element'),
      value: z.string().describe('Text to type into the element'),
    },
    async ({ selector, value }) => {
      try {
        await typeAction(selector, value);
        return { content: [{ type: 'text' as const, text: `Typed "${value}" into ${selector}` }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Type failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_hover',
    { selector: z.string().describe('CSS selector to hover over') },
    async ({ selector }) => {
      try {
        await hover(selector);
        return { content: [{ type: 'text' as const, text: `Hovered: ${selector}` }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Hover failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_drag',
    {
      sourceSelector: z.string().describe('CSS selector of drag source'),
      targetSelector: z.string().describe('CSS selector of drop target'),
    },
    async ({ sourceSelector, targetSelector }) => {
      try {
        await drag(sourceSelector, targetSelector);
        return { content: [{ type: 'text' as const, text: `Dragged ${sourceSelector} to ${targetSelector}` }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Drag failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_select_option',
    {
      selector: z.string().describe('CSS selector of the select element'),
      value: z.string().describe('Value to select'),
    },
    async ({ selector, value }) => {
      try {
        const selected = await selectOption(selector, value);
        return { content: [{ type: 'text' as const, text: `Selected "${selected.join(', ')}" in ${selector}` }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Select failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_press_key',
    { key: z.string().describe('Key to press (e.g., Enter, Tab, Escape, ArrowDown)') },
    async ({ key }) => {
      try {
        await pressKey(key);
        return { content: [{ type: 'text' as const, text: `Pressed key: ${key}` }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Press key failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_scroll',
    {
      selector: z.string().optional().describe('CSS selector to scroll into view'),
      direction: z.enum(['up', 'down', 'left', 'right']).optional().describe('Scroll direction'),
      pixels: z.number().optional().describe('Number of pixels to scroll (default 300)'),
    },
    async ({ selector, direction, pixels }) => {
      try {
        await scroll({ selector, direction, pixels });
        const desc = selector ? `Scrolled to ${selector}` : `Scrolled ${direction || 'down'} ${pixels || 300}px`;
        return { content: [{ type: 'text' as const, text: desc }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Scroll failed: ${err.message}` }], isError: true };
      }
    }
  );
}
