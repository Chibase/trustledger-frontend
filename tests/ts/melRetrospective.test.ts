import {
  bodyCitesAnyCaseId,
  composeActivityReportMarkdown,
  emptyAggregatedPackFacts,
  looksLikeReportTemplateGuide,
  periodFactsHaveWritableEvidence,
  type PeriodActivityFacts,
} from "@/lib/reportComposer";
import {
  composeMelRetrospectiveMarkdown,
  MEL_RETROSPECTIVE_HEADINGS,
} from "@/lib/melRetrospective";
import { lensUsesFixedBrief, reportLensForKind } from "@/lib/reportLenses";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Commitment } from "@/types/commitment";
import type { MelLearnAdaptRecord } from "@/types/melAdapt";

function sampleProject(over: Partial<Project> = {}): Project {
  return {
    id: "PRJ-MEL-4",
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
    id: "INC-MEL-4",
    title: "Dust at the gate",
    description: "Community reported dust.",
    ward: "Ward 12",
    geographicArea: "Gqeberha",
    status: "Investigating",
    priority: "P2-High",
    projectId: "PRJ-MEL-4",
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

function adapt(
  over: Partial<MelLearnAdaptRecord> = {},
): MelLearnAdaptRecord {
  return {
    id: "ADA-1",
    monitor: "Watering skipped on windy days.",
    analyse: "Contractor roster gap.",
    action: "Reinstate twice-daily watering.",
    status: "open",
    createdAt: "2026-09-02T08:00:00.000Z",
    ...over,
  };
}

function factsFrom(over: Partial<PeriodActivityFacts> = {}): PeriodActivityFacts {
  return {
    attended: [],
    escalated: [],
    resolved: [],
    pending: [],
    unresolvedBlocked: [],
    meetingCaptures: [],
    evidence: [],
    trustIndex: 55,
    trustLabel: "Watch",
    avgSentiment: null,
    projectName: "Site A",
    packs: emptyAggregatedPackFacts(),
    ...over,
  };
}

function compose(facts: PeriodActivityFacts) {
  return composeActivityReportMarkdown({
    kind: "mel_retrospective",
    kindLabel: "Learn & Adapt retrospective",
    audienceLabel: "Supervisor / senior consultant",
    periodLabel: "September 2026",
    authorTierLabel: "Community liaison",
    authorName: "Test Author",
    projectName: "Site A",
    includedSectionIds: ["what_worked", "what_did_not", "what_will_change"],
    includedSectionLabels: ["What worked", "What did not", "What we will change"],
    lockedSectionLabels: [],
    facts,
  });
}

describe("MEL-4 retrospective composer", () => {
  it("maps to a fixed retrospective lens, not a fourth pack SKU", () => {
    expect(reportLensForKind("mel_retrospective")).toBe("retrospective");
    expect(lensUsesFixedBrief("retrospective")).toBe(true);
    expect(reportLensForKind("mel")).toBe("monthly");
  });

  it("writes the three locked headings from evidence", () => {
    const open = sampleIncident({
      rootCause: "process_failure",
      learnAdaptRecords: [adapt()],
    });
    const closed = sampleIncident({
      id: "INC-MEL-4B",
      title: "Access list resolved",
      status: "Closed",
    });
    const project = sampleProject({
      melIndicators: [
        {
          id: "MEL-OK",
          label: "People reached",
          unit: "people",
          expected: 100,
          actual: 120,
        },
        {
          id: "MEL-GAP",
          label: "Jobs created",
          unit: "count",
          expected: 1000,
          actual: 620,
        },
      ],
    });
    const facts = factsFrom({
      attended: [open],
      pending: [open],
      resolved: [closed],
      scopeIncidents: [open, closed],
      projects: [project],
    });
    const draft = compose(facts);
    for (const heading of MEL_RETROSPECTIVE_HEADINGS) {
      expect(draft.bodyMarkdown).toContain(`## ${heading}`);
    }
    expect(draft.bodyMarkdown).toMatch(/People reached/);
    expect(draft.bodyMarkdown).toMatch(/INC-MEL-4B/);
    expect(draft.bodyMarkdown).toMatch(/Jobs created/);
    expect(draft.bodyMarkdown).toMatch(/watch, not a named cause/i);
    expect(draft.bodyMarkdown).toMatch(/INC-MEL-4/);
    expect(draft.bodyMarkdown).toMatch(/Reinstate twice-daily watering/);
    expect(looksLikeReportTemplateGuide(draft.bodyMarkdown)).toBe(false);
    expect(
      bodyCitesAnyCaseId(draft.bodyMarkdown, ["INC-MEL-4", "INC-MEL-4B"]),
    ).toBe(true);
  });

  it("includes commitment expected vs actual when the project list has none", () => {
    const commitment: Commitment = {
      id: "COM-MEL-4",
      title: "Local hire",
      status: "open",
      ownerLabel: "CLO",
      dueOn: "2026-12-01",
      projectId: "PRJ-MEL-4",
      engagementId: null,
      stakeholderIds: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      expected: 1000,
      actual: 620,
      melUnit: "people",
    };
    const facts = factsFrom({
      projects: [sampleProject()],
      commitments: [commitment],
    });
    expect(periodFactsHaveWritableEvidence(facts)).toBe(true);
    const draft = compose(facts);
    expect(draft.bodyMarkdown).toMatch(/Local hire/);
    expect(draft.bodyMarkdown).toMatch(/620/);
    expect(draft.bodyMarkdown).toMatch(/watch, not a named cause/i);
  });

  it("does not invent a change when no Adapt actions are on file", () => {
    const facts = factsFrom({
      projects: [
        sampleProject({
          melIndicators: [
            {
              id: "MEL-OK",
              label: "People reached",
              unit: "people",
              expected: 10,
              actual: 10,
            },
          ],
        }),
      ],
    });
    const draft = composeMelRetrospectiveMarkdown({
      kindLabel: "Learn & Adapt retrospective",
      audienceLabel: "Supervisor",
      periodLabel: "September 2026",
      authorTierLabel: "CLO",
      authorName: "Test Author",
      projectName: "Site A",
      facts,
    });
    expect(draft.bodyMarkdown).toMatch(/No Adapt actions are on file/);
    expect(draft.bodyMarkdown).toMatch(/does not invent a change/);
    expect(draft.bodyMarkdown).not.toMatch(/\[Insert/);
  });

  it("does not close or advance cases", () => {
    const incident = sampleIncident({
      status: "Investigating",
      learnAdaptRecords: [adapt({ status: "open" })],
    });
    const before = JSON.parse(JSON.stringify(incident)) as Incident;
    compose(
      factsFrom({
        attended: [incident],
        pending: [incident],
        scopeIncidents: [incident],
      }),
    );
    expect(incident.status).toBe(before.status);
    expect(incident.processStages).toEqual(before.processStages);
    expect(incident.learnAdaptRecords?.[0]?.status).toBe("open");
  });

  it("does not call a remote model", () => {
    const original = global.fetch;
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
    try {
      compose(factsFrom({ attended: [sampleIncident({ id: "INC-MEL-4" })] }));
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      global.fetch = original;
    }
  });

  it("treats MEL indicators and Learn & Adapt records as writable evidence", () => {
    expect(
      periodFactsHaveWritableEvidence(
        factsFrom({
          projects: [
            sampleProject({
              melIndicators: [
                {
                  id: "MEL-1",
                  label: "People reached",
                  unit: "people",
                  expected: 10,
                  actual: 8,
                },
              ],
            }),
          ],
        }),
      ),
    ).toBe(true);
    expect(
      periodFactsHaveWritableEvidence(
        factsFrom({
          pending: [
            sampleIncident({
              learnAdaptRecords: [adapt()],
            }),
          ],
        }),
      ),
    ).toBe(true);
    expect(periodFactsHaveWritableEvidence(factsFrom())).toBe(false);
  });
});
