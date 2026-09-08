/**
 * P-01 — Stakeholder Intelligence & Decision Workspace view model.
 *
 * Composition only. Does not replace I-01–I-06 contracts, SRM entities,
 * Cloud DocTypes, or the existing `/app/intelligence` ESG briefs page.
 */

import type { Commitment } from "@/types/commitment";
import type { Engagement, EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { ContextualIntelligenceRecord } from "@/types/intelligenceContext";
import type {
  IntelligenceActionRecord,
  IntelligenceHumanDecisionRecord,
  IntelligenceOutcomeRecord,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";
import type { ExplainableInterpretationRecord } from "@/types/intelligenceInterpretation";
import type { ExplainableRecommendationRecord } from "@/types/intelligenceRecommendation";
import type { ExplainableSignalRecord } from "@/types/intelligenceSignal";
import type { ExplainableIntelligenceRecord } from "@/types/intelligenceSynthesis";
import type { Stakeholder } from "@/types/stakeholder";

export type StakeholderWorkspaceMode = "customer" | "demo";

/** How I-03–I-07 rows were produced. Never treat seed_demo as customer data. */
export type StakeholderChainSource = "human" | "seed_demo";

export type StakeholderChainBundle = {
  stakeholderId: string;
  source: StakeholderChainSource;
  signals: ExplainableSignalRecord[];
  interpretations: ExplainableInterpretationRecord[];
  intelligence: ExplainableIntelligenceRecord[];
  recommendations: ExplainableRecommendationRecord[];
  decisions: IntelligenceHumanDecisionRecord[];
  actions: IntelligenceActionRecord[];
  outcomes: IntelligenceOutcomeRecord[];
  updatedAt: string;
};

export type RecommendationTrace = {
  recommendationId: string;
  intelligenceIds: string[];
  interpretationIds: string[];
  signalIds: string[];
  contextIds: string[];
  evidenceRefs: IntelligenceRecordRef[];
};

export type StakeholderWorkspaceView = {
  stakeholder: Stakeholder;
  mode: StakeholderWorkspaceMode;
  chainSource: StakeholderChainSource | "none";
  context: ContextualIntelligenceRecord;
  linkedEngagements: Engagement[];
  linkedCommitments: Commitment[];
  projectEngagements: Engagement[];
  projectCommitments: Commitment[];
  projectIncidents: Incident[];
  projectEvidence: EvidenceStub[];
  signals: ExplainableSignalRecord[];
  interpretations: ExplainableInterpretationRecord[];
  intelligence: ExplainableIntelligenceRecord[];
  recommendations: ExplainableRecommendationRecord[];
  decisions: IntelligenceHumanDecisionRecord[];
  actions: IntelligenceActionRecord[];
  outcomes: IntelligenceOutcomeRecord[];
};
