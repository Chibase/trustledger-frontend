/**
 * Power–interest segmentation from SEP stakeholder classes.
 * Influence = power. Interest defaults from purpose if the playbook omitted it.
 */

import type {
  SepInterest,
  SepStakeholderClass,
} from "@/types/engagementPlan";

export type SepMatrixQuadrant =
  | "manage_closely"
  | "keep_satisfied"
  | "keep_informed"
  | "monitor";

export const SEP_QUADRANT_LABELS: Record<SepMatrixQuadrant, string> = {
  manage_closely: "Manage closely",
  keep_satisfied: "Keep satisfied",
  keep_informed: "Keep informed",
  monitor: "Monitor",
};

function rank(value: "high" | "medium" | "low" | "unknown"): number {
  if (value === "high") return 2;
  if (value === "medium") return 1;
  return 0;
}

export function interestForClass(row: SepStakeholderClass): SepInterest {
  if (row.interest) return row.interest;
  if (
    row.purpose === "consult" ||
    row.purpose === "decide" ||
    row.purpose === "remediate"
  ) {
    return "high";
  }
  if (row.influence === "high") return "medium";
  return "low";
}

export function quadrantForClass(row: SepStakeholderClass): SepMatrixQuadrant {
  const power = rank(row.influence);
  const interest = rank(interestForClass(row));
  if (power >= 2 && interest >= 2) return "manage_closely";
  if (power >= 2) return "keep_satisfied";
  if (interest >= 2) return "keep_informed";
  return "monitor";
}

export function vulnerabilityForClass(row: SepStakeholderClass): string {
  if (row.vulnerability?.trim()) return row.vulnerability.trim();
  if (row.kind === "community_group" || row.kind === "traditional_authority") {
    return "High: live with the impact; exclusion or late notice is a licence risk.";
  }
  if (row.kind === "government") {
    return "Medium: skipped statutory or ward channels become objections later.";
  }
  if (row.kind === "contractor") {
    return "Medium: site behaviour can undo consultation done in the hall.";
  }
  return "Review in inception — do not assume uniform vulnerability.";
}
