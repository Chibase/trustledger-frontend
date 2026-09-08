/**
 * I-04 interpretation helpers. Hypothesis only — does not synthesise
 * intelligence, score, predict, recommend, or persist.
 */

import { contextAppliesAt, createTemporalContext } from "@/lib/intelligence/context";
import {
  isIntelligenceConfidenceLevel,
  uniqueRecordRefs,
} from "@/lib/intelligence/foundation";
import type { ContextualIntelligenceRecord } from "@/types/intelligenceContext";
import type {
  IntelligenceConfidenceLevel,
  IntelligenceLifecycleRecord,
} from "@/types/intelligenceFoundation";
import type {
  AssembleInterpretationInput,
  ExplainableInterpretationRecord,
  InterpretationAlternative,
  InterpretationReviewState,
} from "@/types/intelligenceInterpretation";
import { INTERPRETATION_REVIEW_STATES } from "@/types/intelligenceInterpretation";
import type { ExplainableSignalRecord } from "@/types/intelligenceSignal";

export function isInterpretationReviewState(
  value: unknown,
): value is InterpretationReviewState {
  return INTERPRETATION_REVIEW_STATES.includes(
    value as InterpretationReviewState,
  );
}

export function isInterpretationRecord(
  row: IntelligenceLifecycleRecord,
): row is Extract<IntelligenceLifecycleRecord, { stage: "interpretation" }> {
  return row.stage === "interpretation";
}

export function interpretationAppliesAt(
  row: ExplainableInterpretationRecord,
  at: string,
): boolean {
  return contextAppliesAt(row.temporal, at);
}

function asAlternatives(
  rows: InterpretationAlternative[] | string[] | undefined,
): InterpretationAlternative[] {
  if (!rows?.length) return [];
  const out: InterpretationAlternative[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (typeof row === "string") {
      const hypothesis = row.trim();
      if (!hypothesis) return;
      const id = `alt-${index + 1}`;
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ id, hypothesis });
      return;
    }
    if (!row?.hypothesis?.trim()) return;
    const id = String(row.id || `alt-${index + 1}`);
    if (seen.has(id)) return;
    seen.add(id);
    out.push({
      id,
      hypothesis: row.hypothesis.trim(),
      rationale: row.rationale?.trim() || undefined,
    });
  });
  return out;
}

function alternativeStrings(rows: InterpretationAlternative[]): string[] {
  return rows.map((row) => row.hypothesis);
}

/** Interpretation must not carry intelligence, recommendation, or decision fields. */
export function interpretationIsNotIntelligence(
  row: ExplainableInterpretationRecord,
): boolean {
  const extra = row as ExplainableInterpretationRecord & {
    interpretationIds?: unknown;
    action?: unknown;
    governance?: unknown;
    decision?: unknown;
    probability?: unknown;
    score?: unknown;
  };
  return (
    row.stage === "interpretation" &&
    extra.interpretationIds === undefined &&
    extra.action === undefined &&
    extra.governance === undefined &&
    extra.decision === undefined &&
    extra.probability === undefined &&
    extra.score === undefined
  );
}

export function createExplainableInterpretation(
  input: AssembleInterpretationInput,
): ExplainableInterpretationRecord {
  const signalId = String(input.signalId || "").trim();
  if (!signalId) {
    throw new Error("createExplainableInterpretation: signalId required");
  }
  const hypothesis = input.hypothesis.trim();
  const rationale = input.rationale.trim();
  if (!hypothesis || !rationale) {
    throw new Error("createExplainableInterpretation: hypothesis and rationale required");
  }
  const reviewState = input.reviewState ?? "proposed";
  if (!isInterpretationReviewState(reviewState)) {
    throw new Error("createExplainableInterpretation: unknown review state");
  }
  if (
    input.confidence !== undefined &&
    !isIntelligenceConfidenceLevel(input.confidence)
  ) {
    throw new Error("createExplainableInterpretation: unknown confidence");
  }
  const alternativesDetailed = asAlternatives(input.alternatives);
  const signalIds = [
    ...new Set(
      [signalId, ...(input.signalIds || []).map(String)].filter(Boolean),
    ),
  ];
  const temporal = createTemporalContext(input.temporal);
  const interpretedAt =
    input.interpretedAt || temporal.asOf || temporal.capturedAt;
  const record: ExplainableInterpretationRecord = {
    id: input.id,
    stage: "interpretation",
    domain: input.domain,
    signalId,
    signalIds,
    contextIds: [...new Set((input.contextIds || []).map(String).filter(Boolean))],
    evidenceRefs: uniqueRecordRefs(input.evidenceRefs),
    missingEvidenceRefs: uniqueRecordRefs(input.missingEvidenceRefs),
    hypothesis,
    rationale,
    alternatives: alternativeStrings(alternativesDetailed),
    alternativesDetailed,
    temporal,
    reviewState,
    provenance: input.provenance,
  };
  if (input.confidence) record.confidence = input.confidence;
  if (input.limitations?.trim()) record.limitations = input.limitations.trim();
  if (interpretedAt) record.interpretedAt = interpretedAt;
  if (input.reviewedBy) record.reviewedBy = input.reviewedBy;
  if (input.reviewedAt) record.reviewedAt = input.reviewedAt;
  return record;
}

/**
 * Links I-03 signal (and optional I-02 context) to an interpretation.
 * Hypothesis, rationale, and alternatives must be supplied — not inferred.
 */
export function assembleInterpretationFromSignal(input: {
  id: string;
  signal: ExplainableSignalRecord;
  context?: ContextualIntelligenceRecord;
  hypothesis: string;
  rationale: string;
  alternatives?: InterpretationAlternative[] | string[];
  confidence?: IntelligenceConfidenceLevel;
  limitations?: string;
  missingEvidenceRefs?: ExplainableInterpretationRecord["missingEvidenceRefs"];
  reviewState?: InterpretationReviewState;
}): ExplainableInterpretationRecord {
  const contextIds = [
    ...input.signal.contextIds,
    ...(input.context ? [input.context.id] : []),
  ];
  const evidenceRefs = [
    ...input.signal.evidenceRefs,
    ...(input.context?.evidenceRefs || []),
  ];
  return createExplainableInterpretation({
    id: input.id,
    signalId: input.signal.id,
    signalIds: [input.signal.id],
    contextIds,
    evidenceRefs,
    hypothesis: input.hypothesis,
    rationale: input.rationale,
    alternatives: input.alternatives,
    confidence: input.confidence,
    limitations: input.limitations,
    missingEvidenceRefs: input.missingEvidenceRefs,
    temporal: input.context?.temporal || input.signal.temporal,
    domain: input.signal.domain,
    reviewState: input.reviewState,
    provenance: {
      ...input.signal.provenance,
      transformation:
        input.signal.provenance.transformation || "assembled_from_signal",
    },
  });
}

/** New review record. Does not mutate the input and is not an action decision. */
export function recordInterpretationReview(
  row: ExplainableInterpretationRecord,
  input: {
    reviewState: InterpretationReviewState;
    reviewedBy?: string;
    reviewedAt?: string;
  },
): ExplainableInterpretationRecord {
  if (!isInterpretationReviewState(input.reviewState)) {
    throw new Error("recordInterpretationReview: unknown review state");
  }
  return {
    ...row,
    reviewState: input.reviewState,
    reviewedBy: input.reviewedBy,
    reviewedAt: input.reviewedAt,
    provenance: {
      ...row.provenance,
      producer: "human",
      humanReviewed: true,
    },
  };
}
