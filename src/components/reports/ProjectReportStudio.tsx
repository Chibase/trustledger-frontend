"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { defaultAudienceForTier, sectionsForKind } from "@/config/reportCatalogue";
import {
  categoriesForReportKind,
  kindDataCoverageSummary,
  type ProjectDataCategory,
} from "@/lib/projectCategoryMap";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  buildPeriodActivityFacts,
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
  REPORT_KIND_LABELS,
  REPORT_KINDS,
  type ReportAudience,
  type ReportKind,
  type ReportSectionId,
  type SavedReport,
} from "@/types/activityReport";
import type { AiSuggestionStatus } from "@/types/ai";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

export type ReportFormatId = "charts" | "details" | "charts_details";

const FORMAT_OPTIONS: Array<{
  id: ReportFormatId;
  label: string;
  hint: string;
}> = [
  {
    id: "charts",
    label: "Charts",
    hint: "Category charts from mapped project data",
  },
  {
    id: "details",
    label: "Details",
    hint: "Narrative filled from the chosen kind’s map",
  },
  {
    id: "charts_details",
    label: "Charts + details",
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

/**
 * Report generation on the project dashboard:
 * choose kind + format + level only — mapped category data fills the template.
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
  const [viewingId, setViewingId] = useState<string | null>(null);

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

  const viewing = viewingId ? getSavedReport(viewingId) : null;
  const showCharts = format === "charts" || format === "charts_details";
  const showDetails = format === "details" || format === "charts_details";

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
      setViewingId(null);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not write report");
    }
  }

  function handleSave() {
    if (!body.trim()) return;
    const id =
      savedId ||
      `RPT-${Date.now().toString(36).slice(-7).toUpperCase()}`;
    const report: SavedReport = {
      id,
      kind,
      audience,
      title: `${REPORT_KIND_LABELS[kind]} — ${project.name}`,
      periodLabel,
      authorTier: tier,
      authorName,
      projectId: project.id,
      projectName: project.name,
      includedSections: included.map((s) => s.id) as ReportSectionId[],
      lockedSections: [],
      bodyMarkdown: body,
      evidence: facts.evidence,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      purposeTags: ["reporting", "performance"],
    };
    saveAuthoredReport(report);
    setSavedId(id);
    setLibrary(listSavedReports().filter((r) => r.projectId === project.id));
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-5 print:space-y-3">
      <div className="print:hidden">
        <h2 className="text-base font-semibold text-tl-ink">
          Generate report
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Choose the kind, format, and level only. Category data already
          mapped on this project fills the template — you do not pick topics.
        </p>
      </div>

      <div className="grid gap-3 print:hidden sm:grid-cols-3">
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

      <label className="block text-sm print:hidden sm:max-w-xs">
        <span className="mb-1 block font-medium">Period label</span>
        <input
          className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
        />
      </label>

      <div className="rounded-md border border-tl-line bg-tl-paper p-3 text-xs text-tl-ink-muted print:hidden">
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

      <div className="flex flex-wrap gap-2 print:hidden">
        <AiAssistButton
          label="Generate from mapped data"
          loading={status === "loading"}
          onClick={() => void handleCompose()}
        />
        <button
          type="button"
          disabled={!body.trim()}
          onClick={handleSave}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={format === "charts" ? false : !body.trim() && !viewing}
          onClick={handlePrint}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          Print / PDF
        </button>
      </div>

      {error ? (
        <p className="text-sm text-tl-danger print:hidden" role="alert">
          {error}
        </p>
      ) : null}

      {showCharts ? (
        <section className="space-y-3 rounded-lg border border-tl-line bg-tl-paper p-4">
          <h3 className="text-sm font-semibold text-tl-ink">
            Charts — {REPORT_KIND_LABELS[kind]}
          </h3>
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
          <h3 className="mb-2 text-sm font-semibold text-tl-ink print:hidden">
            Details
          </h3>
          {viewing || body ? (
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-tl-ink">
              {viewing?.bodyMarkdown || body}
            </article>
          ) : (
            <p className="text-sm text-tl-ink-muted print:hidden">
              Generate to fill narrative sections from the mapped categories
              for {REPORT_KIND_LABELS[kind]}.
            </p>
          )}
        </section>
      ) : null}

      <section className="print:hidden">
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
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-tl-trust-ink underline"
                  onClick={() => {
                    setViewingId(r.id);
                    setBody(r.bodyMarkdown);
                    setKind(r.kind);
                    setAudience(r.audience);
                    setPeriodLabel(r.periodLabel);
                    setSavedId(r.id);
                    setFormat((prev) =>
                      prev === "charts" ? "charts_details" : prev,
                    );
                  }}
                >
                  View
                </button>
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
    </div>
  );
}
