/**
 * Client cookie helpers for org tenancy (demo/trial).
 */

import {
  SESSION_ROLE_COOKIE,
  TL_DESK_TIER_COOKIE,
  TL_DESK_TIER_LOCKED_COOKIE,
  TL_MODE_COOKIE,
  TL_ORG_ID_COOKIE,
  TL_ORG_OWNER_COOKIE,
  TL_TRIAL_PLAN_COOKIE,
  TL_TRIAL_STARTED_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth.constants";
import type { PlanId } from "@/config/plans";
import type { DeskTier } from "@/types/deskTier";
import type { UserRole } from "@/types/rbac";
import { ensureOwnerOrg } from "@/lib/orgStore";

function setCookie(name: string, value: string, maxAge = SESSION_MAX_AGE_SECONDS) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function applyOrgOwnerSession(input: {
  orgId: string;
  email: string;
  name: string;
  planId: PlanId;
  mode?: "demo" | "trial";
  startedAt?: string;
  maxAge?: number;
}) {
  const mode = input.mode || "demo";
  const maxAge = input.maxAge ?? SESSION_MAX_AGE_SECONDS;
  setCookie(SESSION_ROLE_COOKIE, "admin", maxAge);
  setCookie(TL_MODE_COOKIE, mode, maxAge);
  setCookie(TL_USER_EMAIL_COOKIE, input.email.toLowerCase(), maxAge);
  setCookie(TL_USER_NAME_COOKIE, input.name, maxAge);
  setCookie(TL_TRIAL_PLAN_COOKIE, input.planId, maxAge);
  setCookie(TL_ORG_ID_COOKIE, input.orgId, maxAge);
  setCookie(TL_ORG_OWNER_COOKIE, "1", maxAge);
  setCookie(TL_DESK_TIER_COOKIE, "supervisor", maxAge);
  setCookie(TL_DESK_TIER_LOCKED_COOKIE, "0", maxAge);
  if (mode === "trial" && input.startedAt) {
    setCookie(TL_TRIAL_STARTED_COOKIE, input.startedAt, maxAge);
  }
}

export function applyOrgInviteeSession(input: {
  orgId: string;
  email: string;
  name: string;
  role: UserRole;
  deskTier: DeskTier;
  planId: PlanId;
  mode?: "demo" | "trial";
}) {
  const mode = input.mode || "demo";
  setCookie(SESSION_ROLE_COOKIE, input.role);
  setCookie(TL_MODE_COOKIE, mode);
  setCookie(TL_USER_EMAIL_COOKIE, input.email.toLowerCase());
  setCookie(TL_USER_NAME_COOKIE, input.name);
  setCookie(TL_TRIAL_PLAN_COOKIE, input.planId);
  setCookie(TL_ORG_ID_COOKIE, input.orgId);
  setCookie(TL_ORG_OWNER_COOKIE, "0");
  setCookie(TL_DESK_TIER_COOKIE, input.deskTier);
  setCookie(TL_DESK_TIER_LOCKED_COOKIE, "1");
}

/** Create/reuse org and stamp Plan Owner session cookies. */
export function bootstrapPlanOwnerOrg(input: {
  email: string;
  name: string;
  planId: PlanId;
  organization?: string;
  mode?: "demo" | "trial";
  startedAt?: string;
  maxAge?: number;
}) {
  const org = ensureOwnerOrg({
    email: input.email,
    name: input.name,
    planId: input.planId,
    organization: input.organization,
  });
  applyOrgOwnerSession({
    orgId: org.id,
    email: input.email,
    name: input.name,
    planId: input.planId,
    mode: input.mode,
    startedAt: input.startedAt,
    maxAge: input.maxAge,
  });
  return org;
}

export function readOrgOwnerCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)tl-org-owner=1(?:;|$)/.test(document.cookie);
}

export function readDeskTierLockedCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)tl-desk-tier-locked=1(?:;|$)/.test(document.cookie);
}
