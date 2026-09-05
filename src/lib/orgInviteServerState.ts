/**
 * Process-local invite revoke / notify dedupe for portable email invites.
 * Not multi-instance durable. SEC-5 provisions Cloud Users; this revoke list stays in-process.
 */

const revokedInviteIds = new Map<string, number>(); // id → expiresAt ms
const closedInviteIds = new Map<string, number>(); // accepted/rejected
const notifiedDecisions = new Map<string, number>(); // `${inviteId}:${decision}` → expiresAt

const TTL_MS = 14 * 24 * 60 * 60 * 1000;

function prune(map: Map<string, number>) {
  const now = Date.now();
  for (const [key, exp] of map) {
    if (exp <= now) map.delete(key);
  }
}

export function markInviteRevokedServer(inviteId: string): void {
  prune(revokedInviteIds);
  revokedInviteIds.set(inviteId, Date.now() + TTL_MS);
}

export function isInviteRevokedServer(inviteId: string): boolean {
  prune(revokedInviteIds);
  const exp = revokedInviteIds.get(inviteId);
  if (!exp) return false;
  if (exp <= Date.now()) {
    revokedInviteIds.delete(inviteId);
    return false;
  }
  return true;
}

/** After accept or decline — block further Accept/Decline on other devices. */
export function markInviteClosedServer(inviteId: string): void {
  prune(closedInviteIds);
  closedInviteIds.set(inviteId, Date.now() + TTL_MS);
}

export function isInviteClosedServer(inviteId: string): boolean {
  prune(closedInviteIds);
  const exp = closedInviteIds.get(inviteId);
  if (!exp) return false;
  if (exp <= Date.now()) {
    closedInviteIds.delete(inviteId);
    return false;
  }
  return true;
}

export function inviteBlockedReason(
  inviteId: string,
): "revoked" | "closed" | null {
  if (isInviteRevokedServer(inviteId)) return "revoked";
  if (isInviteClosedServer(inviteId)) return "closed";
  return null;
}

/** Returns true if this is the first notify for inviteId+decision. */
export function claimInviteDecisionNotify(
  inviteId: string,
  decision: "accepted" | "rejected",
): boolean {
  prune(notifiedDecisions);
  const key = `${inviteId}:${decision}`;
  if (notifiedDecisions.has(key)) return false;
  notifiedDecisions.set(key, Date.now() + TTL_MS);
  return true;
}
