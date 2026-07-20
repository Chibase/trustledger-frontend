export type PaystackPlanId = "practitioner" | "project" | "institutional";

export type PaystackPlan = {
  id: PaystackPlanId;
  label: string;
  summary: string;
  /** Amount in ZAR cents (Paystack subunit). 0 = contact sales / not self-serve. */
  amountCents: number;
  currency: "ZAR";
  selfServe: boolean;
};

function envCents(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

/**
 * Plan catalogue for Vercel checkout.
 * Override amounts (ZAR cents) via env without code change:
 * PAYSTACK_AMOUNT_PRACTITIONER_CENTS, PAYSTACK_AMOUNT_PROJECT_CENTS,
 * PAYSTACK_AMOUNT_INSTITUTIONAL_CENTS (0 = contact sales).
 */
export function getPaystackPlans(): PaystackPlan[] {
  return [
    {
      id: "practitioner",
      label: "Practitioner",
      summary: "Single Plan Owner — dashboard, reporting, standard AI assist.",
      amountCents: envCents("PAYSTACK_AMOUNT_PRACTITIONER_CENTS", 0),
      currency: "ZAR",
      selfServe: true,
    },
    {
      id: "project",
      label: "Project",
      summary: "Owner + per-project seats for client, contractor, community.",
      amountCents: envCents("PAYSTACK_AMOUNT_PROJECT_CENTS", 0),
      currency: "ZAR",
      selfServe: true,
    },
    {
      id: "institutional",
      label: "Institutional",
      summary: "Custom seats, regions, and compliance — sales-scoped.",
      amountCents: envCents("PAYSTACK_AMOUNT_INSTITUTIONAL_CENTS", 0),
      currency: "ZAR",
      selfServe: false,
    },
  ];
}

export function getPaystackPlan(id: string | null | undefined): PaystackPlan | null {
  if (!id) return null;
  return getPaystackPlans().find((p) => p.id === id) || null;
}

export function formatZarFromCents(cents: number): string {
  if (!cents) return "Contact sales";
  return `R ${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
