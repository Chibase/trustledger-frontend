import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import { mockIncidents } from "@/data/mockIncidents";
import {
  composeTrustIntelligence,
  composeTrustProofReport,
  createTrustObservation,
  createTrustParticipation,
  summarizeTrustCausality,
  summarizeTrustWorkspace,
} from "@/lib/trust";

function obs(
  id: string,
  at: string,
  signal: "positive" | "negative" | "neutral",
  extra: { evidenceIds?: string[] } = {},
) {
  return createTrustObservation({
    id,
    observedAt: at,
    dimension: "process",
    signal,
    source: "engagement",
    evidenceIds: extra.evidenceIds,
  });
}

describe("TE-12 trust-movement companion reading", () => {
  it("lists later-half negative observations as companions, not causes", () => {
    const report = composeTrustProofReport({
      observations: [
        obs("TRO-early", "2026-01-01T00:00:00Z", "positive", {
          evidenceIds: ["EVD-1"],
        }),
        obs("TRO-late", "2026-06-01T00:00:00Z", "negative", {
          evidenceIds: ["EVD-2"],
        }),
      ],
    });
    expect(report.causality.causalProof).toBe(false);
    expect(report.causality.statisticalCausality).toBe(false);
    expect(report.causality.trustPulseUsed).toBe(false);
    expect(report.causality.sentimentUsed).toBe(false);
    expect(report.causality.status).toBe("accompanied");
    expect(
      report.causality.companions.some((row) => row.kind === "later_negative"),
    ).toBe(true);
    expect(report.markdown).toMatch(/not causal proof/i);
    expect(report.markdown).toMatch(/not statistical causality/i);
    const summary = summarizeTrustWorkspace(report);
    expect(summary.causality.attendanceUsedAsCause).toBe(false);
  });

  it("keeps tied timestamps on the same later-half id split as the period chart", () => {
    const report = composeTrustProofReport({
      observations: [
        obs("TRO-tie-a", "2026-03-01T00:00:00Z", "positive"),
        obs("TRO-tie-b", "2026-03-01T00:00:00Z", "negative"),
      ],
    });
    const laterNegative = report.causality.companions.find(
      (row) => row.kind === "later_negative",
    );
    expect(laterNegative?.observationIds).toEqual(["TRO-tie-b"]);
    expect(laterNegative?.observationIds).not.toContain("TRO-tie-a");
  });

  it("does not treat mixed motive or attendance as a cause", () => {
    const report = composeTrustProofReport({
      observations: [
        obs("TRO-a", "2026-01-01T00:00:00Z", "neutral"),
        obs("TRO-b", "2026-06-01T00:00:00Z", "neutral"),
      ],
      participation: [
        createTrustParticipation({
          id: "TRP-mix",
          source: "engagement",
          motivation: "mixed",
          presenceMode: "in_person",
          willingnessToParticipate: "high",
          attendanceDoesNotEqualConsent: true,
        }),
      ],
    });
    expect(
      report.causality.companions.some((row) => row.kind === "low_willingness"),
    ).toBe(false);
    expect(report.causality.mixedTreatedAsWeak).toBe(false);
    expect(report.causality.attendanceUsedAsCause).toBe(false);
    expect(report.causality.notes.join(" ")).toMatch(/Mixed motive/i);
    expect(report.causality.notes.join(" ")).toMatch(/Attendance/i);
  });

  it("lists explicit low willingness as a companion without using mixed or presence", () => {
    const reading = summarizeTrustCausality({
      observations: [
        obs("TRO-a", "2026-01-01T00:00:00Z", "positive"),
        obs("TRO-b", "2026-06-01T00:00:00Z", "positive"),
      ],
      period: {
        splitAt: "2026-06-01T00:00:00Z",
        movement: "stable",
        earlier: { from: null, to: null, count: 1, mean: 1 },
        later: { from: null, to: null, count: 1, mean: 1 },
      },
      participation: [
        createTrustParticipation({
          id: "TRP-low",
          source: "engagement",
          motivation: "obligation",
          willingnessToParticipate: "low",
          presenceMode: "proxy",
        }),
      ],
    });
    expect(reading.companions.some((row) => row.kind === "low_willingness")).toBe(
      true,
    );
    expect(reading.attendanceUsedAsCause).toBe(false);
  });

  it("is insufficient when only one half of the period is scored", () => {
    const report = composeTrustProofReport({
      observations: [obs("TRO-one", "2026-01-01T00:00:00Z", "negative")],
    });
    expect(report.causality.status).toBe("insufficient");
    expect(report.causality.companions).toEqual([]);
    expect(report.causality.causalProof).toBe(false);
  });

  it("does not change Trust pulse", () => {
    const incidents = mockIncidents.map((row) => ({ ...row }));
    const before = JSON.stringify(trustIndexFromIncidents(incidents));
    composeTrustProofReport({
      observations: [
        obs("TRO-p1", "2026-01-01T00:00:00Z", "negative"),
        obs("TRO-p2", "2026-06-01T00:00:00Z", "positive"),
      ],
    });
    expect(JSON.stringify(trustIndexFromIncidents(incidents))).toBe(before);
  });

  it("feeds companion notes into intelligence without claiming a cause", () => {
    const brief = composeTrustIntelligence({
      observations: [
        obs("TRO-i1", "2026-01-01T00:00:00Z", "negative", {
          evidenceIds: ["EVD-i"],
        }),
        obs("TRO-i2", "2026-06-01T00:00:00Z", "negative", {
          evidenceIds: ["EVD-i"],
        }),
      ],
    });
    expect(brief.advisory.supportNotes.join(" ")).toMatch(/not causal proof/i);
    expect(brief.advisory.supportNotes.join(" ")).toMatch(
      /not statistical causality/i,
    );
    expect(brief.markdown).toMatch(/not causal proof/i);
  });
});
