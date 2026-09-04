/**
 * Client-safe VIP showcase identity (no Node crypto, no password).
 * Server auth lives in vipShowcaseAuth.ts (`import "server-only"`).
 *
 * Illustrative NCGR-B preload is the dedicated showcase mailbox
 * (`sirthoz@trustledgersrm.co.za`). `thozi@chibaseconsulting.co.za`
 * stays on live Cloud (other plan). Other complimentary VIP guests
 * (Cloud `/login/live`) keep an empty Institutional desk.
 */

export const VIP_SHOWCASE_DEFAULT_EMAIL =
  "sirthoz@trustledgersrm.co.za".trim().toLowerCase();
export const VIP_SHOWCASE_WEEKS = 8;
export const VIP_SHOWCASE_PLAN_ID = "institutional" as const;
export const VIP_SHOWCASE_ORG_NAME = "VIP Pilot — NCGR-B Showcase";
export const VIP_SHOWCASE_OWNER_NAME = "Thozamile KaDlanga";

export function isVipShowcaseDefaultEmail(email?: string | null): boolean {
  return (email || "").trim().toLowerCase() === VIP_SHOWCASE_DEFAULT_EMAIL;
}
