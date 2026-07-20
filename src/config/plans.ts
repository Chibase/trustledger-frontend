/**
 * Launch plan catalogue — mirrors trustledger.co.za pricing.
 * Paystack plan codes are filled by Ops after dashboard setup (Test then Live).
 */

export type PlanId = "starter" | "growth" | "enterprise";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  /** Launch monthly ZAR excl. VAT */
  monthlyLaunchZar: number | null;
  /** Launch annual monthly-equivalent ZAR excl. VAT */
  annualMonthlyLaunchZar: number | null;
  listMonthlyZar: number | null;
  trialDays: number | null;
  cta: "trial" | "sales";
  /** Paystack Plan code (PLN_…) — set after Ops creates plans */
  paystackPlanCodeTest: string | null;
  paystackPlanCodeLive: string | null;
};

export const TRIAL_DAYS = 14;

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Single site, core grievance workflow",
    monthlyLaunchZar: 5399,
    annualMonthlyLaunchZar: 4299,
    listMonthlyZar: 8999,
    trialDays: TRIAL_DAYS,
    cta: "trial",
    paystackPlanCodeTest: null,
    paystackPlanCodeLive: null,
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "Multi-site teams with governance reporting",
    monthlyLaunchZar: 14999,
    annualMonthlyLaunchZar: 11999,
    listMonthlyZar: 24999,
    trialDays: TRIAL_DAYS,
    cta: "trial",
    paystackPlanCodeTest: null,
    paystackPlanCodeLive: null,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise / Public",
    description: "Organisation-wide deployment and assurance",
    monthlyLaunchZar: null,
    annualMonthlyLaunchZar: null,
    listMonthlyZar: null,
    trialDays: null,
    cta: "sales",
    paystackPlanCodeTest: null,
    paystackPlanCodeLive: null,
  },
};

export const PLAN_IDS: PlanId[] = ["starter", "growth", "enterprise"];

export function isPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

/** Map marketing UTM campaign → plan (WordPress CTAs). */
export function planFromUtmCampaign(campaign: string | null | undefined): PlanId {
  if (!campaign) return "starter";
  const c = campaign.toLowerCase();
  if (c.includes("growth")) return "growth";
  if (c.includes("enterprise")) return "enterprise";
  if (c.includes("starter")) return "starter";
  return "starter";
}

export function formatZar(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}
