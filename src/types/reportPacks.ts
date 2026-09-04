/**
 * Report pack formats for the Plan Owner Reports dashboard.
 * Availability = plan seniority ∩ Owner desk grants ∩ viewer desk rank.
 */

import type { DeskTier } from "@/types/deskTier";
import type { PlanId } from "@/config/plans";

export const REPORT_PACK_IDS = [
  "monthly",
  "executive",
  "board_presentation",
] as const;

export type ReportPackId = (typeof REPORT_PACK_IDS)[number];

export type ReportPackDef = {
  id: ReportPackId;
  label: string;
  shortLabel: string;
  description: string;
  /** Composition cue shown in the hub. */
  composition: string;
  /** Lowest commercial plan that includes this pack by default. */
  minPlan: PlanId;
  /** Minimum desk rank that may open the pack (Owner may raise). */
  minDesk: DeskTier;
  /** Suggested create-report kind when writing from this pack. */
  defaultKind:
    | "monthly_activity"
    | "board_investor"
    | "executive_risk"
    | "esg"
    | "grm";
  defaultAudience:
    | "supervisor"
    | "board"
    | "funders_investors"
    | "clients";
};

export const REPORT_PACKS: Record<ReportPackId, ReportPackDef> = {
  monthly: {
    id: "monthly",
    label: "Monthly operational report",
    shortLabel: "Monthly",
    description:
      "Text narrative plus graphs for period activity, cases attended, and trust pulse — suitable for supervisor and delivery review.",
    composition: "Text + graphs",
    minPlan: "solo",
    minDesk: "clo",
    defaultKind: "monthly_activity",
    defaultAudience: "supervisor",
  },
  executive: {
    id: "executive",
    label: "Executive risk brief",
    shortLabel: "Executive",
    description:
      "Identified issues, project impact, mitigation stage, expected outcome, and what executives can expedite.",
    composition: "Risk register · impact & mitigation",
    minPlan: "project",
    minDesk: "delivery",
    defaultKind: "executive_risk",
    defaultAudience: "board",
  },
  board_presentation: {
    id: "board_presentation",
    label: "Board / client / funder pack",
    shortLabel: "Board pack",
    description:
      "High-level assurance for clients, board, and funders — snapshot, material items, and asks. Not the monthly activity dump.",
    composition: "High-level · board & funders",
    minPlan: "institutional",
    minDesk: "executive",
    defaultKind: "board_investor",
    defaultAudience: "funders_investors",
  },
};

export const PLAN_RANK: Record<PlanId, number> = {
  solo: 1,
  practitioner: 2,
  project: 3,
  institutional: 4,
};

/** Plans at or above the pack’s minPlan. */
export function planIncludesPack(
  planId: PlanId | null | undefined,
  packId: ReportPackId,
): boolean {
  const pack = REPORT_PACKS[packId];
  // Demo / no-plan uses Project lens (monthly + executive).
  const effective: PlanId = planId ?? "project";
  return PLAN_RANK[effective] >= PLAN_RANK[pack.minPlan];
}
