import { mockCommitments } from "@/data/mockCommitments";
import { mockEngagements, mockEvidence } from "@/data/mockEngagements";
import { mockIncidents } from "@/data/mockIncidents";
import { mockStakeholders } from "@/data/mock/stakeholders";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import {
  composeActivityReportMarkdown,
  emptyAggregatedPackFacts,
  type PeriodActivityFacts,
} from "@/lib/reportComposer";
import {
  analyzeTrust,
  buildTrustProofFromSrm,
  classifyOverallTrustMovement,
  compareTrustByAxis,
  compareTrustPeriods,
  composeTrustProofReport,
  createTrustObservation,
  detectTrustRisks,
  deriveTrustLayer,
} from "@/lib/trust";
import type { Incident } from "@/types/incident";
import type { TrustObservation } from "@/types/trustLayer";

function obs(
  id: string,
  at: string,
  signal: "positive" | "neutral" | "negative",
  extra: Partial<TrustObservation> = {},
): TrustObservation {
  return createTrustObservation({
    id,
    observedAt: at,
    dimension: extra.dimension || "process",
    signal,
    source: extra.source || "derived",
    sourceId: extra.sourceId,
    communityPlaceId: extra.communityPlaceId,
    stakeholderId: extra.stakeholderId,
    evidenceIds: extra.evidenceIds,
    note: extra.note,
    projectId: extra.projectId,
  });
}

describe("TE-3 trust trend analysis", () => {
  it("classifies growth, decline, and stability from later vs earlier halves", () => {
    const improving = [
      obs("a", "2026-01-01T00:00:00Z", "negative"),
      obs("b", "2026-02-01T00:00:00Z", "negative"),
      obs("c", "2026-03-01T00:00:00Z", "positive"),
      obs("d", "2026-04-01T00:00:00Z", "positive"),
    ];
    expect(compareTrustPeriods(improving).movement).toBe("improving");
    expect(compareTrustPeriods(improving).delta).toBeGreaterThanOrEqual(0.34);

    const declining = [
      obs("e", "2026-01-01T00:00:00Z", "positive"),
      obs("f", "2026-02-01T00:00:00Z", "positive"),
      obs("g", "2026-03-01T00:00:00Z", "negative"),
      obs("h", "2026-04-01T00:00:00Z", "negative"),
    ];
    expect(compareTrustPeriods(declining).movement).toBe("declining");

    const stable = [
      obs("i", "2026-01-01T00:00:00Z", "neutral"),
      obs("j", "2026-02-01T00:00:00Z", "positive"),
      obs("k", "2026-03-01T00:00:00Z", "neutral"),
      obs("l", "2026-04-01T00:00:00Z", "positive"),
    ];
    expect(compareTrustPeriods(stable).movement).toBe("stable");
  });

  it("uses an explicit split date when provided", () => {
    const rows = [
      obs("a", "2026-01-01T00:00:00Z", "negative"),
      obs("b", "2026-06-01T00:00:00Z", "positive"),
    ];
    const period = compareTrustPeriods(rows, "2026-04-01T00:00:00Z");
    expect(period.earlier.count).toBe(1);
    expect(period.later.count).toBe(1);
    expect(period.movement).toBe("improving");
  });

  it("marks mixed when one dimension improves and another declines", () => {
    const rows = [
      obs("p1", "2026-01-01T00:00:00Z", "negative", { dimension: "process" }),
      obs("p2", "2026-04-01T00:00:00Z", "positive", { dimension: "process" }),
      obs("i1", "2026-01-01T00:00:00Z", "positive", {
        dimension: "concerns_acted_upon",
      }),
      obs("i2", "2026-04-01T00:00:00Z", "negative", {
        dimension: "concerns_acted_upon",
      }),
    ];
    const bundle = analyzeTrust(rows);
    expect(bundle.overallMovement).toBe("mixed");
    expect(
      classifyOverallTrustMovement(bundle.statuses, bundle.period),
    ).toBe("mixed");
  });

  it("returns insufficient when there are no scored signals", () => {
    expect(compareTrustPeriods([]).movement).toBe("insufficient");
    expect(analyzeTrust([]).overallMovement).toBe("insufficient");
  });
});

