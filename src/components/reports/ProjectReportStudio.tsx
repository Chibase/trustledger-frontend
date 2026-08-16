"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { ReportPresentationView } from "@/components/reports/ReportPresentationView";
import { defaultAudienceForTier, sectionsForKind } from "@/config/reportCatalogue";
import {
  categoriesForReportKind,
  kindDataCoverageSummary,
  type ProjectDataCategory,
} from "@/lib/projectCategoryMap";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  buildPeriodActivityFacts,
  composeActivityReportMarkdown,
  factsToPromptBlock,
  looksLikeReportTemplateGuide,
  periodFactsHaveWritableEvidence,
} from "@/lib/reportComposer";
import {
  getSavedReport,
  listSavedReports,
  saveAuthoredReport,
} from "@/lib/reportStore";
import { listWorkspaceIncidents } from "@/lib/workspaceData";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import { aiService } from "@/services/aiService";
import {
  DESK_TIER_LABELS,
  tierMeetsMinimum,
  type DeskTier,
} from "@/types/deskTier";
import {
  REPORT_AUDIENCE_LABELS,
  REPORT_AUDIENCES,
  REPORT_FORMAT_LABELS,
  REPORT_KIND_LABELS,
  REPORT_KINDS,
  type ReportAudience,
  type ReportFormatId,
  type ReportKind,
  type ReportSectionId,
  type SavedReport,
} from "@/types/activityReport";
import type { AiSuggestionStatus } from "@/types/ai";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
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

type Props = {
  project: Project;
  role: UserRole;
  authorName: string;
  incidents?: Incident[];
  categories: ProjectDataCategory[];
};

