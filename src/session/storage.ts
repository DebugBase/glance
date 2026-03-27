import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Session, SessionAction } from '../types.js';

let _sessionsDir: string;

export function initStorage(sessionsDir: string): void {
  _sessionsDir = sessionsDir;
}

export async function createSession(name?: string): Promise<Session> {
  const session: Session = {
    id: randomUUID(),
    name,
    startedAt: Date.now(),
    actions: [],
    screenshotPaths: [],
  };

  const dir = getSessionDir(session.id);
  await mkdir(join(dir, 'screenshots'), { recursive: true });
  await writeFile(join(dir, 'session.json'), JSON.stringify(session, null, 2));

  return session;
}

export async function saveAction(sessionId: string, action: SessionAction): Promise<void> {
  const dir = getSessionDir(sessionId);
  const sessionFile = join(dir, 'session.json');

  const data = JSON.parse(await readFile(sessionFile, 'utf-8')) as Session;
  data.actions.push(action);
  if (action.screenshotPath) {
    data.screenshotPaths.push(action.screenshotPath);
  }
  await writeFile(sessionFile, JSON.stringify(data, null, 2));
}

export async function endSession(sessionId: string): Promise<Session> {
  const dir = getSessionDir(sessionId);
  const sessionFile = join(dir, 'session.json');

  const data = JSON.parse(await readFile(sessionFile, 'utf-8')) as Session;
  data.endedAt = Date.now();
  await writeFile(sessionFile, JSON.stringify(data, null, 2));

  return data;
}

export async function getSession(sessionId: string): Promise<Session> {
  const dir = getSessionDir(sessionId);
  const sessionFile = join(dir, 'session.json');
  return JSON.parse(await readFile(sessionFile, 'utf-8')) as Session;
}

export async function listSessions(): Promise<{ id: string; name?: string; startedAt: number; endedAt?: number; actionCount: number }[]> {
  const sessionsRoot = join(_sessionsDir, 'sessions');
  try {
    const dirs = await readdir(sessionsRoot);
    const sessions = [];
    for (const dir of dirs) {
      try {
        const data = JSON.parse(await readFile(join(sessionsRoot, dir, 'session.json'), 'utf-8')) as Session;
        sessions.push({
          id: data.id,
          name: data.name,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          actionCount: data.actions.length,
        });
      } catch {}
    }
    return sessions.sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}

export async function saveScreenshot(sessionId: string, actionIndex: number, toolName: string, buffer: Buffer): Promise<string> {
  const dir = getSessionDir(sessionId);
  const path = join(dir, 'screenshots', `${actionIndex}-${toolName}.png`);
  await writeFile(path, buffer);
  return path;
}

function getSessionDir(sessionId: string): string {
  return join(_sessionsDir, 'sessions', sessionId);
}
