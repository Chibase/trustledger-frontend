/**
 * Assemble a plan-scoped execution view: snapshot, timeline, analytics.
 * All queries take planId (EngagementPlan.id). Platform rows are included
 * only when they match applied ids or the plan's projectId.
 */

import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { EngagementPlan } from "@/types/engagementPlan";
import type { Incident } from "@/types/incident";
import type {
  SepEventSeverity,
  SepOutcomeKind,
  SepPlanSnapshot,
  SepTimelineEvent,
  SepExecutionOverlay,
} from "@/types/sepExecution";
import {
  computeSepKpis,
  currentPhaseId,
  nextMilestone,
  normalizeCommitmentStatus,
  normalizeEngagementStatus,
  normalizeIncidentStatus,
  phaseLabel,
  snapshotHealth,
} from "@/lib/sepKpis";
import { backfillSepExecution, saveSepExecution } from "@/lib/sepExecutionStore";
import { listWorkspaceIncidents } from "@/lib/workspaceData";

function readLocalArray<T extends { id: string }>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listLinkedEngagements(plan: EngagementPlan): Engagement[] {
  const ids = new Set(plan.applied?.engagementIds || []);
  const rows = readLocalArray<Engagement>("tl-engagements");
  return rows.filter(
    (row) =>
      ids.has(row.id) ||
      (plan.projectId && row.projectId === plan.projectId),
  );
}

export function listLinkedCommitments(plan: EngagementPlan): Commitment[] {
  const ids = new Set(plan.applied?.commitmentIds || []);
  const rows = readLocalArray<Commitment>("tl-commitments");
  return rows.filter(
    (row) =>
      ids.has(row.id) ||
      (plan.projectId && row.projectId === plan.projectId),
  );
}

export function listLinkedIncidents(plan: EngagementPlan): Incident[] {
  if (!plan.projectId) return [];
  return listWorkspaceIncidents().filter(
    (row) => row.projectId === plan.projectId,
  );
}

/** Pull desk statuses onto tasks / seed outcome events once. */
export function syncSepExecutionFromPlatform(
  plan: EngagementPlan,
  overlay: SepExecutionOverlay,
): SepExecutionOverlay {
  const next: SepExecutionOverlay = {
    ...overlay,
    tasks: overlay.tasks.map((t) => ({ ...t })),
    events: [...overlay.events],
  };
  const engagements = listLinkedEngagements(plan);
  const byId = new Map(engagements.map((row) => [row.id, row]));
  for (const task of next.tasks) {
    const eng = task.linkedEngagementId
      ? byId.get(task.linkedEngagementId)
      : undefined;
    if (!eng) continue;
    const canon = normalizeEngagementStatus(eng.status);
    if (canon === "success" && task.status !== "done") {
      task.status = "done";
      task.completedOn = eng.heldOn || new Date().toISOString().slice(0, 10);
    } else if (canon === "hurdle" && task.status === "planned") {
      task.status = "in_progress";
    }
  }

  const sourced = new Set(
    next.events.map((ev) => `${ev.sourceKind}:${ev.sourceId}`),
  );
  for (const commitment of listLinkedCommitments(plan)) {
    const key = `commitment:${commitment.id}`;
    if (sourced.has(key)) continue;
    const canon = normalizeCommitmentStatus(commitment.status);
    if (canon === "success" || canon === "hurdle" || canon === "failure") {
      next.events.push({
        id: `EVT-cmt-${commitment.id}`,
        planId: plan.id,
        kind: canon === "success" ? "success" : canon === "failure" ? "failure" : "hurdle",
        title: commitment.title,
        description: `Commitment ${commitment.status} on the promise board.`,
        occurredOn: commitment.dueOn,
        severity: canon === "failure" ? "high" : canon === "hurdle" ? "medium" : null,
        ownerLabel: commitment.ownerLabel,
        taskId: null,
        milestoneId: null,
        status: canon === "success" ? "resolved" : "open",
        resolvedOn: canon === "success" ? commitment.dueOn : null,
        sourceKind: "commitment",
        sourceId: commitment.id,
      });
    }
  }
  for (const incident of listLinkedIncidents(plan)) {
    const key = `incident:${incident.id}`;
    if (sourced.has(key)) continue;
    const canon = normalizeIncidentStatus(incident.status);
    next.events.push({
      id: `EVT-inc-${incident.id}`,
      planId: plan.id,
      kind: canon === "success" ? "success" : canon === "failure" ? "failure" : "hurdle",
      title: incident.title,
      description: incident.description.slice(0, 280),
      occurredOn: incident.reportedAt.slice(0, 10),
      severity: incident.priority === "P1-Critical" ? "critical" : "high",
      ownerLabel: incident.ownerName,
      taskId: null,
      milestoneId: null,
      status: canon === "success" ? "resolved" : "open",
      resolvedOn: canon === "success" ? incident.reportedAt.slice(0, 10) : null,
      sourceKind: "incident",
      sourceId: incident.id,
    });
  }
  return saveSepExecution(next);
}