function currentMonthLabel() {
  return new Date().toLocaleString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

function slugFilePart(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * Report generation on the project dashboard:
 * choose kind + format + level only — mapped category data fills the template.
 * View opens a full-screen presentation in the chosen format; download/print
 * stay available for any format.
 */
export function ProjectReportStudio({
  project,
  role,
  authorName,
  incidents: seedIncidents,
  categories,
}: Props) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [kind, setKind] = useState<ReportKind>("esg");
  const [audience, setAudience] = useState<ReportAudience>("clients");
  const [format, setFormat] = useState<ReportFormatId>("charts_details");
  const [periodLabel, setPeriodLabel] = useState(currentMonthLabel());
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents || []);
  const [library, setLibrary] = useState<SavedReport[]>([]);
  const [presentationOpen, setPresentationOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const desk = readDeskTier(role);
      setTier(desk);
      setAudience(defaultAudienceForTier(desk));
      setIncidents(
        seedIncidents?.length
          ? seedIncidents
          : listWorkspaceIncidents().filter((i) => i.projectId === project.id),
      );
      setLibrary(
        listSavedReports().filter((r) => r.projectId === project.id),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [role, project.id, seedIncidents]);

  const included = useMemo(() => {
    return sectionsForKind(kind).filter((s) =>
      tierMeetsMinimum(tier, s.minTier),
    );
  }, [kind, tier]);

  const mappedCategories = useMemo(
    () => categoriesForReportKind(categories, kind),
    [categories, kind],
  );

  const coverage = useMemo(
    () => kindDataCoverageSummary(categories, kind),
    [categories, kind],
  );

  const facts = useMemo(
    () =>
      buildPeriodActivityFacts(incidents, {
        projectId: project.id,
        project,
      }),
    [incidents, project],
  );

  const showCharts = format === "charts" || format === "charts_details";
  const showDetails = format === "details" || format === "charts_details";
  const reportTitle = `${REPORT_KIND_LABELS[kind]} — ${project.name}`;

  const kindChartBars = useMemo(() => {
    const bars: Array<{ label: string; value: number }> = [];
    for (const cat of mappedCategories) {
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
  }, [mappedCategories]);

  /** Always-resolved details text for view / download / print (never empty placeholder). */
  const effectiveBody = useMemo(() => {
    if (body.trim()) return body;
    if (!included.length) {
      return `## ${REPORT_KIND_LABELS[kind]}\n\nNo topics are available for this desk on the selected kind.`;
    }
    if (!periodFactsHaveWritableEvidence(facts)) {
      return `## ${REPORT_KIND_LABELS[kind]}\n\nNo mapped project evidence yet for **${project.name}** (${periodLabel}). Capture category packs or cases on this project, then view, download, or print again.`;
    }
    return composeActivityReportMarkdown({
      kindLabel: REPORT_KIND_LABELS[kind],
      audienceLabel: REPORT_AUDIENCE_LABELS[audience],
      periodLabel,
      authorTierLabel: DESK_TIER_LABELS[tier],
      authorName,
      projectName: project.name,
      includedSectionIds: included.map((s) => s.id),
      includedSectionLabels: included.map((s) => s.label),
      lockedSectionLabels: [],
      facts,
      tonePreference:
        audience === "board" || audience === "funders_investors"
          ? "board"
          : audience === "regulator"
            ? "formal"
            : "plain",
    }).bodyMarkdown;
  }, [
    body,
    included,
    kind,
    facts,
    project.name,
    periodLabel,
    audience,
    tier,
    authorName,
  ]);

  /**
   * Details body for view / download / print — never leave an empty placeholder.
   * Uses saved/generated body when present; otherwise composes from mapped evidence.
   */
  function resolveNarrativeBody(opts?: {
    bodyMarkdown?: string;
    kind?: ReportKind;
    audience?: ReportAudience;
    period?: string;
  }): string {
    const existing = (opts?.bodyMarkdown ?? body).trim();
    if (existing) return existing;

    const k = opts?.kind ?? kind;
    const aud = opts?.audience ?? audience;
    const period = opts?.period ?? periodLabel;
    // Same inputs as effectiveBody when opts match current state.
    if (
      k === kind &&
      aud === audience &&
      period === periodLabel &&
      !(opts?.bodyMarkdown ?? "").trim()
    ) {
      return effectiveBody;
    }
    const sections = sectionsForKind(k).filter((s) =>
      tierMeetsMinimum(tier, s.minTier),
    );
    if (!sections.length) {
      return `## ${REPORT_KIND_LABELS[k]}\n\nNo topics are available for this desk on the selected kind.`;
    }
    if (!periodFactsHaveWritableEvidence(facts)) {
      return `## ${REPORT_KIND_LABELS[k]}\n\nNo mapped project evidence yet for **${project.name}** (${period}). Capture category packs or cases on this project, then view, download, or print again.`;
    }

    const composed = composeActivityReportMarkdown({
      kindLabel: REPORT_KIND_LABELS[k],
      audienceLabel: REPORT_AUDIENCE_LABELS[aud],
      periodLabel: period,
      authorTierLabel: DESK_TIER_LABELS[tier],
      authorName,
      projectName: project.name,
      includedSectionIds: sections.map((s) => s.id),
      includedSectionLabels: sections.map((s) => s.label),
      lockedSectionLabels: [],
      facts,
      tonePreference:
        aud === "board" || aud === "funders_investors"
          ? "board"
          : aud === "regulator"
            ? "formal"
            : "plain",
    });
    return composed.bodyMarkdown;
  }

  async function handleCompose() {
    setError(null);
    if (!included.length) {
      setError("No topics available for this desk on the selected kind.");
      setStatus("error");
      return;
    }
    if (!periodFactsHaveWritableEvidence(facts)) {
      setError(
        isCustomerWorkspaceClient()
          ? "Fill at least one category above (Capture packs or cases) before generating."
          : "No mapped project evidence yet. Capture category data first.",
      );
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const factsBlock = [
        factsToPromptBlock(facts),
        "",
        `MAPPED CATEGORIES FOR ${REPORT_KIND_LABELS[kind]}:`,
        ...mappedCategories.map((c) => {
          const lines = c.facts
            .map((f) => `  - ${f.label}: ${f.value}`)
            .join("\n");
          return `${c.label}${c.hasData ? "" : " (empty)"}:\n${lines}`;
        }),
      ].join("\n");

      const result = await aiService.composeActivityReport({
        kind,
        kindLabel: REPORT_KIND_LABELS[kind],
        audience,
        audienceLabel: REPORT_AUDIENCE_LABELS[audience],
        periodLabel,
        authorTierLabel: DESK_TIER_LABELS[tier],
        authorName,
        projectName: project.name,
        includedSectionIds: included.map((s) => s.id),
        includedSectionLabels: included.map((s) => s.label),
        lockedSectionLabels: [],
        factsBlock,
        factsJson: JSON.stringify({
          facts,
          categoryMap: mappedCategories,
        }),
        tonePreference:
          audience === "board" || audience === "funders_investors"
            ? "board"
            : audience === "regulator"
              ? "formal"
              : "plain",
      });
      if (looksLikeReportTemplateGuide(result.bodyMarkdown)) {
        throw new Error(
          "Writer returned a template instead of a report — try again.",
        );
      }
      setBody(result.bodyMarkdown);
      setSavedId(null);
      setStatus("ready");
      setPresentationOpen(true);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not write report");
    }
  }

  function handleSave() {
    const narrative = resolveNarrativeBody();
    if (!narrative.trim() && format !== "charts") return;
    if (!body.trim() && narrative.trim()) setBody(narrative);
    const id =
      savedId ||
      `RPT-${Date.now().toString(36).slice(-7).toUpperCase()}`;
    const report: SavedReport = {
      id,
      kind,
      audience,
      title: reportTitle,
      periodLabel,
      authorTier: tier,
      authorName,
      projectId: project.id,
      projectName: project.name,
      includedSections: included.map((s) => s.id) as ReportSectionId[],
      lockedSections: [],
      bodyMarkdown: body.trim() || narrative,
      evidence: facts.evidence,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      purposeTags: ["reporting", "performance"],
      preferredFormat: format,
    };
    saveAuthoredReport(report);
    setSavedId(id);
    setLibrary(listSavedReports().filter((r) => r.projectId === project.id));
  }

  function openPresentation(nextFormat?: ReportFormatId) {
    if (nextFormat) setFormat(nextFormat);
    // Persist composed narrative so saved drafts / re-open keep details.
    if (!body.trim() && effectiveBody.trim()) setBody(effectiveBody);
    setPresentationOpen(true);
  }

  function openSaved(report: SavedReport) {
    setKind(report.kind);
    setAudience(report.audience);
    setPeriodLabel(report.periodLabel);
    const fmt = report.preferredFormat || "charts_details";
    const narrative =
      report.bodyMarkdown.trim() ||
      resolveNarrativeBody({
        bodyMarkdown: report.bodyMarkdown,
        kind: report.kind,
        audience: report.audience,
        period: report.periodLabel,
      });
    setBody(narrative);
    setSavedId(report.id);
    setFormat(fmt);
    setPresentationOpen(true);
  }

  function buildDownloadMarkdown(opts?: {
    format?: ReportFormatId;
    bodyMarkdown?: string;
    title?: string;
    kind?: ReportKind;
    audience?: ReportAudience;
    period?: string;
  }): string {
    const fmt = opts?.format ?? format;
    const title = opts?.title ?? reportTitle;
    const k = opts?.kind ?? kind;
    const aud = opts?.audience ?? audience;
    const period = opts?.period ?? periodLabel;
    const wantCharts = fmt === "charts" || fmt === "charts_details";
    const wantDetails = fmt === "details" || fmt === "charts_details";
    const mdBody = wantDetails
      ? resolveNarrativeBody({
          bodyMarkdown: opts?.bodyMarkdown,
          kind: k,
          audience: aud,
          period,
        })
      : "";
    const lines: string[] = [
      `# ${title}`,
      "",
      `Project: ${project.name}`,
      `Period: ${period}`,
      `Kind: ${REPORT_KIND_LABELS[k]}`,
      `Audience: ${REPORT_AUDIENCE_LABELS[aud]}`,
      `Format: ${REPORT_FORMAT_LABELS[fmt]}`,
      "",
    ];
    if (wantCharts) {
      lines.push("## Charts", "");
      if (kindChartBars.length) {
        for (const bar of kindChartBars) {
          lines.push(`- ${bar.label}: ${bar.value}`);
        }
      } else {
        lines.push("_No chart values on file for this kind yet._");
      }
      lines.push("");
    }
    if (wantDetails) {
      lines.push("## Details", "", mdBody, "");
    }
    return lines.join("\n");
  }

  function handleDownload(opts?: {
    format?: ReportFormatId;
    bodyMarkdown?: string;
    title?: string;
    kind?: ReportKind;
    audience?: ReportAudience;
    period?: string;
  }) {
    const fmt = opts?.format ?? format;
    const k = opts?.kind ?? kind;
    // Persist composed body so View/Print stay in sync after Download.
    if (fmt === "details" || fmt === "charts_details") {
      const narrative = resolveNarrativeBody({
        bodyMarkdown: opts?.bodyMarkdown,
        kind: k,
        audience: opts?.audience,
        period: opts?.period,
      });
      if (!body.trim() && narrative.trim() && !opts?.bodyMarkdown) {
        setBody(narrative);
      }
    }
    const text = buildDownloadMarkdown(opts);
    const blob = new Blob([text], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugFilePart(project.name)}-${slugFilePart(k)}-${slugFilePart(fmt)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    if (format === "details" || format === "charts_details") {
      const narrative = resolveNarrativeBody();
      if (!body.trim() && narrative.trim()) setBody(narrative);
    }
    window.setTimeout(() => window.print(), 40);
  }

  return (
    <div className="space-y-5 print:hidden">
      <div>
        <h2 className="text-base font-semibold text-tl-ink">
          Generate report
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Choose the kind, format, and level. View opens a full-screen
          presentation in that format; download and print work for any format.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">1. Report kind</span>
          <select
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
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
          <span className="mb-1 block font-medium">2. Format</span>
          <select
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
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
          <span className="mb-1 block font-medium">3. Level (audience)</span>
          <select
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
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
      </div>

      <label className="block text-sm sm:max-w-xs">
        <span className="mb-1 block font-medium">Period label</span>
        <input
          className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
        />
      </label>

      <div className="rounded-md border border-tl-line bg-tl-paper p-3 text-xs text-tl-ink-muted">
        <p className="font-medium text-tl-ink">
          Auto-mapped for {REPORT_KIND_LABELS[kind]}
        </p>
        <p className="mt-1">{coverage}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {mappedCategories.map((c) => (
            <li
              key={c.id}
              className={`rounded-md px-2 py-0.5 ${
                c.hasData
                  ? "bg-tl-surface text-tl-trust-ink"
                  : "bg-tl-surface text-tl-ink-muted"
              }`}
            >
              {c.label}
              {c.hasData ? "" : " (empty)"}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <AiAssistButton
          label="Generate from mapped data"
          loading={status === "loading"}
          onClick={() => void handleCompose()}
        />
        <button
          type="button"
          onClick={() => openPresentation()}
          className="rounded-md border border-tl-trust/40 bg-tl-paper px-3 py-2 text-sm font-medium text-tl-trust-ink"
        >
          View report
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => handleDownload()}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium"
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => {
            openPresentation();
            handlePrint();
          }}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium"
        >
          Print
        </button>
      </div>

      {error ? (
        <p className="text-sm text-tl-danger" role="alert">
          {error}
        </p>
      ) : null}

      {showCharts ? (
        <section className="space-y-3 rounded-lg border border-tl-line bg-tl-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-tl-ink">
              Charts preview — {REPORT_KIND_LABELS[kind]}
            </h3>
            <button
              type="button"
              className="text-xs font-medium text-tl-trust-ink underline"
              onClick={() => openPresentation("charts")}
            >
              View full screen
            </button>
          </div>
          {kindChartBars.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <HorizontalBarChart bars={kindChartBars} />
              <VerticalBarChart
                bars={kindChartBars.slice(0, 6).map((b) => ({
                  label: b.label.slice(0, 12),
                  value: b.value,
                }))}
              />
            </div>
          ) : (
            <p className="text-sm text-tl-ink-muted">
              No chart values yet for this kind — capture the empty categories
              above, then generate again.
            </p>
          )}
        </section>
      ) : null}

      {showDetails ? (
        <section className="rounded-lg border border-tl-line bg-tl-paper p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-tl-ink">
              Details preview
            </h3>
            {body.trim() || effectiveBody ? (
              <button
                type="button"
                className="text-xs font-medium text-tl-trust-ink underline"
                onClick={() => openPresentation()}
              >
                View full screen
              </button>
            ) : null}
          </div>
          {body.trim() || effectiveBody ? (
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-tl-ink line-clamp-[12]">
              {body.trim() || effectiveBody}
            </article>
          ) : (
            <p className="text-sm text-tl-ink-muted">
              Generate to fill narrative sections from the mapped categories
              for {REPORT_KIND_LABELS[kind]}.
            </p>
          )}
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-tl-ink">
          Saved on this project
        </h3>
        {library.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">No saved reports yet.</p>
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
                      handleDownload({
                        format: r.preferredFormat || "charts_details",
                        bodyMarkdown: r.bodyMarkdown,
                        title: r.title,
                        kind: r.kind,
                        audience: r.audience,
                        period: r.periodLabel,
                      })
                    }
                  >
                    Download
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
        <p className="mt-2 text-xs text-tl-ink-muted">
          Need plan pack formats?{" "}
          <Link href="/app/reports" className="underline">
            Reports pack hub
          </Link>
        </p>
      </section>

      <ReportPresentationView
        open={presentationOpen}
        onClose={() => setPresentationOpen(false)}
        title={
          savedId
            ? getSavedReport(savedId)?.title || reportTitle
            : reportTitle
        }
        projectName={project.name}
        periodLabel={periodLabel}
        kind={kind}
        audience={audience}
        format={format}
        onFormatChange={setFormat}
        bodyMarkdown={effectiveBody}
        chartBars={kindChartBars}
        onPrint={handlePrint}
        onDownload={() => handleDownload()}
        reportId={savedId}
        projectId={project.id}
      />
    </div>
  );
}
