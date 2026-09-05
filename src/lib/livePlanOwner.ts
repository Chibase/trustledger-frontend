/**
 * Live Plan Owner must come from the Cloud sid User flag, not a browser cookie.
 * Trial / demo still use the org owner cookie (browser-local seats).
 */

import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  TL_MODE_COOKIE,
  TL_ORG_OWNER_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
} from "@/lib/auth.constants";
import { fetchSessionContext } from "@/lib/frappeServer";

export function livePlanOwnerFromCloud(input: {
  sidPresent: boolean;
  cloudPlanOwner?: boolean;
}): boolean {
  return Boolean(input.sidPresent && input.cloudPlanOwner);
}

export async function resolveLivePlanOwnerFromSid(
  sid?: string | null,
): Promise<boolean> {
  const token = (sid || "").trim();
  if (!token) return false;
  try {
    const session = await fetchSessionContext(token);
    return livePlanOwnerFromCloud({
      sidPresent: true,
      cloudPlanOwner: session.isPlanOwner,
    });
  } catch {
    return false;
  }
}

export async function requireLivePlanOwner(): Promise<
  | { ok: true; email: string; sid: string; fullName: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value?.trim() || "";
  if (!sid) {
    return { ok: false, status: 401, error: "Live sign-in required." };
  }
  try {
    const session = await fetchSessionContext(sid);
    if (
      !livePlanOwnerFromCloud({
        sidPresent: true,
        cloudPlanOwner: session.isPlanOwner,
      })
    ) {
      return {
        ok: false,
        status: 403,
        error: "Only the Plan Owner can do this.",
      };
    }
    return {
      ok: true,
      email: session.user,
      sid,
      fullName: session.fullName || session.user,
    };
  } catch {
    return { ok: false, status: 401, error: "Live session is not active." };
  }
}

/** Live: Cloud sid flag. Trial/demo: owner cookie (no sid). */
export async function requirePlanOwnerSession(): Promise<
  | { ok: true; email: string; sid: string; fullName: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const jar = await cookies();
  const mode = jar.get(TL_MODE_COOKIE)?.value;
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value?.trim() || "";
  if (mode === "live" || sid) {
    return requireLivePlanOwner();
  }
  if (jar.get(TL_ORG_OWNER_COOKIE)?.value !== "1") {
    return {
      ok: false,
      status: 401,
      error: "Only the Plan Owner can do this.",
    };
  }
  return {
    ok: true,
    email: jar.get(TL_USER_EMAIL_COOKIE)?.value?.trim() || "",
    sid: "",
    fullName: jar.get(TL_USER_NAME_COOKIE)?.value?.trim() || "Plan Owner",
  };
}
