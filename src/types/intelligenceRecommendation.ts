/**
 * I-06 — Explainable Recommendation Foundation
 *
 * A recommendation is a suggestion for a human to consider. It is not
 * intelligence, not a decision, not an action, not a prediction, and not a
 * score. ADR-006: `suggestion_only`, `humanApplyRequired`, not autonomous.
 *
 * Extends the I-01 `IntelligenceRecommendationRecord`. Reuses I-02 temporal
 * windows, I-05 intelligence ids/refs, and I-01 provenance / confidence
 * vocabulary. Review state is not `HumanDecisionStatus`.
 */

import type { IntelligenceTemporalContext } from "@/types/intelligenceContext";
import type {
  IntelligenceConfidenceLevel,
  IntelligenceDomain,
  IntelligenceProvenance,
  IntelligenceRecommendationRecord,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";

/**
 * Judgement on the suggestion itself. `accepted` / `rejected` here do not
 * create a human-decision record and do not execute anything.
 */
export const RECOMMENDATION_REVIEW_STATES = [
  "proposed",
  "reviewed",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type RecommendationReviewState =
  (typeof RECOMMENDATION_REVIEW_STATES)[number];

export type RecommendationAlternative = {
  id: string;
  statement: string;
  action?: string;
  rationale?: string;
  /** True for the explicit no-action option. */
  noAction?: boolean;
};

export type ExplainableRecommendationRecord = IntelligenceRecommendationRecord & {
  /**
   * Canonical I-06 statement. Kept in sync with I-01 `title`.
   * Must not copy a contributing intelligence statement.
   */
  statement: string;
  /** I-01 `intelligenceId` remains the primary; this lists all contributors. */
  intelligenceIds: string[];
  interpretationIds: string[];
  signalIds: string[];
  contextIds: string[];
  evidenceRefs: IntelligenceRecordRef[];
  subjectRefs: IntelligenceRecordRef[];
  objective: string;
  alternatives: RecommendationAlternative[];
  risks?: string;
  constraints?: string;
  dependencies?: string;
  limitations?: string;
  missingEvidenceRefs: IntelligenceRecordRef[];
  confidence?: IntelligenceConfidenceLevel;
  temporal: IntelligenceTemporalContext;
  reviewState: RecommendationReviewState;
  reviewedBy?: string;
  reviewedAt?: string;
};

export type AssembleRecommendationInput = {
  id: string;
  statement: string;
  action: string;
  rationale: string;
  objective: string;
  provenance: IntelligenceProvenance;
  intelligenceIds: string[];
  intelligenceId?: string;
  interpretationIds?: string[];
  signalIds?: string[];
  contextIds?: string[];
  evidenceRefs?: IntelligenceRecordRef[];
  subjectRefs?: IntelligenceRecordRef[];
  alternatives?: RecommendationAlternative[];
  risks?: string;
  constraints?: string;
  dependencies?: string;
  limitations?: string;
  missingEvidenceRefs?: IntelligenceRecordRef[];
  confidence?: IntelligenceConfidenceLevel;
  temporal?: IntelligenceTemporalContext;
  reviewState?: RecommendationReviewState;
  reviewedBy?: string;
  reviewedAt?: string;
  domain?: IntelligenceDomain;
};
