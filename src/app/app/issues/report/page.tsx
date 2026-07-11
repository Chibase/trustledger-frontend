"use client";

import { useState } from "react";
import Link from "next/link";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { aiService } from "@/services/aiService";
import type { AiSuggestionStatus, IncidentTriageSuggestion } from "@/types/ai";

export default function AppReportIssuePage() {
  const [description, setDescription] = useState("");
  const [ward, setWard] = useState("Ward 12");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<IncidentTriageSuggestion | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);

  async function handleAssist() {
    if (!description.trim()) {
      setError("Add a short description before running AI assist.");
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("loading");
    try {
      const result = await aiService.suggestTriage({ description, ward });
      setSuggestion(result);
      setStatus("ready");
    } catch (err) {
      setSuggestion(null);
      setError(err instanceof Error ? err.message : "AI assist failed.");
      setStatus("error");
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    setCategory(suggestion.category);
    setPriority(suggestion.suggestedPriority);
    if (suggestion.geographicAreaHint) {
      setWard(suggestion.geographicAreaHint);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Report an issue</h1>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Describe what happened. AI can suggest category, area, and priority —
          you confirm before submit.
          {aiService.isMockMode() ? (
            <span className="ml-1">(mock AI)</span>
          ) : null}
        </p>
      </div>

      {submitted ? (
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
          <p className="font-medium">Issue captured (demo draft)</p>
          <p className="mt-2 text-tl-ink-muted">
            In live mode this creates an SRM Incident in Frappe with AI metadata
            on the timeline.
          </p>
          <Link
            href="/app/incidents"
            className="mt-4 inline-block text-sm font-medium text-tl-trust-ink underline"
          >
            View sample incidents
          </Link>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              What is the concern?
            </label>
            <textarea
              id="description"
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="Example: Burst pipe is flooding the clinic access road..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ward" className="mb-1 block text-sm font-medium">
                Ward / area
              </label>
              <input
                id="ward"
                value={ward}
                onChange={(event) => setWard(event.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium">
                Category
              </label>
              <input
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                placeholder="Optional — or apply AI suggestion"
              />
            </div>
          </div>

          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium">
              Suggested priority
            </label>
            <input
              id="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="Filled when you apply an AI suggestion"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <AiAssistButton
              onClick={handleAssist}
              loading={status === "loading"}
              disabled={!description.trim()}
            />
            <button
              type="submit"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Submit issue
            </button>
          </div>

          <AiSuggestionPanel
            title="Triage suggestion"
            status={status}
            error={error}
            model={suggestion?.model}
            promptVersion={suggestion?.promptVersion}
            confidence={suggestion?.confidence}
            onApply={suggestion ? applySuggestion : undefined}
          >
            {suggestion ? (
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium">Summary</dt>
                  <dd>{suggestion.summary}</dd>
                </div>
                <div>
                  <dt className="font-medium">Category</dt>
                  <dd>{suggestion.category}</dd>
                </div>
                <div>
                  <dt className="font-medium">Area hint</dt>
                  <dd>{suggestion.geographicAreaHint}</dd>
                </div>
                <div>
                  <dt className="font-medium">Priority hint</dt>
                  <dd>{suggestion.suggestedPriority}</dd>
                </div>
                <div>
                  <dt className="font-medium">Impact hints</dt>
                  <dd>{suggestion.impactHints.join(", ")}</dd>
                </div>
              </dl>
            ) : null}
          </AiSuggestionPanel>
        </form>
      )}
    </div>
  );
}
