/**
 * Shared live-session cookies for /auth/live/login, OTP verify, and invite accept.
 */

import type { NextResponse } from "next/server";
import {
  FRAPPE_SID_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  SESSION_ROLE_COOKIE,
  TL_DESK_TIER_COOKIE,
  TL_DESK_TIER_LOCKED_COOKIE,
  TL_MODE_COOKIE,
  TL_ORG_OWNER_COOKIE,
  TL_TRIAL_PLAN_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
  TL_VIP_COOKIE,
} from "@/lib/auth.constants";
import { cookieSafeValue } from "@/lib/leadCapture";

export type LiveSessionCookieInput = {
  sid: string;
  role: string;
  email: string;
  fullName: string;
  isPlanOwner: boolean;
  deskTier?: string;
  planId?: string;
  vip?: boolean;
};

/** Live Plan Owner is the owner cookie only — never a client-writable session-role.
 *  The cookie is httpOnly on live login. Mutating APIs still ignore it and
 *  require Customer.custom_owner_email (requireLivePlanOwner).
 */
export function livePlanOwnerFromCookies(ownerCookie: boolean): boolean {
  return ownerCookie;
}

export function applyLiveSessionCookies(
  response: NextResponse,
  input: LiveSessionCookieInput,
) {
  const cookieBase = {
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  response.cookies.set(FRAPPE_SID_COOKIE, input.sid, {
    ...cookieBase,
    httpOnly: true,
  });
  response.cookies.set(SESSION_ROLE_COOKIE, input.role, cookieBase);
  response.cookies.set(TL_MODE_COOKIE, "live", cookieBase);
  response.cookies.set(
    TL_USER_NAME_COOKIE,
    cookieSafeValue(input.fullName, 80),
    cookieBase,
  );
  response.cookies.set(
    TL_USER_EMAIL_COOKIE,
    cookieSafeValue(input.email, 120),
    { ...cookieBase, httpOnly: true },
  );
  if (input.isPlanOwner) {
    response.cookies.set(TL_ORG_OWNER_COOKIE, "1", {
      ...cookieBase,
      httpOnly: true,
    });
  } else {
    response.cookies.set(TL_ORG_OWNER_COOKIE, "", {
      ...cookieBase,
      httpOnly: true,
      maxAge: 0,
    });
  }
  if (input.deskTier) {
    response.cookies.set(TL_DESK_TIER_COOKIE, input.deskTier, cookieBase);
    response.cookies.set(
      TL_DESK_TIER_LOCKED_COOKIE,
      input.isPlanOwner ? "0" : "1",
      cookieBase,
    );
  }
  if (input.planId) {
    response.cookies.set(TL_TRIAL_PLAN_COOKIE, input.planId, cookieBase);
  }
  if (input.vip) {
    response.cookies.set(TL_VIP_COOKIE, "1", cookieBase);
  } else {
    response.cookies.set(TL_VIP_COOKIE, "", { ...cookieBase, maxAge: 0 });
  }
}
