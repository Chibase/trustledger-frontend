/**
 * I-06 recommendation helpers. Suggestion only — does not decide, execute,
 * score, predict, or persist.
 */

import { contextAppliesAt, createTemporalContext } from "@/lib/intelligence/context";
import {
  isIntelligenceConfidenceLevel,
  suggestionGovernance,
  uniqueRecordRefs,
} from "@/lib/intelligence/foundation";
import type { ExplainableIntelligenceRecord } from "@/types/intelligenceSynthesis";
import type {
  IntelligenceLifecycleRecord,
  IntelligenceRecommendationRecord,
} from "@/types/intelligenceFoundation";
import type {
  AssembleRecommendationInput,
  ExplainableRecommendationRecord,
  RecommendationAlternative,
  RecommendationReviewState,
} from "@/types/intelligenceRecommendation";
import { RECOMMENDATION_REVIEW_STATES } from "@/types/intelligenceRecommendation";

const NO_ACTION_ID = "alt-no-action";
const NO_ACTION_STATEMENT = "Take no action now.";

export function isRecommendationReviewState(
  value: unknown,
): value is RecommendationReviewState {
  return RECOMMENDATION_REVIEW_STATES.includes(
    value as RecommendationReviewState,
  );
}

export function isExplainableRecommendationRecord(
  row: IntelligenceLifecycleRecord,
): row is IntelligenceRecommendationRecord {
  return row.stage === "recommendation";
}

export function recommendationAppliesAt(
  row: ExplainableRecommendationRecord,
  at: string,
): boolean {
  return contextAppliesAt(row.temporal, at);
}

function uniqueIds(ids: Array<string | undefined> | undefined): string[] {
  return [...new Set((ids || []).map((id) => String(id || "").trim()).filter(Boolean))];
}

function normalisedText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function optionalText(value?: string): string | undefined {
  const text = value?.trim();
  return text || undefined;
}

/** Recommendation must remain a suggestion — not a decision, score, or prediction. */
export function explainableRecommendationIsNotDecision(
  row: ExplainableRecommendationRecord,
): boolean {
  const extra = row as ExplainableRecommendationRecord & {
    status?: unknown;
    decisionId?: unknown;
    probability?: unknown;
    score?: unknown;
    hypothesis?: unknown;
  };
  return (
    row.stage === "recommendation" &&
    row.governance.decision === "suggestion_only" &&
    row.governance.humanApplyRequired === true &&
    row.governance.autonomous === false &&
    extra.status === undefined &&
    extra.decisionId === undefined &&
    extra.probability === undefined &&
    extra.score === undefined &&
    extra.hypothesis === undefined
  );
}

function assertNotIntelligenceCopy(
  statement: string,
  action: string,
  intelligenceStatements: string[],
): void {
  const statementNorm = normalisedText(statement);
  const actionNorm = normalisedText(action);
  for (const text of intelligenceStatements) {
    const needle = normalisedText(text);
    if (!needle) continue;
    if (statementNorm === needle || actionNorm === needle) {
      throw new Error(
        "createExplainableRecommendation: statement/action must not copy an intelligence statement",
      );
    }
  }
}

