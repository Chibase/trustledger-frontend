"use client";

import { useEffect } from "react";
import { getActiveOrgId } from "@/lib/orgStore";
import { applyVipShowcaseSeed } from "@/lib/vipShowcaseSeed";

/** Re-run VIP packaging seed for legacy showcase sessions (SEP-only → full desks). */
export function VipPackagingSync({ email }: { email: string }) {
  useEffect(() => {
    const orgId = getActiveOrgId() || "vip-showcase";
    applyVipShowcaseSeed({ orgId, email: email || "showcase@local" });
  }, [email]);
  return null;
}
