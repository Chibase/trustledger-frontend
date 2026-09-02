/**
 * Client-safe VIP showcase identity (no Node crypto).
 * Live Cloud login must not import vipShowcaseAuth.
 */

export const VIP_SHOWCASE_DEFAULT_EMAIL = "thozi@chibaseconsulting.co.za";

export function isVipShowcaseDefaultEmail(email: string): boolean {
  return email.trim().toLowerCase() === VIP_SHOWCASE_DEFAULT_EMAIL;
}
