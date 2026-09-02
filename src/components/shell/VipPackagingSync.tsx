"use client";

import { useEffect } from "react";
import {
  SESSION_MAX_AGE_SECONDS,
  TL_TRIAL_PLAN_COOKIE,
} from "@/lib/auth.constants";
import { getActiveOrgId } from "@/lib/orgStore";
import { applyVipShowcaseSeed } from "@/lib/vipShowcaseSeed";

/** Re-run VIP packaging seed for legacy showcase sessions (SEP-only → full desks). */
export function VipPackagingSync({ email }: { email: string }) {
  useEffect(() => {
    const orgId = getActiveOrgId() || "vip-showcase";
    document.cookie = `${TL_TRIAL_PLAN_COOKIE}=institutional; path=/; max-age=${SESSION_MAX_AGE_SECONDS * 8}; samesite=lax`;
    applyVipShowcaseSeed({ orgId, email: email || "showcase@local" });
  }, [email]);
  return null;
}
