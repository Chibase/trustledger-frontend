"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HorizontalBarChart } from "@/components/ops/charts/BarChart";
import { ProjectDossierForm } from "@/components/projects/ProjectDossierForm";
import { ProjectReportStudio } from "@/components/reports/ProjectReportStudio";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import {
  buildProjectCategoryMap,
  type ProjectDataCategory,
} from "@/lib/projectCategoryMap";
import {
  buildProjectPortfolioRow,
  pctLabel,
  zar,
} from "@/lib/portfolioMetrics";
import { dossierSummaryLines } from "@/lib/projectDossier";
import { stakeholderService } from "@/services/stakeholderService";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Stakeholder } from "@/types/stakeholder";
import type { UserRole } from "@/types/rbac";

type Props = {
  project: Project;
  incidents: Incident[];
  role: UserRole;
  authorName: string;
  onProjectSaved: (next: Project) => void;
};

/**
 * Project dashboard — activity hub for one project.
 * Data is segmented by report category; those segments feed report templates.
 */
export function ProjectWorkspaceDashboard({
  project,
  incidents,
  role,
  authorName,
  onProjectSaved,
}: Props) {
  const [showDossier, setShowDossier] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [focusCategory, setFocusCategory] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void stakeholderService.list().then((rows) => {
        setStakeholders(
          rows.filter((s) => (s.projectIds || []).includes(project.id)),
        );
      }).catch(() => setStakeholders([]));
    });
    return () => cancelAnimationFrame(frame);
  }, [project.id]);

  const row = useMemo(
    () => buildProjectPortfolioRow(project, incidents),
    [project, incidents],
  );
  const categories = useMemo(
    () =>
      buildProjectCategoryMap({
        project,
        incidents,
        stakeholders,
      }),
    [project, incidents, stakeholders],
  );
  const summary = dossierSummaryLines(project);
  const filledCount = categories.filter((c) => c.hasData).length;

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-sm text-tl-ink-muted">
          <Link href="/app/dashboard" className="underline">
            Executive dashboard
          </Link>
          {" / "}
          <span className="text-tl-ink">Project dashboard</span>
          {" / "}
          {project.id}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
            {project.name}
          </h1>
          <ProjectStatusChip status={project.status} />
        </div>
        <p className="max-w-2xl text-sm text-tl-ink-muted">
          Capture, monitor, and edit this project here. Categories below map
          straight into report templates — generate with kind, format, and
          level only. Feeds the{" "}
          <Link href="/app/dashboard" className="text-tl-trust-ink underline">
            Executive dashboard
          </Link>
          .
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Empowerment budget"
          value={zar(row.empowermentBudget)}
        />
        <KpiCard label="Spent" value={zar(row.empowermentSpent)} />
        <KpiCard label="Available" value={zar(row.empowermentAvailable)} />
        <KpiCard
          label="Achieved"
          value={pctLabel(row.empowermentPct)}
          tone={
            row.empowermentPct != null && row.empowermentPct < 50
              ? "attention"
              : "default"
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open cases" value={String(row.openCases)} />
        <KpiCard
          label="Trust pulse"
          value={`${row.trustIndex}/100`}
        />
        <KpiCard
          label="Categories with data"
          value={`${filledCount} / ${categories.length}`}
        />
        <KpiCard
          label="B-BBEE / hire"
          value={
            row.bbbeeLevelTarget ||
            (row.localHirePct != null ? pctLabel(row.localHirePct) : "—")
          }
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-tl-ink">
              Project data by report category
            </h2>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Each block is what you monitor and edit. Choosing a report kind
              pulls the matching blocks into the template automatically.
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-tl-trust-ink underline"
            onClick={() => setShowDossier((v) => !v)}
          >
            {showDossier ? "Hide dossier editor" : "Edit project dossier"}
          </button>
        </div>

        {showDossier ? (
          <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
            <ProjectDossierForm project={project} onSaved={onProjectSaved} />
          </div>
        ) : null}

        <ul className="grid gap-3 lg:grid-cols-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <CategoryPanel
                category={cat}
                expanded={focusCategory === cat.id}
                onToggle={() =>
                  setFocusCategory((id) => (id === cat.id ? null : cat.id))
                }
              />
            </li>
          ))}
        </ul>

        {summary.length ? (
          <ul className="list-disc space-y-1 pl-5 text-xs text-tl-ink-muted">
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section
        id="project-reports"
        className="rounded-lg border border-tl-line bg-tl-surface p-4"
      >
        <ProjectReportStudio
          project={project}
          role={role}
          authorName={authorName}
          incidents={incidents}
          categories={categories}
        />
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-tl-ink">Cases on this project</h2>
          <Link
            href={`/app/issues/report?projectId=${encodeURIComponent(project.id)}`}
            className="text-sm font-medium text-tl-trust-ink underline"
          >
            Log issue
          </Link>
        </div>
        {incidents.length === 0 ? (
          <p className="text-tl-ink-muted">
            No incidents yet — log issues or capture an Issue log pathway.
          </p>
        ) : (
          <ul className="space-y-2">
            {incidents.slice(0, 12).map((incident) => (
              <li key={incident.id}>
                <Link
                  href={`/app/incidents/${incident.id}`}
                  className="font-medium text-tl-trust-ink underline"
                >
                  {incident.id}
                </Link>{" "}
                {incident.title} ({incident.priority} · {incident.status})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CategoryPanel({
  category,
  expanded,
  onToggle,
}: {
  category: ProjectDataCategory;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={`rounded-lg border bg-tl-surface p-4 ${
        category.hasData
          ? "border-tl-line"
          : "border-dashed border-tl-line opacity-90"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-tl-ink">{category.label}</h3>
          <p className="mt-0.5 text-xs text-tl-ink-muted">
            {category.description}
          </p>
          <p className="mt-1 text-xs text-tl-ink-muted">
            Feeds:{" "}
            {category.reportKinds
              .slice(0, 4)
              .map((k) => k.replaceAll("_", " "))
              .join(", ")}
            {category.reportKinds.length > 4 ? "…" : ""}
          </p>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
            category.hasData
              ? "bg-tl-paper text-tl-trust-ink"
              : "bg-tl-paper text-tl-ink-muted"
          }`}
        >
          {category.hasData ? "Data on file" : "Empty — capture"}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        {category.facts.slice(0, expanded ? undefined : 4).map((f) => (
          <div key={f.label}>
            <dt className="text-tl-ink-muted">{f.label}</dt>
            <dd className="font-medium text-tl-ink">{f.value}</dd>
          </div>
        ))}
      </dl>

      {expanded && category.pathwaySummaries?.length ? (
        <ul className="mt-3 space-y-1 border-t border-tl-line pt-3 text-xs">
          <li className="font-medium text-tl-ink">
            Pathways on this pack (project SoT)
          </li>
          {category.pathwaySummaries.slice(0, 8).map((p) => (
            <li key={p.id} className="text-tl-ink-muted">
              <span className="font-medium text-tl-ink">{p.title}</span>
              {" · "}
              {p.status}
              {p.category ? ` · ${p.category.replaceAll("_", " ")}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      {expanded && category.chartBars.some((b) => b.value > 0) ? (
        <div className="mt-3">
          <HorizontalBarChart bars={category.chartBars} maxHeight={140} />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {category.captureHref ? (
          <Link
            href={category.captureHref}
            className="rounded-md border border-tl-line bg-tl-paper px-2.5 py-1 text-xs font-medium text-tl-ink hover:border-tl-trust/40"
          >
            Capture / edit
          </Link>
        ) : null}
        {category.moduleHref ? (
          <Link
            href={category.moduleHref}
            className="rounded-md border border-tl-line bg-tl-paper px-2.5 py-1 text-xs font-medium text-tl-ink hover:border-tl-trust/40"
          >
            Open module
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md border border-tl-line bg-tl-paper px-2.5 py-1 text-xs font-medium text-tl-ink"
        >
          {expanded ? "Less" : "Retrieve / monitor"}
        </button>
        <a
          href="#project-reports"
          className="rounded-md border border-tl-trust/30 bg-tl-paper px-2.5 py-1 text-xs font-medium text-tl-trust-ink"
        >
          Use in report
        </a>
      </div>
    </article>
  );
}
