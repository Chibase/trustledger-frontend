/**
 * I-02 — Contextual Intelligence Foundation
 *
 * Descriptive context only. Not interpretation, not a signal, not a score,
 * not a BAU module, not a graph, and not Cloud persistence.
 *
 * Extends the I-01 `IntelligenceContextRecord` contract. Existing Stakeholder /
 * Engagement / Commitment / Incident / Evidence entities remain the SoT.
 */

import type {
  IntelligenceContextRecord,
  IntelligenceProvenance,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";

/** Same literals as `StakeholderInfluence`. Descriptive levels, not scores. */
export const CONTEXT_LEVELS = ["high", "medium", "low", "unknown"] as const;

export type ContextLevel = (typeof CONTEXT_LEVELS)[number];

export const STAKEHOLDER_OPERATING_CONTEXT_KEYS = [
  "influence",
  "impact",
  "capacity",
  "commitment",
  "bauPressure",
  "competingPriorities",
  "availability",
  "accountabilityClarity",
  "engagementBurden",
] as const;

export type StakeholderOperatingContextKey =
  (typeof STAKEHOLDER_OPERATING_CONTEXT_KEYS)[number];

/**
 * Time-aware operating attributes. These can change; they are not identity.
 * `commitment` here is operating-context commitment, not the Commitment entity.
 */
export type StakeholderOperatingContext = Partial<
  Record<StakeholderOperatingContextKey, ContextLevel>
> & {
  note?: string;
};

/**
 * When this context describes. Observation time is not interpretation time.
 * An open `validTo` (omitted / null) means the window has not been closed.
 */
export type IntelligenceTemporalContext = {
  /** Moment the context is about. */
  asOf?: string;
  /** When the context row was assembled or captured. */
  capturedAt?: string;
  validFrom?: string;
  validTo?: string | null;
};

export type ContextualIntelligenceRecord = IntelligenceContextRecord & {
  temporal: IntelligenceTemporalContext;
  relatedRefs: IntelligenceRecordRef[];
  operating?: StakeholderOperatingContext;
};

export type AssembleContextInput = {
  id: string;
  provenance: IntelligenceProvenance;
  subjectRefs?: IntelligenceRecordRef[];
  relatedRefs?: IntelligenceRecordRef[];
  evidenceRefs?: IntelligenceRecordRef[];
  temporal?: IntelligenceTemporalContext;
  operating?: StakeholderOperatingContext;
  domain?: IntelligenceContextRecord["domain"];
  note?: string;
};
