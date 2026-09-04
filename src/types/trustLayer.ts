/**
 * TE-2 parallel trust-native layer — first-class trust model.
 * Coexists with SRM records and the TE-1 overlay.
 * Live SoT: Cloud DocTypes (TE-7). Browser key `tl-trust-layer` is a cache / demo store.
 * Never required on incident / engagement / commitment save paths.
 *
 * Six blueprint dimensions: project, entity, process, people, fairness,
 * and whether concerns will be acted upon. SRM sentiment is not a
 * trust observation.
 */

import type { TrustAttitude, TrustSentimentLabel } from "@/types/trustOverlay";

export const TRUST_DIMENSIONS = [
  "project",
  "implementing_entity",
  "process",
  "people",
  "fairness",
  "concerns_acted_upon",
] as const;

export type TrustDimensionId = (typeof TRUST_DIMENSIONS)[number];

/** Pre-blueprint `intentions` rows in `tl-trust-layer` map here. */
export const TRUST_DIMENSION_ALIASES: Record<string, TrustDimensionId> = {
  intentions: "concerns_acted_upon",
};

export const TRUST_DIMENSION_LABELS: Record<TrustDimensionId, string> = {
  project: "Trust in the project",
  implementing_entity: "Trust in the implementing entity",
  process: "Trust in the process",
  people: "Trust in the people",
  fairness: "Trust in fairness",
  concerns_acted_upon: "Trust that concerns will be acted upon",
};

export type TrustSignalKind = TrustSentimentLabel | "unknown";

export type TrustObservationSource =
  | "incident"
  | "engagement"
  | "commitment"
  | "evidence"
  | "stakeholder"
  | "derived";

export const TRUST_BARRIER_IDS = [
  "connectivity",
  "literacy",
  "language",
  "distance",
  "time_season",
  "customary_protocol",
  "gender_access",
  "distrust",
  "other",
] as const;

export type TrustBarrierId = (typeof TRUST_BARRIER_IDS)[number];

export const TRUST_TRANSLATION_STATUSES = [
  "untranslated",
  "working_language",
  "partial",
  "community_checked",
  "unknown",
] as const;

export type TrustTranslationStatus =
  (typeof TRUST_TRANSLATION_STATUSES)[number];

export const TRUST_PARTICIPATION_MOTIVATIONS = [
  "trust",
  "obligation",
  "livelihood",
  "mixed",
  "unknown",
] as const;

export type TrustParticipationMotivation =
  (typeof TRUST_PARTICIPATION_MOTIVATIONS)[number];

export const TRUST_PRESENCE_MODES = [
  "in_person",
  "proxy",
  "household_rep",
  "unknown",
] as const;

export type TrustPresenceMode = (typeof TRUST_PRESENCE_MODES)[number];

export const TRUST_RESPONSE_PATTERNS = [
  "vocal",
  "quiet_presence",
  "walkout",
  "mixed",
  "unknown",
] as const;

export type TrustResponsePattern = (typeof TRUST_RESPONSE_PATTERNS)[number];

export const TRUST_AUTHORITY_ROLES = [
  "traditional_authority",
  "community_leader",
  "ward_structure",
  "informal_influencer",
  "institutional_actor",
  "unknown",
] as const;

export type TrustAuthorityRole = (typeof TRUST_AUTHORITY_ROLES)[number];

/** First-class trust observation — parallel to SRM records, not a replacement. */
export type TrustObservation = {
  id: string;
  layer: "trust";
  observedAt: string;
  dimension: TrustDimensionId;
  signal: TrustSignalKind;
  /** Same −100…100 scale as case/note sentiment when known. */
  signalScore?: number | null;
  source: TrustObservationSource;
  sourceId?: string;
  projectId?: string | null;
  communityPlaceId?: string | null;
  stakeholderId?: string | null;
  evidenceIds: string[];
  note?: string;
  /** Spoken / source language of the note. Empty means unknown — not English. */
  narrativeLanguage?: string;
  translationStatus?: TrustTranslationStatus;
  oralSource?: boolean;
};

export type TrustLevel = "strong" | "watch" | "at_risk" | "unknown";
export type TrustTrend = "improving" | "stable" | "declining" | "unknown";

export type TrustDimensionStatus = {
  dimension: TrustDimensionId;
  level: TrustLevel;
  trend: TrustTrend;
  sampleSize: number;
  lastObservedAt: string | null;
  /** Plain-language rule used — keep this layer explainable. */
  rationale: string;
};

export type TrustParticipationRecord = {
  id: string;
  layer: "trust";
  observedAt: string;
  source: TrustObservationSource;
  sourceId?: string;
  projectId?: string | null;
  stakeholderId?: string | null;
  willingnessToParticipate: TrustAttitude;
  willingnessToContribute: TrustAttitude;
  /**
   * Whether participation looks trust-driven (high willingness + high confidence)
   * versus unknown / not trust-driven.
   */
  trustDriven: boolean | "unknown";
  note?: string;
  /** Why people showed up — do not infer from attendance alone. */
  motivation?: TrustParticipationMotivation;
  presenceMode?: TrustPresenceMode;
  /**
   * Presence at a meeting is not the same as agreement.
   * Optional flag; never inferred as false.
   */
  attendanceDoesNotEqualConsent?: boolean;
  responsePattern?: TrustResponsePattern;
};

export type TrustCommunityContext = {
  id: string;
  layer: "trust";
  updatedAt: string;
  projectId?: string | null;
  placeId?: string;
  placeLabel?: string;
  communityRef?: string;
  notes?: string;
  barriers?: string;
  sensitivityNotes?: string;
  ward?: string;
  municipality?: string;
  historyNotes?: string;
  powerStructureNotes?: string;
  /** Open tag list — communities are not forced onto one template. */
  barrierTags?: TrustBarrierId[];
  /** Desk / working language. Empty means unknown — not English. */
  workingLanguage?: string;
  narrativeLanguage?: string;
  translationStatus?: TrustTranslationStatus;
  oralSource?: boolean;
};

export type TrustLayerBucket = {
  orgId: string;
  observations: TrustObservation[];
  participation: TrustParticipationRecord[];
  community: TrustCommunityContext[];
  updatedAt: string;
};

export const TRUST_LAYER_STORAGE_KEY = "tl-trust-layer";
