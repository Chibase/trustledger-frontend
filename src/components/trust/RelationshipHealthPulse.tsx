"use client";

import { useMemo } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import {
  relationshipHealthFromLabels,
  sentimentLabelFromScore,
} from "@/lib/sentimentAnalysis";
import type { Engagement } from "@/types/engagement";
import type { SentimentLabel } from "@/types/ai";

type RelationshipHealthPulseProps = {
  engagements: Engagement[];
  levelLabel?: string;
};

function labelFor(row: Engagement): SentimentLabel | null {
  if (row.sentimentLabel) return row.sentimentLabel;
  if (typeof row.sentimentScore === "number") {
    return sentimentLabelFromScore(row.sentimentScore);
  }
  return null;
}

/**
 * Leadership early-warning strip from scored communication notes.
 */
export function RelationshipHealthPulse({
  engagements,
  levelLabel = "Community notes",
}: RelationshipHealthPulseProps) {
  const health = useMemo(() => {
    const labels = engagements.map(labelFor);
    const scores = engagements.map((row) =>
      typeof row.sentimentScore === "number" ? row.sentimentScore : null,
    );
    return relationshipHealthFromLabels(labels, scores);
  }, [engagements]);

  const tone =
    health.warning === "alert"
      ? "danger"
      : health.warning === "watch"
        ? "attention"
        : health.sampleSize > 0
          ? "trust"
          : "default";

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-tl-ink">
          Relationship health · {levelLabel}
        </h2>
        <p className="text-xs text-tl-ink-muted">
          One-click sentiment on communication notes (positive / neutral /
          negative)
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Health"
          value={
            health.warning === "alert"
              ? "Alert"
              : health.warning === "watch"
                ? "Watch"
                : health.sampleSize
                  ? "Stable"
                  : "—"
          }
          hint={
            health.sampleSize
              ? `${health.sampleSize} scored notes`
              : "Analyze meeting notes to start the pulse"
          }
          tone={tone}
        />
        <KpiCard
          label="Positive"
          value={String(health.positive)}
          hint="Constructive / supportive notes"
          tone={health.positive > 0 ? "trust" : "default"}
        />
        <KpiCard
          label="Neutral"
          value={String(health.neutral)}
          hint="Informational / mixed"
        />
        <KpiCard
          label="Negative"
          value={String(health.negative)}
          hint={
            health.unlabeled
              ? `${health.unlabeled} still unscored`
              : "Early-warning share"
          }
          tone={health.negative > 0 ? "danger" : "default"}
        />
      </div>
      <p
        className={`text-sm ${
          health.warning === "alert"
            ? "text-tl-danger"
            : health.warning === "watch"
              ? "text-tl-amber"
              : "text-tl-ink-muted"
        }`}
      >
        {health.headline}
      </p>
    </section>
  );
}
