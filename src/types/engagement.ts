export type EngagementKind =
  | "meeting"
  | "consultation"
  | "walkabout"
  | "briefing"
  | "other";

export type EngagementStatus = "draft" | "held" | "follow_up" | "closed";

export type EngagementSource =
  | "seed"
  | "minutes"
  | "attendance"
  | "social_intel"
  | "pasted_report";

/** First-class consultation / meeting record (V002 packet 24c). */
export type Engagement = {
  id: string;
  title: string;
  kind: EngagementKind;
  status: EngagementStatus;
  heldOn: string;
  ward: string;
  placeLabel?: string;
  projectId: string | null;
  summary: string;
  attendeesLabel: string;
  actionItems: string[];
  stakeholderIds: string[];
  captureId?: string;
  source: EngagementSource;
  createdAt: string;
};

export const ENGAGEMENT_KIND_LABELS: Record<EngagementKind, string> = {
  meeting: "Meeting",
  consultation: "Consultation",
  walkabout: "Walkabout",
  briefing: "Briefing",
  other: "Other",
};

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  draft: "Draft",
  held: "Held",
  follow_up: "Follow-up",
  closed: "Closed",
};

/**
 * Legacy meeting-note shape for `listNotes` Frappe method until Cloud
 * Engagement DocType lands. Prefer `Engagement`.
 */
export type MeetingNote = {
  id: string;
  title: string;
  ward: string;
  projectId: string | null;
  heldOn: string;
  summary: string;
  attendeesLabel: string;
  actionItems: string[];
};

export type EvidenceStub = {
  id: string;
  incidentId: string;
  fileName: string;
  classification: "General" | "Confidential" | "Restricted";
  uploadedBy: string;
  uploadedAt: string;
  isPrimary: boolean;
};

export function engagementToMeetingNote(row: Engagement): MeetingNote {
  return {
    id: row.id,
    title: row.title,
    ward: row.ward,
    projectId: row.projectId,
    heldOn: row.heldOn,
    summary: row.summary,
    attendeesLabel: row.attendeesLabel,
    actionItems: row.actionItems,
  };
}
