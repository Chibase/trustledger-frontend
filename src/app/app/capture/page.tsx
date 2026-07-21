"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import {
  createCaptureId,
  listCaptureRecords,
  saveCaptureRecord,
  type CaptureSource,
} from "@/lib/captureStore";
import { listDemoProjects } from "@/lib/demoStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import {
  ensureTrialSeedProject,
  listTrialProjects,
} from "@/lib/trialStore";
import { aiService } from "@/services/aiService";
import { projectService } from "@/services/projectService";
import { stakeholderService } from "@/services/stakeholderService";
import type {
  AiSuggestionStatus,
  ReportBriefSuggestion,
  StakeholderExtractSuggestion,
} from "@/types/ai";
import type { Project } from "@/types/project";
import type { Stakeholder, StakeholderKind } from "@/types/stakeholder";

const SOURCES: { id: CaptureSource; label: string; hint: string }[] = [
  {
    id: "minutes",
    label: "Meeting minutes",
    hint: "Paste minutes — AI extracts attendees and themes.",
  },
  {
    id: "attendance",
    label: "Attendance register",
    hint: "Names from the register become CRM candidates.",
  },
  {
    id: "social_intel",
    label: "Social intelligence",
    hint: "Notes from social listening or community chatter.",
  },
  {
    id: "pasted_report",
    label: "Pasted report",
    hint: "Any narrative report — brief + stakeholders.",
  },
];

function asKind(value: string): StakeholderKind {
  const allowed: StakeholderKind[] = [
    "individual",
    "organisation",
    "community_group",
    "traditional_authority",
    "government",
    "ngo",
    "contractor",
    "funder",
    "media",
    "union",
    "faith_based",
    "academic",
    "other",
  ];
  return allowed.includes(value as StakeholderKind)
    ? (value as StakeholderKind)
    : "individual";
}

