#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getConfig } from './config.js';
import { launchBrowser } from './browser/manager.js';
import { initStorage } from './session/storage.js';
import { initRecorder } from './session/recorder.js';
import { initVisual } from './visual/compare.js';

import { registerNavigationTools } from './tools/navigation.js';
import { registerInteractionTools } from './tools/interaction.js';
import { registerObservationTools } from './tools/observation.js';
import { registerTabTools } from './tools/tabs.js';
import { registerTestingTools } from './tools/testing.js';
import { registerEventTools } from './tools/events.js';
import { registerSessionTools } from './tools/session.js';
import { registerVisualTools } from './tools/visual.js';

async function main() {
  const config = getConfig();

  console.error('[glance] Starting Glance v1.0.0');
  console.error(`[glance] Config: headless=${config.headless}, profile=${config.securityProfile}, viewport=${config.viewport.width}x${config.viewport.height}`);

  // Initialize subsystems
  initStorage(config.sessionsDir);
  initRecorder(config);
  initVisual(config.sessionsDir);

  // EAGER LAUNCH: Start browser immediately
  console.error('[glance] Launching browser (eager mode)...');
  launchBrowser(config).catch((err) => {
    console.error('[glance] Browser launch error:', err);
  });

  // Create MCP server
  const server = new McpServer({
    name: 'glance',
    version: '1.0.0',
  });

  // Register all tools
  registerNavigationTools(server, config);
  registerInteractionTools(server);
  registerObservationTools(server, config);
  registerTabTools(server);
  registerTestingTools(server, config);
  registerEventTools(server);
  registerSessionTools(server);
  registerVisualTools(server, config);

  console.error('[glance] 30 tools registered');

  // Start MCP transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[glance] MCP server connected via stdio');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.error('[glance] Shutting down...');
    const { closeBrowser } = await import('./browser/manager.js');
    await closeBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('[glance] Shutting down...');
    const { closeBrowser } = await import('./browser/manager.js');
    await closeBrowser();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[glance] Fatal error:', err);
  process.exit(1);
});
