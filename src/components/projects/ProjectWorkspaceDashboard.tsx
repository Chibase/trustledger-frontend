"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectDossierForm } from "@/components/projects/ProjectDossierForm";
import { ProjectReportStudio } from "@/components/reports/ProjectReportStudio";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import {
  HorizontalBarChart,
} from "@/components/ops/charts/BarChart";
import {
  buildProjectPortfolioRow,
  pctLabel,
  projectCategoryBars,
  zar,
} from "@/lib/portfolioMetrics";
import { dossierSummaryLines } from "@/lib/projectDossier";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

type Props = {
  project: Project;
  incidents: Incident[];
  role: UserRole;
  authorName: string;
  onProjectSaved: (next: Project) => void;
};

const INPUT_LINKS = [
  {
    href: (id: string) =>
      `/app/capture?projectId=${encodeURIComponent(id)}&source=employment`,
    label: "Employment pack",
    hint: "Local hire, training spend",
  },
  {
    href: (id: string) =>
      `/app/capture?projectId=${encodeURIComponent(id)}&source=bbbee`,
    label: "B-BBEE / empowerment",
    hint: "Skills, procurement, ESD",
  },
  {
    href: (id: string) =>
      `/app/capture?projectId=${encodeURIComponent(id)}&source=esg_period`,
    label: "ESG period pack",
    hint: "Environment, H&S, trust notes",
  },
  {
    href: (id: string) =>
      `/app/capture?projectId=${encodeURIComponent(id)}&source=issue_log`,
    label: "Issue log pathway",
    hint: "Report → follow-ups → close",
  },
  {
    href: (id: string) =>
      `/app/issues/report?projectId=${encodeURIComponent(id)}`,
    label: "Log issue",
    hint: "Desk case intake",
  },
  {
    href: () => `/app/stakeholders`,
    label: "Stakeholders",
    hint: "Registry for this org",
  },
] as const;

/**
 * Project workspace dashboard — details, input shortcuts, live charts,
 * and report generation by kind / format.
 */
export function ProjectWorkspaceDashboard({
  project,
  incidents,
  role,
  authorName,
  onProjectSaved,
}: Props) {
  const [showDossier, setShowDossier] = useState(false);
  const row = useMemo(
    () => buildProjectPortfolioRow(project, incidents),
    [project, incidents],
  );
  const bars = useMemo(() => projectCategoryBars(row), [row]);
  const summary = dossierSummaryLines(project);

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-sm text-tl-ink-muted">
          <Link href="/app/dashboard" className="underline">
            Executive portfolio
          </Link>
          {" / "}
          <Link href="/app/projects" className="underline">
            Projects
          </Link>
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
          {project.clientFunder || "Client / funder TBD"}
          {project.ward ? ` · ${project.ward}` : ""}
          {project.municipality ? ` · ${project.municipality}` : ""}
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
        <KpiCard
          label="Local hire"
          value={
            row.localHireActual != null && row.localHireTarget != null
              ? `${row.localHireActual} / ${row.localHireTarget}`
              : pctLabel(row.localHirePct)
          }
        />
        <KpiCard
          label="B-BBEE target"
          value={row.bbbeeLevelTarget || "—"}
        />
        <KpiCard label="Open cases" value={String(row.openCases)} />
        <KpiCard
          label="Trust pulse"
          value={`${row.trustIndex}/100`}
        />
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="mb-2 text-base font-semibold text-tl-ink">
          Project progress charts
        </h2>
        <p className="mb-3 text-xs text-tl-ink-muted">
          Bars update from Capture packs and desk cases — no separate chart
          entry step.
        </p>
        <HorizontalBarChart
          bars={bars.map((b) => ({ label: b.label, value: b.value }))}
        />
        {summary.length ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-tl-ink-muted">
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-tl-ink">
            Make inputs
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-tl-trust-ink underline"
            onClick={() => setShowDossier((v) => !v)}
          >
            {showDossier ? "Hide project details" : "Edit project details"}
          </button>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INPUT_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href(project.id)}
                className="flex flex-col rounded-lg border border-tl-line bg-tl-surface px-4 py-3 transition hover:border-tl-trust/40 hover:bg-tl-paper"
              >
                <span className="font-medium text-tl-ink">{link.label}</span>
                <span className="mt-0.5 text-xs text-tl-ink-muted">
                  {link.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {showDossier ? (
          <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
            <ProjectDossierForm project={project} onSaved={onProjectSaved} />
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <ProjectReportStudio
          project={project}
          role={role}
          authorName={authorName}
          incidents={incidents}
        />
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-tl-ink">Linked cases</h2>
          <Link
            href={`/app/issues/report?projectId=${encodeURIComponent(project.id)}`}
            className="text-sm font-medium text-tl-trust-ink underline"
          >
            Log issue
          </Link>
        </div>
        {incidents.length === 0 ? (
          <p className="text-tl-ink-muted">
            No incidents linked yet — log issues or add an Issue log pathway
            under Capture.
          </p>
        ) : (
          <ul className="space-y-2">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link
                  href={`/app/incidents/${incident.id}`}
                  className="font-medium text-tl-trust-ink underline"
                >
                  {incident.id}
                </Link>{" "}
                {incident.title} ({incident.priority})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
