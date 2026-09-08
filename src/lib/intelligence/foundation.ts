/**
 * I-01 helpers for the common intelligence lifecycle.
 * No persistence, UI, LLM, or methodology execution.
 */

import type {
  HumanDecisionStatus,
  IntelligenceConfidenceLevel,
  IntelligenceHumanDecisionRecord,
  IntelligenceLifecycleRecord,
  IntelligenceLifecycleStage,
  IntelligenceMethodRef,
  IntelligenceProducerKind,
  IntelligenceProvenance,
  IntelligenceRecommendationRecord,
  IntelligenceRecordRef,
  IntelligenceSpineKind,
  SuggestionGovernance,
} from "@/types/intelligenceFoundation";
import {
  HUMAN_DECISION_STATUSES,
  INTELLIGENCE_CONFIDENCE_LEVELS,
  INTELLIGENCE_LIFECYCLE_STAGES,
  INTELLIGENCE_PRODUCER_KINDS,
  INTELLIGENCE_SPINE_KINDS,
} from "@/types/intelligenceFoundation";

export const SUGGESTION_GOVERNANCE: SuggestionGovernance = {
  decision: "suggestion_only",
  humanApplyRequired: true,
  autonomous: false,
};

export function suggestionGovernance(): SuggestionGovernance {
  return { ...SUGGESTION_GOVERNANCE };
}

export function isSuggestionGovernance(
  value: unknown,
): value is SuggestionGovernance {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    row.decision === "suggestion_only" &&
    row.humanApplyRequired === true &&
    row.autonomous === false
  );
}

export function isIntelligenceLifecycleStage(
  value: unknown,
): value is IntelligenceLifecycleStage {
  return INTELLIGENCE_LIFECYCLE_STAGES.includes(
    value as IntelligenceLifecycleStage,
  );
}

export function intelligenceLifecycleIndex(
  stage: IntelligenceLifecycleStage,
): number {
  return INTELLIGENCE_LIFECYCLE_STAGES.indexOf(stage);
}

export function uniqueRecordRefs(
  refs: IntelligenceRecordRef[] | undefined,
): IntelligenceRecordRef[] {
  const seen = new Set<string>();
  const out: IntelligenceRecordRef[] = [];
  for (const ref of refs || []) {
    if (!ref?.id || !INTELLIGENCE_SPINE_KINDS.includes(ref.kind)) continue;
    const key = `${ref.kind}:${ref.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: ref.kind, id: String(ref.id) });
  }
  return out;
}

function asProducer(value: unknown): IntelligenceProducerKind {
  return INTELLIGENCE_PRODUCER_KINDS.includes(value as IntelligenceProducerKind)
    ? (value as IntelligenceProducerKind)
    : "unknown";
}

export function createIntelligenceProvenance(input: {
  producer?: IntelligenceProducerKind;
  capturedAt?: string;
  recordRefs?: IntelligenceRecordRef[];
  method?: IntelligenceMethodRef;
  transformation?: string;
  humanReviewed?: boolean;
}): IntelligenceProvenance {
  return {
    producer: asProducer(input.producer),
    capturedAt: input.capturedAt,
    recordRefs: uniqueRecordRefs(input.recordRefs),
    method: input.method
      ? {
          kind: input.method.kind,
          id: String(input.method.id),
          version: input.method.version,
          summary: input.method.summary,
        }
      : undefined,
    transformation: input.transformation,
    humanReviewed: input.humanReviewed === true,
  };
}

export function isIntelligenceConfidenceLevel(
  value: unknown,
): value is IntelligenceConfidenceLevel {
  return INTELLIGENCE_CONFIDENCE_LEVELS.includes(
    value as IntelligenceConfidenceLevel,
  );
}

export function isHumanDecisionStatus(
  value: unknown,
): value is HumanDecisionStatus {
  return HUMAN_DECISION_STATUSES.includes(value as HumanDecisionStatus);
}

export function isSpineKind(value: unknown): value is IntelligenceSpineKind {
  return INTELLIGENCE_SPINE_KINDS.includes(value as IntelligenceSpineKind);
}

export function stampSuggestion<T extends Record<string, unknown>>(
  row: T,
): T & SuggestionGovernance {
  return {
    ...row,
    ...suggestionGovernance(),
  };
}

export function createIntelligenceRecommendation(input: {
  id: string;
  title: string;
  action: string;
  rationale: string;
  provenance: IntelligenceProvenance;
  intelligenceId?: string;
  domain?: IntelligenceRecommendationRecord["domain"];
}): IntelligenceRecommendationRecord {
  return {
    id: input.id,
    stage: "recommendation",
    domain: input.domain,
    intelligenceId: input.intelligenceId,
    title: input.title,
    action: input.action,
    rationale: input.rationale,
    provenance: input.provenance,
    governance: suggestionGovernance(),
  };
}

/**
 * Human decision is a new record. Recommendations are never mutated into
 * decisions.
 */
export function recordHumanDecision(input: {
  id: string;
  recommendationId: string;
  status: HumanDecisionStatus;
  provenance: IntelligenceProvenance;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
  domain?: IntelligenceHumanDecisionRecord["domain"];
}): IntelligenceHumanDecisionRecord {
  return {
    id: input.id,
    stage: "human_decision",
    domain: input.domain,
    recommendationId: input.recommendationId,
    status: input.status,
    provenance: {
      ...input.provenance,
      producer: "human",
      humanReviewed: true,
    },
    decidedAt: input.decidedAt,
    decidedBy: input.decidedBy,
    note: input.note,
  };
}

export function lifecycleStageOf(
  row: IntelligenceLifecycleRecord,
): IntelligenceLifecycleStage {
  return row.stage;
}

export function isRecommendationRecord(
  row: IntelligenceLifecycleRecord,
): row is IntelligenceRecommendationRecord {
  return row.stage === "recommendation";
}

export function isHumanDecisionRecord(
  row: IntelligenceLifecycleRecord,
): row is IntelligenceHumanDecisionRecord {
  return row.stage === "human_decision";
}

/** Runtime guard: a recommendation cannot carry a human decision status. */
export function recommendationIsNotADecision(
  row: IntelligenceRecommendationRecord,
): boolean {
  return (
    row.stage === "recommendation" &&
    isSuggestionGovernance(row.governance) &&
    !("status" in row && isHumanDecisionStatus((row as { status?: unknown }).status))
  );
}
