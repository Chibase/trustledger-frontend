import {
  applyEngagementToTrustLayer,
  createMemoryTrustLayerStorage,
  EMPTY_FIELD_META,
  fieldNoteHasParticipationExtras,
  fieldNoteToParticipationDraft,
  getTrustLayerBucket,
  motivationDoesNotInflateWeakParticipation,
} from "@/lib/trust";
import type { Engagement } from "@/types/engagement";

function sampleEngagement(partial: Partial<Engagement> = {}): Engagement {
  return {
    id: "ENG-TE8-1",
    title: "Ward imbizo",
    kind: "meeting",
    status: "held",
    heldOn: "2026-09-01",
    ward: "Ward 12",
    placeLabel: "Ward 12",
    projectId: "PRJ-1",
    summary: "Community meeting notes. Residents said they will take part.",
    attendeesLabel: "Ward committee",
    actionItems: [],
    stakeholderIds: ["STK-1"],
    source: "minutes",
    createdAt: "2026-09-01T10:00:00.000Z",
    ...partial,
  };
}

describe("TE-8 engagement apply → trust layer", () => {
  it("writes participation keyed to the engagement id, not a capture id", async () => {
    const storage = createMemoryTrustLayerStorage();
    const engagement = sampleEngagement();
    const result = await applyEngagementToTrustLayer({
      engagement,
      fieldMeta: {
        ...EMPTY_FIELD_META,
        motivation: "mixed",
        attendanceDoesNotEqualConsent: true,
      },
      orgId: "org-te8",
      storage,
    });
    expect(result.wrote).toBe(true);
    const bucket = getTrustLayerBucket("org-te8", storage);
    expect(bucket.participation).toHaveLength(1);
    expect(bucket.participation[0]?.source).toBe("engagement");
    expect(bucket.participation[0]?.sourceId).toBe(engagement.id);
    expect(bucket.participation[0]?.sourceId).not.toMatch(/^CAP-/);
    expect(bucket.participation[0]?.attendanceDoesNotEqualConsent).toBe(true);
  });

  it("upserts the same engagement instead of appending a second row", async () => {
    const storage = createMemoryTrustLayerStorage();
    const engagement = sampleEngagement();
    await applyEngagementToTrustLayer({
      engagement,
      fieldMeta: { ...EMPTY_FIELD_META, motivation: "obligation" },
      orgId: "org-te8-upsert",
      storage,
    });
    await applyEngagementToTrustLayer({
      engagement,
      fieldMeta: { ...EMPTY_FIELD_META, motivation: "livelihood" },
      orgId: "org-te8-upsert",
      storage,
    });
    const bucket = getTrustLayerBucket("org-te8-upsert", storage);
    expect(bucket.participation).toHaveLength(1);
    expect(bucket.participation[0]?.sourceId).toBe(engagement.id);
    expect(bucket.participation[0]?.motivation).toBe("livelihood");
  });

  it("writes overlay observations and ignores SRM sentiment", async () => {
    const storage = createMemoryTrustLayerStorage();
    const engagement = sampleEngagement({
      sentimentLabel: "positive",
      sentimentScore: 0.9,
      sentimentRationale: "Upbeat minutes",
    });
    const sentimentOnly = await applyEngagementToTrustLayer({
      engagement,
      orgId: "org-te8-sent",
      storage,
    });
    expect(sentimentOnly.observationCount).toBe(0);
    expect(getTrustLayerBucket("org-te8-sent", storage).observations).toHaveLength(
      0,
    );

    const withOverlay = await applyEngagementToTrustLayer({
      engagement,
      overlay: {
        confidenceInProcess: "high",
        willingnessToParticipate: "high",
        capturedAt: "2026-09-01T12:00:00.000Z",
      },
      orgId: "org-te8-sent",
      storage,
    });
    expect(withOverlay.observationCount).toBeGreaterThan(0);
    const bucket = getTrustLayerBucket("org-te8-sent", storage);
    expect(
      bucket.observations.every(
        (row) => row.source === "engagement" && row.sourceId === engagement.id,
      ),
    ).toBe(true);
    expect(
      bucket.observations.some((row) => row.dimension === "process"),
    ).toBe(true);
    expect(
      bucket.observations.every((row) => !String(row.note || "").includes("sentiment")),
    ).toBe(true);
    expect(bucket.participation[0]?.willingnessToParticipate).toBe("high");
  });

  it("does not treat mixed motive as weak participation or as consent", async () => {
    const storage = createMemoryTrustLayerStorage();
    const engagement = sampleEngagement();
    await applyEngagementToTrustLayer({
      engagement,
      fieldMeta: {
        ...EMPTY_FIELD_META,
        motivation: "mixed",
        presenceMode: "in_person",
        attendanceDoesNotEqualConsent: true,
      },
      orgId: "org-te8-mixed",
      storage,
    });
    const row = getTrustLayerBucket("org-te8-mixed", storage).participation[0];
    expect(row?.motivation).toBe("mixed");
    expect(row?.trustDriven).not.toBe(false);
    expect(row?.willingnessToParticipate).not.toBe("low");
    expect(motivationDoesNotInflateWeakParticipation(row!)).toBe(true);
    expect(row?.attendanceDoesNotEqualConsent).toBe(true);
  });

  it("does not infer attendanceDoesNotEqualConsent as false", async () => {
    const storage = createMemoryTrustLayerStorage();
    await applyEngagementToTrustLayer({
      engagement: sampleEngagement(),
      fieldMeta: {
        ...EMPTY_FIELD_META,
        attendanceDoesNotEqualConsent: false,
      },
      orgId: "org-te8-consent",
      storage,
    });
    const row = getTrustLayerBucket("org-te8-consent", storage).participation[0];
    expect(row?.attendanceDoesNotEqualConsent).toBeUndefined();
  });

  it("keeps field willingness when the overlay is blank", async () => {
    const storage = createMemoryTrustLayerStorage();
    const meta = {
      ...EMPTY_FIELD_META,
      willingnessToParticipate: "high",
      willingnessToContribute: "medium",
    };
    expect(fieldNoteHasParticipationExtras(meta)).toBe(true);
    expect(fieldNoteToParticipationDraft(meta)?.willingnessToParticipate).toBe(
      "high",
    );
    await applyEngagementToTrustLayer({
      engagement: sampleEngagement(),
      fieldMeta: meta,
      orgId: "org-te8-will",
      storage,
    });
    const row = getTrustLayerBucket("org-te8-will", storage).participation[0];
    expect(row?.willingnessToParticipate).toBe("high");
    expect(row?.willingnessToContribute).toBe("medium");
  });

  it("does not write when orgId is missing", async () => {
    const storage = createMemoryTrustLayerStorage();
    const result = await applyEngagementToTrustLayer({
      engagement: sampleEngagement(),
      orgId: null,
      storage,
    });
    expect(result.wrote).toBe(false);
    expect(result.observationCount).toBe(0);
  });
});