export default function AppCapturePage() {
  const { pushToast } = useToast();
  const [source, setSource] = useState<CaptureSource>("minutes");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extract, setExtract] =
    useState<StakeholderExtractSuggestion | null>(null);
  const [brief, setBrief] = useState<ReportBriefSuggestion | null>(null);
  const [briefStatus, setBriefStatus] = useState<AiSuggestionStatus>("idle");
  const [recent, setRecent] = useState(listCaptureRecords());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const trial = readTrialModeFromDocument();
      if (trial) ensureTrialSeedProject();
      const seeded = await projectService.list();
      const local = trial ? listTrialProjects() : listDemoProjects();
      const byId = new Map<string, Project>();
      for (const p of [...local, ...seeded]) byId.set(p.id, p);
      if (!cancelled) {
        const rows = [...byId.values()];
        setProjects(rows);
        if (rows[0] && !projectId) setProjectId(rows[0].id);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);

  const project = projects.find((p) => p.id === projectId);

  async function runExtract() {
    if (!body.trim()) {
      setError("Paste source text first.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const result = await aiService.suggestStakeholdersFromText({
        text: body,
        source,
        projectName: project?.name,
      });
      setExtract(result);
      setStatus("ready");
    } catch (err) {
      setExtract(null);
      setError(err instanceof Error ? err.message : "Extract failed");
      setStatus("error");
    }
  }

  async function runBrief() {
    if (!body.trim()) {
      pushToast("Paste source text first", "error");
      return;
    }
    setBriefStatus("loading");
    try {
      const result = await aiService.generateReportBrief({
        audience: "internal",
        projectId: projectId || undefined,
        sourceText: body,
        sourceLabel: SOURCES.find((s) => s.id === source)?.label,
      });
      setBrief(result);
      setBriefStatus("ready");
    } catch {
      setBrief(null);
      setBriefStatus("error");
    }
  }

  function applyStakeholders() {
    if (!extract) return;
    requireEmailThen("save", () => {
      void (async () => {
        const ids: string[] = [];
        for (const row of extract.stakeholders) {
          const id = `STK-C${Date.now().toString().slice(-5)}${ids.length}`;
          const stakeholder: Stakeholder = {
            id,
            name: row.name,
            kind: asKind(row.kind),
            status: "prospect",
            organisation: row.organisation,
            influence: row.influence,
            interests: [],
            tags: [source, "from-capture"],
            summary: row.rationale,
            projectIds: projectId ? [projectId] : [],
            source: "trial",
            countryCode: "ZA",
            createdAt: new Date().toISOString(),
          };
          await stakeholderService.save(stakeholder);
          ids.push(id);
        }
        const record = {
          id: createCaptureId(),
          source,
          title: title.trim() || extract.briefTitle,
          body: body.trim(),
          projectId: project?.id,
          projectName: project?.name,
          createdAt: new Date().toISOString(),
          appliedStakeholderIds: ids,
        };
        saveCaptureRecord(record);
        setRecent(listCaptureRecords());
        pushToast(
          `${ids.length} stakeholder(s) applied to demo CRM`,
          "success",
        );
      })();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Engagement capture"
        title="Capture hub"
        description="Grow the stakeholder registry from minutes, attendance registers, social intelligence, or pasted reports. Seed CRM stays demo placeholder until you apply AI suggestions."
        actions={
          <Link
            href="/app/stakeholders"
            className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            Open demo CRM
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSource(s.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              source === s.id
                ? "bg-tl-trust text-white"
                : "border border-tl-line bg-tl-surface hover:bg-tl-paper"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-tl-ink-muted">
        {SOURCES.find((s) => s.id === source)?.hint}
      </p>

      <form
        className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void runExtract();
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="cap-title">
            Title
          </label>
          <input
            id="cap-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            placeholder="e.g. Ward 12 consultation — 18 Jul"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="cap-project"
          >
            Linked project
          </label>
          <select
            id="cap-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="cap-body">
            Source text
          </label>
          <textarea
            id="cap-body"
            required
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            placeholder="Paste minutes, register lines, social notes, or a report…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <AiAssistButton
            label="Suggest stakeholders"
            onClick={() => void runExtract()}
            loading={status === "loading"}
            disabled={!body.trim()}
          />
          <AiAssistButton
            label="Generate brief"
            onClick={() => void runBrief()}
            loading={briefStatus === "loading"}
            disabled={!body.trim()}
          />
        </div>

        <AiSuggestionPanel
          title="Stakeholder suggestions"
          status={status}
          error={error}
          model={extract?.model}
          promptVersion={extract?.promptVersion}
          confidence={extract?.confidence}
          onApply={extract ? applyStakeholders : undefined}
          applyLabel="Apply to CRM"
        >
          {extract ? (
            <ul className="space-y-2 text-sm">
              {extract.stakeholders.map((s) => (
                <li key={`${s.name}-${s.kind}`}>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-tl-ink-muted">
                    {" "}
                    · {s.kind.replaceAll("_", " ")} · {s.influence}
                  </span>
                  <p className="text-xs text-tl-ink-muted">{s.rationale}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </AiSuggestionPanel>

        <AiSuggestionPanel
          title="AI brief from source"
          status={briefStatus}
          model={brief?.model}
          promptVersion={brief?.promptVersion}
        >
          {brief ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium">{brief.title}</p>
              <p>{brief.executiveSummary}</p>
              <p className="font-medium">Risks</p>
              <ul className="list-disc pl-5">
                {brief.keyRisks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="font-medium">Actions</p>
              <ul className="list-disc pl-5">
                {brief.recommendedActions.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </AiSuggestionPanel>
      </form>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold">Recent captures</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {recent.slice(0, 8).map((r) => (
            <li key={r.id} className="border-b border-tl-line pb-2 last:border-0">
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-tl-ink-muted">
                {r.source.replaceAll("_", " ")}
                {r.projectName ? ` · ${r.projectName}` : ""}
                {r.appliedStakeholderIds?.length
                  ? ` · ${r.appliedStakeholderIds.length} CRM applied`
                  : ""}
              </p>
            </li>
          ))}
          {recent.length === 0 ? (
            <li className="text-tl-ink-muted">No captures in this browser yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
