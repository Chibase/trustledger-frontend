"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { ReportPresentationView } from "@/components/reports/ReportPresentationView";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import { useToast } from "@/components/ui/Toast";
import {
  DESK_TIER_LABELS,
  type DeskTier,
} from "@/types/deskTier";
import {
  REPORT_AUDIENCES,
  REPORT_AUDIENCE_LABELS,
  REPORT_FORMAT_LABELS,
  REPORT_KIND_LABELS,
  REPORT_KINDS,
  type ReportAudience,
  type ReportFormatId,
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
import {
  listCaptureRecords,
  PACK_SOURCE_META,
  type PackCaptureSource,
} from "@/lib/captureStore";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  bodyCitesAnyCaseId,
  buildPeriodActivityFacts,
  factsToPromptBlock,
  funderSnapshotFromFacts,
  looksLikeReportTemplateGuide,
  periodFactsHaveWritableEvidence,
  riskRowsFromFacts,
  type PeriodActivityFacts,
} from "@/lib/reportComposer";
import {
  defaultFormatForLens,
  executiveChartGroups,
  FIXED_BRIEF_OUTLINE,
  funderChartGroups,
  lensUsesFixedBrief,
  monthlyChartGroups,
  reportLensForKind,
} from "@/lib/reportLenses";
import {
  buildProjectCategoryMap,
  categoriesForReportKind,
} from "@/lib/projectCategoryMap";
import { dossierSummaryLines } from "@/lib/projectDossier";
import { loadReportWorkspaceLists } from "@/lib/reportWorkspaceLists";
import {
  createReportId,
  getSavedReport,
  listSavedReports,
  purgeTemplateGuideReports,
  saveAuthoredReport,
} from "@/lib/reportStore";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import { aiService } from "@/services/aiService";
import type {
  ActivityReportComposeSuggestion,
  AiSuggestionStatus,
} from "@/types/ai";
import type { Incident } from "@/types/incident";
import {
  projectChipLabel,
  projectHasDossierBasics,
  type Project,
} from "@/types/project";
import type { Commitment } from "@/types/commitment";
import type { ClientReportPdfPayload } from "@/types/reportPresentation";
import type { UserRole } from "@/types/rbac";

export type { ReportFormatId };

const FORMAT_OPTIONS: Array<{
  id: ReportFormatId;
  label: string;
  hint: string;
}> = [
  {
    id: "charts",
    label: REPORT_FORMAT_LABELS.charts,
    hint: "Category charts from mapped project data",
  },
  {
    id: "details",
    label: REPORT_FORMAT_LABELS.details,
    hint: "Narrative filled from the chosen kind’s map",
  },
  {
    id: "charts_details",
    label: REPORT_FORMAT_LABELS.charts_details,
    hint: "Combined print-ready pack",
  },
];

