/**
 * In-process security event ring + optional outbound alert.
 * Serverless memory is best-effort (per instance). Hosting logs remain the SoT.
 */

import {
  logSecuritySignal,
  postSecurityWebhook,
  type SecuritySignal,
} from "@/lib/security/signal";

export type SecurityEventKind =
  | "probe_blocked"
  | "rate_limited"
  | "honeypot"
  | "form_rejected"
  | "csp_violation";

export type SecurityEvent = SecuritySignal & {
  at: string;
  kind: SecurityEventKind;
};

const MAX = 80;
const ring: SecurityEvent[] = [];

export function recordSecurityEvent(
  event: Omit<SecurityEvent, "at">,
  opts?: { alert?: boolean },
): SecurityEvent {
  const full: SecurityEvent = {
    ...event,
    at: new Date().toISOString(),
    ua: event.ua.slice(0, 180),
    path: event.path.slice(0, 240),
  };
  ring.unshift(full);
  if (ring.length > MAX) ring.pop();
  logSecuritySignal(full);
  if (opts?.alert !== false && full.kind !== "csp_violation") {
    postSecurityWebhook(full);
  }
  return full;
}

export function recentSecurityEvents(limit = 40): SecurityEvent[] {
  return ring.slice(0, limit);
}