export function loadSepExecutionView(
  plan: EngagementPlan,
  opts?: { ownerName?: string },
): SepExecutionOverlay {
  const seeded = backfillSepExecution(plan, { ownerName: opts?.ownerName });
  return syncSepExecutionFromPlatform(plan, seeded);
}

export function buildSepPlanSnapshot(
  plan: EngagementPlan,
  overlay: SepExecutionOverlay,
  todayIso = new Date().toISOString().slice(0, 10),
): SepPlanSnapshot {
  const kpis = computeSepKpis(overlay, todayIso);
  const { health, openCriticalCount } = snapshotHealth(overlay, kpis);
  const phaseId = currentPhaseId(overlay);
  const next = nextMilestone(overlay.milestones);
  const doneTasks = overlay.tasks.filter((t) => t.status === "done").length;
  const progressPct =
    overlay.tasks.length === 0
      ? kpis.goalAttainmentPct
      : Math.round((doneTasks / overlay.tasks.length) * 100);
  return {
    planId: plan.id,
    title: plan.title,
    submittedAt: overlay.submittedAt,
    ownerName: overlay.ownerName,
    stageLabel: phaseLabel(phaseId),
    phaseId,
    progressPct,
    health,
    nextMilestoneOn: next?.dueOn || null,
    nextMilestoneTitle: next?.title || null,
    openCriticalCount,
    kpis,
  };
}

export function buildSepTimeline(
  plan: EngagementPlan,
  overlay: SepExecutionOverlay,
): SepTimelineEvent[] {
  const rows: SepTimelineEvent[] = [
    {
      id: "submitted",
      at: overlay.submittedAt,
      kind: "submitted",
      title: "Plan submitted",
      detail: plan.title,
    },
  ];
  if (plan.applied?.at) {
    rows.push({
      id: "approved",
      at: plan.applied.at,
      kind: "approved",
      title: "Applied to SRM / implementation start",
      detail: `${plan.applied.engagementIds.length} engagements, ${plan.applied.commitmentIds.length} commitments`,
    });
  }
  for (const mile of overlay.milestones) {
    rows.push({
      id: mile.id,
      at: mile.completedOn || mile.dueOn,
      kind: mile.status === "slipped" ? "delay" : "milestone",
      title: mile.title,
      detail: mile.status === "done" ? "Completed" : `Due ${mile.dueOn}`,
      status: mile.status,
    });
  }
  for (const task of overlay.tasks.filter((t) => t.status === "done" && t.completedOn)) {
    rows.push({
      id: task.id,
      at: task.completedOn as string,
      kind: "task",
      title: task.title,
      detail: "Task completed",
    });
  }
  for (const ev of overlay.events) {
    rows.push({
      id: ev.id,
      at: ev.occurredOn,
      kind: ev.kind,
      title: ev.title,
      detail: ev.description.slice(0, 160),
      status: ev.status,
    });
  }
  for (const mit of overlay.interventions) {
    rows.push({
      id: mit.id,
      at: mit.startOn,
      kind: "mitigation",
      title: "Mitigation",
      detail: mit.description.slice(0, 160),
      status: mit.status,
    });
  }
  const today = new Date().toISOString();
  rows.push({
    id: "today",
    at: today,
    kind: "today",
    title: "Today",
    detail: "Current position on the implementation calendar",
  });
  return rows.sort((a, b) => a.at.localeCompare(b.at));
}

export type SepInPlanFilters = {
  fromOn: string;
  toOn: string;
  taskId: string;
  milestoneId: string;
  severity: SepEventSeverity | "all";
  kind: SepOutcomeKind | "all";
};

export const EMPTY_SEP_FILTERS: SepInPlanFilters = {
  fromOn: "",
  toOn: "",
  taskId: "all",
  milestoneId: "all",
  severity: "all",
  kind: "all",
};

function inDateRange(iso: string, fromOn: string, toOn: string): boolean {
  const d = iso.slice(0, 10);
  if (fromOn && d < fromOn) return false;
  if (toOn && d > toOn) return false;
  return true;
}

