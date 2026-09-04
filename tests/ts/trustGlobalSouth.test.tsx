/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockProjects } from "@/data/mockProjects";
import { mockStakeholders } from "@/data/mock/stakeholders";
import { CaptureFieldNoteMeta } from "@/components/capture/CaptureFieldNoteMeta";
import { CommunityProfilesPanel } from "@/components/trust/CommunityProfilesPanel";
import {
  attendanceIsNotConsent,
  authorityRoleFromStakeholder,
  buildCommunityProfiles,
  collectTrustAlerts,
  composeLanguageSupport,
  composeTrustIntelligence,
  composeTrustProofReport,
  createMemoryTrustLayerStorage,
  createTrustCommunityContext,
  createTrustObservation,
  createTrustParticipation,
  EMPTY_FIELD_META,
  emptyTrustLayerBucket,
  emptyTrustNarrativeCapture,
  fieldNoteHasContextExtras,
  fieldNoteMetaPreamble,
  fieldNoteToCommunityDraft,
  fieldNoteToParticipationDraft,
  getTrustLayerBucket,
  mixedMotivationDoesNotEqualTrust,
  motivationDoesNotInflateWeakParticipation,
  narrativeNeedsTranslation,
  normalizeBarrierTags,
  normalizeTrustCommunityContext,
  normalizeTrustObservation,
  normalizeTrustParticipation,
  participationLooksTrustDriven,
  persistFieldCaptureToTrustLayer,
  readFieldCaptureDraft,
  saveFieldCaptureDraft,
  saveTrustLayerBucket,
  summarizeCommunityContextForIntel,
} from "@/lib/trust";
import { aiService } from "@/services/aiService";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("TE-5 Global South — community context", () => {
  it("round-trips optional context fields without requiring a global template", () => {
    const created = createTrustCommunityContext({
      id: "TRC-gs-1",
      placeLabel: "Ward 12",
      notes: "Clinic road still unfinished after two seasons.",
      historyNotes: "Previous contractor left without a close-out imbizo.",
      powerStructureNotes: "Traditional council and ward committee both sit.",
      sensitivityNotes: "Do not name households in public minutes.",
      barriers: "Airtime and distance from the hall.",
      barrierTags: ["connectivity", "distance"],
      workingLanguage: "isiXhosa",
      narrativeLanguage: "isiXhosa",
      oralSource: true,
    });
    expect(created.barrierTags).toEqual(["connectivity", "distance"]);
    expect(
      normalizeBarrierTags(["connectivity", "distance", "not-a-real-tag"]),
    ).toEqual(["connectivity", "distance"]);
    expect(created.workingLanguage).toBe("isiXhosa");
    const normalized = normalizeTrustCommunityContext(created);
    expect(normalized?.historyNotes).toBe(created.historyNotes);
    expect(normalized?.powerStructureNotes).toBe(created.powerStructureNotes);
    expect(normalized?.oralSource).toBe(true);

    const storage = createMemoryTrustLayerStorage();
    saveTrustLayerBucket(
      {
        ...emptyTrustLayerBucket("org-gs"),
        community: [created],
      },
      storage,
    );
    const loaded = getTrustLayerBucket("org-gs", storage);
    expect(loaded.community[0]?.sensitivityNotes).toBe(
      "Do not name households in public minutes.",
    );
    expect(loaded.community[0]?.barrierTags).toEqual([
      "connectivity",
      "distance",
    ]);
  });

  it("does not treat generic derived case notes as intel hints", () => {
    const derived = createTrustCommunityContext({
      id: "TRC-derived",
      notes: "Derived from case INC-1001 — parallel context only.",
      placeLabel: "Ward 12",
    });
    expect(summarizeCommunityContextForIntel([derived])).toEqual([]);
  });
});

