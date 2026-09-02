/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SepOutcomeBoard } from "@/components/sep/SepOutcomeBoard";
import { SepPlanSnapshotHeader } from "@/components/sep/SepPlanSnapshotHeader";
import { SepPractitionerSnapshot } from "@/components/sep/SepPractitionerSnapshot";
import { SepRoadmap } from "@/components/sep/SepRoadmap";
import type { SepExecutionOverlay, SepPlanSnapshot } from "@/types/sepExecution";

const snapshot: SepPlanSnapshot = {
  planId: "SEP-TEST-1",
  title: "Ward 4 access plan",
  submittedAt: "2026-06-01T08:00:00.000Z",
  ownerName: "Lebo",
  stageLabel: "Consultation",
  phaseId: "consultation",
  progressPct: 50,
  health: "amber",
  nextMilestoneOn: "2026-07-13",
  nextMilestoneTitle: "Consultation",
  openCriticalCount: 1,
  kpis: {
    goalAttainmentPct: 70,
    milestoneOnTimeRatePct: 100,
    taskCompletionRatioPct: 50,
    failureReopenRatioPct: 0,
    hurdleResolutionDays: 2,
    mitigationSuccessRatePct: 100,
    scheduleVarianceDays: 0,
    completionConfidenceIndex: 72,
  },
};

const overlay: SepExecutionOverlay = {
  version: 1,
  planId: "SEP-TEST-1",
  submittedAt: "2026-06-01T08:00:00.000Z",
  ownerName: "Lebo",
  lastReviewAt: null,
  milestones: [],
  tasks: [],
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
      taskId: null,
      milestoneId: null,
      status: "open",
      resolvedOn: null,
      sourceKind: null,
      sourceId: null,
    },
  ],
  interventions: [
    {
      id: "MIT-1",
      planId: "SEP-TEST-1",
      eventId: "EVT-1",
      description: "Reschedule",
      ownerLabel: "CLO",
      startOn: "2026-06-11",
      dueOn: "2026-06-18",
      status: "active",
      outcomeNote: "",
      reviewOn: "2026-06-18",
    },
  ],
  activityLog: [],
};

describe("SEP execution dashboard widgets", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  it("renders plan-only snapshot KPIs", () => {
    render(<SepPlanSnapshotHeader snapshot={snapshot} />);
    expect(screen.getByText("Ward 4 access plan")).toBeInTheDocument();
    expect(screen.getByText(/SEP-TEST-1/)).toBeInTheDocument();
    expect(screen.getByText("Health: Watch")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders practitioner snapshot with hurdles and mitigations", () => {
    render(
      <SepPractitionerSnapshot snapshot={snapshot} overlay={overlay} />,
    );
    expect(screen.getByText("Client / superior briefing")).toBeInTheDocument();
    expect(screen.getByText("Low turnout")).toBeInTheDocument();
    expect(screen.getByText(/active/)).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("renders an empty roadmap from submission", () => {
    render(
      <SepRoadmap events={[]} submittedAt="2026-06-01T08:00:00.000Z" />,
    );
    expect(
      screen.getByText(/No implementation events yet/),
    ).toBeInTheDocument();
  });

  it("lets a practitioner log a hurdle and a mitigation; read-only hides save", async () => {
    const user = userEvent.setup();
    const blank: SepExecutionOverlay = {
      ...overlay,
      events: [],
      interventions: [],
      activityLog: [],
    };
    let current = blank;
    const { rerender } = render(
      <SepOutcomeBoard
        overlay={current}
        canEdit
        actor="Lebo"
        onChange={(next) => {
          current = next;
          rerender(
            <SepOutcomeBoard
              overlay={next}
              canEdit
              actor="Lebo"
              onChange={(row) => {
                current = row;
              }}
              filterSeverity="all"
            />,
          );
        }}
        filterSeverity="all"
      />,
    );

    expect(screen.getByText(/No logged outcomes/)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Title"), "Access delayed");
    await user.type(screen.getByPlaceholderText("What happened"), "Gate locked");
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(current.events[0]?.title).toBe("Access delayed");
    expect(current.events[0]?.kind).toBe("hurdle");
    expect(current.activityLog[0]?.action).toBe("event.create");

    rerender(
      <SepOutcomeBoard
        overlay={current}
        canEdit
        actor="Lebo"
        onChange={(next) => {
          current = next;
        }}
        filterSeverity="all"
      />,
    );
    await user.selectOptions(
      screen.getByLabelText(/Linked event/i),
      current.events[0]!.id,
    );
    await user.type(
      screen.getByPlaceholderText("Intervention"),
      "Meet the ward committee",
    );
    await user.click(screen.getByRole("button", { name: "Add intervention" }));
    expect(current.interventions[0]?.description).toBe(
      "Meet the ward committee",
    );
    expect(current.interventions[0]?.eventId).toBe(current.events[0]?.id);

    rerender(
      <SepOutcomeBoard
        overlay={current}
        canEdit={false}
        actor="Lebo"
        onChange={() => undefined}
        filterSeverity="all"
      />,
    );
    expect(screen.queryByRole("button", { name: "Save event" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Add intervention" }),
    ).toBeNull();
  });
});
