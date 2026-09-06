/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { CaptureConnectivityBanner } from "@/components/capture/CaptureConnectivityBanner";
import {
  formatDraftSavedAt,
  isBrowserOnline,
  isLikelyNetworkFailure,
  subscribeBrowserConnection,
} from "@/lib/connectivity";
import { EMPTY_FIELD_META } from "@/lib/trust/fieldCapture";
import {
  clearFieldCaptureDraft,
  fieldDraftHasContent,
  readFieldCaptureDraft,
  saveFieldCaptureDraft,
  withPendingApplyIds,
} from "@/lib/trust/fieldDraftStore";
import type { StakeholderExtractSuggestion } from "@/types/ai";

const extract: StakeholderExtractSuggestion = {
  stakeholders: [
    {
      name: "Ward committee",
      kind: "community_group",
      organisation: "",
      influence: "high",
      rationale: "Spoke at the imbizo",
    },
  ],
  briefTitle: "Ward imbizo",
  briefSummary: "Notes",
  confidence: 0.7,
  model: "local",
  promptVersion: "test",
};

describe("LC-1 low-connectivity capture", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("round-trips a pack draft and pending apply in local storage", () => {
    const pending = withPendingApplyIds({
      confirmedAt: "2026-09-06T12:00:00.000Z",
      kind: "pack",
      cloudSync: true,
    });
    saveFieldCaptureDraft({
      orgId: "org-1",
      projectId: "PRJ-1",
      source: "bbbee",
      title: "August B-BBEE",
      body: "",
      meta: EMPTY_FIELD_META,
      pack: {
        pack: "bbbee",
        data: { bbbeeLevel: "Level 4", notes: "Draft while offline" },
      },
      pendingApply: pending,
    });
    const loaded = readFieldCaptureDraft("org-1", "PRJ-1", "bbbee");
    expect(loaded?.pack?.pack).toBe("bbbee");
    expect(loaded?.pack && "bbbeeLevel" in loaded.pack.data).toBe(true);
    expect(loaded?.pendingApply?.kind).toBe("pack");
    expect(loaded?.pendingApply?.cloudSync).toBe(true);
    expect(loaded?.pendingApply?.captureId).toMatch(/^CAP-/);
    expect(
      fieldDraftHasContent({
        title: "",
        body: "",
        meta: EMPTY_FIELD_META,
        pack: loaded?.pack,
      }),
    ).toBe(true);
  });

  it("reuses the same ids on a confirmed-apply retry", () => {
    const first = withPendingApplyIds(
      {
        confirmedAt: "2026-09-06T12:00:00.000Z",
        kind: "narrative",
        extract,
      },
      extract.stakeholders.length,
    );
    const second = withPendingApplyIds(
      {
        ...first,
        cloudSync: true,
      },
      extract.stakeholders.length,
    );
    expect(second.captureId).toBe(first.captureId);
    expect(second.engagementId).toBe(first.engagementId);
    expect(second.stakeholderIds).toEqual(first.stakeholderIds);
    expect(second.stakeholderIds).toHaveLength(1);
  });

  it("does not treat an empty pack prefill as a user draft", () => {
    expect(
      fieldDraftHasContent({
        title: "B-BBEE — period pack",
        body: "",
        meta: EMPTY_FIELD_META,
        pack: { pack: "bbbee", data: {} },
      }),
    ).toBe(false);
  });

  it("clears a finished draft", () => {
    saveFieldCaptureDraft({
      orgId: "org-1",
      projectId: "PRJ-1",
      source: "minutes",
      title: "Notes",
      body: "Spoken.",
      meta: EMPTY_FIELD_META,
    });
    clearFieldCaptureDraft("org-1", "PRJ-1", "minutes");
    expect(readFieldCaptureDraft("org-1", "PRJ-1", "minutes")).toBeNull();
  });

  it("treats navigator.onLine false as a network failure", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    expect(isBrowserOnline()).toBe(false);
    expect(isLikelyNetworkFailure(new Error("anything"))).toBe(true);
  });

  it("subscribes to online/offline and formats last-saved time", () => {
    const seen: boolean[] = [];
    const stop = subscribeBrowserConnection((next) => seen.push(next));
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));
    stop();
    expect(seen).toEqual([false, true]);
    expect(formatDraftSavedAt("2026-09-06T12:04:00.000Z")).toMatch(/Sep/i);
  });

  it("renders an offline banner with last-saved time", () => {
    render(
      <CaptureConnectivityBanner
        online={false}
        savedAt="2026-09-06T12:04:00.000Z"
        pendingApply
        pendingCloudSync
      />,
    );
    expect(
      screen.getByText("Apply confirmed — saved on this device"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last draft on this device/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
