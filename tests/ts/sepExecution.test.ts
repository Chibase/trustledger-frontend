import type { EngagementPlan } from "@/types/engagementPlan";
import { canEditSepExecution } from "@/lib/sepExecutionAccess";
import {
  computeSepHealth,
  computeSepKpis,
  normalizeCommitmentStatus,
  normalizeEngagementStatus,
  normalizeIncidentStatus,
  normalizePlatformStatus,
} from "@/lib/sepKpis";
import {
  backfillSepExecution,
  getSepExecution,
  saveSepExecution,
} from "@/lib/sepExecutionStore";
import {
  EMPTY_SEP_FILTERS,
  filterSepOverlay,
} from "@/lib/sepExecutionDesk";
import type { SepExecutionOverlay } from "@/types/sepExecution";

function samplePlan(): EngagementPlan {
  return {
    id: "SEP-TEST-1",
    title: "Ward 4 access plan",
    status: "applied",
    sourceKind: "briefing",
    sectorId: "infrastructure",
    projectId: "PRJ-TEST",
    projectNameHint: "Test road",
    placeHint: "Ward 4",
    clientFunderHint: "Municipality",
    timelineHint: "12 weeks",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
    sourceExcerpt: "Test brief",
    purposeStatement: "Consult on access.",
    phases: [
      {
        id: "inception",
        order: 1,
        title: "Inception",
        intent: "",
        exitCriteria: "",
        typicalDuration: "1 week",
        module: "engagements",
      },
      {
        id: "consultation",
        order: 5,
        title: "Consultation",
        intent: "",
        exitCriteria: "",
        typicalDuration: "4 weeks",
        module: "engagements",
      },
    ],
    stakeholderClasses: [],
    activities: [
      {
        id: "ACT-1",
        phaseId: "inception",
        title: "Kick-off imbizo",
        method: "Meeting",
        purpose: "inform",
        engagementKind: "meeting",
        ownerHint: "CLO",
        timingHint: "Week 1",
        evidenceHint: "Minutes",
        module: "engagements",
      },
    ],
    commitments: [],
    instruments: [],
    grievancePath: "",
    assumptions: [],
    documentSections: [],
  };
}

function overlayFixture(): SepExecutionOverlay {
  return {
    version: 1,
    planId: "SEP-TEST-1",
    submittedAt: "2026-06-01T08:00:00.000Z",
    ownerName: "Lebo",
    lastReviewAt: null,
    milestones: [
      {
        id: "MS-1",
        planId: "SEP-TEST-1",
        phaseId: "inception",
        title: "Inception",
        dueOn: "2026-06-08",
        completedOn: "2026-06-07",
        status: "done",
      },
      {
        id: "MS-2",
        planId: "SEP-TEST-1",
        phaseId: "consultation",
        title: "Consultation",
        dueOn: "2026-07-13",
        completedOn: null,
        status: "upcoming",
      },
    ],
    tasks: [
      {
        id: "TSK-1",
        planId: "SEP-TEST-1",
        milestoneId: "MS-1",
        activityId: "ACT-1",
        title: "Kick-off",
        plannedOn: "2026-06-03",
        completedOn: "2026-06-04",
        status: "done",
        ownerLabel: "CLO",
        linkedEngagementId: null,
      },
      {
        id: "TSK-2",
        planId: "SEP-TEST-1",
        milestoneId: "MS-2",
        activityId: "ACT-2",
        title: "Ward meeting",
        plannedOn: "2026-07-01",
        completedOn: null,
        status: "planned",
        ownerLabel: "CLO",
        linkedEngagementId: null,
      },
    ],
    events: [
      {
        id: "EVT-1",
        planId: "SEP-TEST-1",
        kind: "hurdle",
        title: "Low turnout",
        description: "Rain",
        occurredOn: "2026-06-10",
        severity: "medium",
        ownerLabel: "CLO",
        taskId: "TSK-1",
        milestoneId: "MS-1",
        status: "resolved",
        resolvedOn: "2026-06-12",
        sourceKind: "task",
        sourceId: "TSK-1",
      },
    ],
    interventions: [
      {
        id: "MIT-1",
        planId: "SEP-TEST-1",
        eventId: "EVT-1",
        description: "Reschedule + transport",
        ownerLabel: "CLO",
        startOn: "2026-06-11",
        dueOn: "2026-06-18",
        status: "done",
        outcomeNote: "Attendance recovered",
        reviewOn: "2026-06-18",
      },
    ],
    activityLog: [],
  };
}

