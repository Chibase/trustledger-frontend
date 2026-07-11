/**
 * Shapes aligned with future srm-core SRM Incident fields.
 */

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
  reportedAt: string;
  slaDueBy: string;
  slaBreached: boolean;
  escalationLevel: EscalationLevel;
  ownerName: string;
  category: string;
  impactScore: number;
  sentimentScore: number | null;
  timeline: IncidentTimelineEvent[];
}
