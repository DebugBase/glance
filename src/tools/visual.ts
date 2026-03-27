import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { saveBaseline, compareWithBaseline } from '../visual/compare.js';
import type { BrowserConfig } from '../types.js';
import { readFile } from 'fs/promises';

export function registerVisualTools(server: McpServer, config: BrowserConfig) {
  server.tool(
    'visual_baseline',
    {
      name: z.string().describe('Baseline name (e.g., "homepage", "login-form")'),
    },
    async ({ name }) => {
      try {
        const path = await saveBaseline(name);
        return {
          content: [{ type: 'text' as const, text: `Baseline saved: ${name}\nPath: ${path}` }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Baseline save failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'visual_compare',
    {
      name: z.string().describe('Baseline name to compare against'),
    },
    async ({ name }) => {
      try {
        const result = await compareWithBaseline(name, config.sessionsDir);

        // Read diff image for inline display
        let diffContent: any[] = [];
        try {
          const diffBuffer = await readFile(result.diffPath);
          diffContent = [{
            type: 'image' as const,
            data: diffBuffer.toString('base64'),
            mimeType: 'image/png',
          }];
        } catch {}

        const status = result.match ? 'MATCH' : 'CHANGED';
        const text = [
          `Visual Comparison: ${status}`,
          `Diff: ${result.diffPercentage}% (${result.diffPixels}/${result.totalPixels} pixels)`,
          `Baseline: ${result.baselinePath}`,
          `Current: ${result.currentPath}`,
          `Diff image: ${result.diffPath}`,
        ].join('\n');

        return {
          content: [
            { type: 'text' as const, text },
            ...diffContent,
          ],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Compare failed: ${err.message}` }], isError: true };
      }
    }
  );
}
