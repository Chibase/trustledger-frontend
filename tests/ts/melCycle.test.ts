import {
  applyingAdaptLeavesStages,
  collectMelCycleSuggestions,
  monitorFromShortfall,
  scopeCommitmentsForMelCycle,
} from "@/lib/melCycle";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { MelLearnAdaptRecord } from "@/types/melAdapt";

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

const gapProject = sampleProject({
  melIndicators: [
    {
      id: "MEL-GAP",
      label: "People reached",
      unit: "people",
      expected: 1000,
      actual: 620,
    },
  ],
});

describe("MEL-5 Learn & Adapt cycle", () => {
  it("suggests a Learn & Adapt record for a material shortfall with no open Adapt yet", () => {
    const rows = collectMelCycleSuggestions({
      projects: [gapProject],
      incidents: [sampleIncident()],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.candidates.map((c) => c.id)).toEqual(["INC-MEL-5"]);
    expect(rows[0]?.monitor).toMatch(/620/);
    expect(rows[0]?.monitor).toMatch(/watch, not a named cause/i);
    expect(rows[0]?.monitor).not.toMatch(/caused/i);
  });

  it("does not suggest when that project already has an open Adapt record", () => {
    const rec: MelLearnAdaptRecord = {
      id: "ADA-1",
      monitor: "Watering skipped.",
      analyse: "",
      action: "Reinstate watering.",
      status: "open",
      createdAt: "2026-09-02T08:00:00.000Z",
    };
    const rows = collectMelCycleSuggestions({
      projects: [gapProject],
      incidents: [sampleIncident({ learnAdaptRecords: [rec] })],
    });
    expect(rows).toHaveLength(0);
  });

  it("does not invent a case when the project has none", () => {
    const rows = collectMelCycleSuggestions({
      projects: [gapProject],
      incidents: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.candidates).toEqual([]);
  });

  it("does not treat a non-material gap as a cycle suggestion", () => {
    const rows = collectMelCycleSuggestions({
      projects: [
        sampleProject({
          melIndicators: [
            {
              id: "MEL-SMALL",
              label: "Jobs",
              unit: "count",
              expected: 100,
              actual: 90,
            },
          ],
        }),
      ],
      incidents: [sampleIncident()],
    });
    expect(rows).toHaveLength(0);
  });

  it("keeps case stages unchanged when a record is appended", () => {
    const before = sampleIncident({ status: "Investigating" });
    const after: Incident = {
      ...before,
      learnAdaptRecords: [
        {
          id: "ADA-2",
          monitor: monitorFromShortfall({
            label: "People reached",
            projectName: "Site A",
            actual: 620,
            expected: 1000,
          }),
          analyse: "",
          action: "",
          status: "open",
          createdAt: "2026-09-05T00:00:00.000Z",
        },
      ],
    };
    expect(applyingAdaptLeavesStages(before, after)).toBe(true);
    expect(after.status).toBe("Investigating");
    expect(after.processStages?.closedAt).toBeFalsy();
  });

  it("does not attach orphan commitments to a single project desk", () => {
    const orphan: import("@/types/commitment").Commitment = {
      id: "COM-ORPHAN",
      title: "Unlinked hire",
      status: "open",
      ownerLabel: "CLO",
      dueOn: "2026-12-01",
      projectId: null,
      engagementId: null,
      stakeholderIds: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      expected: 1000,
      actual: 620,
    };
    expect(
      scopeCommitmentsForMelCycle([orphan], [gapProject]),
    ).toEqual([]);
    expect(
      scopeCommitmentsForMelCycle([orphan], [gapProject, sampleProject({ id: "PRJ-B" })]),
    ).toEqual([orphan]);
  });
});
