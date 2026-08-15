/**
 * Package labels for shell / settings — never show "Demo" for live or VIP.
 */

import { PLANS, type PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";

export function isVipCustomerName(name: string | null | undefined): boolean {
  return Boolean(name && /^VIP Pilot\b/i.test(name.trim()));
}

/** Short badge for nav / plan strip. */
export function packageLabel(
  planId?: PlanId | null,
  opts?: { mode?: TlMode | null; vip?: boolean },
): string {
  if (opts?.vip) {
    const base = planId && PLANS[planId] ? PLANS[planId].name : "Institutional";
    return base === "Institutional" ? "VIP" : `VIP · ${base}`;
  }
  if (planId && PLANS[planId]) return PLANS[planId].name;
  if (opts?.mode === "live") return "Live workspace";
  if (opts?.mode === "trial") return "Trial";
  return "Sample preview";
}

/** Longer label for settings panels (capability matrix context). */
export function packageLensLabel(
  planId?: PlanId | null,
  opts?: { mode?: TlMode | null; vip?: boolean },
): string {
  if (opts?.vip) {
    const base = planId && PLANS[planId] ? PLANS[planId].name : "Institutional";
    return `VIP · ${base}`;
  }
  if (planId && PLANS[planId]) return PLANS[planId].name;
  if (opts?.mode === "live") return "Live workspace";
  if (opts?.mode === "trial") return "Trial workspace";
  return "Sample preview (Project lens)";
}