/** Filter overlay widgets without changing stored plan_id data. */
export function filterSepOverlay(
  overlay: SepExecutionOverlay,
  filters: SepInPlanFilters,
): SepExecutionOverlay {
  const taskId = filters.taskId !== "all" ? filters.taskId : "";
  const milestoneId = filters.milestoneId !== "all" ? filters.milestoneId : "";
  const severity = filters.severity !== "all" ? filters.severity : "";
  const kind = filters.kind !== "all" ? filters.kind : "";

  const tasks = overlay.tasks.filter((t) => {
    if (taskId && t.id !== taskId) return false;
    if (milestoneId && t.milestoneId !== milestoneId) return false;
    if (t.completedOn) {
      return (
        inDateRange(t.plannedOn, filters.fromOn, filters.toOn) ||
        inDateRange(t.completedOn, filters.fromOn, filters.toOn)
      );
    }
    return inDateRange(t.plannedOn, filters.fromOn, filters.toOn);
  });
  const milestones = overlay.milestones.filter((m) => {
    if (milestoneId && m.id !== milestoneId) return false;
    if (m.completedOn) {
      return (
        inDateRange(m.dueOn, filters.fromOn, filters.toOn) ||
        inDateRange(m.completedOn, filters.fromOn, filters.toOn)
      );
    }
    return inDateRange(m.dueOn, filters.fromOn, filters.toOn);
  });
  const events = overlay.events.filter((ev) => {
    if (!inDateRange(ev.occurredOn, filters.fromOn, filters.toOn)) return false;
    if (taskId && ev.taskId !== taskId) return false;
    if (milestoneId && ev.milestoneId !== milestoneId) return false;
    if (severity && ev.severity !== severity) return false;
    if (kind && ev.kind !== kind) return false;
    return true;
  });
  const eventIds = new Set(events.map((ev) => ev.id));
  const interventions = overlay.interventions.filter((row) => {
    if (overlay.events.length > 0 && !eventIds.has(row.eventId)) return false;
    return inDateRange(row.startOn, filters.fromOn, filters.toOn);
  });

  return {
    ...overlay,
    tasks,
    milestones,
    events,
    interventions,
  };
}

export function taskCompletionTrend(
  overlay: SepExecutionOverlay,
): { label: string; value: number }[] {
  const done = overlay.tasks
    .filter((t) => t.completedOn)
    .sort((a, b) => (a.completedOn || "").localeCompare(b.completedOn || ""));
  const byWeek = new Map<string, number>();
  for (const task of done) {
    const week = (task.completedOn || "").slice(0, 7);
    byWeek.set(week, (byWeek.get(week) || 0) + 1);
  }
  if (!byWeek.size) {
    return [{ label: overlay.submittedAt.slice(0, 7), value: 0 }];
  }
  return [...byWeek.entries()].map(([label, value]) => ({ label, value }));
}

export function plannedVsActual(
  overlay: SepExecutionOverlay,
): { label: string; planned: number; actual: number }[] {
  const byMonth = new Map<string, { planned: number; actual: number }>();
  for (const task of overlay.tasks) {
    const key = task.plannedOn.slice(0, 7);
    const row = byMonth.get(key) || { planned: 0, actual: 0 };
    row.planned += 1;
    if (task.status === "done") row.actual += 1;
    byMonth.set(key, row);
  }
  return [...byMonth.entries()].map(([label, v]) => ({ label, ...v }));
}

export function outcomeDistribution(
  overlay: SepExecutionOverlay,
): { label: string; value: number }[] {
  const counts = { Success: 0, Hurdle: 0, Failure: 0 };
  for (const ev of overlay.events) {
    if (ev.kind === "success") counts.Success += 1;
    else if (ev.kind === "hurdle") counts.Hurdle += 1;
    else counts.Failure += 1;
  }
  return [
    { label: "Success", value: counts.Success },
    { label: "Hurdle", value: counts.Hurdle },
    { label: "Failure", value: counts.Failure },
  ];
}

export function mitigationTrend(
  overlay: SepExecutionOverlay,
): { label: string; value: number }[] {
  const byMonth = new Map<string, { done: number; closed: number }>();
  for (const row of overlay.interventions) {
    const key = row.startOn.slice(0, 7);
    const cell = byMonth.get(key) || { done: 0, closed: 0 };
    if (row.status === "done" || row.status === "ineffective") {
      cell.closed += 1;
      if (row.status === "done") cell.done += 1;
    }
    byMonth.set(key, cell);
  }
  if (!byMonth.size) return [{ label: overlay.submittedAt.slice(0, 7), value: 0 }];
  return [...byMonth.entries()].map(([label, cell]) => ({
    label,
    value: cell.closed ? Math.round((cell.done / cell.closed) * 100) : 0,
  }));
}

export function recentChangesSince(
  overlay: SepExecutionOverlay,
  sinceIso: string | null,
): string[] {
  const since = sinceIso ? Date.parse(sinceIso) : 0;
  return overlay.activityLog
    .filter((row) => Date.parse(row.at) >= since)
    .slice(0, 8)
    .map((row) => `${row.action}: ${row.detail}`);
}
