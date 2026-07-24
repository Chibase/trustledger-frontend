/**
 * Paystack checkout catalogue (ADR-012 / ADR-019).
 * Amounts are ZAR cents. Override via env without code change.
 *
 * Launch defaults (excl. VAT, monthly):
 * - Practitioner R5,399 → 539900
 * - Project R14,999 → 1499900
 * - Institutional → sales (0)
 */

export type PaystackPlanId = "practitioner" | "project" | "institutional";

export type PaystackPlan = {
  id: PaystackPlanId;
  label: string;
  summary: string;
  /** Amount in ZAR cents (Paystack subunit). 0 = contact sales / not self-serve. */
  amountCents: number;
  currency: "ZAR";
  period: "month";
  selfServe: boolean;
};

/** Launch list prices in ZAR (whole rands) — source for WP paste and defaults. */
export const LAUNCH_PRICES_ZAR = {
  practitioner: 5399,
  project: 14999,
  institutional: null as number | null,
} as const;

function envCents(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

/**
 * Plan catalogue for Vercel checkout.
 * Override: PAYSTACK_AMOUNT_PRACTITIONER_CENTS, PAYSTACK_AMOUNT_PROJECT_CENTS,
 * PAYSTACK_AMOUNT_INSTITUTIONAL_CENTS (0 = contact sales).
 */
export function getPaystackPlans(): PaystackPlan[] {
  return [
    {
      id: "practitioner",
      label: "Practitioner",
      summary:
        "Single Plan Owner — dashboard, reporting, and standard AI assist.",
      amountCents: envCents(
        "PAYSTACK_AMOUNT_PRACTITIONER_CENTS",
        LAUNCH_PRICES_ZAR.practitioner * 100,
      ),
      currency: "ZAR",
      period: "month",
      selfServe: true,
    },
    {
      id: "project",
      label: "Project",
      summary:
        "Owner + per-project seats for client, contractor, and community roles.",
      amountCents: envCents(
        "PAYSTACK_AMOUNT_PROJECT_CENTS",
        LAUNCH_PRICES_ZAR.project * 100,
      ),
      currency: "ZAR",
      period: "month",
      selfServe: true,
    },
    {
      id: "institutional",
      label: "Institutional",
      summary: "Custom seats, regions, and compliance — sales-scoped.",
      amountCents: envCents("PAYSTACK_AMOUNT_INSTITUTIONAL_CENTS", 0),
      currency: "ZAR",
      period: "month",
      selfServe: false,
    },
  ];
}

export function getPaystackPlan(
  id: string | null | undefined,
): PaystackPlan | null {
  if (!id) return null;
  return getPaystackPlans().find((p) => p.id === id) || null;
}

export function formatZarFromCents(cents: number): string {
  if (!cents) return "Contact sales";
  return `R ${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPlanPrice(plan: PaystackPlan): string {
  if (!plan.amountCents) return "Contact sales";
  return `${formatZarFromCents(plan.amountCents)}/mo`;
}
