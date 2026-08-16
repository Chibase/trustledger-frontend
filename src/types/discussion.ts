/**
 * Viewer discussion / feedback on reports and issues (browser SoT until Cloud).
 * Available on every commercial plan — timestamps track given + responded per thread.
 */

import type { PlanId } from "@/config/plans";

export const DISCUSSION_SUBJECT_TYPES = ["report", "incident"] as const;
export type DiscussionSubjectType = (typeof DISCUSSION_SUBJECT_TYPES)[number];

export const DISCUSSION_KINDS = [
  "feedback",
  "info_request",
  "meeting_request",
] as const;
export type DiscussionKind = (typeof DISCUSSION_KINDS)[number];

export const DISCUSSION_KIND_LABELS: Record<DiscussionKind, string> = {
  feedback: "Feedback",
  info_request: "Information request",
  meeting_request: "Meeting / engagement",
};

export const DISCUSSION_STATUSES = [
  "open",
  "responded",
  "scheduled",
  "closed",
] as const;
export type DiscussionStatus = (typeof DISCUSSION_STATUSES)[number];

export const DISCUSSION_STATUS_LABELS: Record<DiscussionStatus, string> = {
  open: "Open",
  responded: "Responded",
  scheduled: "Meeting scheduled",
  closed: "Closed",
};

export const DISCUSSION_CALENDAR_KINDS = [
  "meeting",
  "engagement",
  "other",
] as const;
export type DiscussionCalendarKind =
  (typeof DISCUSSION_CALENDAR_KINDS)[number];

export type DiscussionCalendarItem = {
  id: string;
  title: string;
  /** ISO date-time when the meeting/engagement starts. */
  startsAt: string;
  endsAt?: string;
  kind: DiscussionCalendarKind;
  location?: string;
  notes?: string;
  /** Linked Engagement id when created from this item. */
  engagementId?: string;
  createdAt: string;
};

export type DiscussionMessage = {
  id: string;
  authorName: string;
  authorRole?: string;
  body: string;
  /** When this note was given. */
  givenAt: string;
  /** When a counterpart responded to this note (if applicable). */
  respondedAt?: string | null;
  /** True when this message is a reply / response. */
  isResponse?: boolean;
};

export type DiscussionThread = {
  id: string;
  subjectType: DiscussionSubjectType;
  subjectId: string;
  subjectTitle: string;
  projectId?: string;
  kind: DiscussionKind;
  status: DiscussionStatus;
  /** Workspace plan when the thread was opened (audit per plan). */
  planId?: PlanId;
  createdAt: string;
  updatedAt: string;
  /** When the viewer first gave feedback / asked. */
  givenAt: string;
  /** When the first (or latest) response was recorded. */
  respondedAt?: string | null;
  messages: DiscussionMessage[];
  calendarItems: DiscussionCalendarItem[];
};

export type DiscussionSubjectRef = {
  subjectType: DiscussionSubjectType;
  subjectId: string;
  subjectTitle: string;
  projectId?: string;
};
