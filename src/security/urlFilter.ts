import type { SecurityConfig } from '../types.js';

const navigationTimestamps: number[] = [];

/**
 * Convert a URL wildcard pattern to a RegExp.
 * Supports: * (match anything except ://), specific protocols, ports, paths.
 * Examples:
 *   "https://*"           -> matches any https URL
 *   "http://localhost:*"  -> matches localhost on any port + path
 *   "*://admin.*"         -> matches admin.* on any protocol
 */
function patternToRegex(pattern: string): RegExp {
  // Escape regex special chars except *
  let regex = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace * with .* (match anything)
  regex = regex.replace(/\*/g, '.*');
  return new RegExp(`^${regex}$`);
}

function urlMatchesPattern(url: string, pattern: string): boolean {
  return patternToRegex(pattern).test(url);
}

function urlMatchesAnyPattern(url: string, patterns: string[]): boolean {
  return patterns.some((p) => urlMatchesPattern(url, p));
}

export function isUrlAllowed(url: string, security: SecurityConfig): { allowed: boolean; reason?: string } {
  // Check denylist first
  if (security.urlDenylist.length > 0) {
    if (urlMatchesAnyPattern(url, security.urlDenylist)) {
      return { allowed: false, reason: `URL matches denylist pattern` };
    }
  }

  // Check allowlist
  if (security.urlAllowlist.length > 0) {
    if (!urlMatchesAnyPattern(url, security.urlAllowlist)) {
      return { allowed: false, reason: `URL does not match any allowlist pattern` };
    }
  }

  return { allowed: true };
}

export function checkRateLimit(security: SecurityConfig): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Remove old timestamps
  while (navigationTimestamps.length > 0 && navigationTimestamps[0] < oneMinuteAgo) {
    navigationTimestamps.shift();
  }

  if (navigationTimestamps.length >= security.maxNavigationsPerMinute) {
    return { allowed: false, reason: `Rate limit exceeded: ${security.maxNavigationsPerMinute} navigations per minute` };
  }

  navigationTimestamps.push(now);
  return { allowed: true };
}
