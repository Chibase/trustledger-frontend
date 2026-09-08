/**
 * I-05 intelligence helpers. Synthesis only — does not recommend, decide,
 * score, predict, or persist.
 */

import { contextAppliesAt, createTemporalContext } from "@/lib/intelligence/context";
import {
  isIntelligenceConfidenceLevel,
  uniqueRecordRefs,
} from "@/lib/intelligence/foundation";
import type {
  IntelligenceLifecycleRecord,
  IntelligenceSynthesisRecord,
} from "@/types/intelligenceFoundation";
import type { ExplainableInterpretationRecord } from "@/types/intelligenceInterpretation";
import type {
  AssembleIntelligenceInput,
  ExplainableIntelligenceRecord,
  IntelligenceReviewState,
} from "@/types/intelligenceSynthesis";
import { INTELLIGENCE_REVIEW_STATES } from "@/types/intelligenceSynthesis";

export function isIntelligenceReviewState(
  value: unknown,
): value is IntelligenceReviewState {
  return INTELLIGENCE_REVIEW_STATES.includes(value as IntelligenceReviewState);
}

export function isIntelligenceRecord(
  row: IntelligenceLifecycleRecord,
): row is IntelligenceSynthesisRecord {
  return row.stage === "intelligence";
}

export function intelligenceAppliesAt(
  row: ExplainableIntelligenceRecord,
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

/** Intelligence must not carry recommendation, decision, prediction, or score fields. */
export function intelligenceIsNotRecommendation(
  row: ExplainableIntelligenceRecord,
): boolean {
  const extra = row as ExplainableIntelligenceRecord & {
    action?: unknown;
    governance?: unknown;
    decision?: unknown;
    recommendationId?: unknown;
    hypothesis?: unknown;
    probability?: unknown;
    score?: unknown;
  };
  return (
    row.stage === "intelligence" &&
    extra.action === undefined &&
    extra.governance === undefined &&
    extra.decision === undefined &&
    extra.recommendationId === undefined &&
    extra.hypothesis === undefined &&
    extra.probability === undefined &&
    extra.score === undefined
  );
}

function assertStatementIsSynthesis(
  statement: string,
  hypotheses: string[],
): void {
  const needle = normalisedText(statement);
  if (!needle) {
    throw new Error("createExplainableIntelligence: statement required");
  }
  for (const hypothesis of hypotheses) {
    if (hypothesis && needle === normalisedText(hypothesis)) {
      throw new Error(
        "createExplainableIntelligence: statement must not duplicate an interpretation hypothesis",
      );
    }
  }
}

export function createExplainableIntelligence(
  input: AssembleIntelligenceInput,
  contributingHypotheses: string[] = [],
): ExplainableIntelligenceRecord {
  const interpretationIds = uniqueIds(input.interpretationIds);
  if (!interpretationIds.length) {
    throw new Error("createExplainableIntelligence: interpretationIds required");
  }
  const statement = input.statement.trim();
  const synthesis = input.synthesis.trim();
  if (!statement || !synthesis) {
    throw new Error("createExplainableIntelligence: statement and synthesis required");
  }
  if (normalisedText(statement) === normalisedText(synthesis)) {
    throw new Error(
      "createExplainableIntelligence: synthesis must add reasoning beyond the statement",
    );
  }
  assertStatementIsSynthesis(statement, contributingHypotheses);
  const reviewState = input.reviewState ?? "proposed";
  if (!isIntelligenceReviewState(reviewState)) {
    throw new Error("createExplainableIntelligence: unknown review state");
  }
  if (
    input.confidence !== undefined &&
    !isIntelligenceConfidenceLevel(input.confidence)
  ) {
    throw new Error("createExplainableIntelligence: unknown confidence");
  }
  const temporal = createTemporalContext(input.temporal);
  const record: ExplainableIntelligenceRecord = {
    id: input.id,
    stage: "intelligence",
    domain: input.domain,
    statement,
    summary: statement,
    synthesis,
    interpretationIds,
    signalIds: uniqueIds(input.signalIds),
    contextIds: uniqueIds(input.contextIds),
    contextRefs: uniqueRecordRefs(input.contextRefs),
    evidenceRefs: uniqueRecordRefs(input.evidenceRefs),
    subjectRefs: uniqueRecordRefs(input.subjectRefs),
    missingEvidenceRefs: uniqueRecordRefs(input.missingEvidenceRefs),
    temporal,
    reviewState,
    provenance: input.provenance,
  };
  if (input.confidence) record.confidence = input.confidence;
  if (input.limitations?.trim()) record.limitations = input.limitations.trim();
  if (input.reviewedBy) record.reviewedBy = input.reviewedBy;
  if (input.reviewedAt) record.reviewedAt = input.reviewedAt;
  return record;
}

function preservedLimitations(
  rows: ExplainableInterpretationRecord[],
  caller?: string,
): string | undefined {
  const parts = rows
    .map((row) => row.limitations?.trim())
    .filter((text): text is string => Boolean(text));
  if (caller?.trim()) parts.push(caller.trim());
  const unique = [...new Set(parts)];
  return unique.length ? unique.join(" ") : undefined;
}

/**
 * Links I-04 interpretations into one intelligence row.
 * Statement and synthesis must be supplied — not copied from a hypothesis.
 */
export function assembleIntelligenceFromInterpretations(input: {
  id: string;
  interpretations: ExplainableInterpretationRecord[];
  statement: string;
  synthesis: string;
  confidence?: ExplainableIntelligenceRecord["confidence"];
  limitations?: string;
  missingEvidenceRefs?: ExplainableIntelligenceRecord["missingEvidenceRefs"];
  subjectRefs?: ExplainableIntelligenceRecord["subjectRefs"];
  reviewState?: IntelligenceReviewState;
  domain?: ExplainableIntelligenceRecord["domain"];
}): ExplainableIntelligenceRecord {
  if (!input.interpretations.length) {
    throw new Error(
      "assembleIntelligenceFromInterpretations: at least one interpretation required",
    );
  }
  const interpretationIds = uniqueIds(input.interpretations.map((row) => row.id));
  if (interpretationIds.length !== input.interpretations.length) {
    throw new Error(
      "assembleIntelligenceFromInterpretations: interpretation ids must be unique",
    );
  }
  const signalIds = uniqueIds(
    input.interpretations.flatMap((row) => [row.signalId, ...row.signalIds]),
  );
  const contextIds = uniqueIds(
    input.interpretations.flatMap((row) => row.contextIds),
  );
  const evidenceRefs = uniqueRecordRefs(
    input.interpretations.flatMap((row) => row.evidenceRefs),
  );
  const missingEvidenceRefs = uniqueRecordRefs([
    ...input.interpretations.flatMap((row) => row.missingEvidenceRefs),
    ...(input.missingEvidenceRefs || []),
  ]);
  const subjectRefs = uniqueRecordRefs([
    ...(input.subjectRefs || []),
    ...input.interpretations.flatMap((row) =>
      row.evidenceRefs.filter(
        (ref) =>
          ref.kind === "stakeholder" ||
          ref.kind === "project" ||
          ref.kind === "place" ||
          ref.kind === "organisation",
      ),
    ),
  ]);
  const first = input.interpretations[0];
  return createExplainableIntelligence(
    {
      id: input.id,
      statement: input.statement,
      synthesis: input.synthesis,
      interpretationIds,
      signalIds,
      contextIds,
      evidenceRefs,
      subjectRefs,
      confidence: input.confidence,
      limitations: preservedLimitations(
        input.interpretations,
        input.limitations,
      ),
      missingEvidenceRefs,
      temporal: first.temporal,
      domain: input.domain ?? first.domain,
      reviewState: input.reviewState,
      provenance: {
        ...first.provenance,
        transformation:
          first.provenance.transformation || "assembled_from_interpretations",
        recordRefs: uniqueRecordRefs([
          ...first.provenance.recordRefs,
          ...input.interpretations.flatMap((row) => row.provenance.recordRefs),
        ]),
      },
    },
    input.interpretations.map((row) => row.hypothesis),
  );
}

/** New review record. Does not mutate the input and is not an action decision. */
export function recordIntelligenceReview(
  row: ExplainableIntelligenceRecord,
  input: {
    reviewState: IntelligenceReviewState;
    reviewedBy?: string;
    reviewedAt?: string;
  },
): ExplainableIntelligenceRecord {
  if (!isIntelligenceReviewState(input.reviewState)) {
    throw new Error("recordIntelligenceReview: unknown review state");
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
