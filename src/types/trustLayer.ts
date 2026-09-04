/**
 * TE-2 parallel trust-native layer.
 * Coexists with SRM DocTypes and the TE-1 overlay. Not a Frappe DocType.
 * Never required on incident / engagement / commitment save paths.
 */

import type { TrustAttitude, TrustSentimentLabel } from "@/types/trustOverlay";

export const TRUST_DIMENSIONS = [
  "project",
  "implementing_entity",
  "process",
  "people",
  "intentions",
] as const;

export type TrustDimensionId = (typeof TRUST_DIMENSIONS)[number];

export const TRUST_DIMENSION_LABELS: Record<TrustDimensionId, string> = {
  project: "Trust in the project",
  implementing_entity: "Trust in the implementing entity",
  process: "Trust in the process",
  people: "Trust in the people",
  intentions: "Trust in intentions",
};

export type TrustSignalKind = TrustSentimentLabel | "unknown";

export type TrustObservationSource =
  | "incident"
  | "engagement"
  | "commitment"
  | "evidence"
  | "stakeholder"
  | "derived";

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
};

export type TrustLayerBucket = {
  orgId: string;
  observations: TrustObservation[];
  participation: TrustParticipationRecord[];
  community: TrustCommunityContext[];
  updatedAt: string;
};

export const TRUST_LAYER_STORAGE_KEY = "tl-trust-layer";
