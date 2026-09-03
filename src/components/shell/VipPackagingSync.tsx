"use client";

import { useEffect } from "react";
import {
  SESSION_MAX_AGE_SECONDS,
  TL_TRIAL_PLAN_COOKIE,
} from "@/lib/auth.constants";
import { getActiveOrgId } from "@/lib/orgStore";
import { applyVipShowcaseSeed } from "@/lib/vipShowcaseSeed";
import { isVipShowcaseDefaultEmail } from "@/lib/vipShowcaseIdentity";

/**
 * Seed NCGR-B for Thozamile's showcase; reverse leftover theatre for everyone else.
 */
export function VipPackagingSync({ email }: { email: string }) {
  useEffect(() => {
    const showcase = isVipShowcaseDefaultEmail(email);
    const orgId = getActiveOrgId() || (showcase ? "vip-showcase" : "");
    if (showcase) {
      document.cookie = `${TL_TRIAL_PLAN_COOKIE}=institutional; path=/; max-age=${SESSION_MAX_AGE_SECONDS * 8}; samesite=lax`;
    }
    applyVipShowcaseSeed({ orgId, email: email || "" });
  }, [email]);
  return null;
}
