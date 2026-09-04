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
  TL_VIP_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth.constants";
import {
  isVipShowcaseDefaultEmail,
  VIP_SHOWCASE_ORG_NAME,
  VIP_SHOWCASE_PLAN_ID,
  VIP_SHOWCASE_WEEKS,
} from "@/lib/vipShowcaseIdentity";
import type { PlanId } from "@/config/plans";
import { PLAN_OWNER_DESK_TIER, type DeskTier } from "@/types/deskTier";
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
  setCookie(TL_DESK_TIER_COOKIE, PLAN_OWNER_DESK_TIER[input.planId], maxAge);
  setCookie(TL_DESK_TIER_LOCKED_COOKIE, "0", maxAge);
  if (mode === "trial" && input.startedAt) {
    setCookie(TL_TRIAL_STARTED_COOKIE, input.startedAt, maxAge);
  }
}

/**
 * Stamp org id + Plan Owner flags for invite email APIs without clobbering
 * a live Cloud session (`tl-mode=live`). Live login never set `tl-org-id`,
 * which blocked `/api/invite/send` with 401.
 */
export function stampPlanOwnerOrgCookies(input: {
  orgId: string;
  email?: string;
  name?: string;
  planId?: PlanId;
  maxAge?: number;
}) {
  const maxAge = input.maxAge ?? SESSION_MAX_AGE_SECONDS;
  setCookie(TL_ORG_ID_COOKIE, input.orgId, maxAge);
  setCookie(TL_ORG_OWNER_COOKIE, "1", maxAge);
  if (input.email?.includes("@")) {
    setCookie(TL_USER_EMAIL_COOKIE, input.email.toLowerCase(), maxAge);
  }
  if (input.name?.trim()) {
    setCookie(TL_USER_NAME_COOKIE, input.name.trim(), maxAge);
  }
  if (input.planId) {
    setCookie(TL_TRIAL_PLAN_COOKIE, input.planId, maxAge);
    setCookie(TL_DESK_TIER_COOKIE, PLAN_OWNER_DESK_TIER[input.planId], maxAge);
    setCookie(TL_DESK_TIER_LOCKED_COOKIE, "0", maxAge);
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
  complimentaryVip?: boolean;
}) {
  const org = ensureOwnerOrg({
    email: input.email,
    name: input.name,
    planId: input.planId,
    organization: input.organization,
    complimentaryVip: input.complimentaryVip,
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

/**
 * Complimentary VIP Institutional showcase (browser own-data).
 * Uses trial mode so operator emails are not redirected to /ops, stamps
 * tl-vip, and skips the 14-day trial clock (8-week cookie).
 */
export function startVipShowcaseSession(input: {
  email: string;
  name: string;
  weeks?: number;
}) {
  const weeks = input.weeks ?? VIP_SHOWCASE_WEEKS;
  const maxAge = weeks * 7 * 24 * 60 * 60;
  const org = bootstrapPlanOwnerOrg({
    email: input.email,
    name: input.name,
    planId: VIP_SHOWCASE_PLAN_ID,
    organization: isVipShowcaseDefaultEmail(input.email)
      ? VIP_SHOWCASE_ORG_NAME
      : `VIP Pilot — ${input.name.trim() || "Guest"}`,
    mode: "trial",
    maxAge,
    complimentaryVip: true,
  });
  setCookie(TL_VIP_COOKIE, "1", maxAge);
  setCookie(TL_TRIAL_PLAN_COOKIE, VIP_SHOWCASE_PLAN_ID, maxAge);
  setCookie(TL_DESK_TIER_COOKIE, PLAN_OWNER_DESK_TIER[VIP_SHOWCASE_PLAN_ID], maxAge);
  setCookie(TL_DESK_TIER_LOCKED_COOKIE, "0", maxAge);
  setCookie(TL_ORG_OWNER_COOKIE, "1", maxAge);
  // Showcase is not a 14-day billed trial — drop any leftover clock cookie.
  setCookie(TL_TRIAL_STARTED_COOKIE, "", 0);
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
