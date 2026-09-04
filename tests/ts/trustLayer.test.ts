import { mockCommitments } from "@/data/mockCommitments";
import { mockEngagements, mockEvidence } from "@/data/mockEngagements";
import { mockIncidents } from "@/data/mockIncidents";
import { mockStakeholders } from "@/data/mock/stakeholders";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import {
  allTrustDimensions,
  classifyTrustDimension,
  communityContextFromIncident,
  composeTrustSignals,
  createMemoryTrustLayerStorage,
  createTrustObservation,
  deriveTrustLayer,
  getTrustLayerBucket,
  mergeTrustLayerRows,
  participationLooksTrustDriven,
} from "@/lib/trust";
import { TRUST_LAYER_STORAGE_KEY } from "@/types/trustLayer";
import type { Incident } from "@/types/incident";

describe("TE-2 trust-native layer — dimensions", () => {
  it("exposes the five locked trust dimensions", () => {
    expect(allTrustDimensions()).toEqual([
      "project",
      "implementing_entity",
      "process",
      "people",
      "intentions",
    ]);
  });
});

describe("TE-2 trust-native layer — observations and status", () => {
  it("classifies level and trend with an explainable rationale", () => {
    const rows = [
      createTrustObservation({
        id: "TRO-a",
        observedAt: "2026-07-01T00:00:00Z",
        dimension: "process",
        signal: "negative",
        source: "derived",
      }),
      createTrustObservation({
        id: "TRO-b",
        observedAt: "2026-08-01T00:00:00Z",
        dimension: "process",
        signal: "positive",
        source: "derived",
      }),
      createTrustObservation({
        id: "TRO-c",
        observedAt: "2026-09-01T00:00:00Z",
        dimension: "process",
        signal: "positive",
        source: "derived",
      }),
      createTrustObservation({
        id: "TRO-d",
        observedAt: "2026-09-15T00:00:00Z",
        dimension: "process",
        signal: "positive",
        source: "derived",
      }),
    ];
    const status = classifyTrustDimension("process", rows);
    expect(status.level).toBe("strong");
    expect(status.trend).toBe("improving");
    expect(status.sampleSize).toBe(4);
    expect(status.rationale).toContain("strong ≥ 0.34");
  });

  it("stays unknown when there are no scored signals", () => {
    const status = classifyTrustDimension("intentions", []);
    expect(status.level).toBe("unknown");
    expect(status.trend).toBe("unknown");
    expect(status.sampleSize).toBe(0);
  });
});

describe("TE-2 trust-native layer — participation", () => {
  it("marks high willingness plus high confidence as trust-driven", () => {
    expect(participationLooksTrustDriven("high", "high", "unknown")).toBe(true);
    expect(participationLooksTrustDriven("high", "low", "unknown")).toBe(false);
    expect(participationLooksTrustDriven("unknown", "unknown", "unknown")).toBe(
      "unknown",
    );
  });
});

describe("TE-2 trust-native layer — derive from SRM without mutation", () => {
  it("does not mutate incidents, engagements, or evidence", () => {
    const incidents: Incident[] = mockIncidents.map((row) => ({ ...row }));
    const snapshot = JSON.stringify(incidents);
    const derived = deriveTrustLayer({
      incidents,
      engagements: mockEngagements,
      commitments: mockCommitments,
      evidence: mockEvidence,
      stakeholders: mockStakeholders,
    });
    expect(JSON.stringify(incidents)).toBe(snapshot);
    expect(derived.observations.length).toBeGreaterThan(0);
    expect(derived.community.length).toBeGreaterThan(0);
    expect(
      derived.observations.every((row) => row.layer === "trust"),
    ).toBe(true);
  });

  it("leaves the existing Trust pulse formula unchanged", () => {
    const before = trustIndexFromIncidents(mockIncidents);
    deriveTrustLayer({ incidents: mockIncidents });
    expect(trustIndexFromIncidents(mockIncidents)).toEqual(before);
    expect(composeTrustSignals({ incidents: mockIncidents }).incidentPulse).toEqual(
      before,
    );
  });

  it("links evidence trustSupport into observations when opted in", () => {
    const annotated = mockEvidence.map((row, i) =>
      i === 0
        ? {
            ...row,
            trustSupport: {
              supportsTrustClaim: true,
              claimKind: "repair_complete" as const,
            },
          }
        : row,
    );
    const derived = deriveTrustLayer({ evidence: annotated });
    expect(derived.observations.some((row) => row.sourceId === "EVD-01")).toBe(
      true,
    );
    expect(deriveTrustLayer({ evidence: mockEvidence }).observations).toEqual([]);
  });

  it("copies community place fields from the case without renaming geo", () => {
    const incident = mockIncidents[0]!;
    const ctx = communityContextFromIncident(incident, "TRC-test");
    expect(ctx.layer).toBe("trust");
    expect(ctx.ward).toBe(incident.ward);
    expect(ctx.projectId).toBe(incident.projectId);
  });
});

describe("TE-2 trust-native layer — parallel store", () => {
  it("persists under tl-trust-layer and does not write tl-org-data", () => {
    const storage = createMemoryTrustLayerStorage();
    const derived = deriveTrustLayer({
      incidents: mockIncidents,
      commitments: mockCommitments,
    });
    const saved = mergeTrustLayerRows("org-test", derived, storage);
    expect(saved.observations.length).toBe(derived.observations.length);
    expect(storage.getItem(TRUST_LAYER_STORAGE_KEY)).toContain("org-test");
    expect(storage.getItem("tl-org-data")).toBeNull();

    const again = mergeTrustLayerRows("org-test", derived, storage);
    expect(again.observations.length).toBe(saved.observations.length);
    expect(getTrustLayerBucket("org-test", storage).orgId).toBe("org-test");
  });
});