function slugFilePart(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

type CreateReportWizardProps = {
  role: UserRole;
  authorName: string;
  initialKind?: ReportKind;
  initialAudience?: ReportAudience;
};

function currentMonthLabel() {
  return new Date().toLocaleString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

function packEvidenceSummary(projectId: string): string[] {
  const rows = listCaptureRecords().filter((r) => r.projectId === projectId);
  const byPack = new Map<string, { count: number; pathways: number }>();
  let latestIssuePathways: number | null = null;
  for (const row of rows) {
    const pack = row.structured?.pack || row.source;
    const prev = byPack.get(pack) || { count: 0, pathways: 0 };
    prev.count += 1;
    if (row.structured?.pack === "issue_log" && latestIssuePathways === null) {
      latestIssuePathways = (row.structured.data.entries || []).filter((e) =>
        e.title?.trim(),
      ).length;
      prev.pathways = latestIssuePathways;
    }
    byPack.set(pack, prev);
  }
  return [...byPack.entries()].map(([pack, meta]) => {
    const label =
      PACK_SOURCE_META[pack as PackCaptureSource]?.label || pack;
    const pathwayBit =
      pack === "issue_log" && meta.pathways
        ? ` (${meta.pathways} pathway${meta.pathways === 1 ? "" : "s"})`
        : "";
    return `${label} ×${meta.count}${pathwayBit}`;
  });
}

export function CreateReportWizard({
  role,
  authorName,
  initialKind,
  initialAudience,
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
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [allCommitments, setAllCommitments] = useState<Commitment[]>([]);
  const [purgedTemplates, setPurgedTemplates] = useState(0);
  const [format, setFormat] = useState<ReportFormatId>("charts_details");
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [library, setLibrary] = useState<SavedReport[]>([]);

  useEffect(() => {
    function refreshLibrary() {
      if (!projectId) {
        setLibrary([]);
        return;
      }
      setLibrary(listSavedReports().filter((r) => r.projectId === projectId));
    }
    refreshLibrary();
    window.addEventListener("tl-reports-changed", refreshLibrary);
    window.addEventListener("storage", refreshLibrary);
    return () => {
      window.removeEventListener("tl-reports-changed", refreshLibrary);
      window.removeEventListener("storage", refreshLibrary);
    };
  }, [projectId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const desk = readDeskTier(role);
      setTier(desk);
      setKind(initialKind || defaultKindForTier(desk));
      setAudience(initialAudience || defaultAudienceForTier(desk));
    });
    return () => cancelAnimationFrame(frame);
  }, [role, initialKind, initialAudience]);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      // Drop old Cloud LLM month-end drafts from this browser.
      setPurgedTemplates(purgeTemplateGuideReports());
      // Never keep a leftover Month-End paste in the editor across visits.
      setBody("");
      setDraft(null);
      setStatus("idle");
      setError(null);
      setSavedId(null);

      void (async () => {
        // Same project list path as Capture — Cloud/VIP + local dossier overlay.
        const lists = await loadReportWorkspaceLists();
        if (cancelled) return;
        const rows = lists.projects;
        setProjects(rows);
        setAllIncidents(lists.incidents);
        setAllCommitments(lists.commitments);
        const fromQuery =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("projectId")
            : null;
        const preferred =
          (fromQuery && rows.some((p) => p.id === fromQuery) && fromQuery) ||
          (rows.length === 1 ? rows[0].id : "");
        setProjectId(preferred);
      })();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!projectId) {
        setFacts(null);
        setFactsBlock("");
        setEvidence([]);
        return;
      }
      const selectedProject = projects.find((p) => p.id === projectId);
      const scopedFacts = buildPeriodActivityFacts(allIncidents, {
        projectId,
        projectName: selectedProject?.name,
        project: selectedProject,
        commitments: allCommitments,
      });
      setFacts(scopedFacts);
      setFactsBlock(factsToPromptBlock(scopedFacts));
      setEvidence(scopedFacts.evidence);
    });
    return () => cancelAnimationFrame(frame);
  }, [allIncidents, allCommitments, projectId, projects]);

  const catalogue = useMemo(() => {
    const preferred = new Set(sectionsForKind(kind).map((s) => s.id));
    return allSections().map((section) => {
      const allowed = tierMeetsMinimum(tier, section.minTier);
      return { ...section, allowed, preferred: preferred.has(section.id) };
    });
  }, [kind, tier]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const next = new Set<ReportSectionId>();
      for (const section of catalogue) {
        if (section.allowed && section.preferred) next.add(section.id);
      }
      setSelected(next);
    });
    return () => cancelAnimationFrame(frame);
  }, [catalogue]);

  const lockedSections = catalogue.filter((s) => !s.allowed);
  const project = projects.find((p) => p.id === projectId);
  const packLines = projectId ? packEvidenceSummary(projectId) : [];
  const lens = reportLensForKind(kind);
  const fixedOutline = lensUsesFixedBrief(lens)
    ? FIXED_BRIEF_OUTLINE[lens]
    : null;

  const categories = useMemo(() => {
    if (!project) return [];
    return buildProjectCategoryMap({
      project,
      incidents: allIncidents,
    });
  }, [project, allIncidents]);

  const kindChartBarsForKind = useCallback(
    (targetKind: ReportKind) => {
      const rows = categoriesForReportKind(categories, targetKind);
      const bars: Array<{ label: string; value: number }> = [];
      for (const cat of rows) {
        for (const b of cat.chartBars) {
          if (b.value > 0) {
            bars.push({
              label: `${cat.label.split(" ")[0]}: ${b.label}`.slice(0, 28),
              value: b.value,
            });
          }
        }
      }
      return bars.slice(0, 10);
    },
    [categories],
  );

  const kindChartBars = useMemo(
    () => kindChartBarsForKind(kind),
    [kindChartBarsForKind, kind],
  );

  const riskRows = useMemo(
    () => (facts ? riskRowsFromFacts(facts) : []),
    [facts],
  );

  const funderSnapshot = useMemo(
    () => (facts ? funderSnapshotFromFacts(facts) : undefined),
    [facts],
  );

  const chartGroups = useMemo(() => {
    if (lens === "executive") return executiveChartGroups(riskRows);
    if (lens === "funder") return funderChartGroups(funderSnapshot);
    return monthlyChartGroups(facts?.attended || [], kindChartBars);
  }, [lens, riskRows, funderSnapshot, facts, kindChartBars]);

  function chartGroupsForKind(targetKind: ReportKind) {
    const targetLens = reportLensForKind(targetKind);
    if (targetLens === "executive") return executiveChartGroups(riskRows);
    if (targetLens === "funder") return funderChartGroups(funderSnapshot);
    return monthlyChartGroups(
      facts?.attended || [],
      kindChartBarsForKind(targetKind),
    );
  }

  const reportTitle = `${REPORT_KIND_LABELS[kind]} — ${project?.name || periodLabel}`;

  function selectProject(nextId: string) {
    setProjectId(nextId);
    setDraft(null);
    setBody("");
    setStatus("idle");
    setError(null);
    setSavedId(null);
    setLibrary(listSavedReports().filter((r) => r.projectId === nextId));
  }

  function buildPdfPayload(opts?: {
    format?: ReportFormatId;
    bodyMarkdown?: string;
    title?: string;
    kind?: ReportKind;
    audience?: ReportAudience;
    period?: string;
  }): ClientReportPdfPayload {
    const fmt = opts?.format ?? format;
    const title =
      opts?.title ??
      (savedId
        ? getSavedReport(savedId)?.title || reportTitle
        : draft?.title || reportTitle);
    const k = opts?.kind ?? kind;
    const aud = opts?.audience ?? audience;
    const period = opts?.period ?? periodLabel;
    return {
      title,
      projectName: project?.name || "",
      periodLabel: period,
      kindLabel: REPORT_KIND_LABELS[k],
      audienceLabel: REPORT_AUDIENCE_LABELS[aud],
      format: fmt,
      narrativeMarkdown: (opts?.bodyMarkdown ?? body).trim(),
      lens: reportLensForKind(k),
      chartGroups: chartGroupsForKind(k),
      riskRows,
      funderSnapshot,
      trustIndex: facts?.trustIndex ?? 0,
      trustLabel: facts?.trustLabel,
    };
  }

  async function handleDownload(opts?: {
    format?: ReportFormatId;
    bodyMarkdown?: string;
    title?: string;
    kind?: ReportKind;
    audience?: ReportAudience;
    period?: string;
  }) {
    if (!project) return;
    const fmt = opts?.format ?? format;
    const k = opts?.kind ?? kind;
    setDownloadingPdf(true);
    setError(null);
    try {
      const payload = buildPdfPayload(opts);
      const res = await fetch("/api/app/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let message = "Could not build the PDF.";
        try {
          const json = (await res.json()) as { error?: string };
          if (json.error) message = json.error;
        } catch {
          /* keep default */
        }
        throw new Error(message);
      }
      const pdf = await res.blob();
      const url = URL.createObjectURL(pdf);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugFilePart(project.name)}-${slugFilePart(k)}-${slugFilePart(fmt)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  function handlePrint() {
    window.setTimeout(() => window.print(), 40);
  }

  function openPresentation(nextFormat?: ReportFormatId) {
    if (nextFormat) setFormat(nextFormat);
    setPresentationOpen(true);
  }

  function openSaved(report: SavedReport) {
    setKind(report.kind);
    setAudience(report.audience);
    setPeriodLabel(report.periodLabel);
    const fmt = report.preferredFormat || "charts_details";
    setBody(report.bodyMarkdown);
    setSavedId(report.id);
    setFormat(fmt);
    setPresentationOpen(true);
  }

  async function handleCompose() {
    setError(null);
    if (!projectId || !project) {
      setError("Select a project first — reports are generated from its dossier and linked cases.");
      setStatus("error");
      return;
    }
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
    if (!periodFactsHaveWritableEvidence(facts)) {
      setError(
        kind === "mel_retrospective"
          ? "No Learn & Adapt evidence yet. Add expected vs actual, a root-cause tag, a Learn & Adapt record, or a case before writing this retrospective."
          : isCustomerWorkspaceClient()
          ? "No project evidence yet. Complete project details under Capture (dossier / report packs), or log a case, before writing a report."
          : "No workspace evidence yet. Log a case or complete project details under Capture.",
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
      if (
        facts.attended.length > 0 &&
        !bodyCitesAnyCaseId(
          result.bodyMarkdown,
          facts.attended.map((i) => i.id),
        )
      ) {
        throw new Error(
          "Draft missing case citations. Evidence writer did not run — hard-refresh and retry.",
        );
      }
      if (!String(result.model || "").includes("trustledger-evidence")) {
        throw new Error(
          `Unexpected model “${result.model}”. Expected trustledger-evidence — hard-refresh the page.`,
        );
      }
      setDraft(result);
      setBody(result.bodyMarkdown);
      setStatus("ready");
      setPresentationOpen(true);
      pushToast(
        kind === "mel_retrospective"
          ? "Retrospective written from workspace evidence — review, apply, then save"
          : facts.attended.length
          ? `Report written from ${facts.attended.length} cases (e.g. ${facts.attended[0]?.id}) — review then save`
          : "Report written from project dossier / Capture packs — review then save",
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
        preferredFormat: format,
      };
      saveAuthoredReport(report);
      setSavedId(id);
      if (project) {
        setLibrary(listSavedReports().filter((r) => r.projectId === project.id));
      }
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
          Choose the project first — same as Capture — then the local evidence
          writer drafts from that project’s dossier, Capture packs, and linked
          cases. Cloud LLM is not used for this step (it returned fill-in-the-blank
          templates). Confirm the model label shows{" "}
          <span className="font-mono text-tl-ink">trustledger-evidence</span>.
        </p>
        {purgedTemplates > 0 ? (
          <p className="mt-2 rounded-md border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-tl-ink">
            Removed {purgedTemplates} old placeholder draft
            {purgedTemplates === 1 ? "" : "s"} from this browser’s report
            library (Month-End / [Insert …] templates).
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

      <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="report-project"
          >
            Project{" "}
            <span className="text-tl-ink-muted">(required first)</span>
          </label>
          <select
            id="report-project"
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            value={projectId}
            onChange={(e) => selectProject(e.target.value)}
            required
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {projectChipLabel(p)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-tl-ink-muted">
            Reports use only the Capture packs and cases linked to this project.
            No project yet?{" "}
            <Link href="/app/projects" className="text-tl-trust-ink underline">
              Add one under Projects
            </Link>{" "}
            or complete details under{" "}
            <Link href="/app/capture" className="text-tl-trust-ink underline">
              Capture
            </Link>
            .
          </p>
        </div>

        {!projectId ? (
          <p className="text-sm text-tl-ink-muted">
            Select a project to unlock report type, topics, and AI draft.
          </p>
        ) : null}

        {project ? (
          <div className="rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-xs text-tl-ink-muted">
            <p className="font-medium text-tl-ink">
              Evidence for {project.name}
            </p>
            {projectHasDossierBasics(project) ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {dossierSummaryLines(project)
                  .slice(0, 6)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ul>
            ) : (
              <p className="mt-1">
                Project details are thin — complete them under{" "}
                <Link href="/app/capture" className="underline">
                  Capture
                </Link>{" "}
                so the report can reuse funder, geo, and empowerment facts.
              </p>
            )}
            {packLines.length ? (
              <p className="mt-2">
                <span className="font-medium text-tl-ink">Capture packs:</span>{" "}
                {packLines.join(" · ")}
              </p>
            ) : (
              <p className="mt-2">
                No Capture packs saved for this project yet — dossier baselines
                still apply when present.
              </p>
            )}
            {facts ? (
              <p className="mt-2">
                <span className="font-medium text-tl-ink">In scope:</span>{" "}
                {facts.attended.length} case
                {facts.attended.length === 1 ? "" : "s"}
                {facts.attended[0]
                  ? ` (${facts.attended
                      .slice(0, 4)
                      .map((i) => i.id)
                      .join(", ")}${facts.attended.length > 4 ? "…" : ""})`
                  : ""}
                {" · "}trust {facts.trustIndex}/100 ({facts.trustLabel})
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {projectId && project ? (
        <>
      <section className="grid gap-4 rounded-lg border border-tl-line bg-tl-surface p-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">1. Report type</span>
          <select
            className="w-full rounded-md border border-tl-line px-3 py-2"
            value={kind}
            onChange={(e) => {
              const next = e.target.value as ReportKind;
              setKind(next);
              setBody("");
              setDraft(null);
              setSavedId(null);
              setStatus("idle");
              setFormat(defaultFormatForLens(reportLensForKind(next)));
            }}
          >
            {REPORT_KINDS.map((id) => (
              <option key={id} value={id}>
                {REPORT_KIND_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">2. Format</span>
          <select
            className="w-full rounded-md border border-tl-line px-3 py-2"
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormatId)}
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">3. Audience</span>
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
        <label className="block text-sm sm:col-span-3">
          <span className="mb-1 block font-medium">Period</span>
          <input
            className="w-full rounded-md border border-tl-line px-3 py-2"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
          />
        </label>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold">
          {fixedOutline ? "Fixed brief" : "Mapped topics (automatic)"}
        </h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          For{" "}
          <span className="font-medium text-tl-ink">
            {REPORT_KIND_LABELS[kind]}
          </span>
          {project ? (
            <>
              {" "}
              on{" "}
              <span className="font-medium text-tl-ink">{project.name}</span>
            </>
          ) : null}
          {fixedOutline
            ? lens === "retrospective"
              ? " this retrospective always writes What worked / What did not / What we will change. The draft is a suggestion — apply it, then save. It does not close a grievance."
              : " this pack always writes the outline below. Topics are locked so the brief does not become a monthly dump."
            : " topics are fixed by the report kind — you do not pick them. Prefer the "}
          {!fixedOutline && project ? (
            <>
              <Link
                href={`/app/projects/${encodeURIComponent(project.id)}#project-reports`}
                className="text-tl-trust-ink underline"
              >
                project dashboard
              </Link>{" "}
              for category-mapped charts and generation.
            </>
          ) : null}
          {facts
            ? ` Evidence: ${facts.attended.length} cases · ${packLines.length} pack type${packLines.length === 1 ? "" : "s"} · trust ${facts.trustIndex}/100.`
            : ""}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {(fixedOutline
            ? fixedOutline
            : catalogue
                .filter((s) => s.allowed && s.preferred)
                .map((s) => s.label)
          ).map((label) => (
            <li
              key={label}
              className="rounded-md border border-tl-line bg-tl-paper px-2 py-1 text-tl-ink"
            >
              {label}
            </li>
          ))}
        </ul>
        {lockedSections.length && !fixedOutline ? (
          <p className="mt-2 text-xs text-tl-ink-muted">
            Above this desk:{" "}
            {lockedSections.map((s) => s.label).join(", ")}.
          </p>
        ) : null}
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
          onClick={() => openPresentation()}
          disabled={!body.trim()}
          className="rounded-md border border-tl-trust/40 bg-tl-paper px-4 py-2 text-sm font-medium text-tl-trust-ink hover:border-tl-trust disabled:opacity-50"
        >
          View report
        </button>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={!body.trim() || downloadingPdf}
          className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => {
            openPresentation();
            handlePrint();
          }}
          disabled={!body.trim()}
          className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Print
        </button>
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
        <div className="flex flex-wrap items-center gap-2 text-sm text-tl-ink-muted">
          <span>
            Saved as <span className="font-medium text-tl-ink">{savedId}</span>.
          </span>
          <button
            type="button"
            onClick={() => openPresentation()}
            className="font-medium text-tl-trust-ink underline hover:text-tl-trust"
          >
            View report presentation
          </button>
          <span>· Open the dashboard report library to view by desk level.</span>
        </div>
      ) : null}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-tl-ink">
          Saved on this project
        </h3>
        {library.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">
            No saved reports yet on this project.
          </p>
        ) : (
          <ul className="divide-y divide-tl-line rounded-md border border-tl-line bg-tl-paper text-sm">
            {library.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <span>
                  <span className="font-medium">{r.title}</span>
                  <span className="text-tl-ink-muted">
                    {" "}
                    · {r.periodLabel} · {r.status}
                    {r.preferredFormat
                      ? ` · ${REPORT_FORMAT_LABELS[r.preferredFormat]}`
                      : ""}
                  </span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-tl-trust-ink underline"
                    onClick={() => openSaved(r)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-tl-ink underline"
                    onClick={() =>
                      void handleDownload({
                        format: r.preferredFormat || "charts_details",
                        bodyMarkdown: r.bodyMarkdown,
                        title: r.title,
                        kind: r.kind,
                        audience: r.audience,
                        period: r.periodLabel,
                      })
                    }
                  >
                    Download PDF
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-tl-ink underline"
                    onClick={() => {
                      openSaved(r);
                      window.setTimeout(() => window.print(), 80);
                    }}
                  >
                    Print
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {project ? (
        <ReportPresentationView
          open={presentationOpen}
          onClose={() => setPresentationOpen(false)}
          title={
            savedId
              ? getSavedReport(savedId)?.title || reportTitle
              : draft?.title || reportTitle
          }
          projectName={project.name}
          periodLabel={periodLabel}
          kind={kind}
          audience={audience}
          format={format}
          onFormatChange={setFormat}
          bodyMarkdown={body}
          chartBars={kindChartBars}
          onPrint={handlePrint}
          onDownload={() => void handleDownload()}
          downloading={downloadingPdf}
          reportId={savedId}
          projectId={project.id}
          lens={lens}
          riskRows={riskRows}
          funderSnapshot={funderSnapshot}
          chartGroups={chartGroups}
          trustIndex={facts?.trustIndex ?? 0}
          trustLabel={facts?.trustLabel}
        />
      ) : null}
        </>
      ) : null}
    </div>
  );
}
