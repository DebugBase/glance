// ============================================================
// Glance - Type Definitions
// ============================================================

import type { Page, Browser, BrowserContext } from 'playwright-core';

// --- Config ---

export type SecurityProfile = 'local-dev' | 'restricted' | 'open';
export type JsExecutionPolicy = 'always' | 'disabled';

export interface BrowserConfig {
  headless: boolean;
  sessionsDir: string;
  securityProfile: SecurityProfile;
  viewport: { width: number; height: number };
  defaultTimeout: number;
  screenshotOnAction: 'always' | 'on-change' | 'manual';
  channel?: string;
}

export interface SecurityConfig {
  urlAllowlist: string[];
  urlDenylist: string[];
  jsExecution: JsExecutionPolicy;
  maxNavigationsPerMinute: number;
}

// --- Browser Manager ---

export interface BrowserState {
  browser: Browser | null;
  context: BrowserContext | null;
  pages: Map<string, Page>;
  activePageId: string | null;
  consoleMessages: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  ready: Promise<void>;
}

export interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
  url?: string;
  lineNumber?: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  resourceType: string;
  timestamp: number;
  responseHeaders?: Record<string, string>;
  duration?: number;
}

// --- Session Recording ---

export interface Session {
  id: string;
  name?: string;
  startedAt: number;
  endedAt?: number;
  actions: SessionAction[];
  screenshotPaths: string[];
  baseUrl?: string;
}

export interface SessionAction {
  index: number;
  tool: string;
  args: Record<string, unknown>;
  timestamp: number;
  duration: number;
  result: 'success' | 'error';
  screenshotPath?: string;
  error?: string;
}

// --- Test Scenario Engine ---

export interface TestScenario {
  name: string;
  baseUrl?: string;
  steps: TestStep[];
}

export interface TestStep {
  name: string;
  action: StepAction;
  selector?: string;
  value?: string;
  url?: string;
  key?: string;
  pixels?: number;
  timeout?: number;
  type?: AssertionType;
  expected?: string | number;
  attribute?: string;
  script?: string;
  ms?: number;
  screenshotName?: string;
}

export type StepAction =
  | 'navigate'
  | 'click'
  | 'type'
  | 'select'
  | 'hover'
  | 'scroll'
  | 'press'
  | 'waitForSelector'
  | 'waitForText'
  | 'waitForNavigation'
  | 'waitForNetworkIdle'
  | 'assert'
  | 'screenshot'
  | 'evaluate'
  | 'sleep';

export type AssertionType =
  | 'exists'
  | 'notExists'
  | 'textContains'
  | 'textEquals'
  | 'hasAttribute'
  | 'hasClass'
  | 'isVisible'
  | 'isEnabled'
  | 'urlContains'
  | 'urlEquals'
  | 'countEquals'
  | 'consoleNoErrors';

export interface StepResult {
  stepIndex: number;
  stepName: string;
  action: StepAction;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  screenshotPath?: string;
}

export interface ScenarioResult {
  scenarioName: string;
  status: 'pass' | 'fail';
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  duration: number;
  steps: StepResult[];
}

// --- Event Watcher ---

export type WatchEventType =
  | 'dom:mutation'
  | 'network:request'
  | 'network:response'
  | 'console:error'
  | 'console:warn'
  | 'navigation'
  | 'dialog';

export interface WatchedEvent {
  type: WatchEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface EventWatcherConfig {
  events: WatchEventType[];
  urlPattern?: string;
  maxEvents?: number;
}

// --- Visual Regression ---

export interface VisualCompareResult {
  match: boolean;
  diffPercentage: number;
  diffPixels: number;
  totalPixels: number;
  baselinePath: string;
  currentPath: string;
  diffPath: string;
}

// --- Tool Response Helpers ---

export interface ToolContent {
  type: 'text' | 'image';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface ToolResponse {
  content: ToolContent[];
  isError?: boolean;
}
