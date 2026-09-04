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
  TRUST_MVP_DO_NOT_PROMISE,
  TRUST_MVP_FUTURE,
  buildTrustMvpPackageFromSrm,
  composeTrustMvpPackage,
  createTrustCommunityContext,
  createTrustObservation,
  createTrustParticipation,
  mvpProofMatchesStandalone,
  trustPulseUnchangedByMvpPackaging,
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
    communityPlaceId: extra.communityPlaceId,
    stakeholderId: extra.stakeholderId,
    note: extra.note,
  });
}

describe("TE-6 MVP packaging", () => {
  it("produces proof, trends, evidence-backed claims, community context, and suggestion-only recs", () => {
    const pkg = composeTrustMvpPackage({
      generatedAt: "2026-09-04T12:00:00.000Z",
      observations: [
        obs("a", "2026-01-01T00:00:00Z", "neutral", {
          sourceId: "INC-1001",
          evidenceIds: ["EVD-1"],
          communityPlaceId: "za-ward-79800012",
        }),
        obs("b", "2026-04-01T00:00:00Z", "negative", {
          sourceId: "INC-1001",
          evidenceIds: ["EVD-1"],
          communityPlaceId: "za-ward-79800012",
        }),
      ],
      participation: [
        createTrustParticipation({
          id: "TRP-mvp-1",
          source: "engagement",
          motivation: "mixed",
          presenceMode: "household_rep",
          attendanceDoesNotEqualConsent: true,
        }),
      ],
      community: [
        createTrustCommunityContext({
          id: "TRC-mvp-1",
          placeId: "za-ward-79800012",
          placeLabel: "Ward 12",
          historyNotes: "Previous contractor left without a close-out meeting.",
          barriers: "Distance from the hall",
          barrierTags: ["distance"],
        }),
      ],
      stakeholders: mockStakeholders,
    });

    expect(pkg.readiness.proofReport).toBe(true);
    expect(pkg.readiness.evidenceBackedSummary).toBe(true);
    expect(pkg.readiness.trustTrendView).toBe(true);
    expect(pkg.readiness.communityContextView).toBe(true);
    expect(pkg.readiness.recommendationOutput).toBe(true);
    expect(pkg.readiness.recommendationsSuggestionOnly).toBe(true);
    expect(pkg.readiness.autonomous).toBe(false);
    expect(pkg.readiness.trustPulseUsed).toBe(false);
    expect(pkg.readiness.ledgerWrites).toBe(false);
    expect(pkg.proof.sources.trustPulseUsed).toBe(false);
    expect(pkg.proof.claims.some((row) => row.evidenceIds.includes("EVD-1"))).toBe(
      true,
    );
    expect(pkg.proof.comparisons.community.length).toBeGreaterThan(0);
    expect(pkg.intelligence.recommendations.every((row) => row.decision === "suggestion_only")).toBe(
      true,
    );
    expect(pkg.intelligence.recommendations.every((row) => row.autonomous === false)).toBe(
      true,
    );
    expect(pkg.intelligence.alerts.some((row) => row.kind === "weak_participation")).toBe(
      false,
    );
    expect(pkg.communityHints.join(" ")).toMatch(/history/i);
    expect(pkg.authorityRoles).toEqual(
      expect.arrayContaining([
        "traditional_authority",
        "ward_structure",
        "institutional_actor",
      ]),
    );
    expect(pkg.markdown).toContain("TrustLedger MVP package");
    expect(pkg.markdown).toContain("suggestion only");
    expect(pkg.markdown).not.toContain("Frappe");
    expect(pkg.ruleCatalog).toEqual(
      expect.arrayContaining(["TR-REPAIR-DECLINING", "TR-FOLLOWUP-MISSING-EVIDENCE"]),
    );
  });

  it("does not mark empty workspaces as having proof, trends, or recs", () => {
    const empty = composeTrustMvpPackage({
      generatedAt: "2026-09-04T12:00:00.000Z",
      observations: [],
    });
    expect(empty.readiness.proofReport).toBe(false);
    expect(empty.readiness.evidenceBackedSummary).toBe(false);
    expect(empty.readiness.trustTrendView).toBe(false);
    expect(empty.readiness.communityContextView).toBe(false);
    expect(empty.readiness.recommendationOutput).toBe(false);
    expect(empty.readiness.recommendationsSuggestionOnly).toBe(true);
    expect(empty.markdown).toContain("Proof report: no");
    expect(empty.markdown).toContain("Trust trend view: no");
    expect(empty.markdown).toContain("Recommendation output: no");
  });

  it("does not mutate SRM or Trust pulse when packaging from existing modules", () => {
    const incidents: Incident[] = mockIncidents.map((row) => ({ ...row }));
    const snapshot = JSON.stringify(incidents);
    const before = trustIndexFromIncidents(incidents);
    expect(
      mvpProofMatchesStandalone({
        incidents,
        engagements: mockEngagements,
        commitments: mockCommitments,
        evidence: mockEvidence,
        stakeholders: mockStakeholders,
      }),
    ).toBe(true);
    expect(
      trustPulseUnchangedByMvpPackaging(incidents),
    ).toBe(true);
    const pkg = buildTrustMvpPackageFromSrm({
      incidents,
      engagements: mockEngagements,
      commitments: mockCommitments,
      evidence: mockEvidence,
      stakeholders: mockStakeholders,
    });
    expect(JSON.stringify(incidents)).toBe(snapshot);
    expect(trustIndexFromIncidents(incidents)).toEqual(before);
    expect(pkg.intelligence.recommendations.every((row) => row.humanApplyRequired)).toBe(
      true,
    );
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
      periodLabel: "September 2026",
      authorTierLabel: "Delivery",
      authorName: "Test Author",
      includedSectionIds: ["period_summary"],
      includedSectionLabels: ["Period summary"],
      lockedSectionLabels: [],
      facts,
      tonePreference: "plain",
    });
    expect(draft.bodyMarkdown).not.toContain("TrustLedger MVP package");
  });

  it("keeps future-only and do-not-promise lists explicit", () => {
    expect(TRUST_MVP_DO_NOT_PROMISE.join(" ")).toMatch(/autonomous/i);
    expect(TRUST_MVP_DO_NOT_PROMISE.join(" ")).toMatch(/ledger/i);
    expect(TRUST_MVP_DO_NOT_PROMISE.join(" ")).toMatch(/TEDS/i);
    expect(TRUST_MVP_FUTURE.join(" ")).toMatch(/KEY_MANAGEMENT/i);
    expect(TRUST_MVP_FUTURE.join(" ")).toMatch(/DocTypes/i);
  });
});