function withNoActionAlternative(
  rows: RecommendationAlternative[] | undefined,
): RecommendationAlternative[] {
  const out: RecommendationAlternative[] = [];
  const seen = new Set<string>();
  let hasNoAction = false;
  for (const row of rows || []) {
    if (!row?.statement?.trim()) continue;
    const id = String(row.id || "").trim() || `alt-${out.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const noAction = row.noAction === true || id === NO_ACTION_ID;
    if (noAction) hasNoAction = true;
    out.push({
      id,
      statement: row.statement.trim(),
      action: optionalText(row.action),
      rationale: optionalText(row.rationale),
      noAction: noAction || undefined,
    });
  }
  if (!hasNoAction) {
    out.push({
      id: NO_ACTION_ID,
      statement: NO_ACTION_STATEMENT,
      noAction: true,
      rationale: "A person may decide that no change is warranted.",
    });
  }
  return out;
}

export function createExplainableRecommendation(
  input: AssembleRecommendationInput,
  contributingStatements: string[] = [],
): ExplainableRecommendationRecord {
  const intelligenceIds = uniqueIds([
    input.intelligenceId,
    ...(input.intelligenceIds || []),
  ]);
  if (!intelligenceIds.length) {
    throw new Error("createExplainableRecommendation: intelligenceIds required");
  }
  const statement = input.statement.trim();
  const action = input.action.trim();
  const rationale = input.rationale.trim();
  const objective = input.objective.trim();
  if (!statement || !action || !rationale || !objective) {
    throw new Error(
      "createExplainableRecommendation: statement, action, rationale, and objective required",
    );
  }
  assertNotIntelligenceCopy(statement, action, contributingStatements);
  const reviewState = input.reviewState ?? "proposed";
  if (!isRecommendationReviewState(reviewState)) {
    throw new Error("createExplainableRecommendation: unknown review state");
  }
  if (
    input.confidence !== undefined &&
    !isIntelligenceConfidenceLevel(input.confidence)
  ) {
    throw new Error("createExplainableRecommendation: unknown confidence");
  }
  const alternatives = withNoActionAlternative(input.alternatives);
  const temporal = createTemporalContext(input.temporal);
  const record: ExplainableRecommendationRecord = {
    id: input.id,
    stage: "recommendation",
    domain: input.domain,
    statement,
    title: statement,
    action,
    rationale,
    objective,
    intelligenceId: intelligenceIds[0],
    intelligenceIds,
    interpretationIds: uniqueIds(input.interpretationIds),
    signalIds: uniqueIds(input.signalIds),
    contextIds: uniqueIds(input.contextIds),
    evidenceRefs: uniqueRecordRefs(input.evidenceRefs),
    subjectRefs: uniqueRecordRefs(input.subjectRefs),
    missingEvidenceRefs: uniqueRecordRefs(input.missingEvidenceRefs),
    alternatives,
    temporal,
    reviewState,
    provenance: input.provenance,
    governance: suggestionGovernance(),
  };
  if (input.confidence) record.confidence = input.confidence;
  if (optionalText(input.risks)) record.risks = optionalText(input.risks);
  if (optionalText(input.constraints)) {
    record.constraints = optionalText(input.constraints);
  }
  if (optionalText(input.dependencies)) {
    record.dependencies = optionalText(input.dependencies);
  }
  if (optionalText(input.limitations)) {
    record.limitations = optionalText(input.limitations);
  }
  if (input.reviewedBy) record.reviewedBy = input.reviewedBy;
  if (input.reviewedAt) record.reviewedAt = input.reviewedAt;
  return record;
}

/**
 * Links I-05 intelligence rows into one recommendation.
 * Statement, action, rationale, and objective must be supplied — not copied.
 */
export function assembleRecommendationFromIntelligence(input: {
  id: string;
  intelligence: ExplainableIntelligenceRecord[];
  statement: string;
  action: string;
  rationale: string;
  objective: string;
  alternatives?: RecommendationAlternative[];
  risks?: string;
  constraints?: string;
  dependencies?: string;
  limitations?: string;
  missingEvidenceRefs?: ExplainableRecommendationRecord["missingEvidenceRefs"];
  subjectRefs?: ExplainableRecommendationRecord["subjectRefs"];
  confidence?: ExplainableRecommendationRecord["confidence"];
  reviewState?: RecommendationReviewState;
  domain?: ExplainableRecommendationRecord["domain"];
}): ExplainableRecommendationRecord {
  if (!input.intelligence.length) {
    throw new Error(
      "assembleRecommendationFromIntelligence: at least one intelligence record required",
    );
  }
  const intelligenceIds = uniqueIds(input.intelligence.map((row) => row.id));
  if (intelligenceIds.length !== input.intelligence.length) {
    throw new Error(
      "assembleRecommendationFromIntelligence: intelligence ids must be unique",
    );
  }
  const first = input.intelligence[0];
  return createExplainableRecommendation(
    {
      id: input.id,
      statement: input.statement,
      action: input.action,
      rationale: input.rationale,
      objective: input.objective,
      intelligenceIds,
      interpretationIds: input.intelligence.flatMap((row) => row.interpretationIds),
      signalIds: input.intelligence.flatMap((row) => row.signalIds),
      contextIds: input.intelligence.flatMap((row) => row.contextIds),
      evidenceRefs: input.intelligence.flatMap((row) => row.evidenceRefs),
      subjectRefs: [
        ...(input.subjectRefs || []),
        ...input.intelligence.flatMap((row) => row.subjectRefs),
      ],
      alternatives: input.alternatives,
      risks: input.risks,
      constraints: input.constraints,
      dependencies: input.dependencies,
      limitations: input.limitations,
      missingEvidenceRefs: [
        ...input.intelligence.flatMap((row) => row.missingEvidenceRefs),
        ...(input.missingEvidenceRefs || []),
      ],
      confidence: input.confidence,
      temporal: first.temporal,
      domain: input.domain ?? first.domain,
      reviewState: input.reviewState,
      provenance: {
        ...first.provenance,
        transformation:
          first.provenance.transformation || "assembled_from_intelligence",
        recordRefs: uniqueRecordRefs([
          ...first.provenance.recordRefs,
          ...input.intelligence.flatMap((row) => row.provenance.recordRefs),
        ]),
      },
    },
    input.intelligence.map((row) => row.statement),
  );
}

/**
 * New review record. Does not mutate the input, does not execute, and is
 * not a human-decision record — including when reviewState is accepted.
 */
export function recordRecommendationReview(
  row: ExplainableRecommendationRecord,
  input: {
    reviewState: RecommendationReviewState;
    reviewedBy?: string;
    reviewedAt?: string;
  },
): ExplainableRecommendationRecord {
  if (!isRecommendationReviewState(input.reviewState)) {
    throw new Error("recordRecommendationReview: unknown review state");
  }
  return {
    ...row,
    reviewState: input.reviewState,
    reviewedBy: input.reviewedBy,
    reviewedAt: input.reviewedAt,
    governance: suggestionGovernance(),
    provenance: {
      ...row.provenance,
      producer: "human",
      humanReviewed: true,
    },
  };
}