describe("TE-5 Global South — authority", () => {
  it("maps existing kinds and tags without using influence as a proxy", () => {
    const byId = Object.fromEntries(mockStakeholders.map((row) => [row.id, row]));
    expect(authorityRoleFromStakeholder(byId["STK-1004"])).toBe(
      "traditional_authority",
    );
    expect(authorityRoleFromStakeholder(byId["STK-1003"])).toBe(
      "institutional_actor",
    );
    expect(authorityRoleFromStakeholder(byId["STK-1002"])).toBe("ward_structure");
    expect(authorityRoleFromStakeholder(byId["STK-1001"])).toBe("ward_structure");
    expect(
      authorityRoleFromStakeholder({
        kind: "individual",
        tags: [],
        influence: "high",
      }),
    ).toBe("unknown");
    expect(
      authorityRoleFromStakeholder({
        kind: "individual",
        tags: ["influencer"],
        influence: "low",
      }),
    ).toBe("informal_influencer");
    expect(
      authorityRoleFromStakeholder({
        kind: "community_group",
        tags: [],
        influence: "medium",
      }),
    ).toBe("community_leader");
    expect(
      authorityRoleFromStakeholder({
        kind: "funder",
        tags: [],
        influence: "high",
      }),
    ).toBe("institutional_actor");
  });
});

describe("TE-5 Global South — language readiness", () => {
  it("does not default working language to English", () => {
    const empty = emptyTrustNarrativeCapture();
    expect(empty.spokenLanguage).toBeUndefined();
    expect(empty.workingLanguage).toBeUndefined();
    expect(empty.translationStatus).toBe("unknown");
    expect(narrativeNeedsTranslation(empty)).toBe(false);
  });

  it("flags oral and cross-language notes as needing translation", () => {
    expect(
      narrativeNeedsTranslation({
        spokenLanguage: "isiZulu",
        workingLanguage: "English",
        translationStatus: "untranslated",
        oralSource: true,
      }),
    ).toBe(true);
    expect(
      narrativeNeedsTranslation({
        spokenLanguage: "isiZulu",
        workingLanguage: "isiZulu",
        translationStatus: "community_checked",
        oralSource: false,
      }),
    ).toBe(false);
  });
});

describe("TE-5 Global South — participation realism", () => {
  it("does not let mixed motivation flip the existing trustDriven formula", () => {
    expect(participationLooksTrustDriven("high", "high", "unknown")).toBe(true);
    const mixedHigh = createTrustParticipation({
      id: "TRP-mixed-high",
      source: "engagement",
      willingnessToParticipate: "high",
      confidenceInProcess: "high",
      motivation: "mixed",
    });
    expect(mixedHigh.trustDriven).toBe(true);
    expect(mixedMotivationDoesNotEqualTrust("mixed")).toBe(true);
    expect(
      motivationDoesNotInflateWeakParticipation({
        motivation: "mixed",
        willingnessToParticipate: "high",
      }),
    ).toBe(true);

    const mixedUnknown = createTrustParticipation({
      id: "TRP-mixed-unknown",
      source: "engagement",
      motivation: "mixed",
      presenceMode: "household_rep",
      attendanceDoesNotEqualConsent: true,
      responsePattern: "quiet_presence",
    });
    expect(mixedUnknown.trustDriven).toBe("unknown");
    expect(mixedUnknown.willingnessToParticipate).toBe("unknown");
    expect(attendanceIsNotConsent(mixedUnknown)).toBe(true);

    const proof = composeTrustProofReport({
      observations: [
        createTrustObservation({
          id: "TRO-gs-1",
          observedAt: "2026-01-01T00:00:00Z",
          dimension: "process",
          signal: "neutral",
          source: "engagement",
        }),
      ],
      participation: [mixedUnknown],
    });
    const alerts = collectTrustAlerts({ proof });
    expect(alerts.some((row) => row.kind === "weak_participation")).toBe(false);

    const brief = composeTrustIntelligence({
      observations: proof.history.length
        ? [
            createTrustObservation({
              id: "TRO-gs-1",
              observedAt: "2026-01-01T00:00:00Z",
              dimension: "process",
              signal: "neutral",
              source: "engagement",
            }),
          ]
        : [],
      participation: [mixedUnknown],
    });
    expect(brief.alerts.some((row) => row.kind === "weak_participation")).toBe(
      false,
    );
    expect(brief.advisory.supportNotes.join(" ")).toMatch(/mixed/i);
  });

  it("round-trips participation extras through the parallel store", () => {
    const row = createTrustParticipation({
      id: "TRP-gs-store",
      source: "engagement",
      motivation: "livelihood",
      presenceMode: "proxy",
      responsePattern: "walkout",
      attendanceDoesNotEqualConsent: true,
    });
    expect(normalizeTrustParticipation(row)?.presenceMode).toBe("proxy");
    const storage = createMemoryTrustLayerStorage();
    saveTrustLayerBucket(
      { ...emptyTrustLayerBucket("org-part"), participation: [row] },
      storage,
    );
    expect(getTrustLayerBucket("org-part", storage).participation[0]?.motivation).toBe(
      "livelihood",
    );
  });
});

