import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import { mockIncidents } from "@/data/mockIncidents";
import {
  applyClaimVerification,
  composeTrustIntelligence,
  composeTrustProofReport,
  createMemoryClaimVerificationStorage,
  createTrustObservation,
  createTrustParticipation,
  listClaimVerificationStamps,
  mergeClaimVerificationStampsFromCloud,
  replaceClaimVerificationStamps,
  summarizeClaimVerification,
} from "@/lib/trust";
import { summarizeTrustWorkspace } from "@/lib/trust/workspaceProof";

function obs(id: string, extra: { evidenceIds?: string[] } = {}) {
  return createTrustObservation({
    id,
    observedAt: "2026-01-01T00:00:00Z",
    dimension: "process",
    signal: "neutral",
    source: "evidence",
    evidenceIds: extra.evidenceIds,
  });
}

describe("TE-10 trust-claim verification", () => {
  it("treats linked evidence as evidenced, not verified", () => {
    const proof = composeTrustProofReport({
      observations: [obs("TRO-ev", { evidenceIds: ["EVD-1"] })],
    });
    const process = proof.claims.find((row) => row.dimension === "process");
    expect(process?.verification.status).toBe("evidenced");
    expect(process?.verification.notes.join(" ")).toMatch(
      /not verification/i,
    );
    expect(proof.markdown).toMatch(/Trust-claim verification/);
    expect(proof.markdown).toMatch(/linked evidence is not verification/i);
    const index = summarizeClaimVerification(proof.claims);
    expect(index.byStatus.evidenced).toBe(1);
    expect(index.byStatus.verified).toBe(0);
    expect(index.linkedEvidenceIsNotVerified).toBe(true);
    expect(index.trustPulseUsed).toBe(false);
  });

  it("does not verify from attendance or mixed participation", () => {
    const proof = composeTrustProofReport({
      observations: [obs("TRO-att")],
      participation: [
        createTrustParticipation({
          id: "TRP-att",
          source: "engagement",
          motivation: "mixed",
          presenceMode: "in_person",
          willingnessToParticipate: "high",
          attendanceDoesNotEqualConsent: true,
        }),
      ],
    });
    const process = proof.claims.find((row) => row.dimension === "process");
    expect(process?.verification.status).toBe("unevidenced");
    expect(process?.verification.notes.join(" ")).toMatch(/Attendance/i);
    expect(
      composeTrustIntelligence({
        observations: [obs("TRO-att")],
        participation: [
          createTrustParticipation({
            id: "TRP-att",
            source: "engagement",
            motivation: "mixed",
            presenceMode: "in_person",
          }),
        ],
      }).advisory.supportNotes.join(" "),
    ).toMatch(/Linked evidence is not verification/i);
  });

  it("marks verified only after human apply on the same fingerprint", () => {
    const storage = createMemoryClaimVerificationStorage();
    const observation = obs("TRO-v", { evidenceIds: ["EVD-9"] });
    const before = composeTrustProofReport({ observations: [observation] });
    const claim = before.claims.find((row) => row.dimension === "process")!;
    expect(claim.verification.status).toBe("evidenced");
    expect(
      applyClaimVerification(
        { orgId: "org-te10", claim: { evidenceIds: [], observationIds: [], dimension: "process" } },
        storage,
      ),
    ).toBeNull();
    const stamp = applyClaimVerification(
      { orgId: "org-te10", claim, verifiedAt: "2026-09-04T12:00:00.000Z" },
      storage,
    );
    expect(stamp?.source).toBe("human_apply");
    expect(listClaimVerificationStamps("org-te10", storage)).toHaveLength(1);
    const after = composeTrustProofReport({
      observations: [observation],
      claimVerifications: listClaimVerificationStamps("org-te10", storage),
    });
    expect(
      after.claims.find((row) => row.dimension === "process")?.verification
        .status,
    ).toBe("verified");
    expect(after.markdown).toMatch(/Verification: verified/);
    const summary = summarizeTrustWorkspace(after);
    expect(summary.claimVerification.byStatus.verified).toBe(1);
  });

  it("does not keep a stamp when evidence is removed", () => {
    const storage = createMemoryClaimVerificationStorage();
    const withEvidence = composeTrustProofReport({
      observations: [obs("TRO-drop", { evidenceIds: ["EVD-2"] })],
    });
    const claim = withEvidence.claims.find((row) => row.dimension === "process")!;
    applyClaimVerification({ orgId: "org-te10-drop", claim }, storage);
    const dropped = composeTrustProofReport({
      observations: [obs("TRO-drop")],
      claimVerifications: listClaimVerificationStamps("org-te10-drop", storage),
    });
    expect(
      dropped.claims.find((row) => row.dimension === "process")?.verification
        .status,
    ).toBe("unevidenced");
  });

  it("does not change Trust pulse", () => {
    const incidents = mockIncidents.map((row) => ({ ...row }));
    const before = JSON.stringify(trustIndexFromIncidents(incidents));
    composeTrustProofReport({
      observations: [obs("TRO-pulse", { evidenceIds: ["EVD-1"] })],
    });
    expect(JSON.stringify(trustIndexFromIncidents(incidents))).toBe(before);
  });

  it("feeds human-apply stamps into intelligence and the local org fallback", () => {
    const storage = createMemoryClaimVerificationStorage();
    const observation = obs("TRO-intel", { evidenceIds: ["EVD-intel"] });
    const claim = composeTrustProofReport({
      observations: [observation],
    }).claims.find((row) => row.dimension === "process")!;
    applyClaimVerification(
      { orgId: "local", claim, verifiedAt: "2026-09-04T12:00:00.000Z" },
      storage,
    );
    const stamps = listClaimVerificationStamps("local", storage);
    expect(stamps).toHaveLength(1);
    const brief = composeTrustIntelligence({
      observations: [observation],
      claimVerifications: stamps,
    });
    expect(brief.advisory.supportNotes.join(" ")).toMatch(/verified 1/i);
    expect(brief.markdown).toMatch(/verified 1/i);
  });

  it("does not verify from Cloud rows that are not human_apply", () => {
    const storage = createMemoryClaimVerificationStorage();
    replaceClaimVerificationStamps(
      "org-te11",
      [
        {
          id: "TCV-inferred",
          dimension: "process",
          fingerprint: "process|EVD-cloud",
          verifiedAt: "2026-09-04T12:00:00.000Z",
          source: "inferred" as never,
        },
      ],
      storage,
    );
    expect(listClaimVerificationStamps("org-te11", storage)).toEqual([]);
    replaceClaimVerificationStamps(
      "org-te11",
      [
        {
          id: "TCV-no-time",
          dimension: "process",
          fingerprint: "process|EVD-cloud",
          verifiedAt: "",
          source: "human_apply",
        },
      ],
      storage,
    );
    expect(listClaimVerificationStamps("org-te11", storage)).toEqual([]);
    const observation = obs("TRO-cloud", { evidenceIds: ["EVD-cloud"] });
    const claim = composeTrustProofReport({
      observations: [observation],
    }).claims.find((row) => row.dimension === "process")!;
    const extras = mergeClaimVerificationStampsFromCloud(
      "org-te11",
      [
        {
          id: "TCV-human",
          dimension: "process",
          fingerprint: claim.verification.fingerprint,
          verifiedAt: "2026-09-04T12:00:00.000Z",
          source: "human_apply",
        },
      ],
      storage,
    );
    expect(extras).toEqual([]);
    expect(listClaimVerificationStamps("org-te11", storage)).toHaveLength(1);
    const after = composeTrustProofReport({
      observations: [observation],
      claimVerifications: listClaimVerificationStamps("org-te11", storage),
    });
    expect(
      after.claims.find((row) => row.dimension === "process")?.verification
        .status,
    ).toBe("verified");
    const unevidenced = composeTrustProofReport({
      observations: [obs("TRO-cloud")],
      claimVerifications: listClaimVerificationStamps("org-te11", storage),
    });
    expect(
      unevidenced.claims.find((row) => row.dimension === "process")
        ?.verification.status,
    ).toBe("unevidenced");
  });
});
