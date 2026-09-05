/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MelCyclePanel } from "@/components/dashboard/MelCyclePanel";
import { incidentService } from "@/services/incidentService";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ pushToast: jest.fn() }),
}));

jest.mock("@/services/incidentService", () => ({
  incidentService: {
    save: jest.fn(async (row: Incident) => row),
  },
}));

function sampleProject(over: Partial<Project> = {}): Project {
  return {
    id: "PRJ-MEL-5",
    name: "Site A",
    clientFunder: "Funder",
    budgetTotal: 1,
    budgetSpent: 0,
    ward: "Ward 1",
    municipality: "Place",
    status: "Active",
    contractorName: "Co",
    startDate: "2026-01-01",
    targetEndDate: "2026-12-31",
    publicSummary: "Summary",
    melIndicators: [
      {
        id: "MEL-GAP",
        label: "People reached",
        unit: "people",
        expected: 1000,
        actual: 620,
      },
    ],
    ...over,
  };
}

function sampleIncident(over: Partial<Incident> = {}): Incident {
  return {
    id: "INC-MEL-5",
    title: "Dust at the gate",
    description: "Community reported dust.",
    ward: "Ward 12",
    geographicArea: "Gqeberha",
    status: "Investigating",
    priority: "P2-High",
    projectId: "PRJ-MEL-5",
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

describe("MelCyclePanel", () => {
  beforeEach(() => {
    (incidentService.save as jest.Mock).mockClear();
  });

  it("applies a suggested Learn & Adapt record without closing the case", async () => {
    const user = userEvent.setup();
    const incident = sampleIncident();
    const onSaved = jest.fn();
    render(
      <MelCyclePanel
        projects={[sampleProject()]}
        commitments={[]}
        incidents={[incident]}
        onIncidentSaved={onSaved}
      />,
    );

    expect(screen.getByText("Learn & Adapt cycle")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Apply suggestion/i }));

    expect(incidentService.save).toHaveBeenCalled();
    const saved = (incidentService.save as jest.Mock).mock.calls[0][0] as Incident;
    expect(saved.status).toBe("Investigating");
    expect(saved.processStages?.closedAt).toBeFalsy();
    expect(saved.learnAdaptRecords?.[0]?.monitor).toMatch(/watch, not a named cause/i);
    expect(saved.learnAdaptRecords?.[0]?.action).toBe("");
    expect(onSaved).toHaveBeenCalled();
  });

  it("does not invent a case when none are on the project", () => {
    render(
      <MelCyclePanel
        projects={[sampleProject()]}
        commitments={[]}
        incidents={[]}
      />,
    );
    expect(
      screen.getByText(/This draft does not invent a case/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apply suggestion/i })).toBeDisabled();
    expect(incidentService.save).not.toHaveBeenCalled();
  });
});
