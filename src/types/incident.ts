/**
 * Shapes aligned with future srm-core SRM Incident fields.
 */

import type {
  ComplaintNatureId,
  EscalationPolicy,
  IncidentProcessStages,
} from "@/lib/grievanceProcess";

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
  impactScore: number;
  sentimentScore: number | null;
  timeline: IncidentTimelineEvent[];
  geo?: IncidentGeoContext;
  processStages?: IncidentProcessStages;
  escalationPolicy?: EscalationPolicy;
}
