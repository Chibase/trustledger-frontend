import { mockIncidents } from "@/data/mockIncidents";
import {
  composeActivityReportMarkdown,
  emptyAggregatedPackFacts,
  type PeriodActivityFacts,
} from "@/lib/reportComposer";
import {
  buildExecutiveRiskRows,
  buildFunderSnapshot,
  reportLensForKind,
  reportLensForPack,
  savedBodyMatchesLens,
} from "@/lib/reportLenses";
import { REPORT_PACKS } from "@/types/reportPacks";

function factsFromMocks(): PeriodActivityFacts {
  const open = mockIncidents.filter((i) => i.status !== "Closed");
  const trust = 42;
  return {
    attended: mockIncidents.slice(0, 8),
    escalated: mockIncidents.filter(
      (i) => i.status === "Escalated" || i.escalationLevel !== "None",
    ),
    resolved: mockIncidents.filter((i) => i.status === "Closed"),
    pending: open.filter(
      (i) => i.status === "Open" || i.status === "Investigating",
    ),
    unresolvedBlocked: open.filter(
      (i) => i.slaBreached || i.status === "Escalated",
    ),
    meetingCaptures: [],
    evidence: mockIncidents.slice(0, 2).map((i) => ({
      id: `ev-${i.id}`,
      kind: "other" as const,
      label: `${i.id} — ${i.title}`,
    })),
    trustIndex: trust,
    trustLabel: "Watch",
    avgSentiment: -20,
    projectName: mockIncidents[0]?.projectName,
    packs: emptyAggregatedPackFacts(),
  };
}

function compose(kind: "monthly_activity" | "executive_risk" | "board_investor") {
  const labels = {
    monthly_activity: "Monthly activity report",
    executive_risk: "Executive risk brief",
    board_investor: "Board / investor / funder brief",
  };
  return composeActivityReportMarkdown({
    kind,
    kindLabel: labels[kind],
    audienceLabel: kind === "monthly_activity" ? "Supervisor" : "Board",
    periodLabel: "August 2026",
    authorTierLabel: "Delivery",
    authorName: "Test Author",
    projectName: "Ward 12 Access Road Repair",
    includedSectionIds: [
      "period_summary",
      "activity_log",
      "issues_attended",
      "appendix_evidence",
    ],
    includedSectionLabels: [
      "Period summary",
      "Activity log",
      "Issues attended to",
      "Evidence appendix",
    ],
    lockedSectionLabels: [],
    facts: factsFromMocks(),
    tonePreference: kind === "monthly_activity" ? "plain" : "board",
  });
}

describe("report pack lenses", () => {
  it("maps packs and kinds to distinct lenses", () => {
    expect(reportLensForPack("monthly")).toBe("monthly");
    expect(reportLensForPack("executive")).toBe("executive");
    expect(reportLensForPack("board_presentation")).toBe("funder");
    expect(reportLensForKind("monthly_activity")).toBe("monthly");
    expect(reportLensForKind("executive_risk")).toBe("executive");
    expect(reportLensForKind("board_investor")).toBe("funder");
    expect(REPORT_PACKS.executive.defaultKind).toBe("executive_risk");
    expect(REPORT_PACKS.board_presentation.defaultKind).toBe("board_investor");
  });

  it("builds executive rows with impact, mitigation, stage, outcome, and expedite", () => {
    const rows = buildExecutiveRiskRows(mockIncidents);
    expect(rows.length).toBeGreaterThan(0);
    const lead = rows.find((r) => r.id === "INC-1001") || rows[0];
    expect(lead.projectImpact.length).toBeGreaterThan(20);
    expect(["Critical", "High", "Medium", "Low"]).toContain(lead.impactLevel);
    expect(lead.mitigation.length).toBeGreaterThan(8);
    expect(lead.processStage.length).toBeGreaterThan(4);
    expect(lead.expectedOutcome.length).toBeGreaterThan(8);
    expect(rows.some((r) => r.executiveAction)).toBe(true);
  });

  it("keeps funder snapshot high-level", () => {
    const snap = buildFunderSnapshot(mockIncidents, {
      trustIndex: 42,
      trustLabel: "Watch",
    });
    expect(snap.materialItems.length).toBeGreaterThan(0);
    expect(snap.materialItems.length).toBeLessThanOrEqual(5);
    expect(snap.asks.length).toBeGreaterThan(0);
    expect(snap.asks.length).toBeLessThanOrEqual(3);
  });

  it("composes different bodies for monthly, executive, and funder", () => {
    const monthly = compose("monthly_activity");
    const executive = compose("executive_risk");
    const funder = compose("board_investor");

    expect(monthly.bodyMarkdown).not.toEqual(executive.bodyMarkdown);
    expect(executive.bodyMarkdown).not.toEqual(funder.bodyMarkdown);
    expect(monthly.bodyMarkdown).not.toEqual(funder.bodyMarkdown);

    expect(monthly.bodyMarkdown).toMatch(/detailed monthly activity/i);
    expect(monthly.bodyMarkdown).toMatch(/Activity log|Issues attended/i);
    expect(monthly.bodyMarkdown).toMatch(/Field and desk actions/i);

    expect(executive.bodyMarkdown).toMatch(/## Identified issues/);
    expect(executive.bodyMarkdown).toMatch(/\*\*Project impact:\*\*/);
    expect(executive.bodyMarkdown).toMatch(/\*\*Impact level:\*\*/);
    expect(executive.bodyMarkdown).toMatch(/\*\*Mitigation in progress:\*\*/);
    expect(executive.bodyMarkdown).toMatch(/\*\*Mitigation process:\*\*/);
    expect(executive.bodyMarkdown).toMatch(/\*\*Expected outcome:\*\*/);
    expect(executive.bodyMarkdown).toMatch(/## What executives can expedite/);
    expect(executive.bodyMarkdown).not.toMatch(/Field and desk actions/);

    expect(funder.bodyMarkdown).toMatch(/## Assurance snapshot/);
    expect(funder.bodyMarkdown).toMatch(/## Material items/);
    expect(funder.bodyMarkdown).toMatch(/## What we are asking/);
    expect(funder.bodyMarkdown).not.toMatch(/Field and desk actions/);
    expect(funder.bodyMarkdown).not.toMatch(/## Identified issues/);
    expect(funder.bodyMarkdown.length).toBeLessThan(monthly.bodyMarkdown.length);

    expect(savedBodyMatchesLens("executive_risk", executive.bodyMarkdown)).toBe(
      true,
    );
    expect(savedBodyMatchesLens("board_investor", funder.bodyMarkdown)).toBe(
      true,
    );
    expect(
      savedBodyMatchesLens("executive_risk", monthly.bodyMarkdown),
    ).toBe(false);
  });
});
