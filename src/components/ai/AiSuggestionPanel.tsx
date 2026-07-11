import type { ReactNode } from "react";
import type { AiSuggestionStatus } from "@/types/ai";

type AiSuggestionPanelProps = {
  title: string;
  status: AiSuggestionStatus;
  error?: string | null;
  model?: string;
  promptVersion?: string;
  confidence?: number;
  children?: ReactNode;
  onApply?: () => void;
  applyLabel?: string;
};

export function AiSuggestionPanel({
  title,
  status,
  error,
  model,
  promptVersion,
  confidence,
  children,
  onApply,
  applyLabel = "Apply suggestion",
}: AiSuggestionPanelProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <section
      className="rounded-lg border border-dashed border-tl-line bg-tl-paper p-4"
      aria-live="polite"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-tl-ink">{title}</h3>
          <p className="mt-1 text-xs text-tl-ink-muted">
            Suggestion only — review before saving to the case record.
          </p>
        </div>
        {typeof confidence === "number" && status === "ready" ? (
          <span className="text-xs text-tl-ink-muted">
            Confidence {(confidence * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>

      {status === "loading" ? (
        <p className="text-sm text-tl-ink-muted">Running AI assist…</p>
      ) : null}

      {status === "error" ? (
        <p className="text-sm text-tl-danger">
          {error || "AI assist failed. Try again or continue manually."}
        </p>
      ) : null}

      {status === "ready" ? (
        <div className="space-y-3">
          <div className="text-sm text-tl-ink">{children}</div>
          {onApply ? (
            <button
              type="button"
              onClick={onApply}
              className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              {applyLabel}
            </button>
          ) : null}
          {(model || promptVersion) && (
            <p className="text-xs text-tl-ink-muted">
              {model ? `Model: ${model}` : null}
              {model && promptVersion ? " · " : null}
              {promptVersion ? `Prompt: ${promptVersion}` : null}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
