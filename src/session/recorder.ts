import type { Session, SessionAction, BrowserConfig } from '../types.js';
import { createSession, saveAction, endSession, saveScreenshot } from './storage.js';
import { takeScreenshot } from '../browser/actions.js';

let _activeSession: Session | null = null;
let _config: BrowserConfig;

export function initRecorder(config: BrowserConfig): void {
  _config = config;
}

export async function startRecording(name?: string): Promise<Session> {
  if (_activeSession) {
    await stopRecording();
  }
  _activeSession = await createSession(name);
  return _activeSession;
}

export async function recordAction(
  tool: string,
  args: Record<string, unknown>,
  duration: number,
  result: 'success' | 'error',
  error?: string
): Promise<void> {
  if (!_activeSession) return;

  const index = _activeSession.actions.length;
  let screenshotPath: string | undefined;

  // Auto-screenshot based on config
  if (_config.screenshotOnAction === 'always') {
    try {
      const buf = await takeScreenshot();
      screenshotPath = await saveScreenshot(_activeSession.id, index, tool, buf);
    } catch {}
  }

  // Redact sensitive fields before recording
  const safeArgs = { ...args };
  const sensitiveKeys = ['passwordValue', 'password', 'token', 'secret', 'apiKey', 'credential'];
  for (const key of sensitiveKeys) {
    if (key in safeArgs) (safeArgs as any)[key] = '***REDACTED***';
  }

  const action: SessionAction = {
    index,
    tool,
    args: safeArgs,
    timestamp: Date.now(),
    duration,
    result,
    screenshotPath,
    error,
  };

  _activeSession.actions.push(action);
  await saveAction(_activeSession.id, action);
}

export async function stopRecording(): Promise<Session | null> {
  if (!_activeSession) return null;
  const session = await endSession(_activeSession.id);
  _activeSession = null;
  return session;
}

export function isRecording(): boolean {
  return _activeSession !== null;
}

export function getActiveSessionId(): string | null {
  return _activeSession?.id || null;
}

export function formatSession(session: Session): string {
  const lines: string[] = [
    `Session: ${session.name || session.id}`,
    `ID: ${session.id}`,
    `Started: ${new Date(session.startedAt).toISOString()}`,
    session.endedAt ? `Ended: ${new Date(session.endedAt).toISOString()}` : 'Status: Recording...',
    session.endedAt ? `Duration: ${session.endedAt - session.startedAt}ms` : '',
    `Actions: ${session.actions.length}`,
    `Screenshots: ${session.screenshotPaths.length}`,
    '',
    'Timeline:',
  ];

  for (const action of session.actions) {
    const time = new Date(action.timestamp).toISOString().split('T')[1].replace('Z', '');
    const status = action.result === 'success' ? 'OK' : 'ERR';
    let line = `  [${time}] [${status}] ${action.tool}(${JSON.stringify(action.args).slice(0, 80)}) - ${action.duration}ms`;
    if (action.error) {
      line += `\n    Error: ${action.error}`;
    }
    if (action.screenshotPath) {
      line += `\n    Screenshot: ${action.screenshotPath}`;
    }
    lines.push(line);
  }

  return lines.filter(Boolean).join('\n');
}
