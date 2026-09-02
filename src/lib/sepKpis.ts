/**
 * SEP execution KPIs and canonical status mapping.
 * Pure functions — no I/O. Used by the plan dashboard and tests.
 */

import type { CommitmentStatus } from "@/types/commitment";
import type { EngagementStatus } from "@/types/engagement";
import type { IncidentStatus } from "@/types/incident";
import type { SepPhaseId } from "@/types/engagementPlan";
import { SEP_PHASE_ORDER } from "@/types/engagementPlan";
import type {
  PlanMilestone,
  PlanOutcomeEvent,
  SepCanonicalStatus,
  SepExecutionOverlay,
  SepHealth,
  SepKpis,
} from "@/types/sepExecution";

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function dayMs(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
}

export function currentPhaseId(
  overlay: Pick<SepExecutionOverlay, "milestones">,
): SepPhaseId {
  const done = new Set(
    overlay.milestones.filter((m) => m.status === "done").map((m) => m.phaseId),
  );
  for (const id of SEP_PHASE_ORDER) {
    if (!done.has(id)) return id;
  }
  return "closeout";
}

export function phaseLabel(id: SepPhaseId): string {
  const labels: Record<SepPhaseId, string> = {
    inception: "Inception",
    mapping: "Mapping",
    scoping: "Scoping",
    first_contact: "First contact",
    consultation: "Consultation",
    commitments: "Commitments",
    closeout: "Close-out",
  };
  return labels[id];
}

/**
 * Map a linked desk row into success / hurdle / failure / mitigated.
 * Unknown statuses stay hurdles so the plan does not over-claim success.
 *
 * Open / in-progress commitments still normalise to hurdle for KPI helpers,
 * but must not be seeded as dashboard outcome events (see shouldSeed*).
 */
export function normalizePlatformStatus(input: {
  source: "engagement" | "commitment" | "incident";
  status: string;
  mitigated?: boolean;
}): SepCanonicalStatus {
  if (input.mitigated) return "mitigated";
  const s = input.status.trim().toLowerCase();
  if (input.source === "engagement") {
    if (s === "closed" || s === "held") return "success";
    return "hurdle";
  }
  if (input.source === "commitment") {
    if (s === "fulfilled") return "success";
    if (s === "broken") return "failure";
    if (s === "overdue") return "hurdle";
    if (s === "cancelled") return "mitigated";
    return "hurdle";
  }
  if (s === "closed") return "success";
  if (s === "escalated") return "failure";
  return "hurdle";
}

/** Seed an outcome only for exceptional/terminal commitment states. */
export function shouldSeedCommitmentOutcome(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "fulfilled" || s === "broken" || s === "overdue";
}

export function normalizeEngagementStatus(
  status: EngagementStatus,
  mitigated = false,
): SepCanonicalStatus {
  return normalizePlatformStatus({
    source: "engagement",
    status,
    mitigated,
  });
}

export function normalizeCommitmentStatus(
  status: CommitmentStatus,
  mitigated = false,
): SepCanonicalStatus {
  return normalizePlatformStatus({
    source: "commitment",
    status,
    mitigated,
  });
}

export function normalizeIncidentStatus(
  status: IncidentStatus,
  mitigated = false,
): SepCanonicalStatus {
  return normalizePlatformStatus({
    source: "incident",
    status,
    mitigated,
  });
}

function scheduleVarianceDays(
  milestones: PlanMilestone[],
  todayIso: string,
): number {
  const today = dayMs(todayIso);
  let worst = 0;
  for (const mile of milestones) {
    const due = dayMs(mile.dueOn);
    if (mile.completedOn) {
      const done = dayMs(mile.completedOn);
      worst = Math.max(worst, Math.round((done - due) / 86_400_000));
    } else if (today > due) {
      worst = Math.max(worst, Math.round((today - due) / 86_400_000));
    }
  }
  return worst;
}

function hurdleResolutionDaysFromEvents(events: PlanOutcomeEvent[]): number | null {
  const closed = events.filter(
    (ev) =>
      ev.kind === "hurdle" &&
      (ev.status === "resolved" || ev.status === "accepted"),
  );
  if (!closed.length) return null;
  const spans = closed.map((ev) => {
    const opened = dayMs(ev.occurredOn);
    const closedAt = ev.resolvedOn ? dayMs(ev.resolvedOn) : opened;
    return Math.max(0, Math.round((closedAt - opened) / 86_400_000));
  });
  return Math.round(spans.reduce((sum, n) => sum + n, 0) / spans.length);
}