describe("TE-3 trust comparison views", () => {
  it("compares by community, location, stakeholder group, and project phase", () => {
    const rows = [
      obs("c1", "2026-01-01T00:00:00Z", "negative", {
        communityPlaceId: "place-a",
        stakeholderId: "STK-1",
        source: "incident",
      }),
      obs("c2", "2026-04-01T00:00:00Z", "positive", {
        communityPlaceId: "place-a",
        stakeholderId: "STK-1",
        source: "incident",
      }),
      obs("c3", "2026-01-01T00:00:00Z", "positive", {
        communityPlaceId: "place-b",
        stakeholderId: "STK-2",
        source: "engagement",
      }),
      obs("c4", "2026-04-01T00:00:00Z", "positive", {
        communityPlaceId: "place-b",
        stakeholderId: "STK-2",
        source: "engagement",
      }),
    ];
    const context = {
      community: [
        {
          id: "TRC-a",
          layer: "trust" as const,
          updatedAt: "2026-01-01T00:00:00Z",
          placeId: "place-a",
          placeLabel: "Ward 4",
          communityRef: "Clinic corridor",
          ward: "Ward 4",
          municipality: "Example LM",
        },
        {
          id: "TRC-b",
          layer: "trust" as const,
          updatedAt: "2026-01-01T00:00:00Z",
          placeId: "place-b",
          placeLabel: "Ward 9",
          communityRef: "Civic hall",
          ward: "Ward 9",
          municipality: "Other LM",
        },
      ],
      stakeholders: [
        { id: "STK-1", kind: "community_group" as const },
        { id: "STK-2", kind: "government" as const },
      ],
    };
    const community = compareTrustByAxis(rows, "community", context);
    expect(community.map((row) => row.label).sort()).toEqual([
      "Civic hall",
      "Clinic corridor",
    ]);
    const location = compareTrustByAxis(rows, "location", context);
    expect(location.map((row) => row.label).sort()).toEqual([
      "Example LM",
      "Other LM",
    ]);
    const groups = compareTrustByAxis(rows, "stakeholder_group", context);
    expect(groups.map((row) => row.label).sort()).toEqual([
      "Community group",
      "Government",
    ]);
    const phases = compareTrustByAxis(rows, "project_phase", context);
    expect(phases.map((row) => row.id).sort()).toEqual([
      "engagement",
      "resolution",
    ]);
  });
});

describe("TE-3 trust risk detection", () => {
  it("flags declining trust, low confidence, and missing evidence", () => {
    const rows = [
      obs("r1", "2026-01-01T00:00:00Z", "neutral", {
        communityPlaceId: "thin-place",
      }),
      obs("r2", "2026-04-01T00:00:00Z", "negative", {
        communityPlaceId: "thin-place",
      }),
    ];
    const flags = detectTrustRisks({ observations: rows });
    expect(flags.some((row) => row.kind === "declining_trust")).toBe(true);
    expect(flags.some((row) => row.kind === "at_risk_level")).toBe(true);
    expect(flags.some((row) => row.kind === "low_confidence")).toBe(true);
    expect(flags.some((row) => row.kind === "insufficient_evidence")).toBe(
      true,
    );
  });

  it("does not flag a well-evidenced stable slice as at risk", () => {
    const rows = [
      obs("s1", "2026-01-01T00:00:00Z", "positive", { evidenceIds: ["EVD-1"] }),
      obs("s2", "2026-02-01T00:00:00Z", "positive", { evidenceIds: ["EVD-2"] }),
      obs("s3", "2026-03-01T00:00:00Z", "positive", { evidenceIds: ["EVD-3"] }),
      obs("s4", "2026-04-01T00:00:00Z", "positive", { evidenceIds: ["EVD-4"] }),
    ];
    const flags = detectTrustRisks({ observations: rows });
    expect(flags.some((row) => row.kind === "declining_trust")).toBe(false);
    expect(flags.some((row) => row.kind === "at_risk_level")).toBe(false);
    expect(flags.some((row) => row.kind === "insufficient_evidence")).toBe(
      false,
    );
  });
});

