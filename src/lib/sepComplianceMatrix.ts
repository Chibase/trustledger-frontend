/**
 * SEP Tender Compliance Matrix
 * Phase D: TrustLedger SRM — SEP Generation Specification v1.0
 *
 * Specification Section 18: Tender Compliance Matrix
 *
 * Maps every tender requirement to SEP response, sections, evidence, and status.
 */

import type {
  ComplianceItem,
  EngagementActivity,
  Indicator,
  RequirementCategory,
  SepGenerationPlan,
  TenderIntelligence,
} from "@/types/sepAnalysis";

const STOP = new Set([
  "that", "this", "with", "from", "have", "been", "will", "shall", "must",
  "the", "and", "for", "are", "not", "all", "any", "into", "their", "they",
]);

/** Specification Section 19 numbers that typically answer each requirement class. */
export const CATEGORY_SEP_SECTIONS: Record<RequirementCategory, string[]> = {
  participation: ["7", "10", "11"],
  consultation: ["7", "10", "11", "13"],
  grievance: ["14", "15"],
  livelihood: ["8", "16", "17"],
  resettlement: ["5", "8", "11", "12"],
  vulnerability: ["12", "11"],
  reporting: ["17", "18"],
  evaluation: ["17", "23"],
  local_content: ["16"],
  other: ["4", "10"],
};

const CATEGORY_KEYWORDS: Record<RequirementCategory, string[]> = {
  participation: ["stakeholder", "participation", "engagement", "consult"],
  consultation: ["consultation", "public participation", "meeting"],
  grievance: ["grievance", "complaint", "redress", "mechanism"],
  livelihood: ["livelihood", "restoration", "income", "economic displacement"],
  resettlement: ["relocation", "resettlement", "displacement", "census", "host"],
  vulnerability: ["vulnerab", "inclusion", "gender", "disabled", "elderly"],
  reporting: ["report", "monthly", "progress", "minutes"],
  evaluation: ["evaluation", "monitoring", "indicator", "criteria", "progress", "report"],
  local_content: ["local content", "local labour", "smmes", "preferential"],
  other: [],
};

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 3 && !STOP.has(token)),
  );
}

function overlapScore(a: string, b: string): number {
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.size === 0 || right.size === 0) return 0;
  let hit = 0;
  for (const token of left) {
    if (right.has(token)) hit += 1;
  }
  return hit / Math.min(left.size, right.size);
}

export function normalizeRequirementCategory(
  category: string,
): RequirementCategory {
  if (category === "grievance") return "grievance";
  if (
    category === "participation" ||
    category === "consultation" ||
    category === "local_content" ||
    category === "livelihood" ||
    category === "resettlement" ||
    category === "vulnerability" ||
    category === "reporting" ||
    category === "evaluation" ||
    category === "other"
  ) {
    return category;
  }
  return "other";
}

function activityBlob(activity: EngagementActivity): string {
  return [
    activity.activityName,
    activity.purpose,
    activity.method,
    activity.expectedOutput,
    activity.decisionLinkage,
    ...activity.tools,
    ...activity.targetedStakeholders,
  ].join(" ");
}

function indicatorBlob(indicator: Indicator): string {
  return [indicator.indicatorName, indicator.definition, indicator.indicatorType].join(" ");
}

function categoryMatchesText(category: RequirementCategory, text: string): boolean {
  return CATEGORY_KEYWORDS[category].some((keyword) =>
    text.toLowerCase().includes(keyword),
  );
}

function coveringActivities(
  reqText: string,
  category: RequirementCategory,
  activities: EngagementActivity[],
): EngagementActivity[] {
  return activities.filter((activity) => {
    const blob = activityBlob(activity);
    const score = overlapScore(reqText, blob);
    return score >= 0.2 || categoryMatchesText(category, blob);
  });
}

function coveringIndicators(
  reqText: string,
  category: RequirementCategory,
  indicators: Indicator[],
  activityIds: string[],
): Indicator[] {
  return indicators.filter((indicator) => {
    if (
      indicator.linkedToEngagementActivity &&
      activityIds.includes(indicator.linkedToEngagementActivity)
    ) {
      return true;
    }
    const blob = indicatorBlob(indicator);
    return overlapScore(reqText, blob) >= 0.2 || categoryMatchesText(category, blob);
  });
}

function determineStatus(args: {
  activities: EngagementActivity[];
  indicators: Indicator[];
  evidence: string[];
  hasFrameworkHook: boolean;
}): { status: ComplianceItem["status"]; rationale: string; gap?: string } {
  const { activities, indicators, evidence, hasFrameworkHook } = args;
  const hasActivity = activities.length > 0;
  const hasEvidence = evidence.length > 0 || indicators.length > 0;

  if (hasActivity && hasEvidence) {
    return {
      status: "covered",
      rationale: "Requirement is implemented by named activities with an evidence path (records and/or indicators).",
    };
  }
  if (hasActivity || hasEvidence || hasFrameworkHook) {
    return {
      status: "partial",
      rationale: hasActivity
        ? "Activities are assigned but evidence/indicators are incomplete."
        : "Section or framework coverage exists without a dedicated activity.",
      gap: hasActivity
        ? "Add indicators or required records so completion can be verified."
        : "Assign an engagement activity, commitment, or indicator that implements this requirement.",
    };
  }
  return {
    status: "missing",
    rationale: "No activity, indicator, or framework currently implements this requirement.",
    gap: "No activity assigned; requirement is not yet designed into the SEP.",
  };
}

