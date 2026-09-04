/**
 * Trial / marketing plan lens — aligned with Paystack catalogue (ADR-012 / ADR-035).
 * Prefer `getPaystackPlans()` for checkout amounts.
 */

import {
  getPaystackPlans,
  LAUNCH_PRICES_ZAR,
  type PaystackPlanId,
} from "@/lib/paystackPlans";

export type PlanId = PaystackPlanId;

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  monthlyLaunchZar: number | null;
  trialDays: number | null;
  cta: "pay" | "sales";
  payHref: string;
};

export const TRIAL_DAYS = 14;

export const PLAN_IDS: PlanId[] = [
  "solo",
  "practitioner",
  "project",
  "institutional",
];

export function isPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

/** Legacy UTM aliases (Starter/Growth) plus ADR-054 focused-SKU campaigns map onto Paystack plan ids. */
export function planFromUtmCampaign(
  campaign: string | null | undefined,
): PlanId {
  if (!campaign) return "solo";
  const c = campaign.toLowerCase();
  if (
    c.includes("growth") ||
    c.includes("project") ||
    c.includes("trial_growth")
  ) {
    return "project";
  }
  if (
    c.includes("enterprise") ||
    c.includes("institutional") ||
    c.includes("public")
  ) {
    return "institutional";
  }
  if (c.includes("practitioner") || c.includes("ai_assist")) {
    return "practitioner";
  }
  // ADR-054 focused-SKU persona campaigns (same Paystack plans, not new products).
  if (
    c.includes("local_procurement") ||
    c.includes("ed_portal") ||
    c.includes("bbbee") ||
    c.includes("field_companion") ||
    c.includes("capture_hub")
  ) {
    return "project";
  }
  if (
    c.includes("solo") ||
    c.includes("starter") ||
    c.includes("entry") ||
    c.includes("lone") ||
    c.includes("grievance_desk") ||
    c.includes("grm")
  ) {
    return "solo";
  }
  return "solo";
}

export function formatZar(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  solo: {
    id: "solo",
    name: "Solo",
    description:
      "Lone consultant — 1 seat, essential desk (no AI Assist).",
    monthlyLaunchZar: LAUNCH_PRICES_ZAR.solo,
    trialDays: TRIAL_DAYS,
    cta: "pay",
    payHref:
      "/pay?plan=solo&utm_source=pricing&utm_medium=cta&utm_campaign=buy_solo",
  },
  practitioner: {
    id: "practitioner",
    name: "Practitioner",
    description:
      "Independent desk — AI Assist, light governance, higher media quota.",
    monthlyLaunchZar: LAUNCH_PRICES_ZAR.practitioner,
    trialDays: TRIAL_DAYS,
    cta: "pay",
    payHref:
      "/pay?plan=practitioner&utm_source=pricing&utm_medium=cta&utm_campaign=buy_practitioner",
  },
  project: {
    id: "project",
    name: "Project",
    description:
      "Owner + per-project seats for client, contractor, and community.",
    monthlyLaunchZar: LAUNCH_PRICES_ZAR.project,
    trialDays: TRIAL_DAYS,
    cta: "pay",
    payHref:
      "/pay?plan=project&utm_source=pricing&utm_medium=cta&utm_campaign=buy_project",
  },
  institutional: {
    id: "institutional",
    name: "Institutional",
    description: "Organisation-wide deployment and assurance.",
    monthlyLaunchZar: null,
    trialDays: null,
    cta: "sales",
    payHref:
      "/contact?utm_source=pricing&utm_medium=cta&utm_campaign=buy_institutional",
  },
};

/** Live catalogue with env-overridable Paystack amounts for UI. */
export function getMarketingPlans(): PlanDefinition[] {
  return getPaystackPlans().map((p) => ({
    id: p.id,
    name: p.label,
    description: p.summary,
    monthlyLaunchZar: p.amountCents ? Math.round(p.amountCents / 100) : null,
    trialDays: p.selfServe ? TRIAL_DAYS : null,
    cta: p.selfServe ? ("pay" as const) : ("sales" as const),
    payHref:
      p.selfServe
        ? `/pay?plan=${p.id}&utm_source=pricing&utm_medium=cta&utm_campaign=buy_${p.id}`
        : `/contact?utm_source=pricing&utm_medium=cta&utm_campaign=buy_${p.id}`,
  }));
}
