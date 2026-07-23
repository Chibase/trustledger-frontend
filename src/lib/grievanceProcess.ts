/**
 * Complaint natures, process TAT stages, escalation routing, trust from sentiment.
 */

import type { Incident, IncidentPriority } from "@/types/incident";

export const COMPLAINT_NATURES = [
  { id: "dust", label: "Dust" },
  { id: "noise", label: "Noise" },
  { id: "water", label: "Water / utilities" },
  { id: "access_road", label: "Access road / mobility" },
  { id: "employment", label: "Local employment / labour" },
  { id: "community_disgruntlement", label: "Community disgruntlement" },
  { id: "safety", label: "Safety / security" },
  { id: "land", label: "Land / resettlement" },
  { id: "environment", label: "Environment / pollution" },
  { id: "other", label: "Other" },
] as const;

export type ComplaintNatureId = (typeof COMPLAINT_NATURES)[number]["id"];

export const PROCESS_STAGE_KEYS = [
  "reported",
  "resource_deployed",
  "investigated",
  "resolved",
  "verified",
  "closed",
] as const;

export type ProcessStageKey = (typeof PROCESS_STAGE_KEYS)[number];

export const PROCESS_STAGE_LABELS: Record<ProcessStageKey, string> = {
  reported: "Reported",
  resource_deployed: "Resource deployed",
  investigated: "Investigated",
  resolved: "Resolved",
  verified: "Verified",
  closed: "Closed",
};

export type IncidentProcessStages = {
  reportedAt: string;
  resourceDeployedAt?: string | null;
  investigatedAt?: string | null;
  resolvedAt?: string | null;
  /** Community / supervisor verify before close (packet 24e). */
  verifiedAt?: string | null;
  closedAt?: string | null;
  /** Target turnaround hours configured by client (per stage from previous). */
  targetHours?: Partial<Record<ProcessStageKey, number>>;
};

export type StaffTier = "junior" | "senior" | "unassigned";

/** Client policy: priorities at/above this threshold require senior. */
export type EscalationPolicy = {
  seniorFromPriority: IncidentPriority;
  suggestedTier: StaffTier;
  reason?: string;
};

const PRIORITY_RANK: Record<IncidentPriority, number> = {
  "P4-Low": 1,
  "P3-Medium": 2,
  "P2-High": 3,
  "P1-Critical": 4,
};

export function suggestStaffTier(
  priority: IncidentPriority,
  seniorFrom: IncidentPriority = "P2-High",
): EscalationPolicy {
  const needsSenior =
    PRIORITY_RANK[priority] >= PRIORITY_RANK[seniorFrom];
  return {
    seniorFromPriority: seniorFrom,
    suggestedTier: needsSenior ? "senior" : "junior",
    reason: needsSenior
      ? `${priority} meets or exceeds client senior threshold (${seniorFrom}).`
      : `${priority} is below senior threshold (${seniorFrom}) — junior staff may handle.`,
  };
}

export function stageTimestamp(
  stages: IncidentProcessStages | undefined,
  key: ProcessStageKey,
): string | null {
  if (!stages) return null;
  switch (key) {
    case "reported":
      return stages.reportedAt;
    case "resource_deployed":
      return stages.resourceDeployedAt ?? null;
    case "investigated":
      return stages.investigatedAt ?? null;
    case "resolved":
      return stages.resolvedAt ?? null;
    case "verified":
      return stages.verifiedAt ?? null;
    case "closed":
      return stages.closedAt ?? null;
  }
}

/** Hours between two ISO timestamps; null if incomplete. */
export function hoursBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round(((b - a) / (1000 * 60 * 60)) * 10) / 10;
}

export function processTurnaroundHours(
  stages: IncidentProcessStages | undefined,
): number | null {
  if (!stages) return null;
  const end = stages.closedAt || stages.resolvedAt;
  return hoursBetween(stages.reportedAt, end ?? null);
}

/**
 * Trust index 0–100 from average sentiment (−100..100) and open SLA pressure.
 * Explicit on dashboards — sentiment is the quantifiable trust signal.
 */
