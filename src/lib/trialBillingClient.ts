/**
 * Client-side trial billing state (opt-out + reactivation).
 * Authorization codes stay in localStorage for the browser that completed Paystack.
 */

const BILLING_KEY = "tl-trial-billing";
const MUST_CHANGE_KEY = "tl-must-change-password";

export type TrialBillingState = {
  email: string;
  name: string;
  planId: string;
  planLabel?: string;
  organization?: string;
  reference: string;
  billAt: string;
  authorizationCode?: string;
  authorizationLast4?: string;
  status: "scheduled" | "cancelled" | "charged";
  activatedAt: string;
};

export function readTrialBilling(): TrialBillingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BILLING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrialBillingState;
  } catch {
    return null;
  }
}

export function writeTrialBilling(state: TrialBillingState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BILLING_KEY, JSON.stringify(state));
}

export function markTrialBillingCancelled() {
  const current = readTrialBilling();
  if (!current) return null;
  const next: TrialBillingState = { ...current, status: "cancelled" };
  writeTrialBilling(next);
  return next;
}

export function setMustChangePassword(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(MUST_CHANGE_KEY, "1");
  else window.localStorage.removeItem(MUST_CHANGE_KEY);
}

export function mustChangePassword(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUST_CHANGE_KEY) === "1";
}
