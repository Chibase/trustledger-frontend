/**
 * I-04 — Explainable Interpretation Foundation
 *
 * An interpretation is a reasoned hypothesis about a signal. It is not
 * established truth, intelligence synthesis, a recommendation, or a decision.
 *
 * Extends the I-01 `IntelligenceInterpretationRecord`. Reuses I-02 temporal
 * windows, I-03 signal ids/refs, and I-01 provenance / confidence vocabulary.
 * Confidence is evidential language, not a probability or score.
 */

import type { IntelligenceTemporalContext } from "@/types/intelligenceContext";
import type {
  IntelligenceConfidenceLevel,
  IntelligenceDomain,
  IntelligenceInterpretationRecord,
  IntelligenceProvenance,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";

/**
 * Professional judgement on the hypothesis itself — not an action decision.
 * Do not reuse `HumanDecisionStatus` here.
 */
export const INTERPRETATION_REVIEW_STATES = [
  "proposed",
  "reviewed",
  "endorsed",
  "disputed",
  "withdrawn",
] as const;

export type InterpretationReviewState =
  (typeof INTERPRETATION_REVIEW_STATES)[number];

export type InterpretationAlternative = {
  id: string;
  hypothesis: string;
  rationale?: string;
};

export type ExplainableInterpretationRecord = IntelligenceInterpretationRecord & {
  /** All linked I-03 signal ids. `signalId` remains the primary (I-01). */
  signalIds: string[];
  contextIds: string[];
  evidenceRefs: IntelligenceRecordRef[];
  rationale: string;
  limitations?: string;
  missingEvidenceRefs: IntelligenceRecordRef[];
  temporal: IntelligenceTemporalContext;
  reviewState: InterpretationReviewState;
  reviewedBy?: string;
  reviewedAt?: string;
  alternativesDetailed: InterpretationAlternative[];
};

export type AssembleInterpretationInput = {
  id: string;
  hypothesis: string;
  rationale: string;
  provenance: IntelligenceProvenance;
  signalId: string;
  signalIds?: string[];
  contextIds?: string[];
  evidenceRefs?: IntelligenceRecordRef[];
  alternatives?: InterpretationAlternative[] | string[];
  confidence?: IntelligenceConfidenceLevel;
  limitations?: string;
  missingEvidenceRefs?: IntelligenceRecordRef[];
  temporal?: IntelligenceTemporalContext;
  interpretedAt?: string;
  reviewState?: InterpretationReviewState;
  reviewedBy?: string;
  reviewedAt?: string;
  domain?: IntelligenceDomain;
};
