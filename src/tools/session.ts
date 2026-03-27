import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { startRecording, stopRecording, isRecording, formatSession } from '../session/recorder.js';
import { listSessions, getSession } from '../session/storage.js';

export function registerSessionTools(server: McpServer) {
  server.tool(
    'session_start',
    {
      name: z.string().optional().describe('Optional session name'),
    },
    async ({ name }) => {
      if (isRecording()) {
        return { content: [{ type: 'text' as const, text: 'A session is already recording. Stop it first with session_end.' }] };
      }
      try {
        const session = await startRecording(name);
        return {
          content: [{
            type: 'text' as const,
            text: `Session started.\nID: ${session.id}\nName: ${session.name || '(unnamed)'}`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Session start failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'session_end',
    {},
    async () => {
      if (!isRecording()) {
        return { content: [{ type: 'text' as const, text: 'No active session to end.' }] };
      }
      try {
        const session = await stopRecording();
        if (!session) {
          return { content: [{ type: 'text' as const, text: 'No session data.' }] };
        }
        return {
          content: [{ type: 'text' as const, text: formatSession(session) }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Session end failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'session_list',
    {},
    async () => {
      try {
        const sessions = await listSessions();
        if (sessions.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No recorded sessions.' }] };
        }
        const text = sessions.map((s) => {
          const date = new Date(s.startedAt).toISOString().replace('T', ' ').slice(0, 19);
          const status = s.endedAt ? 'completed' : 'recording';
          return `  ${s.id.slice(0, 8)} | ${s.name || '(unnamed)'} | ${date} | ${s.actionCount} actions | ${status}`;
        }).join('\n');
        return { content: [{ type: 'text' as const, text: `Sessions (${sessions.length})\n${text}` }] };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `List failed: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'session_replay',
    {
      sessionId: z.string().describe('Session ID (first 8 chars or full UUID)'),
    },
    async ({ sessionId }) => {
      try {
        const sessions = await listSessions();
        const match = sessions.find((s) => s.id.startsWith(sessionId));
        if (!match) {
          return { content: [{ type: 'text' as const, text: `Session not found: ${sessionId}` }], isError: true };
        }
        const session = await getSession(match.id);
        return {
          content: [{ type: 'text' as const, text: formatSession(session) }],
        };
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: `Replay failed: ${err.message}` }], isError: true };
      }
    }
  );
}
