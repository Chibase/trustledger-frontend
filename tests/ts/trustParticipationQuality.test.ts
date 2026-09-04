/**
 * @jest-environment jsdom
 */
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import { mockIncidents } from "@/data/mockIncidents";
import {
  classifyParticipationQuality,
  collectTrustAlerts,
  composeTrustIntelligence,
  composeTrustProofReport,
  createTrustObservation,
  createTrustParticipation,
  formatParticipationQualityMix,
  participationLooksTrustDriven,
  participationQualityLooksWeak,
  summarizeParticipationQuality,
} from "@/lib/trust";
import { summarizeTrustWorkspace } from "@/lib/trust/workspaceProof";

function obs() {
  return createTrustObservation({
    id: "TRO-te9-1",
    observedAt: "2026-01-01T00:00:00Z",
    dimension: "process",
    signal: "neutral",
    source: "engagement",
  });
}

describe("TE-9 participation-quality reading", () => {
  it("uses stored motivation as the class and does not infer trust from attendance or high willingness", () => {
    const present = createTrustParticipation({
      id: "TRP-present",
      source: "engagement",
      willingnessToParticipate: "high",
      presenceMode: "in_person",
    });
    const reading = classifyParticipationQuality(present);
    expect(reading.qualityClass).toBe("unknown");
    expect(reading.classSource).toBe("unspecified");
    expect(reading.consentImplied).toBe(false);
    expect(reading.attendanceDoesNotEqualConsent).toBe(true);
    expect(reading.treatedAsWeak).toBe(false);
    expect(reading.notes.join(" ")).toMatch(/do not imply trust/i);

    const storedTrust = createTrustParticipation({
      id: "TRP-trust",
      source: "engagement",
      motivation: "trust",
      presenceMode: "in_person",
      willingnessToParticipate: "medium",
    });
    expect(classifyParticipationQuality(storedTrust).qualityClass).toBe("trust");
    expect(classifyParticipationQuality(storedTrust).consentImplied).toBe(false);
  });

  it("does not treat mixed, obligation, or livelihood as weak", () => {
    const mixedHigh = createTrustParticipation({
      id: "TRP-mixed-high",
      source: "engagement",
      motivation: "mixed",
      willingnessToParticipate: "high",
      confidenceInProcess: "high",
      presenceMode: "household_rep",
      attendanceDoesNotEqualConsent: true,
    });
    expect(participationLooksTrustDriven("high", "high", "unknown")).toBe(true);
    expect(mixedHigh.trustDriven).toBe(true);
    const reading = classifyParticipationQuality(mixedHigh);
    expect(reading.qualityClass).toBe("mixed");
    expect(reading.treatedAsWeak).toBe(false);
    expect(reading.consentImplied).toBe(false);

    const livelihood = createTrustParticipation({
      id: "TRP-livelihood",
      source: "engagement",
      motivation: "livelihood",
      willingnessToParticipate: "medium",
      trustDriven: false,
    });
    expect(classifyParticipationQuality(livelihood).treatedAsWeak).toBe(false);
    expect(participationQualityLooksWeak([mixedHigh, livelihood])).toBe(false);

    const index = summarizeParticipationQuality([mixedHigh, livelihood]);
    expect(index.byClass.mixed).toBe(1);
    expect(index.byClass.livelihood).toBe(1);
    expect(index.byClass.trust).toBe(0);
    expect(index.consentImpliedCount).toBe(0);
    expect(index.mixedIsNotWeak).toBe(true);
    expect(index.attendanceIsNotConsent).toBe(true);
    expect(index.weakByWillingnessOnly).toBe(0);
    expect(formatParticipationQualityMix(index)).toMatch(/mixed 1/);
  });

  it("does not invent a weak-participation alert from mixed motive or not-trust-driven flags", () => {
    const mixedFlagged = createTrustParticipation({
      id: "TRP-mixed-false",
      source: "engagement",
      motivation: "mixed",
      willingnessToParticipate: "medium",
      trustDriven: false,
    });
    const proof = composeTrustProofReport({
      observations: [obs()],
      participation: [mixedFlagged],
    });
    expect(proof.participation.quality.byClass.mixed).toBe(1);
    expect(proof.participation.quality.consentImpliedCount).toBe(0);
    expect(proof.markdown).toMatch(/Quality mix:/);
    expect(proof.markdown).toMatch(/mixed is not weak/i);
    expect(proof.markdown).toMatch(/attendance is not consent/i);
    expect(proof.markdown).toMatch(/not Trust pulse/i);
    const alerts = collectTrustAlerts({ proof });
    expect(alerts.some((row) => row.kind === "weak_participation")).toBe(false);

    const brief = composeTrustIntelligence({
      observations: [obs()],
      participation: [mixedFlagged],
    });
    expect(brief.alerts.some((row) => row.kind === "weak_participation")).toBe(
      false,
    );
    expect(brief.advisory.supportNotes.join(" ")).toMatch(/Participation quality/i);
    expect(brief.advisory.supportNotes.join(" ")).toMatch(/mixed/i);
  });

  it("still flags explicit low willingness as weak", () => {
    const low = createTrustParticipation({
      id: "TRP-low",
      source: "engagement",
      motivation: "trust",
      willingnessToParticipate: "low",
    });
    expect(classifyParticipationQuality(low).treatedAsWeak).toBe(true);
    expect(participationQualityLooksWeak([low])).toBe(true);
    const proof = composeTrustProofReport({
      observations: [obs()],
      participation: [low],
    });
    expect(
      collectTrustAlerts({ proof }).some((row) => row.kind === "weak_participation"),
    ).toBe(true);
  });

  it("does not change Trust pulse", () => {
    const incidents = mockIncidents.map((row) => ({ ...row }));
    const before = JSON.stringify(trustIndexFromIncidents(incidents));
    const mixed = createTrustParticipation({
      id: "TRP-pulse",
      source: "engagement",
      motivation: "obligation",
      presenceMode: "in_person",
      willingnessToParticipate: "high",
    });
    composeTrustProofReport({
      observations: [obs()],
      participation: [mixed],
    });
    collectTrustAlerts({
      proof: composeTrustProofReport({
        observations: [obs()],
        participation: [mixed],
      }),
    });
    expect(JSON.stringify(trustIndexFromIncidents(incidents))).toBe(before);
  });

  it("exposes the quality mix on the workspace summary without a pulse-like score", () => {
    const report = composeTrustProofReport({
      observations: [obs()],
      participation: [
        createTrustParticipation({
          id: "TRP-hub",
          source: "engagement",
          motivation: "obligation",
          presenceMode: "proxy",
          attendanceDoesNotEqualConsent: true,
        }),
      ],
    });
    const summary = summarizeTrustWorkspace(report);
    expect(summary.participationQuality.byClass.obligation).toBe(1);
    expect(summary.participationQuality.consentImpliedCount).toBe(0);
    expect(report.sources.trustPulseUsed).toBe(false);
  });
});
