/**
 * Plan-centric SEP execution overlay (SI-SEP).
 * planId is EngagementPlan.id — not a Paystack SKU.
 */

import type { SepPhaseId } from "@/types/engagementPlan";

export type SepOutcomeKind = "success" | "hurdle" | "failure";

export type SepCanonicalStatus =
  | "success"
  | "hurdle"
  | "failure"
  | "mitigated";

export type SepHealth = "green" | "amber" | "red";

export type SepTaskStatus = "planned" | "in_progress" | "done" | "blocked" | "slipped";

export type SepMilestoneStatus = "upcoming" | "due" | "done" | "slipped";

export type SepEventSeverity = "low" | "medium" | "high" | "critical";

export type SepEventStatus = "open" | "watching" | "resolved" | "accepted";

export type SepInterventionStatus =
  | "planned"
  | "active"
  | "done"
  | "ineffective"
  | "cancelled";

export type SepLinkedSourceKind =
  | "engagement"
  | "commitment"
  | "incident"
  | "capture"
  | "task"
  | "milestone";

export type PlanMilestone = {
  id: string;
  planId: string;
  phaseId: SepPhaseId;
  title: string;
  dueOn: string;
  completedOn: string | null;
  status: SepMilestoneStatus;
};

export type PlanTask = {
  id: string;
  planId: string;
  milestoneId: string | null;
  activityId: string;
  title: string;
  plannedOn: string;
  completedOn: string | null;
  status: SepTaskStatus;
  ownerLabel: string;
  linkedEngagementId: string | null;
};

export type PlanOutcomeEvent = {
  id: string;
  planId: string;
  kind: SepOutcomeKind;
  title: string;
  description: string;
  occurredOn: string;
  severity: SepEventSeverity | null;
  ownerLabel: string;
  taskId: string | null;
  milestoneId: string | null;
  status: SepEventStatus;
  resolvedOn: string | null;
  sourceKind: SepLinkedSourceKind | null;
  sourceId: string | null;
};

export type MitigationIntervention = {
  id: string;
  planId: string;
  eventId: string;
  description: string;
  ownerLabel: string;
  startOn: string;
  dueOn: string;
  status: SepInterventionStatus;
  outcomeNote: string;
  reviewOn: string | null;
};

export type PlanActivityLog = {
  id: string;
  planId: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export type SepExecutionOverlay = {
  version: 1;
  planId: string;
  submittedAt: string;
  ownerName: string;
  lastReviewAt: string | null;
  milestones: PlanMilestone[];
  tasks: PlanTask[];
  events: PlanOutcomeEvent[];
  interventions: MitigationIntervention[];
  activityLog: PlanActivityLog[];
};

export type SepKpis = {
  goalAttainmentPct: number;
  milestoneOnTimeRatePct: number;
  taskCompletionRatioPct: number;
  failureReopenRatioPct: number;
  hurdleResolutionDays: number | null;
  mitigationSuccessRatePct: number;
  scheduleVarianceDays: number;
  completionConfidenceIndex: number;
};

export type SepPlanSnapshot = {
  planId: string;
  title: string;
  submittedAt: string;
  ownerName: string;
  stageLabel: string;
  phaseId: SepPhaseId;
  progressPct: number;
  health: SepHealth;
  nextMilestoneOn: string | null;
  nextMilestoneTitle: string | null;
  openCriticalCount: number;
  kpis: SepKpis;
};

export type SepTimelineKind =
  | "submitted"
  | "approved"
  | "today"
  | "milestone"
  | "task"
  | "delay"
  | "failure"
  | "hurdle"
  | "success"
  | "mitigation";

export type SepTimelineEvent = {
  id: string;
  at: string;
  kind: SepTimelineKind;
  title: string;
  detail: string;
  status?: string;
};

export const SEP_HEALTH_LABELS: Record<SepHealth, string> = {
  green: "On track",
  amber: "Watch",
  red: "At risk",
};

export const SEP_OUTCOME_LABELS: Record<SepOutcomeKind, string> = {
  success: "Success",
  hurdle: "Hurdle",
  failure: "Failure",
};

export const SEP_CANONICAL_LABELS: Record<SepCanonicalStatus, string> = {
  success: "Success",
  hurdle: "Hurdle",
  failure: "Failure",
  mitigated: "Mitigated",
};
