import { mockIncidents } from "@/data/mockIncidents";
import { mockCommitments } from "@/data/mockCommitments";
import { mockEngagements, mockEvidence } from "@/data/mockEngagements";
import { mockStakeholders } from "@/data/mock/stakeholders";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import {
  composeActivityReportMarkdown,
  emptyAggregatedPackFacts,
  type PeriodActivityFacts,
} from "@/lib/reportComposer";
import {
  buildTrustIntelligenceFromSrm,
  composeTrustIntelligence,
  createTrustObservation,
  createTrustParticipation,
  TRUST_INTELLIGENCE_RULES,
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
    source: extra.source || "incident",
    sourceId: extra.sourceId,
    evidenceIds: extra.evidenceIds,
    note: extra.note,
    communityPlaceId: extra.communityPlaceId,
  });
}

describe("TE-4 trust recommendations", () => {
  it("suggests repair and follow-up from declining, unevidenced signals", () => {
    const brief = composeTrustIntelligence({
      generatedAt: "2026-09-04T12:00:00.000Z",
      observations: [
        obs("a", "2026-01-01T00:00:00Z", "neutral", { sourceId: "INC-1001" }),
        obs("b", "2026-04-01T00:00:00Z", "negative", { sourceId: "INC-1001" }),
      ],
    });
    expect(brief.recommendations.every((row) => row.decision === "suggestion_only")).toBe(
      true,
    );
    expect(brief.recommendations.every((row) => row.autonomous === false)).toBe(
      true,
    );
    expect(brief.recommendations.every((row) => row.humanApplyRequired)).toBe(
      true,
    );
    expect(
      brief.recommendations.some((row) => row.trace.ruleId === "TR-REPAIR-DECLINING"),
    ).toBe(true);
    expect(
      brief.recommendations.some(
        (row) => row.trace.ruleId === "TR-FOLLOWUP-MISSING-EVIDENCE",
      ),
    ).toBe(true);
    expect(brief.alerts.some((row) => row.kind === "declining_trust")).toBe(true);
    expect(brief.alerts.some((row) => row.kind === "missing_evidence")).toBe(true);
    expect(brief.markdown).toContain("TR-REPAIR-DECLINING");
    expect(brief.markdown).toContain("suggestion only");
  });

  it("suggests a next engagement when willingness is low", () => {
    const brief = composeTrustIntelligence({
      observations: [
        obs("p1", "2026-01-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
        obs("p2", "2026-02-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
        obs("p3", "2026-03-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
        obs("p4", "2026-04-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
      ],
      participation: [
        createTrustParticipation({
          id: "TRP-low",
          source: "engagement",
          willingnessToParticipate: "low",
          willingnessToContribute: "low",
        }),
      ],
    });
    expect(
      brief.recommendations.some(
        (row) => row.trace.ruleId === "TR-ENGAGE-LOW-WILLINGNESS",
      ),
    ).toBe(true);
    expect(brief.alerts.some((row) => row.kind === "weak_participation")).toBe(
      true,
    );
    expect(brief.drafts.communityFacing).toContain("not sent");
    expect(brief.drafts.autonomous).toBe(false);
  });

  it("flags unresolved cases and suggests senior review without mutating them", () => {
    const incidents: Incident[] = mockIncidents.map((row) => ({ ...row }));
    const snapshot = JSON.stringify(incidents);
    const lead = incidents.find((row) => row.id === "INC-1001") || incidents[0]!;
    const brief = composeTrustIntelligence({
      incidents,
      observations: [
        obs("d1", "2026-01-01T00:00:00Z", "neutral", {
          sourceId: lead.id,
        }),
        obs("d2", "2026-04-01T00:00:00Z", "negative", {
          sourceId: lead.id,
        }),
      ],
    });
    expect(brief.alerts.some((row) => row.kind === "unresolved_concerns")).toBe(
      true,
    );
    expect(
      brief.recommendations.some(
        (row) => row.trace.ruleId === "TR-ESCALATE-OPEN-DECLINE",
      ),
    ).toBe(true);
    expect(
      brief.recommendations
        .find((row) => row.trace.ruleId === "TR-ESCALATE-OPEN-DECLINE")
        ?.action.includes("does not change"),
    ).toBe(true);
    expect(JSON.stringify(incidents)).toBe(snapshot);
    expect(incidents.find((row) => row.id === lead.id)?.status).toBe(lead.status);
    expect(incidents.find((row) => row.id === lead.id)?.escalationLevel).toBe(
      lead.escalationLevel,
    );
  });

  it("does not double-count stored participation that already came from derivation", () => {
    const incident = {
      ...mockIncidents[0]!,
      trustResponse: {
        willingnessToParticipate: "low" as const,
        willingnessToContribute: "low" as const,
        confidenceInProcess: "unknown" as const,
        confidenceInImplementer: "unknown" as const,
        capturedAt: "2026-04-01T00:00:00Z",
      },
    };
    const once = buildTrustIntelligenceFromSrm({ incidents: [incident] });
    const derived = once.drafts.responseSummary;
    const twice = buildTrustIntelligenceFromSrm(
      { incidents: [incident] },
      {
        storedParticipation: [
          createTrustParticipation({
            id: `TRP-incident-${incident.id}`,
            source: "incident",
            sourceId: incident.id,
            willingnessToParticipate: "low",
            willingnessToContribute: "low",
          }),
        ],
      },
    );
    expect(twice.drafts.responseSummary).toBe(derived);
    expect(
      twice.alerts.filter((row) => row.kind === "weak_participation"),
    ).toHaveLength(
      once.alerts.filter((row) => row.kind === "weak_participation").length,
    );
  });

  it("does not invent recommendations when there are no scored signals", () => {
    const brief = composeTrustIntelligence({ observations: [] });
    expect(brief.recommendations).toEqual([]);
    expect(brief.alerts).toEqual([]);
    expect(brief.advisory.autonomous).toBe(false);
    expect(brief.advisory.source).toBe("local_advisory");
    expect(brief.advisory.model).toBe("local-rules");
  });

  it("keeps every recommendation traced to a published rule", () => {
    const brief = composeTrustIntelligence({
      observations: [
        obs("x1", "2026-01-01T00:00:00Z", "negative"),
        obs("x2", "2026-04-01T00:00:00Z", "negative"),
      ],
    });
    for (const row of [...brief.recommendations, ...brief.alerts]) {
      expect(TRUST_INTELLIGENCE_RULES[row.trace.ruleId]).toBeDefined();
      expect(row.trace.ruleSummary).toBe(
        TRUST_INTELLIGENCE_RULES[row.trace.ruleId].summary,
      );
      expect(row.decision).toBe("suggestion_only");
    }
  });
});

describe("TE-4 compatibility and advisory safety", () => {
  it("does not change Trust pulse or legacy activity reports", () => {
    const incidents: Incident[] = mockIncidents.map((row) => ({ ...row }));
    const before = trustIndexFromIncidents(incidents);
    buildTrustIntelligenceFromSrm({
      incidents,
      engagements: mockEngagements,
      commitments: mockCommitments,
      evidence: mockEvidence,
      stakeholders: mockStakeholders,
    });
    expect(trustIndexFromIncidents(incidents)).toEqual(before);
    expect(JSON.stringify(incidents)).toBe(JSON.stringify(mockIncidents));

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
    expect(draft.bodyMarkdown).not.toContain("Trust intelligence (optional)");
    expect(draft.bodyMarkdown).not.toContain("TR-REPAIR-DECLINING");
  });

  it("advisory wording does not add actions the rules did not fire", () => {
    const brief = composeTrustIntelligence({
      observations: [
        obs("s1", "2026-01-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
        obs("s2", "2026-02-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
        obs("s3", "2026-03-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
        obs("s4", "2026-04-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
      ],
    });
    for (const row of brief.recommendations) {
      expect(brief.advisory.reportLanguage).toContain(row.trace.ruleId);
    }
    expect(brief.advisory.reportLanguage).toContain("person must apply");
    expect(brief.advisory.humanApplyRequired).toBe(true);
  });
});
