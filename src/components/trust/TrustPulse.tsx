"use client";

import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import type { Incident } from "@/types/incident";
import { KpiCard } from "@/components/ui/KpiCard";

type TrustPulseProps = {
  incidents: Incident[];
  /** Role-level framing for the trust signal. */
  levelLabel?: string;
  avgTatHours?: number | null;
  openOverTarget?: number;
};

/**
 * Explicit trust + sentiment strip for every role dashboard.
 * Sentiment is the quantifiable trust input; TAT pressure adjusts the index.
 */
export function TrustPulse({
  incidents,
  levelLabel = "Workspace",
  avgTatHours = null,
  openOverTarget = 0,
}: TrustPulseProps) {
  const trust = trustIndexFromIncidents(incidents);
  const tone =
    trust.label === "Strong"
      ? "trust"
      : trust.label === "At risk"
        ? "danger"
        : trust.label === "Watch"
          ? "attention"
          : "default";

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-tl-ink">
          Trust pulse · {levelLabel}
        </h2>
        <p className="text-xs text-tl-ink-muted">
          From case sentiment (−100…100) and open SLA pressure
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Trust index"
          value={String(trust.trustIndex)}
          hint={trust.label}
          tone={tone}
        />
        <KpiCard
          label="Avg sentiment"
          value={
            trust.avgSentiment === null ? "—" : String(trust.avgSentiment)
          }
          hint={`${trust.sampleSize} scored cases`}
          tone={
            trust.avgSentiment !== null && trust.avgSentiment < -40
              ? "attention"
              : "default"
          }
        />
        <KpiCard
          label="Avg TAT (hrs)"
          value={avgTatHours === null ? "—" : String(avgTatHours)}
          hint="Reported → resolved/closed"
        />
        <KpiCard
          label="Over stage target"
          value={String(openOverTarget)}
          hint="Open cases past client TAT"
          tone={openOverTarget > 0 ? "attention" : "default"}
        />
      </div>
    </section>
  );
}
