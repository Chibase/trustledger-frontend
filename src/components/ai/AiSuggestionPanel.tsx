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
      className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4"
      aria-live="polite"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">
            Suggestion only — review before saving to the case record.
          </p>
        </div>
        {typeof confidence === "number" && status === "ready" ? (
          <span className="text-xs text-gray-600">
            Confidence {(confidence * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>

      {status === "loading" ? (
        <p className="text-sm text-gray-600">Running AI assist…</p>
      ) : null}

      {status === "error" ? (
        <p className="text-sm text-red-700">
          {error || "AI assist failed. Try again or continue manually."}
        </p>
      ) : null}

      {status === "ready" ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-800">{children}</div>
          {onApply ? (
            <button
              type="button"
              onClick={onApply}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              {applyLabel}
            </button>
          ) : null}
          {(model || promptVersion) && (
            <p className="text-xs text-gray-500">
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
