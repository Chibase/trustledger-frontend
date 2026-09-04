/**
 * Package labels for shell / settings — never show "Demo" for live or VIP.
 */

import { PLANS, type PlanId } from "@/config/plans";
import { TL_USER_EMAIL_COOKIE, type TlMode } from "@/lib/auth.constants";
import { isVipShowcaseDefaultEmail } from "@/lib/vipShowcaseIdentity";

export function isVipCustomerName(name: string | null | undefined): boolean {
  return Boolean(name && /^VIP Pilot\b/i.test(name.trim()));
}

function readDocumentEmail(): string {
  if (typeof document === "undefined") return "";
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${TL_USER_EMAIL_COOKIE}=`));
  if (!row) return "";
  return decodeURIComponent(row.split("=").slice(1).join("="))
    .trim()
    .toLowerCase();
}

/** Session mailbox: explicit argument, else the browser cookie. */
export function resolveVipShowcaseEmail(email?: string | null): string {
  if (email && email.includes("@")) return email.trim().toLowerCase();
  return readDocumentEmail();
}

/**
 * Illustrative NCGR-B workspace: Thozamile's trial + VIP mailbox only.
 * Other complimentary VIP (Cloud guests) are Institutional, not the showcase.
 */
export function isVipShowcaseWorkspace(
  mode?: TlMode | null,
  isVip?: boolean,
  email?: string | null,
): boolean {
  if (!isVipShowcaseDefaultEmail(resolveVipShowcaseEmail(email))) return false;
  return mode === "trial" && Boolean(isVip);
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
