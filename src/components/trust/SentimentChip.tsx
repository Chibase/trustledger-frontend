"use client";

import type { SentimentLabel } from "@/types/ai";
import { SENTIMENT_LABEL_COPY } from "@/lib/sentimentAnalysis";

type SentimentChipProps = {
  label: SentimentLabel | null | undefined;
  score?: number | null;
  size?: "sm" | "md";
};

const TONE: Record<SentimentLabel, string> = {
  positive: "border-tl-trust bg-tl-paper text-tl-trust-ink",
  neutral: "border-tl-line bg-tl-surface text-tl-ink-muted",
  negative: "border-tl-danger/40 bg-tl-paper text-tl-danger",
};

export function SentimentChip({
  label,
  score,
  size = "sm",
}: SentimentChipProps) {
  if (!label) {
    return (
      <span
        className={`rounded border border-dashed border-tl-line text-tl-ink-muted ${
          size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"
        }`}
      >
        Unscored
      </span>
    );
  }

  return (
    <span
      className={`rounded border font-medium ${TONE[label]} ${
        size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"
      }`}
    >
      {SENTIMENT_LABEL_COPY[label]}
      {typeof score === "number" ? ` · ${score}` : ""}
    </span>
  );
}
