import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getPageList, newPage, selectPage, closePage } from '../browser/manager.js';

export function registerTabTools(server: McpServer) {
  server.tool(
    'browser_tab_list',
    {},
    async () => {
      const tabs = getPageList();
      const text = tabs.length === 0
        ? 'No tabs open.'
        : tabs.map((t, i) => `${t.active ? '>' : ' '} [${i}] ${t.id.slice(0, 8)} - ${t.url}`).join('\n');
      return { content: [{ type: 'text' as const, text: `Tabs (${tabs.length})\n${text}` }] };
    }
  );

  server.tool(
    'browser_tab_new',
    { url: z.string().optional().describe('URL to open in new tab') },
    async ({ url }) => {
      try {
        const { id, page } = await newPage();
        if (url) {
          await page.goto(url, { waitUntil: 'domcontentloaded' });
        }
        return {
          content: [{ type: 'text' as const, text: `New tab opened: ${id.slice(0, 8)} - ${page.url()}` }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `New tab failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_tab_select',
    { tabId: z.string().describe('Tab ID to switch to (first 8 chars or full UUID)') },
    async ({ tabId }) => {
      const tabs = getPageList();
      const match = tabs.find((t) => t.id.startsWith(tabId));
      if (!match) {
        return { content: [{ type: 'text' as const, text: `Tab not found: ${tabId}` }], isError: true };
      }
      selectPage(match.id);
      return { content: [{ type: 'text' as const, text: `Switched to tab: ${match.id.slice(0, 8)} - ${match.url}` }] };
    }
  );

  server.tool(
    'browser_close',
    { tabId: z.string().optional().describe('Tab ID to close (defaults to active tab)') },
    async ({ tabId }) => {
      try {
        let targetId = tabId;
        if (tabId) {
          const tabs = getPageList();
          const match = tabs.find((t) => t.id.startsWith(tabId));
          targetId = match?.id;
        }
        const closed = await closePage(targetId);
        if (!closed) {
          return { content: [{ type: 'text' as const, text: 'No tab to close.' }] };
        }
        return { content: [{ type: 'text' as const, text: 'Tab closed.' }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Close failed: ${err.message}` }], isError: true };
      }
    }
  );
}
