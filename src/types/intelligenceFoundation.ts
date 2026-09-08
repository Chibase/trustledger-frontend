/**
 * I-01 — Common Intelligence Foundation
 *
 * Shared lifecycle contracts. Not a product module, DocType, dashboard, or
 * persistence layer. Existing SRM entities (stakeholder, engagement, incident,
 * commitment, evidence, project, place) stay the system of record.
 *
 * Lifecycle:
 * Evidence → Context → Signal → Interpretation → Intelligence →
 * Recommendation → Human Decision → Action → Outcome → Learning
 *
 * Stages are distinguishable. A signal is not a conclusion. An interpretation
 * is not a fact. A recommendation is not a decision (ADR-006). A decision is
 * not an outcome. Methodologies attach by identity only — no engine here.
 */

export const INTELLIGENCE_LIFECYCLE_STAGES = [
  "evidence",
  "context",
  "signal",
  "interpretation",
  "intelligence",
  "recommendation",
  "human_decision",
  "action",
  "outcome",
  "learning",
] as const;

export type IntelligenceLifecycleStage =
  (typeof INTELLIGENCE_LIFECYCLE_STAGES)[number];

/**
 * Architectural domain labels. Open string so future domains can attach
 * without a product-module enum lock-in. Known ids are convenience only.
 */
export const INTELLIGENCE_DOMAIN_IDS = [
  "stakeholder",
  "relationship",
  "community",
  "engagement",
  "risk",
  "impact",
  "decision",
  "trust",
] as const;

export type IntelligenceDomainId = (typeof INTELLIGENCE_DOMAIN_IDS)[number];

export type IntelligenceDomain = IntelligenceDomainId | (string & {});

/** Operational spine kinds — references only; does not redefine those entities. */
export const INTELLIGENCE_SPINE_KINDS = [
  "organisation",
  "project",
  "place",
  "stakeholder",
  "relationship",
  "engagement",
  "commitment",
  "incident",
  "evidence",
  "observation",
  "decision",
  "action",
  "outcome",
  "other",
] as const;

export type IntelligenceSpineKind = (typeof INTELLIGENCE_SPINE_KINDS)[number];

export type IntelligenceRecordRef = {
  kind: IntelligenceSpineKind;
  id: string;
};

export const INTELLIGENCE_PRODUCER_KINDS = [
  "recorded_fact",
  "observation",
  "rule",
  "model",
  "methodology",
  "human",
  "ai_assist",
  "external",
  "unknown",
] as const;

export type IntelligenceProducerKind =
  (typeof INTELLIGENCE_PRODUCER_KINDS)[number];

/**
 * Pluggable method identity. Not a methodology engine, registry UI, or
 * marketplace. Future packets may fill versioned methods without changing core.
 */
export type IntelligenceMethodRef = {
  kind: Extract<
    IntelligenceProducerKind,
    "rule" | "model" | "methodology" | "human" | "ai_assist" | "unknown"
  >;
  id: string;
  version?: string;
  summary?: string;
};

/**
 * Conceptual confidence vocabulary (Part 3). Not a probability and not a
 * predictive score. Taxonomy may be refined by later methodology packets.
 */
export const INTELLIGENCE_CONFIDENCE_LEVELS = [
  "verified",
  "strongly_supported",
  "indicative",
  "emerging",
  "uncertain",
  "disputed",
  "insufficient_evidence",
] as const;

export type IntelligenceConfidenceLevel =
  (typeof INTELLIGENCE_CONFIDENCE_LEVELS)[number];

export type IntelligenceProvenance = {
  producer: IntelligenceProducerKind;
  capturedAt?: string;
  recordRefs: IntelligenceRecordRef[];
  method?: IntelligenceMethodRef;
  transformation?: string;
  humanReviewed: boolean;
};

/**
 * ADR-006: machine output is never a decision. Same literals as TE-4
 * `TrustRecommendation` so existing trust suggestions stay compatible.
 */
export type SuggestionGovernance = {
  decision: "suggestion_only";
  humanApplyRequired: true;
  autonomous: false;
};

export const HUMAN_DECISION_STATUSES = [
  "pending",
  "accepted",
  "modified",
  "rejected",
  "deferred",
  "escalated",
] as const;

export type HumanDecisionStatus = (typeof HUMAN_DECISION_STATUSES)[number];

type IntelligenceRecordBase = {
  id: string;
  domain?: IntelligenceDomain;
  provenance: IntelligenceProvenance;
};

export type IntelligenceEvidenceRecord = IntelligenceRecordBase & {
  stage: "evidence";
  refs: IntelligenceRecordRef[];
  observedAt?: string;
  note?: string;
};

export type IntelligenceContextRecord = IntelligenceRecordBase & {
  stage: "context";
  subjectRefs: IntelligenceRecordRef[];
  evidenceRefs: IntelligenceRecordRef[];
  note?: string;
};

export type IntelligenceSignalRecord = IntelligenceRecordBase & {
  stage: "signal";
  evidenceRefs: IntelligenceRecordRef[];
  contextRefs: IntelligenceRecordRef[];
  summary: string;
  detectedAt?: string;
};

export type IntelligenceInterpretationRecord = IntelligenceRecordBase & {
  stage: "interpretation";
  signalId: string;
  hypothesis: string;
  alternatives: string[];
  confidence?: IntelligenceConfidenceLevel;
  interpretedAt?: string;
};

export type IntelligenceSynthesisRecord = IntelligenceRecordBase & {
  stage: "intelligence";
  interpretationIds: string[];
  evidenceRefs: IntelligenceRecordRef[];
  contextRefs: IntelligenceRecordRef[];
  summary: string;
  confidence?: IntelligenceConfidenceLevel;
};

export type IntelligenceRecommendationRecord = IntelligenceRecordBase & {
  stage: "recommendation";
  intelligenceId?: string;
  title: string;
  action: string;
  rationale: string;
  governance: SuggestionGovernance;
};

export type IntelligenceHumanDecisionRecord = IntelligenceRecordBase & {
  stage: "human_decision";
  recommendationId: string;
  status: HumanDecisionStatus;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
};

export type IntelligenceActionRecord = IntelligenceRecordBase & {
  stage: "action";
  decisionId: string;
  summary: string;
  occurredAt?: string;
  refs: IntelligenceRecordRef[];
};

export type IntelligenceOutcomeRecord = IntelligenceRecordBase & {
  stage: "outcome";
  actionId?: string;
  decisionId?: string;
  summary: string;
  recordedAt?: string;
};

export type IntelligenceLearningRecord = IntelligenceRecordBase & {
  stage: "learning";
  outcomeIds: string[];
  summary: string;
};

export type IntelligenceLifecycleRecord =
  | IntelligenceEvidenceRecord
  | IntelligenceContextRecord
  | IntelligenceSignalRecord
  | IntelligenceInterpretationRecord
  | IntelligenceSynthesisRecord
  | IntelligenceRecommendationRecord
  | IntelligenceHumanDecisionRecord
  | IntelligenceActionRecord
  | IntelligenceOutcomeRecord
  | IntelligenceLearningRecord;