describe("TE-5 Global South — field capture", () => {
  it("includes oral and language lines in the notes preamble", () => {
    const preamble = fieldNoteMetaPreamble({
      ...EMPTY_FIELD_META,
      place: "Ward 12",
      oralCapture: true,
      spokenLanguage: "isiZulu",
      workingLanguage: "English",
      rapidCapture: true,
      lowConnectivity: true,
      barriers: "Distance from the hall",
    });
    expect(preamble).toContain("Source: oral");
    expect(preamble).toContain("Spoken language: isiZulu");
    expect(preamble).toContain("Working language: English");
    expect(preamble).toContain("low connectivity");
    expect(preamble).toContain("Trust barriers: Distance from the hall");
    expect(preamble).toContain("rapid / notes-first");
  });

  it("keeps the previous preamble shape when extras are blank", () => {
    const preamble = fieldNoteMetaPreamble({
      ...EMPTY_FIELD_META,
      meetingHeldOn: "2026-09-01",
      place: "Ward 12",
    });
    expect(preamble).toBe(
      "Date of meeting: 2026-09-01\nPlace / ward: Ward 12\n\n",
    );
  });

  it("does not leak the Other-place sentinel into captured notes", () => {
    const preamble = fieldNoteMetaPreamble({
      ...EMPTY_FIELD_META,
      place: "__other",
      localContextNotes: "Clinic hall, unnamed village.",
    });
    expect(preamble).not.toContain("__other");
    expect(preamble).toContain("Local context: Clinic hall, unnamed village.");
    expect(preamble).not.toContain("Place / ward:");
  });

  it("builds a community draft without writing the trust-layer store", () => {
    const storage = createMemoryTrustLayerStorage();
    const draft = fieldNoteToCommunityDraft(
      {
        ...EMPTY_FIELD_META,
        place: "Ward 12",
        oralCapture: true,
        spokenLanguage: "Sesotho",
        historyNotes: "Relocation in 2019 still unresolved.",
        socialSensitivityNotes: "Funeral on Thursday.",
        powerStructureNotes: "Kgosi and ward councillor both expected.",
        barriers: "low connectivity",
      },
      { projectId: "PRJ-001" },
    );
    expect(draft.oralSource).toBe(true);
    expect(draft.historyNotes).toContain("Relocation");
    expect(draft.barrierTags).toContain("connectivity");
    expect(getTrustLayerBucket("org-draft", storage).community).toEqual([]);
    expect(fieldNoteToParticipationDraft(EMPTY_FIELD_META)).toBeNull();
  });

  it("keeps existing capture dropdowns and hides extras behind optional details", async () => {
    const user = userEvent.setup();
    const project = mockProjects[0];
    render(
      <CaptureFieldNoteMeta
        project={project}
        meta={EMPTY_FIELD_META}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByLabelText("Place / ward")).toBeInTheDocument();
    expect(screen.getByLabelText("Engagement kind")).toBeInTheDocument();
    const extras = screen.getByText("Field context (optional)").closest("details");
    expect(extras).not.toHaveAttribute("open");
    await user.click(screen.getByText("Field context (optional)"));
    expect(extras).toHaveAttribute("open");
    expect(
      screen.getByLabelText("Spoken / community language"),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /rapid capture/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /oral source/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /low connectivity/i })).toBeInTheDocument();
  });
});

