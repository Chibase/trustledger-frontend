"use client";

import { useEffect, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { SentimentChip } from "@/components/trust/SentimentChip";
import { useToast } from "@/components/ui/Toast";
import { hasCapability, resolveClientPlanId } from "@/lib/entitlements";
import { SENTIMENT_LABEL_COPY } from "@/lib/sentimentAnalysis";
import { aiService } from "@/services/aiService";
import type { PlanId } from "@/config/plans";
import type {
  AiSuggestionStatus,
  SentimentSuggestion,
} from "@/types/ai";

type SavedSentiment = {
  label: SentimentSuggestion["sentimentLabel"] | null | undefined;
  score?: number | null;
  rationale?: string;
  analyzedAt?: string;
};

type NoteSentimentAssistProps = {
  noteText: string;
  geographicArea?: string;
  linkedIncidentId?: string;
  sourceType?: SentimentSuggestion["sourceType"];
  saved?: SavedSentiment | null;
  planId?: PlanId | null;
  onApply: (suggestion: SentimentSuggestion) => Promise<void> | void;
};

/**
 * One-click sentiment analysis for communication notes.
 * Suggest → human apply → save (ADR-006).
 */
export function NoteSentimentAssist({
  noteText,
  geographicArea,
  linkedIncidentId,
  sourceType = "Community Meeting",
  saved,
  planId,
  onApply,
}: NoteSentimentAssistProps) {
  const { pushToast } = useToast();
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SentimentSuggestion | null>(
    null,
  );
  const [applying, setApplying] = useState(false);
  const [canAssist, setCanAssist] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCanAssist(hasCapability("aiAssist", resolveClientPlanId(planId)));
    });
    return () => cancelAnimationFrame(frame);
  }, [planId]);
  const text = noteText.trim();

  async function handleAnalyze() {
    if (!text) {
      setError("Add note text before analysing sentiment.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const result = await aiService.suggestSentiment({
        text,
        geographicArea,
        linkedIncidentId,
        sourceType,
      });
      setSuggestion(result);
      setStatus("ready");
    } catch (err) {
      setSuggestion(null);
      setError(
        err instanceof Error ? err.message : "Sentiment analysis failed.",
      );
      setStatus("error");
    }
  }

  async function handleApply() {
    if (!suggestion) return;
    setApplying(true);
    try {
      await onApply(suggestion);
      pushToast("Sentiment saved to relationship health", "success");
      setStatus("idle");
      setSuggestion(null);
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Could not save sentiment",
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
          <h2 className="font-semibold text-tl-ink">Sentiment analysis</h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            One click classifies this communication note as positive, neutral,
            or negative. Apply to feed the leadership early-warning pulse.
          </p>
        </div>
        {canAssist ? (
          <AiAssistButton
            label="Analyze sentiment"
            onClick={() => void handleAnalyze()}
            loading={status === "loading"}
            disabled={!text}
          />
        ) : (
          <p className="text-xs text-tl-ink-muted">
            AI assist is not on this plan.
          </p>
        )}
      </div>

      {saved?.label ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-tl-ink-muted">Saved</span>
          <SentimentChip label={saved.label} score={saved.score} size="md" />
          {saved.analyzedAt ? (
            <span className="text-xs text-tl-ink-muted">
              {new Date(saved.analyzedAt).toLocaleString("en-ZA")}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-tl-ink-muted">
          No sentiment saved on this note yet.
        </p>
      )}

      {saved?.rationale && status === "idle" ? (
        <p className="text-sm text-tl-ink-muted">{saved.rationale}</p>
      ) : null}

      <AiSuggestionPanel
        title="Sentiment suggestion"
        status={status}
        error={error}
        model={suggestion?.model}
        promptVersion={suggestion?.promptVersion}
        confidence={suggestion?.confidenceScore}
        onApply={
          suggestion && !applying ? () => void handleApply() : undefined
        }
        applyLabel={applying ? "Saving…" : "Apply & save"}
      >
        {suggestion ? (
          <dl className="space-y-2">
            <div>
              <dt className="font-medium">Relationship signal</dt>
              <dd className="mt-1">
                <SentimentChip
                  label={suggestion.sentimentLabel}
                  score={suggestion.sentimentScore}
                  size="md"
                />
              </dd>
            </div>
            <div>
              <dt className="font-medium">Label</dt>
              <dd>{SENTIMENT_LABEL_COPY[suggestion.sentimentLabel]}</dd>
            </div>
            <div>
              <dt className="font-medium">Rationale</dt>
              <dd>{suggestion.rationale}</dd>
            </div>
          </dl>
        ) : null}
      </AiSuggestionPanel>
    </section>
  );
}
