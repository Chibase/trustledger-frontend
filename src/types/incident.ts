/**
 * Shapes aligned with future srm-core SRM Incident fields.
 */

import type {
  ComplaintNatureId,
  EscalationPolicy,
  IncidentProcessStages,
} from "@/lib/grievanceProcess";
import type { GrievanceRootCauseId } from "@/lib/grievanceRootCause";
import type { DeskTier } from "@/types/deskTier";
import type { MelLearnAdaptRecord } from "@/types/melAdapt";
import type { StakeholderTrustResponse } from "@/types/trustOverlay";

export type IncidentStatus =
  | "Open"
  | "Investigating"
  | "Escalated"
  | "Closed";

export type IncidentPriority =
  | "P4-Low"
  | "P3-Medium"
  | "P2-High"
  | "P1-Critical";

export type EscalationLevel = "None" | "L1" | "L2" | "L3";

export interface IncidentTimelineEvent {
  id: string;
  type: string;
  summary: string;
  at: string;
}

export interface IncidentGeoContext {
  countryCode?: string;
  countryName?: string;
  provinceId?: string;
  provinceName?: string;
  districtId?: string;
  districtName?: string;
  municipalityId?: string;
  municipalityName?: string;
  traditionalCouncilId?: string;
  traditionalCouncilName?: string;
  wardId?: string;
  wardName?: string;
  placeId?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  ward: string;
  geographicArea: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  projectId: string;
  projectName: string;
  reportedByRole: "community" | "contractor" | "client" | "admin";
  /** Reporter display name; omit or null when anonymous. */
  reporterName?: string | null;
  anonymous?: boolean;
  reportedAt: string;
  slaDueBy: string;
  slaBreached: boolean;
  escalationLevel: EscalationLevel;
  ownerName: string;
  category: string;
  /** Structured nature of complaint (dust, noise, …). */
  nature?: ComplaintNatureId | string;
  /**
   * MEL-2 operational root-cause tag (why it happened). Distinct from `nature`.
   * Not a trust-movement cause. Required to stamp investigated / resolved.
   */
  rootCause?: GrievanceRootCauseId;
  /** Required when `rootCause` is `other`. */
  rootCauseNote?: string;
  /**
   * MEL-3 Learn & Adapt records. Corrective actions — not grievance stages.
   * Completing a record does not close the case.
   */
  learnAdaptRecords?: MelLearnAdaptRecord[];
  impactScore: number;
  sentimentScore: number | null;
  /** Applied label when sentiment was captured from the case note. */
  sentimentLabel?: "positive" | "neutral" | "negative" | null;
  timeline: IncidentTimelineEvent[];
  geo?: IncidentGeoContext;
  processStages?: IncidentProcessStages;
  escalationPolicy?: EscalationPolicy;
  /** Professional desk that filed the case (CLO / site / …). */
  filedByTier?: DeskTier;
  /**
   * TE-1 overlay — later trust attitudes. Optional; omitted on Cloud writes.
   * Does not replace `sentimentLabel` / `sentimentScore`.
   */
  trustResponse?: StakeholderTrustResponse;
}
