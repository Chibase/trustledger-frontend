/**
 * Client-safe VIP showcase identity (no Node crypto).
 * Live Cloud login must not import vipShowcaseAuth.
 *
 * Illustrative NCGR-B preload is dedicated to the showcase mailbox.
 * Other complimentary VIP guests (Cloud `/login/live`) keep an empty
 * Institutional desk.
 */

export const VIP_SHOWCASE_DEFAULT_EMAIL =
  "sirthoz@trustledgersrm.co.za".trim().toLowerCase();
export const VIP_SHOWCASE_ORG_NAME = "VIP Pilot — NCGR-B Showcase";

export function isVipShowcaseDefaultEmail(email: string): boolean {
  return email.trim().toLowerCase() === VIP_SHOWCASE_DEFAULT_EMAIL;
}
