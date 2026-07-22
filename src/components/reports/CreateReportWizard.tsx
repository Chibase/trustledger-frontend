"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import { useToast } from "@/components/ui/Toast";
import {
  DESK_TIER_LABELS,
  type DeskTier,
} from "@/types/deskTier";
import {
  REPORT_AUDIENCES,
  REPORT_AUDIENCE_LABELS,
  REPORT_KIND_LABELS,
  REPORT_KINDS,
  type ReportAudience,
  type ReportKind,
  type ReportSectionId,
  type SavedReport,
} from "@/types/activityReport";
import {
  allSections,
  defaultAudienceForTier,
  defaultKindForTier,
  sectionsForKind,
  tierMeetsMinimum,
} from "@/config/reportCatalogue";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import { listDemoIncidents, listDemoProjects } from "@/lib/demoStore";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  buildPeriodActivityFacts,
  factsToPromptBlock,
  looksLikeReportTemplateGuide,
  type PeriodActivityFacts,
} from "@/lib/reportComposer";
import {
  createReportId,
  saveAuthoredReport,
} from "@/lib/reportStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import { listTrialIncidents, listTrialProjects } from "@/lib/trialStore";
import { aiService } from "@/services/aiService";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";
import type {
  ActivityReportComposeSuggestion,
  AiSuggestionStatus,
} from "@/types/ai";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

type CreateReportWizardProps = {
  role: UserRole;
  authorName: string;
};

