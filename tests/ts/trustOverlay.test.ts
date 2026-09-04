import { mockCommitments } from "@/data/mockCommitments";
import { mockEngagements, mockEvidence } from "@/data/mockEngagements";
import { mockIncidents } from "@/data/mockIncidents";
import { mockStakeholders } from "@/data/mock/stakeholders";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import { evidenceToFrappeDoc, incidentToFrappeDoc } from "@/lib/productCloud";
import { relationshipHealthFromLabels } from "@/lib/sentimentAnalysis";
import {
  engagementToFrappeDoc,
  stakeholderToFrappeDoc,
} from "@/lib/siCloud";
import {
  composeTrustSignals,
  evidenceSupportsTrustClaim,
  incidentPlaceKey,
  isTrustResponseBlank,
  listEvidenceSupportingTrustClaims,
  normalizeTrustResponse,
  omitTrustOverlayFlag,
  prepareTrustReportSummary,
  prepareTrustResponseHints,
  prepareTrustSensitiveDraft,
  prepareTrustTriageOverlay,
  promiseHealthFromCommitments,
  stakeholdersByKind,
  stakeholdersByPlace,
  trustPulseByPlace,
} from "@/lib/trust";
import { TRUST_OVERLAY_CLOUD_OMIT } from "@/types/trustOverlay";
import type { Engagement } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Stakeholder } from "@/types/stakeholder";

function assertNoOverlayKeys(doc: Record<string, unknown>) {
  for (const key of TRUST_OVERLAY_CLOUD_OMIT) {
    expect(doc).not.toHaveProperty(key);
  }
}

describe("TE-1 trust overlay — measurement", () => {
  it("keeps the incident trust index identical to the existing formula", () => {
    const canonical = trustIndexFromIncidents(mockIncidents);
    const snapshot = composeTrustSignals({ incidents: mockIncidents });
    expect(snapshot.incidentPulse).toEqual(canonical);
    expect(snapshot.relationshipHealth).toBeNull();
    expect(snapshot.promiseHealth).toBeNull();
  });

  it("omits SI slices for Solo even if arrays are passed", () => {
    const snapshot = composeTrustSignals({
      incidents: mockIncidents,
      engagements: mockEngagements,
      commitments: mockCommitments,
      includeRelationshipHealth: false,
      includePromiseHealth: false,
    });
    expect(snapshot.incidentPulse).toEqual(
      trustIndexFromIncidents(mockIncidents),
    );
    expect(snapshot.relationshipHealth).toBeNull();
    expect(snapshot.promiseHealth).toBeNull();
  });

  it("adds overlay-only relationship and promise health without changing the index", () => {
    const snapshot = composeTrustSignals({
      incidents: mockIncidents,
      engagements: mockEngagements,
      commitments: mockCommitments,
    });
    expect(snapshot.incidentPulse).toEqual(
      trustIndexFromIncidents(mockIncidents),
    );
    expect(snapshot.relationshipHealth).toEqual(
      relationshipHealthFromLabels(
        mockEngagements.map((row) => row.sentimentLabel ?? null),
        mockEngagements.map((row) => row.sentimentScore ?? null),
      ),
    );
    expect(snapshot.promiseHealth).toEqual(
      promiseHealthFromCommitments(mockCommitments),
    );
    expect(snapshot.promiseHealth?.fulfilled).toBeGreaterThan(0);
  });
});

describe("TE-1 trust overlay — response", () => {
  it("does not treat missing overlay as captured attitudes", () => {
    expect(isTrustResponseBlank(undefined)).toBe(true);
    expect(normalizeTrustResponse(undefined).willingnessToParticipate).toBe(
      "unknown",
    );
  });

  it("hints trust sentiment from note text without requiring a record write", () => {
    const hints = prepareTrustResponseHints(
      "Residents will attend the next meeting and thank the desk for progress.",
    );
    expect(hints.trustSentiment).toBe("positive");
    expect(hints.willingnessToParticipate).toBe("high");
  });
});

describe("TE-1 trust overlay — evidence", () => {
  it("leaves current evidence rows unsupported until annotated", () => {
    expect(mockEvidence.every((row) => !evidenceSupportsTrustClaim(row))).toBe(
      true,
    );
    expect(listEvidenceSupportingTrustClaims(mockEvidence)).toEqual([]);
  });

  it("filters only rows that opt into a trust claim", () => {
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
    expect(listEvidenceSupportingTrustClaims(annotated).map((r) => r.id)).toEqual(
      ["EVD-01"],
    );
    expect(annotated[0]?.classification).toBe(mockEvidence[0]?.classification);
    expect(annotated[0]?.isPrimary).toBe(mockEvidence[0]?.isPrimary);
  });
});

