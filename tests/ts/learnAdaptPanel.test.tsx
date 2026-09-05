/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnAdaptPanel } from "@/components/incidents/LearnAdaptPanel";
import { incidentService } from "@/services/incidentService";
import type { Incident } from "@/types/incident";

jest.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ pushToast: jest.fn() }),
}));

jest.mock("@/services/incidentService", () => ({
  incidentService: {
    save: jest.fn(async (row: Incident) => row),
  },
}));

function sample(over: Partial<Incident> = {}): Incident {
  return {
    id: "INC-MEL-3",
    title: "Dust at the gate",
    description: "Community reported dust.",
    ward: "Ward 12",
    geographicArea: "Gqeberha",
    status: "Investigating",
    priority: "P2-High",
    projectId: "PRJ-1",
    projectName: "Site A",
    reportedByRole: "community",
    reporterName: "A. Resident",
    reportedAt: "2026-09-01T08:00:00.000Z",
    slaDueBy: "2026-09-04T08:00:00.000Z",
    slaBreached: false,
    escalationLevel: "None",
    ownerName: "CLO",
    category: "Dust",
    impactScore: 40,
    sentimentScore: null,
    timeline: [],
    processStages: {
      reportedAt: "2026-09-01T08:00:00.000Z",
    },
    ...over,
  };
}

describe("LearnAdaptPanel", () => {
  beforeEach(() => {
    (incidentService.save as jest.Mock).mockClear();
  });

  it("saves a Monitor → Analyse → Adapt record without closing the case", async function () {
    const user = userEvent.setup();
    const onSaved = jest.fn();
    render(<LearnAdaptPanel incident={sample()} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: /Add record/i }));
    await user.type(screen.getByPlaceholderText("What did we observe?"), "Repeat dust.");
    await user.type(screen.getByPlaceholderText("Why did it happen?"), "Watering skipped.");
    await user.type(
      screen.getByPlaceholderText("What will we change?"),
      "Reinstate watering.",
    );
    await user.click(screen.getByRole("button", { name: /Save Learn & Adapt/i }));

    expect(incidentService.save).toHaveBeenCalled();
    const saved = (incidentService.save as jest.Mock).mock.calls[0][0] as Incident;
    expect(saved.learnAdaptRecords?.[0]?.monitor).toMatch(/Repeat dust/);
    expect(saved.learnAdaptRecords?.[0]?.action).toMatch(/Reinstate watering/);
    expect(saved.processStages?.closedAt).toBeFalsy();
    expect(saved.status).toBe("Investigating");
  });

  it("does not PUT an empty adapt list when the case never loaded records", async function () {
    const user = userEvent.setup();
    render(<LearnAdaptPanel incident={sample()} onSaved={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: /Save Learn & Adapt/i }));
    expect(incidentService.save).not.toHaveBeenCalled();
  });
});