function currentMonthLabel() {
  return new Date().toLocaleString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

export function CreateReportWizard({
  role,
  authorName,
}: CreateReportWizardProps) {
  const { pushToast } = useToast();
  const [tier, setTier] = useState<DeskTier>("clo");
  const [kind, setKind] = useState<ReportKind>("monthly_activity");
  const [audience, setAudience] = useState<ReportAudience>("supervisor");
  const [periodLabel, setPeriodLabel] = useState(currentMonthLabel());
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Set<ReportSectionId>>(new Set());
  const [purposes, setPurposes] = useState<
    Array<"reporting" | "performance" | "dispute">
  >(["reporting", "performance"]);
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActivityReportComposeSuggestion | null>(
    null,
  );
  const [body, setBody] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [factsBlock, setFactsBlock] = useState("");
  const [facts, setFacts] = useState<PeriodActivityFacts | null>(null);
  const [evidence, setEvidence] = useState<SavedReport["evidence"]>([]);
  const [allIncidents, setAllIncidents] = useState<
    Awaited<ReturnType<typeof incidentService.list>>
  >([]);

  useEffect(() => {
    const desk = readDeskTier(role);
    setTier(desk);
    setKind(defaultKindForTier(desk));
    setAudience(defaultAudienceForTier(desk));
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const trial = readTrialModeFromDocument();
      const [iRows, pRows] = await Promise.all([
        incidentService.list(),
        projectService.list(),
      ]);
      if (cancelled) return;
      const localI = trial ? listTrialIncidents() : listDemoIncidents();
      const localP = trial ? listTrialProjects() : listDemoProjects();
      // Always ground report writing in demo seed cases (unless trial own-data).
      const seedI = trial ? [] : mockIncidents;
      const seedP = trial ? [] : mockProjects;
      const byI = new Map(
        [...seedI, ...localI, ...iRows].map((i) => [i.id, i]),
      );
      const byP = new Map(
        [...seedP, ...localP, ...pRows].map((p) => [p.id, p]),
      );
      const incidents = [...byI.values()];
      const projectList = [...byP.values()];
      setProjects(projectList);
      setAllIncidents(incidents);
      setProjectId((prev) => prev || projectList[0]?.id || "");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const project = projects.find((p) => p.id === projectId);
    const scopedFacts = buildPeriodActivityFacts(allIncidents, {
      projectId: projectId || undefined,
      projectName: project?.name,
    });
    setFacts(scopedFacts);
    setFactsBlock(factsToPromptBlock(scopedFacts));
    setEvidence(scopedFacts.evidence);
  }, [allIncidents, projectId, projects]);

  const catalogue = useMemo(() => {
    const preferred = new Set(sectionsForKind(kind).map((s) => s.id));
    return allSections().map((section) => {
      const allowed = tierMeetsMinimum(tier, section.minTier);
      return { ...section, allowed, preferred: preferred.has(section.id) };
    });
  }, [kind, tier]);

  useEffect(() => {
    const next = new Set<ReportSectionId>();
    for (const section of catalogue) {
      if (section.allowed && section.preferred) next.add(section.id);
    }
    setSelected(next);
  }, [catalogue]);

  const lockedSections = catalogue.filter((s) => !s.allowed);
  const project = projects.find((p) => p.id === projectId);

  async function handleCompose() {
    setError(null);
    const included = catalogue.filter(
      (s) => s.allowed && selected.has(s.id),
    );
    if (!included.length) {
      setError("Pick at least one topic to include in the report.");
      setStatus("error");
      return;
    }
    if (!facts) {
      setError("Workspace evidence is still loading.");
      setStatus("error");
      return;
    }
    if (!facts.attended.length) {
      setError(
        "No demo/workspace cases available to write from. Open Demo mode or log cases first.",
      );
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const result = await aiService.composeActivityReport({
        kind,
        kindLabel: REPORT_KIND_LABELS[kind],
        audience,
        audienceLabel: REPORT_AUDIENCE_LABELS[audience],
        periodLabel,
        authorTierLabel: DESK_TIER_LABELS[tier],
        authorName,
        projectName: project?.name,
        includedSectionIds: included.map((s) => s.id),
        includedSectionLabels: included.map((s) => s.label),
        lockedSectionLabels: lockedSections.map((s) => s.label),
        factsBlock,
        factsJson: JSON.stringify(facts),
        tonePreference:
          audience === "board" || audience === "funders_investors"
            ? "board"
            : audience === "regulator"
              ? "formal"
              : "plain",
      });
      if (looksLikeReportTemplateGuide(result.bodyMarkdown)) {
        throw new Error(
          "AI returned a template guide instead of a report. The evidence writer blocked it — try again.",
        );
      }
      setDraft(result);
      setBody(result.bodyMarkdown);
      setStatus("ready");
      pushToast(
        `Report written from ${facts.attended.length} cases (e.g. ${facts.attended[0]?.id}) — review then save`,
        "success",
      );
    } catch (err) {
      setDraft(null);
      setError(err instanceof Error ? err.message : "Compose failed");
      setStatus("error");
    }
  }

  function handleApplyDraft() {
    if (!draft) return;
    setBody(draft.bodyMarkdown);
    pushToast("Draft applied — edit before save", "success");
  }

  function togglePurpose(tag: "reporting" | "performance" | "dispute") {
    setPurposes((prev) =>
      prev.includes(tag) ? prev.filter((p) => p !== tag) : [...prev, tag],
    );
  }

  function handleSave(statusValue: SavedReport["status"]) {
    if (!body.trim()) {
      pushToast("Generate or write a report body first", "error");
      return;
    }
    requireEmailThen("save", () => {
      const now = new Date().toISOString();
      const id = savedId || createReportId();
      const included = [...selected].filter((id) =>
        catalogue.some((s) => s.id === id && s.allowed),
      );
      const report: SavedReport = {
        id,
        kind,
        audience,
        title: draft?.title || `${REPORT_KIND_LABELS[kind]} — ${periodLabel}`,
        periodLabel,
        authorTier: tier,
        authorName,
        projectId: project?.id,
        projectName: project?.name,
        includedSections: included,
        lockedSections: lockedSections.map((s) => s.id),
        bodyMarkdown: body,
        evidence,
        status: statusValue,
        createdAt: now,
        updatedAt: now,
        purposeTags: purposes.length ? purposes : ["reporting"],
      };
      saveAuthoredReport(report);
      setSavedId(id);
      pushToast(
        statusValue === "submitted"
          ? "Report submitted to library"
          : "Draft saved to library",
        "success",
      );
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Create a report</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Pick topics, then AI writes a finished report from the demo case
          desk (not a blank template). It cites real case IDs from this
          workspace. Edit and save before sharing.
        </p>
        {facts ? (
          <p className="mt-2 rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-xs text-tl-ink-muted">
            <span className="font-medium text-tl-ink">Data in scope:</span>{" "}
            {facts.attended.length} case
            {facts.attended.length === 1 ? "" : "s"}
            {facts.attended[0]
              ? ` · ${facts.attended
                  .slice(0, 4)
                  .map((i) => i.id)
                  .join(", ")}${facts.attended.length > 4 ? "…" : ""}`
              : ""}
            {" · "}trust {facts.trustIndex}/100 ({facts.trustLabel})
            {project?.name ? ` · ${project.name}` : ""}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-tl-ink-muted">
          Author desk:{" "}
          <span className="font-medium text-tl-ink">
            {DESK_TIER_LABELS[tier]}
          </span>
          {" · "}
          <Link href="/app/settings" className="text-tl-trust-ink underline">
            Change tier
          </Link>
        </p>
      </div>

      <section className="grid gap-4 rounded-lg border border-tl-line bg-tl-surface p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Report type</span>
          <select
            className="w-full rounded-md border border-tl-line px-3 py-2"
            value={kind}
            onChange={(e) => setKind(e.target.value as ReportKind)}
          >
            {REPORT_KINDS.map((id) => (
              <option key={id} value={id}>
                {REPORT_KIND_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Audience</span>
          <select
            className="w-full rounded-md border border-tl-line px-3 py-2"
            value={audience}
            onChange={(e) => setAudience(e.target.value as ReportAudience)}
          >
            {REPORT_AUDIENCES.map((id) => (
              <option key={id} value={id}>
                {REPORT_AUDIENCE_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Period</span>
          <input
            className="w-full rounded-md border border-tl-line px-3 py-2"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Project</span>
          <select
            className="w-full rounded-md border border-tl-line px-3 py-2"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">All / portfolio</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold">Topics to cover</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          AI writes only the topics you select, using cases
          {facts
            ? ` (${facts.attended.length} in scope · trust ${facts.trustIndex}/100)`
            : ""}
          . Greyed topics are above this desk grade — visible, not selectable.
        </p>
        <ul className="mt-3 space-y-2">
          {catalogue.map((section) => {
            const checked = selected.has(section.id);
            return (
              <li key={section.id}>
                <label
                  className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                    section.allowed
                      ? "border-tl-line bg-tl-paper/40"
                      : "border-tl-line/60 bg-tl-paper/20 opacity-55"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    disabled={!section.allowed}
                    checked={section.allowed ? checked : false}
                    onChange={(e) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(section.id);
                        else next.delete(section.id);
                        return next;
                      });
                    }}
                  />
                  <span>
                    <span className="font-medium text-tl-ink">
                      {section.label}
                    </span>
                    {!section.allowed ? (
                      <span className="ml-2 text-xs text-tl-ink-muted">
                        (requires {DESK_TIER_LABELS[section.minTier]}+)
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-tl-ink-muted">
                      {section.description}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold">Evidence &amp; purpose</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Linked from Capture hub and case desk — usable for reporting,
          performance, and dispute support.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-tl-ink-muted">
          {evidence.map((e) => (
            <li key={e.id}>
              <span className="font-medium text-tl-ink">{e.kind}</span> —{" "}
              {e.label}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {(
            [
              ["reporting", "Reporting"],
              ["performance", "Performance evidence"],
              ["dispute", "Dispute evidence"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={purposes.includes(id)}
                onChange={() => togglePurpose(id)}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <AiAssistButton
          label="AI write the report"
          onClick={() => void handleCompose()}
          loading={status === "loading"}
        />
        <button
          type="button"
          onClick={handleApplyDraft}
          disabled={!draft}
          className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Apply draft to editor
        </button>
        <button
          type="button"
          onClick={() => handleSave("draft")}
          className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => handleSave("submitted")}
          className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Submit to library
        </button>
        <Link
          href="/app/dashboard"
          className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper"
        >
          View on dashboard
        </Link>
      </div>

      <AiSuggestionPanel
        title={draft?.title || "Report draft"}
        status={status}
        error={error}
        model={draft?.model}
        promptVersion={draft?.promptVersion}
        confidence={draft?.confidence}
      >
        {draft ? (
          <>
            <p className="mb-3 text-sm text-tl-ink-muted">
              {draft.executiveHighlight}
            </p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-tl-line bg-tl-paper/50 p-3 font-mono text-xs text-tl-ink">
              {draft.bodyMarkdown.slice(0, 1200)}
              {draft.bodyMarkdown.length > 1200 ? "…" : ""}
            </pre>
          </>
        ) : null}
      </AiSuggestionPanel>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          Report body (edit after AI)
        </span>
        <textarea
          rows={18}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border border-tl-line px-3 py-2 font-mono text-xs"
          placeholder="AI draft appears here — refine for your supervisor or board."
        />
      </label>

      {savedId ? (
        <p className="text-sm text-tl-ink-muted">
          Saved as <span className="font-medium text-tl-ink">{savedId}</span>.
          Open the dashboard report library to view by desk level.
        </p>
      ) : null}
    </div>
  );
}
