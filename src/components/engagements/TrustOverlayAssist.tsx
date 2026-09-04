"use client";

import { useMemo, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { useToast } from "@/components/ui/Toast";
import { applyEngagementToTrustLayer } from "@/lib/trust/applyEngagement";
import { prepareTrustResponseHints } from "@/lib/trust/aiPrepare";
import { getActiveOrgId } from "@/lib/orgStore";
import {
  emptyTrustResponse,
  isTrustResponseBlank,
  normalizeTrustResponse,
} from "@/lib/trust/response";
import { engagementService } from "@/services/engagementService";
import type { Engagement } from "@/types/engagement";
import type { TrustAttitude, StakeholderTrustResponse } from "@/types/trustOverlay";

type Props = {
  engagement: Engagement;
  noteText: string;
  onApplied: (next: Engagement) => void;
};

const ATTITUDE_OPTIONS: Array<{ value: TrustAttitude; label: string }> = [
  { value: "unknown", label: "Unknown" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const OVERLAY_FIELDS: Array<{
  key: keyof Pick<
    StakeholderTrustResponse,
    | "willingnessToParticipate"
    | "willingnessToContribute"
    | "confidenceInProcess"
    | "confidenceInImplementer"
    | "confidenceInFairness"
    | "confidenceConcernsActedUpon"
  >;
  label: string;
}> = [
  { key: "willingnessToParticipate", label: "Willingness to participate" },
  { key: "willingnessToContribute", label: "Willingness to contribute" },
  { key: "confidenceInProcess", label: "Confidence in process" },
  { key: "confidenceInImplementer", label: "Confidence in implementer" },
  { key: "confidenceInFairness", label: "Confidence in fairness" },
  { key: "confidenceConcernsActedUpon", label: "Concerns will be acted upon" },
];

function attitudeValue(
  overlay: StakeholderTrustResponse,
  key: (typeof OVERLAY_FIELDS)[number]["key"],
): TrustAttitude {
  const value = overlay[key];
  if (value === "high" || value === "medium" || value === "low") return value;
  return "unknown";
}

/**
 * Optional trust overlay on an engagement. Local hints only.
 * Suggest → review → apply & save. Does not copy note sentiment.
 */
export function TrustOverlayAssist({ engagement, noteText, onApplied }: Props) {
  const { pushToast } = useToast();
  const [draft, setDraft] = useState<StakeholderTrustResponse>(() =>
    normalizeTrustResponse(engagement.trustResponse || emptyTrustResponse()),
  );
  const [applying, setApplying] = useState(false);
  const text = noteText.trim();
  const savedOverlay = engagement.trustResponse;
  const savedSummary = useMemo(() => {
    if (!savedOverlay || isTrustResponseBlank(savedOverlay)) return null;
    return OVERLAY_FIELDS.filter(
      (row) => attitudeValue(savedOverlay, row.key) !== "unknown",
    )
      .map((row) => `${row.label}: ${attitudeValue(savedOverlay, row.key)}`)
      .join(" · ");
  }, [savedOverlay]);

  function patch(key: (typeof OVERLAY_FIELDS)[number]["key"], value: string) {
    setDraft((prev) => ({
      ...prev,
      [key]:
        value === "high" || value === "medium" || value === "low"
          ? value
          : "unknown",
    }));
  }

  function handleSuggest() {
    if (!text) {
      pushToast("Add engagement notes before suggesting an overlay.", "error");
      return;
    }
    setDraft(prepareTrustResponseHints(text));
  }

  async function handleApply() {
    const overlay = normalizeTrustResponse({
      ...draft,
      capturedAt: new Date().toISOString(),
    });
    setApplying(true);
    try {
      const next: Engagement = { ...engagement, trustResponse: overlay };
      const saved = await engagementService.save(next);
      const withOverlay: Engagement = { ...saved, trustResponse: overlay };
      await applyEngagementToTrustLayer({
        engagement: withOverlay,
        overlay,
        orgId: getActiveOrgId() || "local",
      });
      onApplied(withOverlay);
      pushToast(
        isTrustResponseBlank(overlay)
          ? "Participation recorded on the trust layer"
          : "Trust overlay applied",
        "success",
      );
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Could not apply trust overlay",
        "error",
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-tl-ink">Trust overlay</h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Optional. Records willingness and confidence on the trust layer.
            Note sentiment is not a trust observation.
          </p>
        </div>
        <AiAssistButton
          label="Suggest overlay"
          onClick={handleSuggest}
          disabled={!text || applying}
        />
      </div>

      {savedSummary ? (
        <p className="text-sm text-tl-ink">{savedSummary}</p>
      ) : (
        <p className="text-sm text-tl-ink-muted">
          No trust overlay saved on this engagement yet.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {OVERLAY_FIELDS.map((row) => (
          <div key={row.key}>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor={`overlay-${row.key}`}
            >
              {row.label}
            </label>
            <select
              id={`overlay-${row.key}`}
              className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
              value={attitudeValue(draft, row.key)}
              onChange={(e) => patch(row.key, e.target.value)}
            >
              {ATTITUDE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={applying}
          onClick={() => void handleApply()}
          className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {applying ? "Saving…" : "Apply overlay & save"}
        </button>
        <p className="text-xs text-tl-ink-muted">
          Suggestion only — review before saving. Overlay stays on the trust
          layer, not on the engagement record.
        </p>
      </div>
    </section>
  );
}