describe("TE-1 trust overlay — geography / segmentation", () => {
  it("groups incidents by existing ward labels without mutating rows", () => {
    const frozen: Incident[] = mockIncidents.map((row) => ({ ...row }));
    const before = frozen.map((row) => ({ ...row }));
    const segments = trustPulseByPlace(frozen);
    expect(frozen).toEqual(before);
    expect(segments.length).toBeGreaterThan(0);
    const ward12 = segments.find((s) => s.segmentKey.includes("Ward 12"));
    expect(ward12?.pulse).toEqual(
      trustIndexFromIncidents(
        frozen.filter((row) => incidentPlaceKey(row) === ward12?.segmentKey),
      ),
    );
  });

  it("groups stakeholders by existing kind and placeId", () => {
    const kinds = stakeholdersByKind(mockStakeholders);
    const places = stakeholdersByPlace(mockStakeholders);
    expect(kinds.some((g) => g.label === "community_group")).toBe(true);
    expect(places.some((g) => g.segmentKey.includes("za-ward-79800012"))).toBe(
      true,
    );
    const kindSum = kinds.reduce((n, g) => n + g.sampleSize, 0);
    expect(kindSum).toBe(mockStakeholders.length);
  });
});

describe("TE-1 trust overlay — Cloud mappers omit overlay keys", () => {
  it("does not post trustResponse or trustSupport to Frappe docs", () => {
    const incident: Incident = {
      ...mockIncidents[0]!,
      trustResponse: {
        trustSentiment: "negative",
        willingnessToParticipate: "low",
      },
    };
    const evidence = {
      ...mockEvidence[0]!,
      trustSupport: {
        supportsTrustClaim: true,
        claimKind: "identity" as const,
      },
    };
    const engagement: Engagement = {
      ...mockEngagements[0]!,
      trustResponse: { confidenceInProcess: "low" },
    };
    const stakeholder: Stakeholder = {
      ...mockStakeholders[0]!,
      trustResponse: { confidenceInImplementer: "high" },
    };

    assertNoOverlayKeys(incidentToFrappeDoc(incident, "CUST-1", "org-1"));
    assertNoOverlayKeys(evidenceToFrappeDoc(evidence, "CUST-1", "org-1"));
    assertNoOverlayKeys(engagementToFrappeDoc(engagement, "CUST-1", "org-1"));
    assertNoOverlayKeys(stakeholderToFrappeDoc(stakeholder, "CUST-1", "org-1"));
  });
});

describe("TE-1 trust overlay — AI helpers", () => {
  it("strips includeTrustOverlay from Cloud-bound payloads", () => {
    const payload = omitTrustOverlayFlag({
      description: "Burst pipe",
      ward: "Ward 12",
      includeTrustOverlay: true,
    });
    expect(payload).toEqual({ description: "Burst pipe", ward: "Ward 12" });
    expect(payload).not.toHaveProperty("includeTrustOverlay");
  });

  it("does not rewrite draft text when preparing a trust-sensitive overlay", () => {
    const overlay = prepareTrustSensitiveDraft({
      audience: "community",
      description: "Community unrest and protest at the clinic road",
    });
    expect(overlay.trustSensitive).toBe(true);
    expect(overlay.notes.length).toBeGreaterThan(0);
  });

  it("keeps report brief overlay from changing cited ids", () => {
    const overlay = prepareTrustReportSummary({
      citedIncidentIds: ["INC-1001", "INC-1004"],
      keyRisks: ["risk a"],
    });
    expect(overlay.citedCaseCount).toBe(2);
    expect(overlay.headline).toContain("unchanged");
  });

  it("classifies social-licence triage overlay without replacing category logic", () => {
    const high = prepareTrustTriageOverlay({
      description:
        "Residents threaten protest and boycott after a broken promise",
      ward: "Ward 12",
    });
    const low = prepareTrustTriageOverlay({
      description: "Request for a copy of the meeting minutes",
    });
    expect(high.socialLicenceRisk).toBe("high");
    expect(low.socialLicenceRisk).toBe("low");
  });
});
