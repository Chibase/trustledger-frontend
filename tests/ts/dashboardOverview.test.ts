import {
  budgetMixBars,
  engagementSentimentBars,
  incidentPriorityBars,
  incidentStatusFunnel,
  namedShareBars,
  projectStatusBars,
} from "@/lib/dashboardOverview";
import type { Engagement } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

function project(status: Project["status"]): Project {
  return {
    id: `PRJ-${status}`,
    name: status,
    clientFunder: "Test",
    budgetTotal: 0,
    budgetSpent: 0,
    ward: "Ward 1",
    municipality: "Test",
    status,
    contractorName: "Test",
    startDate: "2026-01-01",
    targetEndDate: "2026-12-31",
    publicSummary: "",
  };
}

function incident(
  status: Incident["status"],
  priority: Incident["priority"],
): Incident {
  return {
    id: `INC-${status}-${priority}`,
    title: status,
    description: "",
    ward: "Ward 1",
    geographicArea: "Ward 1",
    status,
    priority,
    projectId: "PRJ-001",
    projectName: "Test",
    reportedByRole: "community",
    reportedAt: "2026-01-01T00:00:00Z",
    slaDueBy: "2026-01-02T00:00:00Z",
    slaBreached: false,
    escalationLevel: "None",
    ownerName: "Test",
    category: "Other",
    impactScore: 0,
    sentimentScore: null,
    timeline: [],
  };
}

function engagement(
  sentimentLabel: Engagement["sentimentLabel"],
): Engagement {
  return {
    id: `ENG-${sentimentLabel ?? "none"}`,
    title: "Note",
    kind: "meeting",
    status: "held",
    heldOn: "2026-01-01",
    ward: "Ward 1",
    projectId: "PRJ-001",
    summary: "",
    attendeesLabel: "",
    actionItems: [],
    stakeholderIds: [],
    source: "minutes",
    createdAt: "2026-01-01T00:00:00Z",
    sentimentLabel,
  };
}

describe("dashboardOverview", () => {
  it("counts project status and drops empty buckets", () => {
    expect(
      projectStatusBars([
        project("Active"),
        project("Active"),
        project("OnHold"),
      ]),
    ).toEqual([
      { label: "Active", value: 2 },
      { label: "On hold", value: 1 },
    ]);
    expect(projectStatusBars([])).toEqual([]);
  });

  it("charts open-case priority only and drops empty buckets", () => {
    expect(
      incidentPriorityBars([
        incident("Open", "P1-Critical"),
        incident("Investigating", "P2-High"),
        incident("Closed", "P1-Critical"),
        incident("Open", "P4-Low"),
      ]),
    ).toEqual([
      { label: "P1", value: 1 },
      { label: "P2", value: 1 },
      { label: "P4", value: 1 },
    ]);
    expect(incidentPriorityBars([incident("Closed", "P1-Critical")])).toEqual(
      [],
    );
  });

  it("keeps a four-step case funnel including zeros", () => {
    expect(
      incidentStatusFunnel([
        incident("Open", "P3-Medium"),
        incident("Open", "P4-Low"),
        incident("Closed", "P4-Low"),
      ]),
    ).toEqual([
      { label: "Open", value: 2 },
      { label: "Investigating", value: 0 },
      { label: "Escalated", value: 0 },
      { label: "Closed", value: 1 },
    ]);
  });

  it("charts budget mix and hides an all-zero series", () => {
    expect(
      budgetMixBars({ budget: 100.4, spent: 40.2, available: 59.9 }),
    ).toEqual([
      { label: "Budget", value: 100 },
      { label: "Spent", value: 40 },
      { label: "Available", value: 60 },
    ]);
    expect(budgetMixBars({ budget: 0, spent: 0, available: 0 })).toEqual([]);
  });

  it("charts named shares and applied note sentiment without inventing rows", () => {
    expect(
      namedShareBars([
        { label: "Community", count: 3 },
        { label: "Funder", count: 0 },
      ]),
    ).toEqual([{ label: "Community", value: 3 }]);
    expect(
      engagementSentimentBars([
        engagement("positive"),
        engagement("positive"),
        engagement("neutral"),
        engagement(null),
      ]),
    ).toEqual([
      { label: "Positive", value: 2 },
      { label: "Neutral", value: 1 },
    ]);
  });
});
