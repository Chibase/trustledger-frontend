/**
 * Org-scoped SEP execution overlay (browser until a Cloud DocType exists).
 * Opening a plan dashboard runs backfill from the composed EngagementPlan.
 */

import type { EngagementPlan } from "@/types/engagementPlan";
import { SEP_PHASE_ORDER } from "@/types/engagementPlan";
import type {
  MitigationIntervention,
  PlanActivityLog,
  PlanOutcomeEvent,
  SepExecutionOverlay,
  SepInterventionStatus,
} from "@/types/sepExecution";
import { getActiveOrgId } from "@/lib/orgStore";
import { TL_ORG_ID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";

const ROOT_KEY = "tl-sep-execution";

type Root = Record<string, Record<string, SepExecutionOverlay>>;

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

function scopeKey(): string {
  const org =
    getActiveOrgId()?.trim() || readCookie(TL_ORG_ID_COOKIE)?.trim();
  if (org) return `org:${org}`;
  const email = readCookie(TL_USER_EMAIL_COOKIE)?.trim().toLowerCase();
  if (email) return `email:${email}`;
  return "local";
}

function readRoot(): Root {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Root;
  } catch {
    return {};
  }
}

function writeRoot(root: Root) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROOT_KEY, JSON.stringify(root));
  } catch {
    /* quota */
  }
}

function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function addUtcDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function phaseOffset(phaseId: EngagementPlan["phases"][number]["id"]): number {
  switch (phaseId) {
    case "inception":
      return 7;
    case "mapping":
      return 14;
    case "scoping":
      return 21;
    case "first_contact":
      return 28;
    case "consultation":
      return 42;
    case "commitments":
      return 56;
    case "closeout":
      return 84;
    default:
      return 30;
  }
}

function log(
  overlay: SepExecutionOverlay,
  action: string,
  detail: string,
  actor: string,
): PlanActivityLog {
  return {
    id: newId("LOG"),
    planId: overlay.planId,
    at: new Date().toISOString(),
    actor,
    action,
    detail,
  };
}

export function emptySepExecution(planId: string): SepExecutionOverlay {
  return {
    version: 1,
    planId,
    submittedAt: new Date().toISOString(),
    ownerName: "Plan Owner",
    lastReviewAt: null,
    milestones: [],
    tasks: [],
    events: [],
    interventions: [],
    activityLog: [],
  };
}

export function getSepExecution(planId: string): SepExecutionOverlay | null {
  const bag = readRoot()[scopeKey()] || {};
  return bag[planId] || null;
}

export function saveSepExecution(
  overlay: SepExecutionOverlay,
): SepExecutionOverlay {
  const root = readRoot();
  const key = scopeKey();
  const bag = { ...(root[key] || {}) };
  bag[overlay.planId] = overlay;
  root[key] = bag;
  writeRoot(root);
  return overlay;
}

