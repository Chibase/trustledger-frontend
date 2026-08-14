/**
 * Edge-safe security signals. Middleware must not fetch this app's own origin
 * (hosting deadlock). Probes go to logs + optional external webhook only.
 */

export type SecuritySignal = {
  kind: string;
  reason: string;
  path: string;
  ip: string;
  host: string;
  ua: string;
};

let lastWebhookAt = 0;

export function logSecuritySignal(event: SecuritySignal): void {
  console.warn(
    "[security]",
    event.kind,
    event.reason,
    event.path,
    event.ip,
    event.host,
  );
}

export function postSecurityWebhook(
  event: SecuritySignal,
  waitUntil?: (promise: Promise<unknown>) => void,
): void {
  const url = process.env.SECURITY_ALERT_WEBHOOK_URL?.trim();
  if (!url) return;
  const now = Date.now();
  if (now - lastWebhookAt < 60_000) return;
  lastWebhookAt = now;
  const run = fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `TrustLedger security: ${event.kind} ${event.reason} ${event.path} from ${event.ip}`,
      event,
    }),
    signal: AbortSignal.timeout(4000),
  }).catch(() => {
    /* webhook must never break the visitor path */
  });
  if (waitUntil) waitUntil(run);
}
