"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";
import {
  FEATURED_INDICATOR_PLACES,
  mockIndicators,
} from "@/data/mockIndicators";
import {
  listIndicatorBriefs,
  saveIndicatorBrief,
  type SavedIndicatorBrief,
} from "@/lib/indicatorBriefStore";
import { aiService } from "@/services/aiService";
import type { AiSuggestionStatus, IndicatorBriefSuggestion } from "@/types/ai";
import type { SocioEconomicIndicator } from "@/types/geo";

export default function AppIntelligencePage() {
  const { pushToast } = useToast();
  const [placeId, setPlaceId] = useState<string>(
    FEATURED_INDICATOR_PLACES[0].id,
  );
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<IndicatorBriefSuggestion | null>(null);
  const [saved, setSaved] = useState<SavedIndicatorBrief[]>([]);

  const placeName =
    FEATURED_INDICATOR_PLACES.find((p) => p.id === placeId)?.name ?? placeId;

  const indicators: SocioEconomicIndicator[] = useMemo(
    () => mockIndicators.filter((i) => i.placeId === placeId),
    [placeId],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSaved(listIndicatorBriefs(placeId));
      setBrief(null);
      setStatus("idle");
      setError(null);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [placeId]);

  async function runBrief() {
    if (!indicators.length) {
      setError("No indicators for this place yet.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const result = await aiService.generateIndicatorBrief({
        placeId,
        placeName,
        indicators: indicators.map((i) => ({
          key: i.key,
          label: i.label,
          value: i.value,
          unit: i.unit,
          year: i.year,
        })),
      });
      setBrief(result);
      setStatus("ready");
    } catch (err) {
      setBrief(null);
      setError(err instanceof Error ? err.message : "Brief failed");
      setStatus("error");
    }
  }

  function applyBrief() {
    if (!brief) return;
    requireEmailThen("save", () => {
      const row = saveIndicatorBrief({
        placeId,
        placeName,
        suggestion: brief,
      });
      setSaved(listIndicatorBriefs(placeId));
      pushToast(`Saved brief ${row.id}`, "success");
    });
  }

  return (
    <FeatureGate capability="esgIndicators">
      <div className="space-y-6">
        <PageHeader
          eyebrow={`${NEXT_PRODUCT_VERSION_LABEL} · ${PRODUCT_VERSION_LABEL} desk remains`}
          title="Intelligence / ESG"
          description="Socio-economic indicator cards for priority places, with AI briefs (suggest → apply → save). Demo figures until Stats SA ingest lands."
          actions={
            <Link
              href="/app/geo"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Open geo
            </Link>
          }
        />

        <label className="block max-w-md text-sm">
          <span className="mb-1 block font-medium text-tl-ink">Place</span>
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            {FEATURED_INDICATOR_PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.level})
              </option>
            ))}
          </select>
        </label>

        {indicators.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">
            No indicators seeded for this place.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {indicators.map((row) => (
              <KpiCard
                key={`${row.placeId}:${row.key}`}
                label={row.label}
                value={`${row.value}${row.unit === "%" ? "%" : ` ${row.unit}`}`}
                hint={`${row.source ?? "Demo"}${row.year ? ` · ${row.year}` : ""}`}
                tone={
                  row.key.includes("unemployment") && row.value >= 35
                    ? "attention"
                    : "trust"
                }
              />
            ))}
          </div>
        )}

        <section className="space-y-3 rounded-lg border border-dashed border-tl-line bg-tl-surface/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-tl-ink">
              Indicator brief
            </h2>
            <AiAssistButton
              label="Suggest brief"
              onClick={() => void runBrief()}
              loading={status === "loading"}
              disabled={!indicators.length}
            />
          </div>
          <AiSuggestionPanel
            title="ESG / intelligence suggestion"
            status={status}
            error={error}
            model={brief?.model}
            promptVersion={brief?.promptVersion}
            confidence={brief?.confidence}
            onApply={brief ? applyBrief : undefined}
            applyLabel="Apply & save brief"
          >
            {brief ? (
              <div className="space-y-2 text-sm text-tl-ink">
                <p className="font-medium">{brief.title}</p>
                <p className="text-tl-ink-muted">{brief.executiveSummary}</p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                    Watchpoints
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {brief.watchpoints.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                    Recommended actions
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {brief.recommendedActions.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </AiSuggestionPanel>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold text-tl-ink">
            Saved briefs (this place)
          </h2>
          {saved.length === 0 ? (
            <p className="mt-2 text-sm text-tl-ink-muted">
              None yet — suggest a brief, then apply &amp; save.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-tl-line rounded-lg border border-tl-line bg-tl-surface">
              {saved.map((row) => (
                <li key={row.id} className="px-4 py-3 text-sm">
                  <p className="font-medium text-tl-ink">{row.title}</p>
                  <p className="text-xs text-tl-ink-muted">
                    {row.id} · {new Date(row.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-tl-ink-muted">{row.executiveSummary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </FeatureGate>
  );
}
