import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import type { BrowserConfig, ConsoleMessage, NetworkRequest } from '../types.js';
import { randomUUID } from 'crypto';

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;
let _pages: Map<string, Page> = new Map();
let _activePageId: string | null = null;
let _consoleMessages: ConsoleMessage[] = [];
let _networkRequests: NetworkRequest[] = [];
let _readyResolve: (() => void) | null = null;
let _readyPromise: Promise<void> = new Promise((r) => { _readyResolve = r; });
let _config: BrowserConfig;

const MAX_CONSOLE = 500;
const MAX_NETWORK = 500;

export async function launchBrowser(config: BrowserConfig): Promise<void> {
  _config = config;

  try {
    const launchOptions: Parameters<typeof chromium.launch>[0] = {
      headless: config.headless,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        `--window-size=${config.viewport.width},${config.viewport.height + 100}`,
      ],
    };

    if (config.channel) {
      launchOptions.channel = config.channel as any;
    }

    _browser = await chromium.launch(launchOptions);

    _browser.on('disconnected', () => {
      console.error('[glance] Browser disconnected, will relaunch on next tool call');
      _browser = null;
      _context = null;
      _pages.clear();
      _activePageId = null;
    });

    _context = await _browser.newContext({
      viewport: config.viewport,
      ignoreHTTPSErrors: true,
    });

    // Create initial page
    const page = await _context.newPage();
    const pageId = randomUUID();
    _pages.set(pageId, page);
    _activePageId = pageId;
    _setupPageListeners(page, pageId);

    _readyResolve?.();
    console.error('[glance] Browser launched and ready');
  } catch (err) {
    console.error('[glance] Failed to launch browser:', err);
    // Try with bundled chromium path detection disabled, fallback to system chrome
    try {
      _browser = await chromium.launch({
        headless: config.headless,
        channel: 'chrome',
        args: ['--no-first-run', '--no-default-browser-check'],
      });

      _context = await _browser.newContext({
        viewport: config.viewport,
        ignoreHTTPSErrors: true,
      });

      const page = await _context.newPage();
      const pageId = randomUUID();
      _pages.set(pageId, page);
      _activePageId = pageId;
      _setupPageListeners(page, pageId);

      _readyResolve?.();
      console.error('[glance] Browser launched (system Chrome) and ready');
    } catch (err2) {
      console.error('[glance] Failed to launch system Chrome:', err2);
      _readyResolve?.();
    }
  }
}

export async function ensureBrowser(): Promise<void> {
  if (!_browser || !_browser.isConnected()) {
    _readyPromise = new Promise((r) => { _readyResolve = r; });
    await launchBrowser(_config);
  }
  await _readyPromise;
}

export async function getActivePage(): Promise<Page> {
  await ensureBrowser();

  if (!_activePageId || !_pages.has(_activePageId)) {
    if (_pages.size > 0) {
      _activePageId = [..._pages.keys()][0];
    } else {
      const page = await _context!.newPage();
      const pageId = randomUUID();
      _pages.set(pageId, page);
      _activePageId = pageId;
      _setupPageListeners(page, pageId);
    }
  }

  return _pages.get(_activePageId!)!;
}

export function getPageList(): { id: string; url: string; title: string; active: boolean }[] {
  return [..._pages.entries()].map(([id, page]) => ({
    id,
    url: page.url(),
    title: '', // title() is async, we skip it for quick listing
    active: id === _activePageId,
  }));
}

export async function newPage(): Promise<{ id: string; page: Page }> {
  await ensureBrowser();
  const page = await _context!.newPage();
  const id = randomUUID();
  _pages.set(id, page);
  _activePageId = id;
  _setupPageListeners(page, id);
  return { id, page };
}

export function selectPage(pageId: string): boolean {
  if (_pages.has(pageId)) {
    _activePageId = pageId;
    return true;
  }
  return false;
}

export async function closePage(pageId?: string): Promise<boolean> {
  const id = pageId || _activePageId;
  if (!id || !_pages.has(id)) return false;

  const page = _pages.get(id)!;
  await page.close();
  _pages.delete(id);

  if (_activePageId === id) {
    _activePageId = _pages.size > 0 ? [..._pages.keys()][0] : null;
  }

  return true;
}

export function getConsoleMessages(): ConsoleMessage[] {
  return [..._consoleMessages];
}

export function clearConsoleMessages(): void {
  _consoleMessages = [];
}

export function getNetworkRequests(): NetworkRequest[] {
  return [..._networkRequests];
}

export function clearNetworkRequests(): void {
  _networkRequests = [];
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
    _context = null;
    _pages.clear();
    _activePageId = null;
    _consoleMessages = [];
    _networkRequests = [];
  }
}

function _setupPageListeners(page: Page, _pageId: string): void {
  page.on('console', (msg) => {
    _consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now(),
      url: msg.location()?.url,
      lineNumber: msg.location()?.lineNumber,
    });
    if (_consoleMessages.length > MAX_CONSOLE) {
      _consoleMessages = _consoleMessages.slice(-MAX_CONSOLE);
    }
  });

  page.on('request', (req) => {
    _networkRequests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      timestamp: Date.now(),
    });
    if (_networkRequests.length > MAX_NETWORK) {
      _networkRequests = _networkRequests.slice(-MAX_NETWORK);
    }
  });

  page.on('response', (res) => {
    const entry = _networkRequests.find(
      (r) => r.url === res.url() && !r.status
    );
    if (entry) {
      entry.status = res.status();
      entry.statusText = res.statusText();
      entry.duration = Date.now() - entry.timestamp;
    }
  });

  page.on('close', () => {
    _pages.delete(_pageId);
    if (_activePageId === _pageId) {
      _activePageId = _pages.size > 0 ? [..._pages.keys()][0] : null;
    }
  });
}