export function trustIndexFromIncidents(incidents: Incident[]): {
  trustIndex: number;
  avgSentiment: number | null;
  sampleSize: number;
  label: "Strong" | "Watch" | "At risk" | "Unknown";
} {
  const withSentiment = incidents.filter(
    (i) => typeof i.sentimentScore === "number",
  );
  if (!withSentiment.length) {
    return {
      trustIndex: 50,
      avgSentiment: null,
      sampleSize: 0,
      label: "Unknown",
    };
  }
  const avg =
    withSentiment.reduce((s, i) => s + (i.sentimentScore as number), 0) /
    withSentiment.length;
  // Map −100..100 → 0..100
  let trust = Math.round((avg + 100) / 2);
  const openBreaches = incidents.filter(
    (i) => i.status !== "Closed" && i.slaBreached,
  ).length;
  trust = Math.max(0, Math.min(100, trust - openBreaches * 5));
  const label =
    trust >= 70 ? "Strong" : trust >= 45 ? "Watch" : ("At risk" as const);
  return {
    trustIndex: trust,
    avgSentiment: Math.round(avg),
    sampleSize: withSentiment.length,
    label,
  };
}

export function defaultTargetHours(): Partial<
  Record<ProcessStageKey, number>
> {
  return {
    resource_deployed: 4,
    investigated: 24,
    resolved: 72,
    verified: 84,
    closed: 96,
  };
}

function setStageAt(
  stages: IncidentProcessStages,
  key: ProcessStageKey,
  at: string,
): IncidentProcessStages {
  const next = { ...stages };
  switch (key) {
    case "reported":
      next.reportedAt = at;
      break;
    case "resource_deployed":
      next.resourceDeployedAt = at;
      break;
    case "investigated":
      next.investigatedAt = at;
      break;
    case "resolved":
      next.resolvedAt = at;
      break;
    case "verified":
      next.verifiedAt = at;
      break;
    case "closed":
      next.closedAt = at;
      break;
  }
  return next;
}

export function ensureProcessStages(incident: Incident): IncidentProcessStages {
  if (incident.processStages?.reportedAt) {
    return {
      targetHours: defaultTargetHours(),
      ...incident.processStages,
    };
  }
  return {
    reportedAt: incident.reportedAt,
    targetHours: defaultTargetHours(),
  };
}

/** First stage that does not yet have a timestamp. */
export function nextPendingStage(
  stages: IncidentProcessStages,
): ProcessStageKey | null {
  for (const key of PROCESS_STAGE_KEYS) {
    if (!stageTimestamp(stages, key)) return key;
  }
  return null;
}

export function statusForProcessStages(
  stages: IncidentProcessStages,
  previous: Incident["status"],
): Incident["status"] {
  if (stages.closedAt) return "Closed";
  if (stages.resourceDeployedAt || stages.investigatedAt || stages.resolvedAt) {
    return previous === "Escalated" ? "Escalated" : "Investigating";
  }
  return previous === "Escalated" ? "Escalated" : "Open";
}

/**
 * Stamp the next pending stage (or a specific key). Returns updated incident.
 */
export function advanceIncidentStage(
  incident: Incident,
  options: { to?: ProcessStageKey; at?: string; actor?: string } = {},
): Incident {
  const at = options.at ?? new Date().toISOString();
  const actor = options.actor ?? "Case desk";
  let stages = ensureProcessStages(incident);
  const target = options.to ?? nextPendingStage(stages);
  if (!target) return incident;
  if (stageTimestamp(stages, target)) return incident;

  stages = setStageAt(stages, target, at);
  const event = {
    id: `EVT-${Date.now().toString(36)}`,
    type: `stage_${target}`,
    summary: `${PROCESS_STAGE_LABELS[target]} — ${actor}`,
    at,
  };
  return {
    ...incident,
    processStages: stages,
    status: statusForProcessStages(stages, incident.status),
    timeline: [event, ...incident.timeline],
  };
}

/** After resolved: stamp verified then closed in one action. */
export function verifyAndCloseIncident(
  incident: Incident,
  options: { at?: string; actor?: string } = {},
): Incident {
  const at = options.at ?? new Date().toISOString();
  const actor = options.actor ?? "Case desk";
  let next = incident;
  const stages = ensureProcessStages(incident);
  if (!stages.resolvedAt) {
    next = advanceIncidentStage(next, { to: "resolved", at, actor });
  }
  if (!ensureProcessStages(next).verifiedAt) {
    next = advanceIncidentStage(next, { to: "verified", at, actor });
  }
  if (!ensureProcessStages(next).closedAt) {
    next = advanceIncidentStage(next, { to: "closed", at, actor });
  }
  return next;
}
