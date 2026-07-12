/**
 * Platform Operator — sole controller of live product access until you lift lockdown.
 * Distinct from customer Plan Owner (`admin` on a paid org). See ADR-013.
 */

function parseFlag(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** Normalize email / Frappe user id for allowlist compare. */
export function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase();
}

export function getPlatformOperatorEmails(): string[] {
  const raw = process.env.PLATFORM_OPERATOR_EMAILS || "";
  return raw
    .split(/[,;\s]+/)
    .map((part) => normalizeIdentity(part))
    .filter(Boolean);
}

/** When true, only allowlisted identities may use live login / live /app / Frappe BFF. */
export function isPlatformOperatorOnly(): boolean {
  return parseFlag(process.env.PLATFORM_OPERATOR_ONLY);
}

/**
 * Optional hard lock: also block demo /app entry (assessment + marketing stay public).
 * Default off so Wednesday lead demo can stay open.
 */
export function isPlatformOperatorLockPublic(): boolean {
  return parseFlag(process.env.PLATFORM_OPERATOR_LOCK_PUBLIC);
}

export function isPlatformOperatorIdentity(
  ...candidates: Array<string | null | undefined>
): boolean {
  const allow = getPlatformOperatorEmails();
  if (allow.length === 0) return false;
  const allowSet = new Set(allow);
  for (const c of candidates) {
    if (c && allowSet.has(normalizeIdentity(c))) return true;
  }
  return false;
}

export type OperatorGateResult =
  | { ok: true }
  | { ok: false; reason: "lockdown_misconfigured" | "not_operator" };

/**
 * Live-session gate. Fail closed when lockdown is on but allowlist is empty.
 */
export function assertLiveOperatorAccess(
  ...candidates: Array<string | null | undefined>
): OperatorGateResult {
  if (!isPlatformOperatorOnly()) return { ok: true };
  const allow = getPlatformOperatorEmails();
  if (allow.length === 0) {
    return { ok: false, reason: "lockdown_misconfigured" };
  }
  if (!isPlatformOperatorIdentity(...candidates)) {
    return { ok: false, reason: "not_operator" };
  }
  return { ok: true };
}

export function operatorGateMessage(
  reason: "lockdown_misconfigured" | "not_operator",
): string {
  if (reason === "lockdown_misconfigured") {
    return "Live access is locked to the Platform Operator, but no allowlist is configured. Set PLATFORM_OPERATOR_EMAILS on the server.";
  }
  return "Live access is limited to the Platform Operator. Customer and staff logins are paused until lockdown is lifted.";
}
