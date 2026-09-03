/**
 * Client-safe VIP showcase identity (no Node crypto).
 * Live Cloud login must not import vipShowcaseAuth.
 *
 * Illustrative NCGR-B preload is Thozamile KaDlanga only
 * (`thozi@chibaseconsulting.co.za`). Other complimentary VIP guests
 * (Cloud `/login/live`) keep an empty Institutional desk.
 */

export const VIP_SHOWCASE_DEFAULT_EMAIL = "thozi@chibaseconsulting.co.za";
export const VIP_SHOWCASE_ORG_NAME = "VIP Pilot — NCGR-B Showcase";

export function isVipShowcaseDefaultEmail(email?: string | null): boolean {
  return (email || "").trim().toLowerCase() === VIP_SHOWCASE_DEFAULT_EMAIL;
}
