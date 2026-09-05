"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DiscussionSpace } from "@/components/discussion/DiscussionSpace";
import {
  ExecutiveRiskLayout,
  FunderAssuranceLayout,
  MonthlyOpsLayout,
} from "@/components/reports/ReportLensLayout";
import { DESK_TIER_RANK, sectionsForKind } from "@/config/reportCatalogue";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  readSessionAuthor,
  readSessionPlanId,
} from "@/lib/discussionStore";
import {
  buildPeriodActivityFacts,
  composeActivityReportMarkdown,
  funderSnapshotFromFacts,
  riskRowsFromFacts,
} from "@/lib/reportComposer";
import {
  citedIncidentIds,
  executiveChartGroups,
  funderChartGroups,
  monthlyChartGroups,
  reportLensForKind,
  savedBodyMatchesLens,
} from "@/lib/reportLenses";
import {
  clearAllSavedReports,
  listSavedReports,
  purgeTemplateGuideReports,
} from "@/lib/reportStore";
import {
  REPORT_AUDIENCE_LABELS,
  REPORT_KIND_LABELS,
  type SavedReport,
} from "@/types/activityReport";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

type ReportsLibraryProps = {
  role: UserRole;
  projects?: Project[];
  incidents?: Incident[];
};

/**
 * Level-aware report library for dashboards — viewers see packs at or below
 * their desk grade, plus anything addressed to their audience band.
 */