function generateResponse(
  activities: EngagementActivity[],
  indicators: Indicator[],
  sections: string[],
  status: ComplianceItem["status"],
): string {
  if (status === "missing") {
    return "No engagement activity, commitment, or indicator currently implements this requirement. It is flagged for design before approval.";
  }
  const activityBit = activities.length
    ? `Implemented through: ${activities.map((row) => row.activityName).join("; ")}.`
    : "Section coverage is identified; operational activity is still being confirmed.";
  const evidenceBit = indicators.length
    ? ` Verified through indicators: ${indicators.map((row) => row.indicatorName).join("; ")}.`
    : "";
  return `${activityBit} Addressed in SEP section(s) ${sections.join(", ")}.${evidenceBit}`;
}

function frameworkHook(
  category: RequirementCategory,
  plan: Pick<SepGenerationPlan, "grievanceFramework" | "communications" | "commitments">,
): boolean {
  if (category === "grievance") {
    return (plan.grievanceFramework?.stages.length || 0) > 0;
  }
  if (category === "consultation" || category === "participation") {
    return (plan.communications?.length || 0) > 0;
  }
  if (category === "reporting") {
    return (plan.commitments || []).some((row) => /report|register|minutes/i.test(row.commitmentText));
  }
  return false;
}

/**
 * Build the Section 18 matrix: requirement → SEP response → evidence → status.
 */
export function buildComplianceMatrix(
  tender: TenderIntelligence,
  plan: Pick<
    SepGenerationPlan,
    | "id"
    | "projectProfileId"
    | "activities"
    | "indicators"
    | "commitments"
    | "grievanceFramework"
    | "communications"
  >,
): ComplianceItem[] {
  const createdAt = new Date().toISOString();
  const matrix: ComplianceItem[] = [];

  for (const req of tender.requirements) {
    const category = normalizeRequirementCategory(req.category);
    const sections = [...CATEGORY_SEP_SECTIONS[category]];
    const activities = coveringActivities(req.text, category, plan.activities || []);
    const activityIds = activities.map((row) => row.id);
    const indicators = coveringIndicators(
      req.text,
      category,
      plan.indicators || [],
      activityIds,
    );
    const evidence = [
      ...activities.flatMap((row) => row.requiredRecords),
      ...indicators.map((row) => row.evidenceSource),
      ...(plan.commitments || [])
        .filter((row) => overlapScore(req.text, row.commitmentText) >= 0.2)
        .flatMap((row) => row.requiredEvidence),
    ].filter((row, index, all) => row && all.indexOf(row) === index);

    const hooked = frameworkHook(category, plan);
    const { status, rationale, gap } = determineStatus({
      activities,
      indicators,
      evidence,
      hasFrameworkHook: hooked,
    });

    matrix.push({
      id: `COMP-${req.id}`,
      projectProfileId: plan.projectProfileId,
      tenderIntelligenceId: tender.id,
      tenderRequirement: req.text,
      requirementCategory: category,
      sourceReference: req.sourceReference,
      mandatory: req.mandatory,
      sepResponse: generateResponse(activities, indicators, sections, status),
      sepSections: sections,
      evidence,
      linkedActivities: activityIds,
      linkedIndicators: indicators.map((row) => row.id),
      status,
      statusRationale: rationale,
      gap,
      mitigationPlan:
        status === "covered"
          ? undefined
          : "Design the missing activity/indicator before client approval; do not present the requirement as met.",
      riskIfNotCovered:
        status === "covered"
          ? undefined
          : "Bid/evaluation risk: the tender requirement cannot be evidenced.",
      isProfessionalRecommendation: false,
      createdAt,
    });
  }

  return matrix;
}

export function complianceStatus(matrix: ComplianceItem[]): {
  covered: number;
  partial: number;
  missing: number;
  missingRequirements: ComplianceItem[];
  coverageRatio: number;
} {
  const covered = matrix.filter((row) => row.status === "covered").length;
  const partial = matrix.filter((row) => row.status === "partial").length;
  const missingRequirements = matrix.filter((row) => row.status === "missing");
  return {
    covered,
    partial,
    missing: missingRequirements.length,
    missingRequirements,
    coverageRatio: matrix.length === 0 ? 0 : (covered + partial * 0.5) / matrix.length,
  };
}

/**
 * Human-readable gaps. When `mandatory` is true, only mandatory missing/partial rows.
 */
export function flagComplianceGaps(
  matrix: ComplianceItem[],
  mandatory: boolean = true,
): string[] {
  return matrix
    .filter((row) => row.status !== "covered")
    .filter((row) => (mandatory ? row.mandatory : true))
    .map((row) => {
      const label = row.status === "missing" ? "MISSING" : "PARTIAL";
      const detail =
        row.gap ||
        (row.status === "missing"
          ? "no activity assigned"
          : "implementation or evidence incomplete");
      return `Requirement: '${row.tenderRequirement}' is ${label} — ${detail}`;
    });
}
