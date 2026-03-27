import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { navigate, goBack, goForward } from '../browser/actions.js';
import { isUrlAllowed, checkRateLimit } from '../security/urlFilter.js';
import { getSecurityConfig } from '../config.js';
import type { BrowserConfig } from '../types.js';

export function registerNavigationTools(server: McpServer, config: BrowserConfig) {
  server.tool(
    'browser_navigate',
    { url: z.string().describe('URL to navigate to') },
    async ({ url }) => {
      // Get security config fresh each call (defensive)
      const security = getSecurityConfig(config.securityProfile);

      // Security checks
      const urlCheck = isUrlAllowed(url, security);
      if (!urlCheck.allowed) {
        return { content: [{ type: 'text' as const, text: `Blocked: ${urlCheck.reason}` }], isError: true };
      }

      const rateCheck = checkRateLimit(security);
      if (!rateCheck.allowed) {
        return { content: [{ type: 'text' as const, text: `Rate limited: ${rateCheck.reason}` }], isError: true };
      }

      try {
        const result = await navigate(url);
        return {
          content: [{
            type: 'text' as const,
            text: `Navigated to: ${result.url}\nTitle: ${result.title}`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Navigation failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_go_back',
    {},
    async () => {
      try {
        const result = await goBack();
        return {
          content: [{ type: 'text' as const, text: `Navigated back to: ${result.url}\nTitle: ${result.title}` }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Go back failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_go_forward',
    {},
    async () => {
      try {
        const result = await goForward();
        return {
          content: [{ type: 'text' as const, text: `Navigated forward to: ${result.url}\nTitle: ${result.title}` }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Go forward failed: ${err.message}` }], isError: true };
      }
    }
  );
}
