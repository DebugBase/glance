import type { JsExecutionPolicy } from '../types.js';

export function isJsAllowed(policy: JsExecutionPolicy): { allowed: boolean; reason?: string } {
  if (policy === 'disabled') {
    return { allowed: false, reason: 'JavaScript execution is disabled by security policy' };
  }
  return { allowed: true };
}
