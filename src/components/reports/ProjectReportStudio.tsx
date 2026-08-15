"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { allSections, sectionsForKind } from "@/config/reportCatalogue";
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
import {
  buildProjectPortfolioRow,
  projectCategoryBars,
  zar,
} from "@/lib/portfolioMetrics";
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
    hint: "Category bars from Capture packs and cases",
  },
  {
    id: "details",
    label: "Details",
    hint: "Narrative sections for the chosen report kind",
  },
  {
    id: "charts_details",
    label: "Charts + details",
    hint: "Combined view for print and handoff",
  },
];

type Props = {
  project: Project;
  role: UserRole;
  authorName: string;
  incidents?: Incident[];
};

function currentMonthLabel() {
  return new Date().toLocaleString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Project-scoped report studio: pick kind (e.g. ESG) → related topics auto-include
 * → choose format/level → generate, view, print.
 */
export function ProjectReportStudio({
  project,
  role,
  authorName,
  incidents: seedIncidents,
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
      setTier(readDeskTier(role));
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

  const row = useMemo(
    () => buildProjectPortfolioRow(project, incidents),
    [project, incidents],
  );
  const categoryBars = useMemo(() => projectCategoryBars(row), [row]);

  const included = useMemo(() => {
    return sectionsForKind(kind).filter((s) =>
      tierMeetsMinimum(tier, s.minTier),
    );
  }, [kind, tier]);

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
          ? "Add Capture packs or project details first — reports draw from what you have already entered."
          : "No evidence yet for this project. Capture packs or cases first.",
      );
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const factsBlock = factsToPromptBlock(facts);
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
        lockedSectionLabels: allSections()
          .filter((s) => !tierMeetsMinimum(tier, s.minTier))
          .map((s) => s.label),
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
          Generate & view reports
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Choose the report kind — related topics from Capture and cases are
          included automatically. Charts fill as you enter data.
        </p>
      </div>

      <div className="grid gap-3 print:hidden sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Report kind</span>
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
          <span className="mb-1 block font-medium">Audience / level</span>
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
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Period</span>
          <input
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
          />
        </label>
      </div>

      <fieldset className="print:hidden">
        <legend className="mb-2 text-sm font-medium">Format</legend>
        <ul className="grid gap-2 sm:grid-cols-3">
          {FORMAT_OPTIONS.map((opt) => (
            <li key={opt.id}>
              <label
                className={`flex cursor-pointer flex-col rounded-md border px-3 py-2 text-sm ${
                  format === opt.id
                    ? "border-tl-trust bg-tl-paper"
                    : "border-tl-line bg-tl-surface"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="report-format"
                    checked={format === opt.id}
                    onChange={() => setFormat(opt.id)}
                  />
                  {opt.label}
                </span>
                <span className="mt-1 text-xs text-tl-ink-muted">{opt.hint}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="rounded-md border border-tl-line bg-tl-paper p-3 text-xs text-tl-ink-muted print:hidden">
        <p className="font-medium text-tl-ink">
          Auto-included for {REPORT_KIND_LABELS[kind]}
        </p>
        <p className="mt-1">
          {included.map((s) => s.label).join(" · ") || "—"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <AiAssistButton
          label="Generate report"
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
          disabled={
            format === "charts"
              ? false
              : !body.trim() && !viewing
          }
          onClick={handlePrint}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          Print / PDF
        </button>
        <Link
          href={`/app/capture?projectId=${encodeURIComponent(project.id)}`}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium"
        >
          Add Capture data
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-tl-danger print:hidden" role="alert">
          {error}
        </p>
      ) : null}

      {showCharts ? (
        <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
          <h3 className="text-sm font-semibold text-tl-ink">
            Charts — {project.name}
          </h3>
          <p className="text-xs text-tl-ink-muted">
            Categories grow as Capture packs and cases are saved (
            {[
              row.hasEmploymentPack && "employment",
              row.hasBbbeePack && "B-BBEE",
              row.hasEsgPack && "ESG",
              row.hasGrmPack && "GRM",
              row.hasIssueLogPack && "issue log",
            ]
              .filter(Boolean)
              .join(", ") || "capture packs to populate"}
            ).
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart
              bars={categoryBars.map((b) => ({
                label: b.label,
                value: b.value,
              }))}
            />
            <div className="text-sm">
              <p>
                Empowerment: {zar(row.empowermentSpent)} of{" "}
                {zar(row.empowermentBudget)} (
                {row.empowermentPct != null ? `${row.empowermentPct}%` : "—"})
              </p>
              <p className="mt-1">
                Available: {zar(row.empowermentAvailable)} · Trust{" "}
                {row.trustIndex}/100
              </p>
              {kind === "esg" || kind === "bbbee" || kind === "mel" ? (
                <VerticalBarChart
                  bars={[
                    {
                      label: "Spend %",
                      value: row.empowermentPct ?? 0,
                    },
                    {
                      label: "Hire %",
                      value: row.localHirePct ?? 0,
                    },
                    {
                      label: "Trust",
                      value: row.trustIndex,
                    },
                  ]}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showDetails ? (
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-tl-ink print:hidden">
            Details
          </h3>
          {viewing ? (
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-tl-ink">
              {viewing.bodyMarkdown}
            </article>
          ) : body ? (
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-tl-ink">
              {body}
            </article>
          ) : (
            <p className="text-sm text-tl-ink-muted print:hidden">
              Generate a report to fill this panel with kind-specific narrative
              (ESG pulls scorecard, environment, empowerment topics, etc.).
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
          <ul className="divide-y divide-tl-line rounded-md border border-tl-line bg-tl-surface text-sm">
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
                    // Always show narrative when opening a saved draft.
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
      </section>
    </div>
  );
}
