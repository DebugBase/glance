import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getActivePage } from '../browser/manager.js';
import { startWatching, stopWatching, isWatching, getWatcherEventCount } from '../testing/eventWatcher.js';
import type { WatchEventType, WatchedEvent } from '../types.js';

export function registerEventTools(server: McpServer) {
  server.tool(
    'test_watch_events',
    {
      events: z.array(z.enum([
        'dom:mutation', 'network:request', 'network:response',
        'console:error', 'console:warn', 'navigation', 'dialog',
      ])).describe('Event types to watch'),
      urlPattern: z.string().optional().describe('Filter network events by URL pattern'),
      maxEvents: z.number().optional().describe('Maximum events to capture (default: 1000)'),
    },
    async ({ events, urlPattern, maxEvents }) => {
      try {
        const page = await getActivePage();
        startWatching(page, {
          events: events as WatchEventType[],
          urlPattern,
          maxEvents,
        });
        return {
          content: [{
            type: 'text' as const,
            text: `Event watcher started.\nWatching: ${events.join(', ')}${urlPattern ? `\nURL filter: ${urlPattern}` : ''}`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Watch failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'test_stop_watch',
    {},
    async () => {
      if (!isWatching()) {
        return { content: [{ type: 'text' as const, text: 'No active event watcher.' }] };
      }

      try {
        let page;
        try { page = await getActivePage(); } catch {}
        const events = await stopWatching(page);
        const text = formatEvents(events);
        return {
          content: [{
            type: 'text' as const,
            text: `Event watcher stopped. Captured ${events.length} events.\n${'='.repeat(50)}\n${text}`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Stop watch failed: ${err.message}` }], isError: true };
      }
    }
  );
}

function formatEvents(events: WatchedEvent[]): string {
  if (events.length === 0) return 'No events captured.';

  // Group by type
  const groups = new Map<string, WatchedEvent[]>();
  for (const e of events) {
    const arr = groups.get(e.type) || [];
    arr.push(e);
    groups.set(e.type, arr);
  }

  const lines: string[] = [];
  for (const [type, evts] of groups) {
    lines.push(`\n[${type}] (${evts.length} events)`);
    for (const e of evts.slice(0, 50)) {
      const time = new Date(e.timestamp).toISOString().split('T')[1].replace('Z', '');
      const data = Object.entries(e.data)
        .map(([k, v]) => `${k}=${typeof v === 'string' ? v.slice(0, 80) : v}`)
        .join(', ');
      lines.push(`  ${time} | ${data}`);
    }
    if (evts.length > 50) {
      lines.push(`  ... and ${evts.length - 50} more`);
    }
  }

  return lines.join('\n');
}
