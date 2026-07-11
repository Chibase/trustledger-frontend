"use client";

import Link from "next/link";
import { use, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { getMockIncident } from "@/data/mockIncidents";
import { aiService } from "@/services/aiService";
import type {
  AiSuggestionStatus,
  DraftResponseSuggestion,
  SentimentSuggestion,
} from "@/types/ai";

type IncidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = use(params);
  const incident = getMockIncident(id);

  const [draftStatus, setDraftStatus] = useState<AiSuggestionStatus>("idle");
  const [sentimentStatus, setSentimentStatus] =
    useState<AiSuggestionStatus>("idle");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftResponseSuggestion | null>(null);
  const [sentiment, setSentiment] = useState<SentimentSuggestion | null>(null);
  const [responseText, setResponseText] = useState("");

  if (!incident) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Incident not found</h1>
        <Link href="/incidents" className="mt-4 inline-block text-sm underline">
          Back to incidents
        </Link>
      </main>
    );
  }

  const caseRecord = incident;

  async function handleDraft() {
    setDraftError(null);
    setDraftStatus("loading");
    try {
      const result = await aiService.draftResponse({
        incidentId: caseRecord.id,
        description: caseRecord.description,
        audience: "community",
      });
      setDraft(result);
      setDraftStatus("ready");
    } catch (err) {
      setDraft(null);
      setDraftError(err instanceof Error ? err.message : "Draft failed.");
      setDraftStatus("error");
    }
  }

  async function handleSentiment() {
    setSentimentError(null);
    setSentimentStatus("loading");
    try {
      const result = await aiService.suggestSentiment({
        text: caseRecord.description,
        geographicArea: caseRecord.ward,
        linkedIncidentId: caseRecord.id,
        sourceType: "Other",
      });
      setSentiment(result);
      setSentimentStatus("ready");
    } catch (err) {
      setSentiment(null);
      setSentimentError(
        err instanceof Error ? err.message : "Sentiment assist failed.",
      );
      setSentimentStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/incidents" className="underline">
            Incidents
          </Link>{" "}
          / {caseRecord.id}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{caseRecord.title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {caseRecord.priority} · {caseRecord.status} · {caseRecord.ward}
        </p>
      </div>

      <section className="rounded-lg border p-4 text-sm text-gray-700">
        <h2 className="mb-2 font-semibold text-gray-900">Description</h2>
        <p>{caseRecord.description}</p>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Community response</h2>
          <AiAssistButton
            label="Draft reply"
            onClick={handleDraft}
            loading={draftStatus === "loading"}
          />
        </div>
        <textarea
          rows={6}
          value={responseText}
          onChange={(event) => setResponseText(event.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Write or apply an AI draft. Nothing is sent automatically."
        />
        <AiSuggestionPanel
          title="Draft response"
          status={draftStatus}
          error={draftError}
          model={draft?.model}
          promptVersion={draft?.promptVersion}
          onApply={
            draft
              ? () => {
                  setResponseText(draft.draft);
                }
              : undefined
          }
          applyLabel="Insert draft"
        >
          {draft ? <p className="whitespace-pre-wrap">{draft.draft}</p> : null}
        </AiSuggestionPanel>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Sentiment capture</h2>
          <AiAssistButton
            label="Estimate sentiment"
            onClick={handleSentiment}
            loading={sentimentStatus === "loading"}
          />
        </div>
        <p className="text-sm text-gray-600">
          Feeds srm-core priority blend (impact 70% + sentiment intensity 30%).
        </p>
        <AiSuggestionPanel
          title="Sentiment suggestion"
          status={sentimentStatus}
          error={sentimentError}
          model={sentiment?.model}
          promptVersion={sentiment?.promptVersion}
          confidence={sentiment?.confidenceScore}
        >
          {sentiment ? (
            <dl className="space-y-2">
              <div>
                <dt className="font-medium">Score (-100 to 100)</dt>
                <dd>{sentiment.sentimentScore}</dd>
              </div>
              <div>
                <dt className="font-medium">Rationale</dt>
                <dd>{sentiment.rationale}</dd>
              </div>
            </dl>
          ) : null}
        </AiSuggestionPanel>
      </section>
    </main>
  );
}
