/**
 * Client-safe VIP showcase identity (no Node crypto).
 * Live Cloud login must not import vipShowcaseAuth.
 *
 * Dedicated mailbox — `thozi@chibaseconsulting.co.za` is already on another
 * plan and must keep /login/live (Cloud), not this illustrative workspace.
 */

export const VIP_SHOWCASE_DEFAULT_EMAIL = "sirthoz@trustledgersrm.co.za";

export function isVipShowcaseDefaultEmail(email: string): boolean {
  return email.trim().toLowerCase() === VIP_SHOWCASE_DEFAULT_EMAIL;
}
