/**
 * Client-safe VIP showcase constants (no Node crypto, no password).
 * Server auth lives in vipShowcaseAuth.ts (`import "server-only"`).
 */

export const VIP_SHOWCASE_DEFAULT_EMAIL = "thozi@chibaseconsulting.co.za";
export const VIP_SHOWCASE_WEEKS = 8;
export const VIP_SHOWCASE_PLAN_ID = "institutional" as const;
export const VIP_SHOWCASE_ORG_NAME = "VIP Pilot — NCGR-B Showcase";
export const VIP_SHOWCASE_OWNER_NAME = "Thozamile KaDlanga";

export function isVipShowcaseDefaultEmail(email: string): boolean {
  return email.trim().toLowerCase() === VIP_SHOWCASE_DEFAULT_EMAIL;
}