describe("SEP status normalization", () => {
  it("maps desk statuses to canonical categories", () => {
    expect(normalizeEngagementStatus("held")).toBe("success");
    expect(normalizeEngagementStatus("follow_up")).toBe("hurdle");
    expect(normalizeCommitmentStatus("fulfilled")).toBe("success");
    expect(normalizeCommitmentStatus("broken")).toBe("failure");
    expect(normalizeCommitmentStatus("overdue")).toBe("hurdle");
    expect(normalizeIncidentStatus("Closed")).toBe("success");
    expect(normalizeIncidentStatus("Escalated")).toBe("failure");
    expect(
      normalizePlatformStatus({
        source: "incident",
        status: "Investigating",
        mitigated: true,
      }),
    ).toBe("mitigated");
  });
});

describe("SEP KPI computations", () => {
  it("computes attainment, on-time rate, confidence, and resolution days", () => {
    const kpis = computeSepKpis(overlayFixture(), "2026-06-20");
    expect(kpis.taskCompletionRatioPct).toBe(50);
    expect(kpis.milestoneOnTimeRatePct).toBe(100);
    expect(kpis.goalAttainmentPct).toBe(70);
    expect(kpis.hurdleResolutionDays).toBe(2);
    expect(kpis.mitigationSuccessRatePct).toBe(100);
    expect(kpis.failureReopenRatioPct).toBe(0);
    expect(kpis.completionConfidenceIndex).toBeGreaterThan(50);
    expect(computeSepHealth({
      openCritical: 0,
      openHurdles: 0,
      scheduleVarianceDays: 0,
      failureOpen: 0,
    })).toBe("green");
    expect(computeSepHealth({
      openCritical: 1,
      openHurdles: 0,
      scheduleVarianceDays: 0,
      failureOpen: 0,
    })).toBe("red");
  });
});

describe("SEP execution access", () => {
  it("lets owners and delivery desks edit; client/board is snapshot-only", () => {
    expect(canEditSepExecution({ deskTier: "clo", isPlanOwner: true })).toBe(
      true,
    );
    expect(
      canEditSepExecution({ deskTier: "delivery", isPlanOwner: false }),
    ).toBe(true);
    expect(canEditSepExecution({ deskTier: "funder", isPlanOwner: false })).toBe(
      false,
    );
    expect(
      canEditSepExecution({ deskTier: "executive", isPlanOwner: false }),
    ).toBe(false);
  });
});

describe("SEP execution store scoping", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("backfills one plan and does not leak another plan_id", () => {
    const plan = samplePlan();
    const overlay = backfillSepExecution(plan, { ownerName: "Lebo" });
    expect(overlay.planId).toBe("SEP-TEST-1");
    expect(overlay.milestones.length).toBeGreaterThanOrEqual(2);
    expect(overlay.tasks).toHaveLength(1);
    expect(overlay.tasks[0]?.planId).toBe("SEP-TEST-1");
    expect(getSepExecution("SEP-OTHER")).toBeNull();
    const saved = saveSepExecution({
      ...overlay,
      planId: "SEP-TEST-1",
    });
    expect(saved.planId).toBe("SEP-TEST-1");
    expect(getSepExecution("SEP-TEST-1")?.planId).toBe("SEP-TEST-1");
  });
});

describe("SEP in-plan filters", () => {
  it("keeps only matching events and does not change planId", () => {
    const overlay = overlayFixture();
    const filtered = filterSepOverlay(overlay, {
      ...EMPTY_SEP_FILTERS,
      severity: "medium",
      fromOn: "2026-06-01",
      toOn: "2026-06-30",
    });
    expect(filtered.planId).toBe("SEP-TEST-1");
    expect(filtered.events).toHaveLength(1);
    expect(filtered.events[0]?.title).toBe("Low turnout");
    expect(filtered.interventions).toHaveLength(1);
    const empty = filterSepOverlay(overlay, {
      ...EMPTY_SEP_FILTERS,
      kind: "failure",
    });
    expect(empty.events).toHaveLength(0);
    expect(empty.interventions).toHaveLength(0);
  });
});
