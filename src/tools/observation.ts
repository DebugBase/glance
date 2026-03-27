import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { takeScreenshot, evaluate } from '../browser/actions.js';
import { captureSnapshot } from '../browser/snapshot.js';
import { getConsole, getNetwork, formatConsole, formatNetwork } from '../browser/devtools.js';
import { getActivePage } from '../browser/manager.js';
import { isJsAllowed } from '../security/jsPolicy.js';
import { getSecurityConfig } from '../config.js';
import type { BrowserConfig } from '../types.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export function registerObservationTools(server: McpServer, config: BrowserConfig) {

  server.tool(
    'browser_screenshot',
    {
      fullPage: z.boolean().optional().describe('Capture full page (default: viewport only)'),
      selector: z.string().optional().describe('CSS selector to screenshot specific element'),
      savePath: z.string().optional().describe('Custom save path (default: auto-generated in sessions dir)'),
    },
    async ({ fullPage, selector, savePath }) => {
      try {
        const buffer = await takeScreenshot({ fullPage, selector });
        const base64 = buffer.toString('base64');

        // Save to disk (path traversal protection)
        const screenshotsDir = join(config.sessionsDir, 'screenshots');
        await mkdir(screenshotsDir, { recursive: true });
        const safeName = (savePath || `screenshot-${Date.now()}.png`).replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = join(screenshotsDir, safeName);
        await writeFile(filePath, buffer);

        const page = await getActivePage();
        const url = page.url();

        return {
          content: [
            { type: 'text' as const, text: `Screenshot captured\nURL: ${url}\nSaved: ${filePath}` },
            { type: 'image' as const, data: base64, mimeType: 'image/png' },
          ],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Screenshot failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_snapshot',
    {},
    async () => {
      try {
        const tree = await captureSnapshot();
        const page = await getActivePage();
        return {
          content: [{
            type: 'text' as const,
            text: `Accessibility Tree for ${page.url()}\n${'='.repeat(60)}\n${tree}`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Snapshot failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'browser_console_messages',
    {
      type: z.string().optional().describe('Filter by message type: log, error, warning, info'),
      clear: z.boolean().optional().describe('Clear messages after reading'),
    },
    async ({ type, clear }) => {
      const messages = getConsole({ type, clear });
      return {
        content: [{
          type: 'text' as const,
          text: `Console Messages (${messages.length})\n${'='.repeat(40)}\n${formatConsole(messages)}`,
        }],
      };
    }
  );

  server.tool(
    'browser_network_requests',
    {
      method: z.string().optional().describe('Filter by HTTP method (GET, POST, etc.)'),
      urlPattern: z.string().optional().describe('Filter by URL substring'),
      clear: z.boolean().optional().describe('Clear requests after reading'),
    },
    async ({ method, urlPattern, clear }) => {
      const requests = getNetwork({ method, urlPattern, clear });
      return {
        content: [{
          type: 'text' as const,
          text: `Network Requests (${requests.length})\n${'='.repeat(40)}\n${formatNetwork(requests)}`,
        }],
      };
    }
  );

  server.tool(
    'browser_evaluate',
    {
      script: z.string().describe('JavaScript code to execute in the browser context'),
    },
    async ({ script }) => {
      const security = getSecurityConfig(config.securityProfile);
      const jsCheck = isJsAllowed(security.jsExecution);
      if (!jsCheck.allowed) {
        return { content: [{ type: 'text' as const, text: `Blocked: ${jsCheck.reason}` }], isError: true };
      }

      // Audit log for security
      console.error(`[glance] evaluate: ${script.length > 200 ? script.slice(0, 200) + '...' : script}`);

      try {
        const result = await evaluate(script);
        return {
          content: [{
            type: 'text' as const,
            text: `Evaluate result:\n${JSON.stringify(result, null, 2)}`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Evaluate failed: ${err.message}` }], isError: true };
      }
    }
  );
}
