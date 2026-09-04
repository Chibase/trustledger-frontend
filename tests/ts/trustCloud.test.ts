import { createTrustCommunityContext } from "@/lib/trust/communityContext";
import { createTrustObservation } from "@/lib/trust/observation";
import { createTrustParticipation } from "@/lib/trust/participation";
import { TRUST_DOCTYPE_NAMES, trustDocTypePayload } from "@/lib/frappeTrustDocTypes";
import {
  communityToFrappeDoc,
  frappeToCommunity,
  frappeToObservation,
  frappeToParticipation,
  frappeToVerification,
  isPersistableClaimVerificationStamp,
  observationToFrappeDoc,
  participationToFrappeDoc,
  verificationToFrappeDoc,
} from "@/lib/trustCloud";
import type { TrustClaimVerificationStamp } from "@/lib/trust/claimVerification";

describe("TE-7 trust Cloud mappers", () => {
  it("does not copy SRM sentiment fields onto observations", () => {
    const row = createTrustObservation({
      id: "TRO-1",
      observedAt: "2026-09-04T12:00:00.000Z",
      dimension: "process",
      signal: "negative",
      signalScore: -40,
      source: "engagement",
      evidenceIds: ["EVD-1"],
    });
    const doc = observationToFrappeDoc(row, "Acme Customer", "org-1");
    expect(doc.customer).toBe("Acme Customer");
    expect(doc.observation_code).toBe("TRO-1");
    expect(doc.signal).toBe("negative");
    expect(doc.signal_score).toBe(-40);
    expect(doc).not.toHaveProperty("sentiment_label");
    expect(doc).not.toHaveProperty("sentiment_score");
    expect(doc).not.toHaveProperty("trustResponse");
    const back = frappeToObservation(doc);
    expect(back?.id).toBe("TRO-1");
    expect(back?.dimension).toBe("process");
    expect(back?.signal).toBe("negative");
    expect(back?.evidenceIds).toEqual(["EVD-1"]);
  });

  it("maps stored intentions alias to concerns_acted_upon", () => {
    const back = frappeToObservation({
      observation_code: "TRO-2",
      dimension: "intentions",
      signal: "positive",
      source: "derived",
      customer: "Acme Customer",
    });
    expect(back?.dimension).toBe("concerns_acted_upon");
  });

  it("does not infer attendance as consent from a Check 0", () => {
    const row = createTrustParticipation({
      id: "TRP-1",
      source: "engagement",
      willingnessToParticipate: "high",
      willingnessToContribute: "medium",
      trustDriven: true,
      attendanceDoesNotEqualConsent: true,
      motivation: "mixed",
    });
    const doc = participationToFrappeDoc(row, "Acme Customer");
    expect(doc.trust_driven).toBe("yes");
    expect(doc.attendance_does_not_equal_consent).toBe(1);
    expect(doc.motivation).toBe("mixed");
    const unset = frappeToParticipation({
      ...doc,
      attendance_does_not_equal_consent: 0,
    });
    expect(unset?.attendanceDoesNotEqualConsent).toBeUndefined();
    expect(frappeToParticipation(doc)?.attendanceDoesNotEqualConsent).toBe(true);
  });

  it("round-trips community context without overlay keys", () => {
    const row = createTrustCommunityContext({
      id: "TRC-1",
      placeLabel: "Ward 12",
      historyNotes: "Previous contractor left.",
      oralSource: true,
      barrierTags: ["distance"],
    });
    const doc = communityToFrappeDoc(row, "Acme Customer");
    expect(doc).not.toHaveProperty("trustResponse");
    expect(doc.oral_source).toBe(1);
    const back = frappeToCommunity(doc);
    expect(back?.placeLabel).toBe("Ward 12");
    expect(back?.oralSource).toBe(true);
    expect(back?.barrierTags).toEqual(["distance"]);
  });

  it("requires customer on each trust DocType payload and omits sentiment columns", () => {
    expect([...TRUST_DOCTYPE_NAMES]).toEqual([
      "TL Trust Observation",
      "TL Trust Participation",
      "TL Trust Community Context",
      "TL Trust Claim Verification",
    ]);
    for (const name of TRUST_DOCTYPE_NAMES) {
      const payload = trustDocTypePayload(name);
      const fields = payload.fields as Array<{ fieldname: string; reqd?: number }>;
      expect(fields.some((f) => f.fieldname === "customer" && f.reqd === 1)).toBe(
        true,
      );
      expect(fields.some((f) => f.fieldname === "sentiment_label")).toBe(false);
      expect(fields.some((f) => f.fieldname === "sentiment_score")).toBe(false);
      expect(fields.some((f) => f.fieldname === "trustResponse")).toBe(false);
    }
  });

  it("round-trips a human-apply verification stamp without inferring from evidence", () => {
    const stamp: TrustClaimVerificationStamp = {
      id: "TCV-1",
      dimension: "process",
      fingerprint: "process|EVD-1|TRO-1",
      verifiedAt: "2026-09-04T12:00:00.000Z",
      source: "human_apply",
    };
    const doc = verificationToFrappeDoc(stamp, "Acme Customer", "org-1");
    expect(doc.customer).toBe("Acme Customer");
    expect(doc.verification_code).toBe("TCV-1");
    expect(doc.fingerprint).toBe("process|EVD-1|TRO-1");
    expect(doc.source).toBe("human_apply");
    expect(doc).not.toHaveProperty("sentiment_label");
    expect(doc).not.toHaveProperty("sentiment_score");
    expect(doc).not.toHaveProperty("trustResponse");
    expect(doc).not.toHaveProperty("signal");
    const back = frappeToVerification(doc);
    expect(back).toEqual(stamp);
    expect(isPersistableClaimVerificationStamp(back)).toBe(true);
  });

  it("does not treat inferred or empty Cloud verification rows as stamps", () => {
    expect(
      frappeToVerification({
        verification_code: "TCV-inferred",
        dimension: "process",
        fingerprint: "process|EVD-1",
        source: "inferred",
        customer: "Acme Customer",
      }),
    ).toBeNull();
    expect(
      frappeToVerification({
        verification_code: "TCV-empty",
        dimension: "process",
        fingerprint: "",
        source: "human_apply",
        customer: "Acme Customer",
      }),
    ).toBeNull();
    expect(
      frappeToVerification({
        verification_code: "TCV-no-time",
        dimension: "process",
        fingerprint: "process|EVD-1",
        source: "human_apply",
        verified_at: "",
        customer: "Acme Customer",
      }),
    ).toBeNull();
    expect(
      isPersistableClaimVerificationStamp({
        id: "TCV-no-time",
        dimension: "process",
        fingerprint: "process|EVD-1",
        source: "human_apply",
      }),
    ).toBe(false);
    expect(
      isPersistableClaimVerificationStamp({
        id: "TCV-bad",
        dimension: "process",
        fingerprint: "process|EVD-1",
        verifiedAt: "2026-09-04T12:00:00.000Z",
        source: "inferred" as TrustClaimVerificationStamp["source"],
      }),
    ).toBe(false);
  });

  it("limits claim-verification source options to human_apply", () => {
    const payload = trustDocTypePayload("TL Trust Claim Verification");
    const fields = payload.fields as Array<{
      fieldname: string;
      options?: string;
      reqd?: number;
    }>;
    const source = fields.find((f) => f.fieldname === "source");
    expect(source?.options).toBe("human_apply");
    expect(source?.reqd).toBe(1);
    expect(payload.autoname).toBe("field:verification_code");
  });
});