describe("TE-3 proof reporting", () => {
  it("writes claims, evidence, history, and participation without an LLM", () => {
    const generatedAt = "2026-09-04T12:00:00.000Z";
    const report = composeTrustProofReport({
      generatedAt,
      observations: [
        obs("h1", "2026-01-01T00:00:00Z", "negative", {
          evidenceIds: ["EVD-99"],
          note: "Site walkabout.",
        }),
        obs("h2", "2026-04-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-99"],
          note: "Repair confirmed.",
        }),
      ],
      participation: [
        {
          id: "TRP-1",
          layer: "trust",
          observedAt: "2026-04-01T00:00:00Z",
          source: "engagement",
          willingnessToParticipate: "high",
          willingnessToContribute: "medium",
          trustDriven: true,
          note: "Committee asked to stay involved.",
        },
      ],
    });
    expect(report.overallMovement).toBe("improving");
    expect(report.markdown).toContain("Trust proof summary");
    expect(report.markdown).toContain("does not replace monthly");
    expect(report.markdown).toContain("EVD-99");
    expect(report.markdown).toContain("Committee asked to stay involved");
    expect(report.markdown).toContain("Incident Trust pulse used: no");
    expect(report.history).toHaveLength(2);
    expect(report.claims.some((row) => row.evidenceIds.includes("EVD-99"))).toBe(
      true,
    );
    expect(report.participation.participateHigh).toBe(1);
    expect(report.sources.trustPulseUsed).toBe(false);
    expect(report.narrative).toContain("improving");
  });

  it("derives from SRM without mutating records or Trust pulse", () => {
    const incidents: Incident[] = mockIncidents.map((row) => ({ ...row }));
    const snapshot = JSON.stringify(incidents);
    const before = trustIndexFromIncidents(incidents);
    const report = buildTrustProofFromSrm({
      incidents,
      engagements: mockEngagements,
      commitments: mockCommitments,
      evidence: mockEvidence,
      stakeholders: mockStakeholders,
    });
    expect(JSON.stringify(incidents)).toBe(snapshot);
    expect(trustIndexFromIncidents(incidents)).toEqual(before);
    expect(report.markdown).toContain("optional");
    expect(deriveTrustLayer({ incidents }).observations).toEqual([]);
    expect(
      deriveTrustLayer({ incidents, commitments: mockCommitments }).observations
        .length,
    ).toBeGreaterThan(0);
  });

  it("leaves legacy activity-report composition unchanged", () => {
    const facts: PeriodActivityFacts = {
      attended: mockIncidents.slice(0, 2),
      escalated: [],
      resolved: [],
      pending: [],
      unresolvedBlocked: [],
      meetingCaptures: [],
      evidence: [],
      trustIndex: 42,
      trustLabel: "Watch",
      avgSentiment: 0,
      packs: emptyAggregatedPackFacts(),
    };
    const draft = composeActivityReportMarkdown({
      kind: "monthly_activity",
      kindLabel: "Monthly activity report",
      audienceLabel: "Supervisor",
      periodLabel: "August 2026",
      authorTierLabel: "Delivery",
      authorName: "Test Author",
      includedSectionIds: ["period_summary"],
      includedSectionLabels: ["Period summary"],
      lockedSectionLabels: [],
      facts,
      tonePreference: "plain",
    });
    expect(draft.bodyMarkdown).toContain("Monthly activity report");
    expect(draft.bodyMarkdown).not.toContain("Trust proof summary");
    expect(draft.title).toContain("Monthly activity report");
  });
});