export function ReportsLibrary({
  role,
  projects = [],
  incidents = [],
}: ReportsLibraryProps) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [rows, setRows] = useState<SavedReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [purged, setPurged] = useState(0);
  const [author, setAuthor] = useState<{ name: string; role?: string }>({
    name: "Viewer",
  });
  const [planId, setPlanId] = useState<ReturnType<typeof readSessionPlanId>>(
    undefined,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTier(readDeskTier(role));
      setPurged(purgeTemplateGuideReports());
      setRows(listSavedReports());
      setAuthor(readSessionAuthor());
      setPlanId(readSessionPlanId());
    });
    return () => cancelAnimationFrame(frame);
  }, [role]);

  const visible = useMemo(() => {
    const rank = DESK_TIER_RANK[tier];
    return rows.filter((r) => {
      const authorRank = DESK_TIER_RANK[r.authorTier];
      // Seniors (lower rank number) see junior filings; juniors see peer tier.
      if (rank <= authorRank) return true;
      if (r.authorTier === tier) return true;
      return false;
    });
  }, [rows, tier]);

  const active = visible.find((r) => r.id === activeId) ?? visible[0] ?? null;

  function handleClearLibrary() {
    clearAllSavedReports();
    setRows([]);
    setActiveId(null);
    setPurged(0);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-tl-ink">
            Report library · {DESK_TIER_LABELS[tier]}
          </h2>
          <p className="text-xs text-tl-ink-muted">
            Evidence packs for reporting, performance, and disputes. Create new
            packs under Create report.
          </p>
          {purged > 0 ? (
            <p className="mt-1 text-xs text-amber-800">
              Cleared {purged} old Cloud LLM placeholder draft
              {purged === 1 ? "" : "s"} from this browser.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {rows.length > 0 ? (
            <button
              type="button"
              onClick={handleClearLibrary}
              className="text-xs font-medium text-tl-ink-muted hover:text-tl-ink hover:underline"
            >
              Clear browser library
            </button>
          ) : null}
          <Link
            href="/app/reports"
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            Create a report
          </Link>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-tl-line bg-tl-surface px-4 py-6 text-sm text-tl-ink-muted">
          No saved reports yet for this desk view.{" "}
          <Link href="/app/reports" className="text-tl-trust-ink underline">
            Create a report
          </Link>{" "}
          with the evidence writer.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
            {visible.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(r.id)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-tl-paper ${
                    active?.id === r.id ? "bg-tl-trust/10" : ""
                  }`}
                >
                  <p className="font-medium text-tl-ink">{r.title}</p>
                  <p className="text-xs text-tl-ink-muted">
                    {REPORT_KIND_LABELS[r.kind]} · {r.status} ·{" "}
                    {DESK_TIER_LABELS[r.authorTier]}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <div className="space-y-4">
              <article className="rounded-lg border border-tl-line bg-tl-surface p-4">
                <header className="border-b border-tl-line pb-3">
                  <h3 className="font-display text-xl font-semibold text-tl-ink">
                    {active.title}
                  </h3>
                  <p className="mt-1 text-xs text-tl-ink-muted">
                    {REPORT_KIND_LABELS[active.kind]} →{" "}
                    {REPORT_AUDIENCE_LABELS[active.audience]} ·{" "}
                    {active.periodLabel}
                    {active.projectName ? ` · ${active.projectName}` : ""} ·{" "}
                    {active.purposeTags.join(", ")}
                  </p>
                </header>
                <div className="mt-4">
                  <SavedReportLensBody
                    report={active}
                    projects={projects}
                    incidents={incidents}
                  />
                </div>
                {active.evidence.length ? (
                  <div className="mt-4 border-t border-tl-line pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                      Evidence index
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-tl-ink-muted">
                      {active.evidence.map((e) => (
                        <li key={e.id}>
                          {e.kind}: {e.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
              <DiscussionSpace
                subject={{
                  subjectType: "report",
                  subjectId: active.id,
                  subjectTitle: active.title,
                  projectId: active.projectId,
                }}
                authorName={author.name}
                authorRole={author.role}
                planId={planId}
              />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function SavedReportLensBody({
  report,
  projects,
  incidents: workspaceIncidents,
}: {
  report: SavedReport;
  projects: Project[];
  incidents: Incident[];
}) {
  const project = report.projectId
    ? projects.find((p) => p.id === report.projectId)
    : undefined;
  const scoped = workspaceIncidents.filter(
    (i) => !report.projectId || i.projectId === report.projectId,
  );
  const cited = citedIncidentIds(report.bodyMarkdown);
  const incidents =
    cited.length > 0
      ? scoped.filter((i) =>
          cited.some((id) => id.toUpperCase() === i.id.toUpperCase()),
        )
      : scoped;
  const facts = buildPeriodActivityFacts(incidents, {
    projectId: report.projectId,
    projectName: report.projectName,
    project,
  });
  const lens = reportLensForKind(report.kind);
  const riskRows = riskRowsFromFacts(facts);
  const funderSnapshot = funderSnapshotFromFacts(facts);
  const sections = sectionsForKind(report.kind);
  const body =
    report.bodyMarkdown.trim() &&
    savedBodyMatchesLens(report.kind, report.bodyMarkdown)
      ? report.bodyMarkdown
      : composeActivityReportMarkdown({
          kind: report.kind,
          kindLabel: REPORT_KIND_LABELS[report.kind],
          audienceLabel: REPORT_AUDIENCE_LABELS[report.audience],
          periodLabel: report.periodLabel,
          authorTierLabel: DESK_TIER_LABELS[report.authorTier],
          authorName: report.authorName,
          projectName: report.projectName,
          includedSectionIds: sections.map((s) => s.id),
          includedSectionLabels: sections.map((s) => s.label),
          lockedSectionLabels: [],
          facts,
          tonePreference:
            report.audience === "board" ||
            report.audience === "funders_investors"
              ? "board"
              : "plain",
        }).bodyMarkdown;

  if (lens === "executive") {
    return (
      <ExecutiveRiskLayout
        rows={riskRows}
        trustIndex={facts.trustIndex}
        trustLabel={facts.trustLabel}
        chartGroups={executiveChartGroups(riskRows)}
        showCharts
        showDetails
        bodyMarkdown={body}
      />
    );
  }
  if (lens === "funder") {
    return (
      <FunderAssuranceLayout
        snapshot={funderSnapshot}
        chartGroups={funderChartGroups(funderSnapshot)}
        showCharts
        showDetails
        bodyMarkdown={body}
      />
    );
  }
  return (
    <MonthlyOpsLayout
      chartGroups={monthlyChartGroups(
        [
          ...facts.attended,
          ...facts.resolved,
        ],
        [],
      )}
      showCharts
      showDetails
      bodyMarkdown={body}
    />
  );
}