/** Seed milestones/tasks from the composed plan without wiping logged events. */
export function backfillSepExecution(
  plan: EngagementPlan,
  opts?: { ownerName?: string; actor?: string },
): SepExecutionOverlay {
  const actor = opts?.actor || "system";
  const existing = getSepExecution(plan.id);
  const submittedAt = existing?.submittedAt || plan.createdAt;
  const ownerName = opts?.ownerName || existing?.ownerName || "Plan Owner";
  const overlay: SepExecutionOverlay = existing
    ? { ...existing, ownerName }
    : {
        version: 1,
        planId: plan.id,
        submittedAt,
        ownerName,
        lastReviewAt: null,
        milestones: [],
        tasks: [],
        events: [],
        interventions: [],
        activityLog: [],
      };

  const milesByPhase = new Map(
    overlay.milestones.map((m) => [m.phaseId, m]),
  );
  const orderedPhases = [...plan.phases].sort((a, b) => a.order - b.order);
  const phases =
    orderedPhases.length > 0
      ? orderedPhases
      : SEP_PHASE_ORDER.map((id, order) => ({
          id,
          order: order + 1,
          title: id,
        }));

  for (const phase of phases) {
    if (milesByPhase.has(phase.id)) continue;
    overlay.milestones.push({
      id: newId("MS"),
      planId: plan.id,
      phaseId: phase.id,
      title: "title" in phase ? String(phase.title) : phase.id,
      dueOn: addUtcDays(submittedAt, phaseOffset(phase.id)),
      completedOn: null,
      status: "upcoming",
    });
  }

  const taskByActivity = new Map(
    overlay.tasks.map((t) => [t.activityId, t]),
  );
  const appliedEngagements = plan.applied?.engagementIds || [];
  plan.activities.forEach((activity, index) => {
    if (taskByActivity.has(activity.id)) return;
    const mile = overlay.milestones.find((m) => m.phaseId === activity.phaseId);
    overlay.tasks.push({
      id: newId("TSK"),
      planId: plan.id,
      milestoneId: mile?.id || null,
      activityId: activity.id,
      title: activity.title,
      plannedOn: addUtcDays(
        submittedAt,
        phaseOffset(activity.phaseId) - 3 + Math.min(index, 5),
      ),
      completedOn: null,
      status: "planned",
      ownerLabel: activity.ownerHint || ownerName,
      linkedEngagementId: appliedEngagements[index] || null,
    });
  });

  if (!existing) {
    overlay.activityLog.unshift(
      log(overlay, "backfill", "Execution overlay created from composed plan.", actor),
    );
  }

  overlay.milestones.sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  return saveSepExecution(overlay);
}

export function appendSepActivity(
  overlay: SepExecutionOverlay,
  action: string,
  detail: string,
  actor: string,
): SepExecutionOverlay {
  overlay.activityLog.unshift(log(overlay, action, detail, actor));
  overlay.activityLog = overlay.activityLog.slice(0, 200);
  return saveSepExecution(overlay);
}

export function upsertSepEvent(
  overlay: SepExecutionOverlay,
  event: PlanOutcomeEvent,
  actor: string,
): SepExecutionOverlay {
  const idx = overlay.events.findIndex((row) => row.id === event.id);
  if (idx >= 0) overlay.events[idx] = event;
  else overlay.events.unshift(event);
  return appendSepActivity(
    overlay,
    idx >= 0 ? "event.update" : "event.create",
    `${event.kind}: ${event.title}`,
    actor,
  );
}

export function upsertSepIntervention(
  overlay: SepExecutionOverlay,
  row: MitigationIntervention,
  actor: string,
): SepExecutionOverlay {
  const idx = overlay.interventions.findIndex((item) => item.id === row.id);
  if (idx >= 0) overlay.interventions[idx] = row;
  else overlay.interventions.unshift(row);
  return appendSepActivity(
    overlay,
    idx >= 0 ? "mitigation.update" : "mitigation.create",
    row.description.slice(0, 120),
    actor,
  );
}

export function createOutcomeEvent(
  planId: string,
  partial: Omit<PlanOutcomeEvent, "id" | "planId" | "resolvedOn"> & {
    resolvedOn?: string | null;
  },
): PlanOutcomeEvent {
  return {
    ...partial,
    id: newId("EVT"),
    planId,
    resolvedOn: partial.resolvedOn ?? null,
  };
}

export function createIntervention(
  planId: string,
  partial: Omit<MitigationIntervention, "id" | "planId">,
): MitigationIntervention {
  return { ...partial, id: newId("MIT"), planId };
}

export function setInterventionStatus(
  overlay: SepExecutionOverlay,
  interventionId: string,
  status: SepInterventionStatus,
  note: string,
  actor: string,
): SepExecutionOverlay {
  const row = overlay.interventions.find((item) => item.id === interventionId);
  if (!row) return overlay;
  row.status = status;
  if (note.trim()) row.outcomeNote = note.trim();
  return appendSepActivity(
    overlay,
    "mitigation.status",
    `${interventionId} → ${status}`,
    actor,
  );
}

export { newId as newSepExecutionId };
