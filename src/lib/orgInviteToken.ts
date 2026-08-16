/**
 * Portable org invite tokens — accept/reject from email on any device.
 * Signed with TRIAL_TOKEN_SECRET (same family as trial activation).
 */

import { createHmac, timingSafeEqual } from "crypto";
import { isPlanId, type PlanId } from "@/config/plans";
import { isDeskTier, type DeskTier } from "@/types/deskTier";
import { INVITEABLE_ROLES, type InviteableRole } from "@/types/org";

const INVITE_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type PortableOrgInvite = {
  orgId: string;
  orgName: string;
  planId: PlanId;
  ownerEmail: string;
  ownerName: string;
  inviteId: string;
  token: string;
  email: string;
  name: string;
  role: InviteableRole;
  deskTier: DeskTier;
  projectId?: string;
  projectName?: string;
  complimentaryVip?: boolean;
  exp: number;
};

function tokenSecret(): string {
  const explicit = process.env.TRIAL_TOKEN_SECRET?.trim();
  if (explicit) return explicit;
  const paystack = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (paystack) return paystack;
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  if (isProd) {
    throw new Error(
      "TRIAL_TOKEN_SECRET (or PAYSTACK_SECRET_KEY) must be set in production for invite emails",
    );
  }
  return "trustledger-dev-invite-secret";
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export function signPortableOrgInvite(
  payload: Omit<PortableOrgInvite, "exp"> & { exp?: number },
): string {
  const body: PortableOrgInvite = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + INVITE_TTL_SECONDS,
  };
  const bodyB64 = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", tokenSecret()).update(bodyB64).digest();
  return `${bodyB64}.${b64url(sig)}`;
}

export function verifyPortableOrgInvite(
  token: string,
): PortableOrgInvite | null {
  const [bodyB64, sigB64] = token.split(".");
  if (!bodyB64 || !sigB64) return null;
  const expected = createHmac("sha256", tokenSecret()).update(bodyB64).digest();
  const got = fromB64url(sigB64);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      fromB64url(bodyB64).toString("utf8"),
    ) as PortableOrgInvite;
    if (!parsed.orgId || !parsed.email || !parsed.token || !parsed.inviteId) {
      return null;
    }
    if (!isPlanId(parsed.planId)) return null;
    if (!INVITEABLE_ROLES.includes(parsed.role)) return null;
    if (!isDeskTier(parsed.deskTier)) return null;
    if (typeof parsed.exp === "number" && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Owner-side sync after invitee Accept/Decline (apply status on Owner browser). */
export type InviteOwnerSync = {
  kind: "invite-owner-sync";
  orgId: string;
  orgName: string;
  planId: PlanId;
  ownerEmail: string;
  ownerName: string;
  inviteId: string;
  token: string;
  email: string;
  name: string;
  role: InviteableRole;
  deskTier: DeskTier;
  decision: "accepted" | "rejected";
  exp: number;
};

export function signInviteOwnerSync(
  payload: Omit<InviteOwnerSync, "kind" | "exp"> & { exp?: number },
): string {
  const body: InviteOwnerSync = {
    kind: "invite-owner-sync",
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + INVITE_TTL_SECONDS,
  };
  const bodyB64 = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", tokenSecret()).update(bodyB64).digest();
  return `${bodyB64}.${b64url(sig)}`;
}

export function verifyInviteOwnerSync(token: string): InviteOwnerSync | null {
  const [bodyB64, sigB64] = token.split(".");
  if (!bodyB64 || !sigB64) return null;
  const expected = createHmac("sha256", tokenSecret()).update(bodyB64).digest();
  const got = fromB64url(sigB64);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      fromB64url(bodyB64).toString("utf8"),
    ) as InviteOwnerSync;
    if (parsed.kind !== "invite-owner-sync") return null;
    if (!parsed.orgId || !parsed.inviteId || !parsed.token) return null;
    if (!isPlanId(parsed.planId)) return null;
    if (!INVITEABLE_ROLES.includes(parsed.role)) return null;
    if (!isDeskTier(parsed.deskTier)) return null;
    if (parsed.decision !== "accepted" && parsed.decision !== "rejected") {
      return null;
    }
    if (typeof parsed.exp === "number" && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
