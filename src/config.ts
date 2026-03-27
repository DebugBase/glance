import type { BrowserConfig, SecurityConfig, SecurityProfile } from './types.js';
import { resolve } from 'path';

const SECURITY_PROFILES: Record<SecurityProfile, SecurityConfig> = {
  'local-dev': {
    urlAllowlist: ['http://localhost:*', 'http://127.0.0.1:*', 'https://localhost:*', 'https://127.0.0.1:*', 'http://*', 'https://*'],
    urlDenylist: [],
    jsExecution: 'always',
    maxNavigationsPerMinute: 60,
  },
  'restricted': {
    urlAllowlist: ['http://localhost:*', 'http://127.0.0.1:*'],
    urlDenylist: ['*://admin.*', '*://*.internal.*'],
    jsExecution: 'disabled',
    maxNavigationsPerMinute: 30,
  },
  'open': {
    urlAllowlist: ['*'],
    urlDenylist: [],
    jsExecution: 'always',
    maxNavigationsPerMinute: 120,
  },
};

export function getConfig(): BrowserConfig {
  const profile = (process.env.BROWSER_SECURITY_PROFILE || 'local-dev') as SecurityProfile;
  return {
    headless: process.env.BROWSER_HEADLESS === 'true',
    sessionsDir: resolve(process.env.BROWSER_SESSIONS_DIR || '.browser-sessions'),
    securityProfile: profile,
    viewport: {
      width: parseInt(process.env.BROWSER_VIEWPORT_WIDTH || '1280', 10),
      height: parseInt(process.env.BROWSER_VIEWPORT_HEIGHT || '720', 10),
    },
    defaultTimeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
    screenshotOnAction: (process.env.BROWSER_SCREENSHOT_ON_ACTION || 'manual') as BrowserConfig['screenshotOnAction'],
    channel: process.env.BROWSER_CHANNEL || undefined,
  };
}

export function getSecurityConfig(profile: SecurityProfile): SecurityConfig {
  const config = SECURITY_PROFILES[profile];
  if (!config) {
    console.error(`[glance] Unknown security profile "${profile}", falling back to local-dev`);
    return SECURITY_PROFILES['local-dev'];
  }
  return config;
}
