/**
 * I-05 — Explainable Intelligence Foundation
 *
 * Intelligence synthesises one or more explainable interpretations into a
 * decision-relevant understanding. It is not a copy of a hypothesis, not a
 * recommendation, not a decision, not a prediction, and not a score.
 *
 * Extends the I-01 `IntelligenceSynthesisRecord`. Reuses I-02 temporal
 * windows, I-04 interpretation ids/refs, and I-01 provenance / confidence
 * vocabulary. Confidence is evidential language, not a probability.
 */

import type { IntelligenceTemporalContext } from "@/types/intelligenceContext";
import type {
  IntelligenceConfidenceLevel,
  IntelligenceDomain,
  IntelligenceProvenance,
  IntelligenceRecordRef,
  IntelligenceSynthesisRecord,
} from "@/types/intelligenceFoundation";

/**
 * Professional judgement on the synthesis itself — not an action decision
 * and not `SuggestionGovernance`. Do not reuse `HumanDecisionStatus`.
 */
export const INTELLIGENCE_REVIEW_STATES = [
  "proposed",
  "reviewed",
  "endorsed",
  "disputed",
  "withdrawn",
] as const;

export type IntelligenceReviewState =
  (typeof INTELLIGENCE_REVIEW_STATES)[number];

export type ExplainableIntelligenceRecord = IntelligenceSynthesisRecord & {
  /**
   * Canonical I-05 statement. Kept in sync with I-01 `summary`.
   * Must not copy a contributing interpretation hypothesis.
   */
  statement: string;
  /** Why the statement follows from the contributing interpretations. */
  synthesis: string;
  /** I-03 signal row ids collected along the chain. */
  signalIds: string[];
  /** I-02 context row ids collected along the chain. */
  contextIds: string[];
  subjectRefs: IntelligenceRecordRef[];
  limitations?: string;
  missingEvidenceRefs: IntelligenceRecordRef[];
  temporal: IntelligenceTemporalContext;
  reviewState: IntelligenceReviewState;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type AssembleIntelligenceInput = {
  id: string;
  statement: string;
  synthesis: string;
  provenance: IntelligenceProvenance;
  interpretationIds: string[];
  signalIds?: string[];
  contextIds?: string[];
  contextRefs?: IntelligenceRecordRef[];
  evidenceRefs?: IntelligenceRecordRef[];
  subjectRefs?: IntelligenceRecordRef[];
  confidence?: IntelligenceConfidenceLevel;
  limitations?: string;
  missingEvidenceRefs?: IntelligenceRecordRef[];
  temporal?: IntelligenceTemporalContext;
  reviewState?: IntelligenceReviewState;
  reviewedBy?: string;
  reviewedAt?: string;
  domain?: IntelligenceDomain;
};