describe("TE-5 Global South — observation extras", () => {
  it("persists oral / language flags on observations", () => {
    const row = createTrustObservation({
      id: "TRO-oral",
      dimension: "people",
      signal: "neutral",
      source: "engagement",
      oralSource: true,
      narrativeLanguage: "isiXhosa",
      translationStatus: "untranslated",
    });
    const normalized = normalizeTrustObservation(row);
    expect(normalized?.oralSource).toBe(true);
    expect(normalized?.narrativeLanguage).toBe("isiXhosa");
    expect(normalized?.translationStatus).toBe("untranslated");
  });
});

describe("TE-5b community profiles and language support", () => {
  it("persists field extras onto the trust layer on apply and upserts the same place", () => {
    const storage = createMemoryTrustLayerStorage();
    const meta = {
      ...EMPTY_FIELD_META,
      place: "Ward 12",
      historyNotes: "Previous contractor left without a close-out imbizo.",
      powerStructureNotes: "Traditional council and ward committee both sit.",
      spokenLanguage: "isiXhosa",
      oralCapture: true,
      attendanceDoesNotEqualConsent: true,
      motivation: "mixed",
    };
    expect(fieldNoteHasContextExtras(meta)).toBe(true);
    expect(
      persistFieldCaptureToTrustLayer(
        meta,
        { projectId: "PRJ-1", sourceId: "CAP-1" },
        "org-gs-apply",
        storage,
      ),
    ).toBe(true);
    persistFieldCaptureToTrustLayer(
      {
        ...meta,
        historyNotes: "Updated history after the second imbizo.",
      },
      { projectId: "PRJ-1", sourceId: "CAP-2" },
      "org-gs-apply",
      storage,
    );
    const bucket = getTrustLayerBucket("org-gs-apply", storage);
    expect(bucket.community).toHaveLength(1);
    expect(bucket.community[0]?.historyNotes).toContain("Updated history");
    expect(bucket.participation).toHaveLength(2);
    const profiles = buildCommunityProfiles(
      bucket.community,
      bucket.participation,
    );
    expect(profiles[0]?.label).toBe("Ward 12");
    expect(profiles[0]?.participationHints.join(" ")).toMatch(/not equal to consent/i);
  });

  it("skips derived-from-case shells in community profiles", () => {
    const derived = createTrustCommunityContext({
      notes: "Derived from case INC-1 — parallel context only.",
      ward: "Ward 4",
    });
    expect(buildCommunityProfiles([derived])).toEqual([]);
  });

  it("records language support without inventing a translation", async () => {
    const unknown = composeLanguageSupport({});
    expect(unknown.languageDetected).toBe("unknown");
    expect(unknown.translated).toBe(false);

    const xhosa = composeLanguageSupport({
      preferredLanguage: "isiXhosa",
      oralSource: true,
    });
    expect(xhosa.needsTranslation).toBe(true);
    expect(xhosa.note).toMatch(/does not machine-translate/i);

    const suggestion = await aiService.suggestTriage({
      description: "The pipeline burst next to the clinic.",
      preferredLanguage: "isiXhosa",
    });
    expect(suggestion.languageDetected).toBe("isiXhosa");
    expect(suggestion.translatedDescription).toBeUndefined();
    expect(suggestion.languageSupport?.translated).toBe(false);
  });

  it("round-trips a low-connectivity field draft in local storage", () => {
    window.localStorage.clear();
    saveFieldCaptureDraft({
      orgId: "org-draft",
      projectId: "PRJ-1",
      source: "minutes",
      title: "Ward imbizo",
      body: "Spoken notes.",
      meta: { ...EMPTY_FIELD_META, lowConnectivity: true, oralCapture: true },
    });
    const loaded = readFieldCaptureDraft("org-draft", "PRJ-1", "minutes");
    expect(loaded?.title).toBe("Ward imbizo");
    expect(loaded?.meta.lowConnectivity).toBe(true);
    expect(loaded?.meta.oralCapture).toBe(true);
  });

  it("renders community profile empty state with a capture shortcut", () => {
    window.localStorage.clear();
    render(<CommunityProfilesPanel />);
    expect(screen.getByText("Community profiles")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Capture field context" }),
    ).toHaveAttribute("href", "/app/capture");
  });
});
