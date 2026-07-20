"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { evidenceService } from "@/services/noteService";
import { incidentService } from "@/services/incidentService";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import { useToast } from "@/components/ui/Toast";
import {
  listDemoEvidence,
  listDemoIncidents,
  saveDemoEvidence,
} from "@/lib/demoStore";
import { aiService } from "@/services/aiService";
import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type {
  AiSuggestionStatus,
  DraftResponseSuggestion,
  SentimentSuggestion,
} from "@/types/ai";

type IncidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function AppIncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
  const { id } = use(params);
  const { pushToast } = useToast();
  const [incident, setIncident] = useState<Incident | null | undefined>(
    undefined,
  );
  const [evidence, setEvidence] = useState<EvidenceStub[]>([]);
  const [fileName, setFileName] = useState("");

  const [draftStatus, setDraftStatus] = useState<AiSuggestionStatus>("idle");
  const [sentimentStatus, setSentimentStatus] =
    useState<AiSuggestionStatus>("idle");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftResponseSuggestion | null>(null);
  const [sentiment, setSentiment] = useState<SentimentSuggestion | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([incidentService.get(id), evidenceService.listForIncident(id)]).then(
      ([caseRecord, files]) => {
        if (cancelled) return;
        const localCase = listDemoIncidents().find((row) => row.id === id);
        setIncident(localCase ?? caseRecord);
        const localFiles = listDemoEvidence(id);
        const byId = new Map<string, EvidenceStub>();
        for (const file of [...localFiles, ...files]) {
          byId.set(file.id, file);
        }
        setEvidence([...byId.values()]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleEvidenceSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!fileName.trim() || !incident) return;
    requireEmailThen("save", () => {
      const stub: EvidenceStub = {
        id: `EVD-D${Date.now().toString().slice(-5)}`,
        incidentId: incident.id,
        fileName: fileName.trim(),
        classification: "General",
        uploadedBy: "Trial guest",
        uploadedAt: new Date().toISOString(),
        isPrimary: evidence.length === 0,
      };
      saveDemoEvidence(stub);
      setEvidence((prev) => [stub, ...prev]);
      setFileName("");
      pushToast("Evidence saved in this browser", "success");
    });
  }

  if (incident === undefined) {
    return <p className="text-sm text-tl-ink-muted">Loading incident…</p>;
  }

  if (!incident) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold">Incident not found</h1>
        <Link
          href="/app/incidents"
          className="mt-4 inline-block text-sm text-tl-trust-ink underline"
        >
          Back to incidents
        </Link>
      </div>
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-tl-ink-muted">
          <Link href="/app/incidents" className="underline">
            Incidents
          </Link>{" "}
          / {caseRecord.id}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          {caseRecord.title}
        </h1>
        <p className="mt-2 text-sm text-tl-ink-muted">
          {caseRecord.priority} · {caseRecord.status} · {caseRecord.ward} ·{" "}
          {caseRecord.escalationLevel}
          {caseRecord.slaBreached ? " · SLA breached" : ""}
        </p>
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="text-tl-ink-muted">{caseRecord.description}</p>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-tl-ink-muted">Category</dt>
            <dd>{caseRecord.category}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Owner</dt>
            <dd>{caseRecord.ownerName}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Project</dt>
            <dd>{caseRecord.projectName}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Impact score</dt>
            <dd>{caseRecord.impactScore}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="mb-3 font-semibold">Timeline</h2>
        <ol className="space-y-3">
          {caseRecord.timeline.map((event) => (
            <li key={event.id} className="border-l-2 border-tl-line pl-3">
              <p className="font-medium">{event.type}</p>
              <p className="text-tl-ink-muted">{event.summary}</p>
              <p className="text-xs text-tl-ink-muted">
                {new Date(event.at).toLocaleString("en-ZA")}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="mb-3 font-semibold">Evidence</h2>
        {evidence.length === 0 ? (
          <p className="mb-3 text-tl-ink-muted">No evidence attached yet.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {evidence.map((file) => (
              <li key={file.id}>
                {file.fileName}
                <span className="text-tl-ink-muted">
                  {" "}
                  · {file.classification}
                  {file.isPrimary ? " · primary" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleEvidenceSubmit} className="flex flex-wrap gap-2">
          <input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="Filename stub e.g. site-photo.jpg"
            className="min-w-[12rem] flex-1 rounded-md border border-tl-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm font-medium hover:bg-tl-surface"
          >
            Add evidence (demo)
          </button>
        </form>
        <p className="mt-2 text-xs text-tl-ink-muted">
          Demo stores the filename only — binary upload arrives with TrustLedger Cloud live mode.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Community response</h2>
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
          className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
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
                  pushToast("Draft inserted", "success");
                }
              : undefined
          }
          applyLabel="Insert draft"
        >
          {draft ? <p className="whitespace-pre-wrap">{draft.draft}</p> : null}
        </AiSuggestionPanel>
      </section>

      <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Sentiment capture</h2>
          <AiAssistButton
            label="Estimate sentiment"
            onClick={handleSentiment}
            loading={sentimentStatus === "loading"}
          />
        </div>
        <p className="text-sm text-tl-ink-muted">
          Feeds priority blend (impact 70% + sentiment intensity 30%).
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
    </div>
  );
}
