import type { Page } from 'playwright-core';
import type { WatchEventType, WatchedEvent, EventWatcherConfig } from '../types.js';

interface ActiveWatcher {
  config: EventWatcherConfig;
  events: WatchedEvent[];
  cleanupFns: (() => void)[];
  startedAt: number;
}

let _activeWatcher: ActiveWatcher | null = null;

export function startWatching(page: Page, config: EventWatcherConfig): void {
  // Stop any existing watcher
  if (_activeWatcher) {
    stopWatching();
  }

  const watcher: ActiveWatcher = {
    config,
    events: [],
    cleanupFns: [],
    startedAt: Date.now(),
  };

  const maxEvents = config.maxEvents || 1000;

  const addEvent = (type: WatchEventType, data: Record<string, unknown>) => {
    if (watcher.events.length < maxEvents) {
      watcher.events.push({ type, timestamp: Date.now(), data });
    }
  };

  for (const eventType of config.events) {
    switch (eventType) {
      case 'console:error': {
        const handler = (msg: any) => {
          if (msg.type() === 'error') {
            addEvent('console:error', { text: msg.text(), url: msg.location()?.url });
          }
        };
        page.on('console', handler);
        watcher.cleanupFns.push(() => page.off('console', handler));
        break;
      }

      case 'console:warn': {
        const handler = (msg: any) => {
          if (msg.type() === 'warning') {
            addEvent('console:warn', { text: msg.text(), url: msg.location()?.url });
          }
        };
        page.on('console', handler);
        watcher.cleanupFns.push(() => page.off('console', handler));
        break;
      }

      case 'network:request': {
        const handler = (req: any) => {
          const url = req.url();
          if (!config.urlPattern || url.includes(config.urlPattern)) {
            addEvent('network:request', { url, method: req.method(), resourceType: req.resourceType() });
          }
        };
        page.on('request', handler);
        watcher.cleanupFns.push(() => page.off('request', handler));
        break;
      }

      case 'network:response': {
        const handler = (res: any) => {
          const url = res.url();
          if (!config.urlPattern || url.includes(config.urlPattern)) {
            addEvent('network:response', { url, status: res.status(), statusText: res.statusText() });
          }
        };
        page.on('response', handler);
        watcher.cleanupFns.push(() => page.off('response', handler));
        break;
      }

      case 'navigation': {
        const handler = (frame: any) => {
          if (frame === page.mainFrame()) {
            addEvent('navigation', { url: frame.url() });
          }
        };
        page.on('framenavigated', handler);
        watcher.cleanupFns.push(() => page.off('framenavigated', handler));
        break;
      }

      case 'dialog': {
        const handler = async (dialog: any) => {
          addEvent('dialog', { type: dialog.type(), message: dialog.message() });
          await dialog.dismiss();
        };
        page.on('dialog', handler);
        watcher.cleanupFns.push(() => page.off('dialog', handler));
        break;
      }

      case 'dom:mutation': {
        // DOM mutations are tracked via JS injection
        page.evaluate(() => {
          const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
              (window as any).__browserMcpMutations = (window as any).__browserMcpMutations || [];
              const arr = (window as any).__browserMcpMutations;
              if (arr.length < 500) {
                arr.push({
                  type: m.type,
                  target: (m.target as HTMLElement).tagName || 'text',
                  addedNodes: m.addedNodes.length,
                  removedNodes: m.removedNodes.length,
                  attributeName: m.attributeName,
                  timestamp: Date.now(),
                });
              }
            }
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });
          (window as any).__browserMcpObserver = observer;
        }).catch(() => {});
        watcher.cleanupFns.push(() => {
          page.evaluate(() => {
            (window as any).__browserMcpObserver?.disconnect();
            delete (window as any).__browserMcpObserver;
            delete (window as any).__browserMcpMutations;
          }).catch(() => {});
        });
        break;
      }
    }
  }

  _activeWatcher = watcher;
}

export async function stopWatching(page?: Page): Promise<WatchedEvent[]> {
  if (!_activeWatcher) return [];

  const watcher = _activeWatcher;

  // Collect DOM mutations if tracked
  if (watcher.config.events.includes('dom:mutation') && page) {
    try {
      const mutations = await page.evaluate(() => {
        const arr = (window as any).__browserMcpMutations || [];
        return arr;
      }) as any[];
      for (const m of mutations) {
        watcher.events.push({
          type: 'dom:mutation',
          timestamp: m.timestamp,
          data: {
            mutationType: m.type,
            target: m.target,
            addedNodes: m.addedNodes,
            removedNodes: m.removedNodes,
            attributeName: m.attributeName,
          },
        });
      }
    } catch {
      // Page might be closed
    }
  }

  // Cleanup all listeners
  for (const cleanup of watcher.cleanupFns) {
    try { cleanup(); } catch {}
  }

  const events = watcher.events;
  _activeWatcher = null;
  return events;
}

export function isWatching(): boolean {
  return _activeWatcher !== null;
}

export function getWatcherEventCount(): number {
  return _activeWatcher?.events.length || 0;
}
