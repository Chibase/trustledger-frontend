"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import { SepDashboardPanel } from "@/components/sep/SepDashboardPanel";
import { useSepDesk } from "@/components/sep/SepDeskContext";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  buildPortfolioOverview,
  pctLabel,
  zar,
} from "@/lib/portfolioMetrics";
import { isExecutiveDashboardProject } from "@/lib/projectCategoryMap";
import {
  listWorkspaceIncidents,
  listWorkspaceProjects,
} from "@/lib/workspaceData";
import type { PlanId } from "@/config/plans";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

type Props = {
  role: UserRole;
  planId?: PlanId | null;
  isPlanOwner?: boolean;
  seedIncidents?: Incident[];
  seedProjects?: Project[];
};

/**
 * Executive portfolio dashboard — overview of every project, then drill into
 * a project workspace for inputs and reports.
 */
export function ExecutivePortfolioDashboard({
  role,
  isPlanOwner = false,
  seedIncidents = [],
  seedProjects = [],
}: Props) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const sepDesk = useSepDesk();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTier(readDeskTier(role));
      setIncidents(listWorkspaceIncidents(seedIncidents));
      setProjects(listWorkspaceProjects(seedProjects));
    });
    return () => cancelAnimationFrame(frame);
  }, [role, seedIncidents, seedProjects]);

  const openProjects = useMemo(
    () => projects.filter(isExecutiveDashboardProject),
    [projects],
  );
  const parked = useMemo(
    () =>
      projects.filter(
        (p) => p.status === "Completed" || p.status === "Closed",
      ),
    [projects],
  );
  const overview = useMemo(
    () => buildPortfolioOverview(openProjects, incidents),
    [openProjects, incidents],
  );
  const { totals, rows } = overview;

  const spendBars = rows
    .filter((r) => r.empowermentBudget > 0)
    .map((r) => ({
      label: r.project.name.split("—")[0]?.trim().slice(0, 22) || r.project.id,
      value: r.empowermentPct ?? 0,
    }))
    .slice(0, 8);

  const hireBars = rows
    .filter((r) => r.localHirePct != null)
    .map((r) => ({
      label: r.project.name.split("—")[0]?.trim().slice(0, 22) || r.project.id,
      value: r.localHirePct ?? 0,
    }))
    .slice(0, 8);

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-tl-trust">Executive dashboard</p>
          <h1 className="font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
            {isPlanOwner
              ? "Projects overview"
              : "Projects you work on"}
          </h1>
          <p className="max-w-2xl text-sm text-tl-ink-muted">
            Roll-up of empowerment budgets, targets, and progress across your
            projects (including Draft). Open a project dashboard to capture,
            monitor, edit, and generate reports — that data feeds this view.
            Desk: {DESK_TIER_LABELS[tier]}.
          </p>
        </div>
        {sepDesk ? (
        <Link
          href="#engagement-plans"
          className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Engagement plan
        </Link>
        ) : null}
      </header>

      {sepDesk ? <SepDashboardPanel /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects" value={String(totals.projectCount)} />
        <KpiCard
          label="Empowerment budget"
          value={zar(totals.empowermentBudget)}
        />
        <KpiCard
          label="Empowerment spent"
          value={zar(totals.empowermentSpent)}
        />
        <KpiCard
          label="Available"
          value={zar(totals.empowermentAvailable)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Empowerment achieved"
          value={pctLabel(totals.empowermentPct)}
          tone={
            totals.empowermentPct != null && totals.empowermentPct >= 80
              ? "default"
              : "attention"
          }
        />
        <KpiCard
          label="Local hire vs target"
          value={pctLabel(totals.localHirePct)}
        />
        <KpiCard label="Open cases" value={String(totals.openCases)} />
        <KpiCard
          label="Avg trust pulse"
          value={
            totals.avgTrust != null ? `${totals.avgTrust}/100` : "—"
          }
        />
      </div>

      {(spendBars.length > 0 || hireBars.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {spendBars.length > 0 ? (
            <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
              <h2 className="mb-3 text-base font-semibold text-tl-ink">
                Empowerment spend by project (%)
              </h2>
              <HorizontalBarChart bars={spendBars} maxHeight={200} />
            </div>
          ) : null}
          {hireBars.length > 0 ? (
            <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
              <h2 className="mb-3 text-base font-semibold text-tl-ink">
                Local hire vs target (%)
              </h2>
              <VerticalBarChart bars={hireBars} />
            </div>
          ) : null}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-tl-ink">
            Your projects
          </h2>
          <Link
            href="/app/projects"
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            Manage projects
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-tl-line bg-tl-surface px-4 py-6 text-sm text-tl-ink-muted">
            No projects yet.{" "}
            <Link href="/app/capture" className="text-tl-trust-ink underline">
              Capture a project dossier
            </Link>{" "}
            to start the executive view.
          </p>
        ) : (
          <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
            {rows.map((row) => (
              <li key={row.project.id}>
                <Link
                  href={`/app/projects/${encodeURIComponent(row.project.id)}`}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 text-sm transition hover:bg-tl-paper"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-tl-ink">
                        {row.project.name}
                      </span>
                      <ProjectStatusChip status={row.project.status} />
                    </div>
                    <p className="mt-1 text-xs text-tl-ink-muted">
                      {row.project.clientFunder || "No funder"} ·{" "}
                      {row.project.ward || row.project.municipality || "Place TBD"}
                    </p>
                    <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <dt className="text-tl-ink-muted">Empowerment budget</dt>
                        <dd className="font-medium tabular-nums">
                          {zar(row.empowermentBudget)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-tl-ink-muted">Spent / available</dt>
                        <dd className="font-medium tabular-nums">
                          {zar(row.empowermentSpent)} ·{" "}
                          {zar(row.empowermentAvailable)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-tl-ink-muted">Achieved</dt>
                        <dd className="font-medium tabular-nums">
                          {pctLabel(row.empowermentPct)}
                          {row.localHirePct != null
                            ? ` · hire ${pctLabel(row.localHirePct)}`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-tl-ink-muted">B-BBEE target</dt>
                        <dd>{row.bbbeeLevelTarget || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-tl-ink-muted">Cases / trust</dt>
                        <dd>
                          {row.openCases} open · {row.trustIndex}/100 (
                          {row.trustLabel})
                        </dd>
                      </div>
                      <div>
                        <dt className="text-tl-ink-muted">Packs on file</dt>
                        <dd>
                          {[
                            row.hasEmploymentPack && "Employment",
                            row.hasBbbeePack && "B-BBEE",
                            row.hasEsgPack && "ESG",
                            row.hasGrmPack && "GRM",
                            row.hasIssueLogPack && "Issue log",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "None yet — capture to fill charts"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-tl-trust-ink">
                    Open project dashboard →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {parked.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-tl-ink-muted">
            Completed / closed ({parked.length})
          </h2>
          <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-dashed border-tl-line bg-tl-surface text-sm">
            {parked.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/app/projects/${encodeURIComponent(project.id)}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-tl-paper"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-tl-ink">{project.name}</span>
                    <ProjectStatusChip status={project.status} />
                  </span>
                  <span className="text-xs text-tl-trust-ink">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