export function computeSepHealth(input: {
  openCritical: number;
  openHurdles: number;
  scheduleVarianceDays: number;
  failureOpen: number;
}): SepHealth {
  if (input.openCritical > 0 || input.failureOpen > 0) return "red";
  if (input.openHurdles > 0 || input.scheduleVarianceDays > 7) return "amber";
  return "green";
}

export function computeSepKpis(
  overlay: Pick<
    SepExecutionOverlay,
    "milestones" | "tasks" | "events" | "interventions"
  >,
  todayIso = new Date().toISOString().slice(0, 10),
): SepKpis {
  const tasks = overlay.tasks;
  const miles = overlay.milestones;
  const events = overlay.events;
  const interventions = overlay.interventions;

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskCompletionRatioPct = tasks.length
    ? clampPct((doneTasks / tasks.length) * 100)
    : 0;

  const dueMiles = miles.filter(
    (m) => m.status === "done" || dayMs(m.dueOn) <= dayMs(todayIso),
  );
  const onTime = dueMiles.filter((m) => {
    if (!m.completedOn) return false;
    return dayMs(m.completedOn) <= dayMs(m.dueOn);
  }).length;
  const milestoneOnTimeRatePct = dueMiles.length
    ? clampPct((onTime / dueMiles.length) * 100)
    : miles.some((m) => m.status === "slipped")
      ? 0
      : 100;

  const goalAttainmentPct = clampPct(
    taskCompletionRatioPct * 0.6 + milestoneOnTimeRatePct * 0.4,
  );

  const failures = events.filter((e) => e.kind === "failure");
  const reopened = failures.filter((e) => e.status === "open").length;
  const failureReopenRatioPct = failures.length
    ? clampPct((reopened / failures.length) * 100)
    : 0;

  const closedInterventions = interventions.filter(
    (row) => row.status === "done" || row.status === "ineffective",
  );
  const successful = closedInterventions.filter(
    (row) => row.status === "done",
  ).length;
  const mitigationSuccessRatePct = closedInterventions.length
    ? clampPct((successful / closedInterventions.length) * 100)
    : interventions.length
      ? 0
      : 100;

  const variance = scheduleVarianceDays(miles, todayIso);

  /*
   * Completion confidence index (0–100):
   *   0.35 × goal attainment
   * + 0.20 × milestone on-time rate
   * + 0.20 × task completion ratio
   * + 0.15 × mitigation success rate
   * − 0.10 × failure/reopen ratio
   * − min(15, schedule variance days)
   * Clamped to 0–100. Shown on the practitioner snapshot.
   */
  const raw =
    0.35 * goalAttainmentPct +
    0.2 * milestoneOnTimeRatePct +
    0.2 * taskCompletionRatioPct +
    0.15 * mitigationSuccessRatePct -
    0.1 * failureReopenRatioPct -
    Math.min(15, Math.max(0, variance));

  return {
    goalAttainmentPct,
    milestoneOnTimeRatePct,
    taskCompletionRatioPct,
    failureReopenRatioPct,
    hurdleResolutionDays: hurdleResolutionDaysFromEvents(events),
    mitigationSuccessRatePct,
    scheduleVarianceDays: variance,
    completionConfidenceIndex: clampPct(raw),
  };
}

export function snapshotHealth(
  overlay: SepExecutionOverlay,
  kpis: SepKpis,
): { health: SepHealth; openCriticalCount: number } {
  const mitigated = new Set(
    overlay.interventions
      .filter((row) => row.status === "done")
      .map((row) => row.eventId),
  );
  const openCriticalCount = overlay.events.filter(
    (ev) =>
      (ev.kind === "failure" || ev.severity === "critical") &&
      ev.status !== "resolved" &&
      ev.status !== "accepted" &&
      !mitigated.has(ev.id),
  ).length;
  const openHurdles = overlay.events.filter(
    (ev) =>
      ev.kind === "hurdle" &&
      ev.status !== "resolved" &&
      ev.status !== "accepted" &&
      !mitigated.has(ev.id),
  ).length;
  const failureOpen = overlay.events.filter(
    (ev) =>
      ev.kind === "failure" &&
      ev.status !== "resolved" &&
      ev.status !== "accepted" &&
      !mitigated.has(ev.id),
  ).length;
  return {
    health: computeSepHealth({
      openCritical: openCriticalCount,
      openHurdles,
      scheduleVarianceDays: kpis.scheduleVarianceDays,
      failureOpen,
    }),
    openCriticalCount,
  };
}

export function nextMilestone(
  milestones: PlanMilestone[],
): PlanMilestone | null {
  const upcoming = milestones
    .filter((m) => m.status !== "done")
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  return upcoming[0] || null;
}
