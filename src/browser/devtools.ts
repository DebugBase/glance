import { getConsoleMessages, getNetworkRequests, clearConsoleMessages, clearNetworkRequests } from './manager.js';
import type { ConsoleMessage, NetworkRequest } from '../types.js';

export function getConsole(options?: { type?: string; clear?: boolean }): ConsoleMessage[] {
  let messages = getConsoleMessages();

  if (options?.type) {
    messages = messages.filter((m) => m.type === options.type);
  }

  if (options?.clear) {
    clearConsoleMessages();
  }

  return messages;
}

export function getNetwork(options?: { method?: string; urlPattern?: string; clear?: boolean }): NetworkRequest[] {
  let requests = getNetworkRequests();

  if (options?.method) {
    requests = requests.filter((r) => r.method === options.method);
  }

  if (options?.urlPattern) {
    const pattern = options.urlPattern;
    requests = requests.filter((r) => r.url.includes(pattern));
  }

  if (options?.clear) {
    clearNetworkRequests();
  }

  return requests;
}

export function formatConsole(messages: ConsoleMessage[]): string {
  if (messages.length === 0) return 'No console messages.';

  return messages.map((m) => {
    const time = new Date(m.timestamp).toISOString().split('T')[1].replace('Z', '');
    const loc = m.url ? ` (${m.url}:${m.lineNumber})` : '';
    return `[${time}] [${m.type.toUpperCase()}] ${m.text}${loc}`;
  }).join('\n');
}

export function formatNetwork(requests: NetworkRequest[]): string {
  if (requests.length === 0) return 'No network requests.';

  return requests.map((r) => {
    const status = r.status ? ` -> ${r.status} ${r.statusText || ''}` : ' (pending)';
    const duration = r.duration ? ` ${r.duration}ms` : '';
    return `${r.method} ${r.url}${status}${duration} [${r.resourceType}]`;
  }).join('\n');
}
