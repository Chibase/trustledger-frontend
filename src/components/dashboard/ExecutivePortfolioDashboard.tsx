"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import { SepDashboardPanel } from "@/components/sep/SepDashboardPanel";
import { MelVarianceAlert } from "@/components/dashboard/MelVarianceAlert";
import { MelAdaptWatch } from "@/components/dashboard/MelAdaptWatch";
import { ModuleContributionBoard } from "@/components/dashboard/ModuleContributionBoard";
import { DashboardOverviewToolbar } from "@/components/dashboard/DashboardOverviewToolbar";
import { OverviewChartCard } from "@/components/dashboard/OverviewChartCard";
import { TrustWorkspaceHub } from "@/components/trust/TrustWorkspaceHub";
import { hasCapability } from "@/lib/entitlements";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  engagementSentimentBars,
  incidentPriorityBars,
  incidentStatusFunnel,
  projectStatusBars,
} from "@/lib/dashboardOverview";
import {
  buildPortfolioOverview,
  pctLabel,
} from "@/lib/portfolioMetrics";
import { isExecutiveDashboardProject } from "@/lib/projectCategoryMap";
import { isLiveMode } from "@/config/api";
import {
  listWorkspaceIncidents,
  listWorkspaceProjects,
  preferCloudIncidentList,
  preferCloudProjectList,
} from "@/lib/workspaceData";
import { projectService } from "@/services/projectService";
import { incidentService } from "@/services/incidentService";
import type { PlanId } from "@/config/plans";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Engagement } from "@/types/engagement";
import type { TlMode } from "@/lib/auth.constants";
import type { UserRole } from "@/types/rbac";
import { engagementService } from "@/services/engagementService";
import { commitmentService } from "@/services/commitmentService";
import type { Commitment } from "@/types/commitment";

type Props = {
  role: UserRole;
  planId?: PlanId | null;
  isPlanOwner?: boolean;
  isVip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
  seedIncidents?: Incident[];
  seedProjects?: Project[];
};

/**
 * Executive portfolio dashboard — overall graphs for the workspace.
 */
export function ExecutivePortfolioDashboard({
  role,
  planId = null,
  isPlanOwner = false,
  isVip = false,
  mode = null,
  email = null,
  seedIncidents = [],
  seedProjects = [],
}: Props) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const showNotesPulse = hasCapability("engagements", planId);

  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      if (isLiveMode()) {
        const cloud = await projectService.list();
        if (!cancelled) setProjects(preferCloudProjectList(cloud));
        return;
      }
      if (!cancelled) setProjects(listWorkspaceProjects(seedProjects));
    };
    const loadIncidents = async () => {
      if (isLiveMode()) {
        const cloud = await incidentService.list();
        if (!cancelled) setIncidents(preferCloudIncidentList(cloud));
        return;
      }
      if (!cancelled) setIncidents(listWorkspaceIncidents(seedIncidents));
    };
    const refresh = () => {
      setTier(readDeskTier(role));
      void loadIncidents();
      void loadProjects();
    };
    const frame = requestAnimationFrame(refresh);
    window.addEventListener("tl-workspace-seeded", refresh);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("tl-workspace-seeded", refresh);
    };
  }, [role, seedIncidents, seedProjects]);

  useEffect(() => {
    if (!hasCapability("engagements", planId)) return;
    let cancelled = false;
    void engagementService.list().then((rows) => {
      if (!cancelled) setEngagements(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  useEffect(() => {
    if (!hasCapability("commitments", planId)) return;
    let cancelled = false;
    void commitmentService.list().then((rows) => {
      if (!cancelled) setCommitments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const openProjects = useMemo(
    () => projects.filter(isExecutiveDashboardProject),
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
      label: r.project.name.split("—")[0]?.trim() || r.project.id,
      value: r.empowermentPct ?? 0,
    }))
    .slice(0, 8);

  const hireBars = rows
    .filter((r) => r.localHirePct != null)
    .map((r) => ({
      label: r.project.name.split("—")[0]?.trim() || r.project.id,
      value: r.localHirePct ?? 0,
    }))
    .slice(0, 8);

  const statusBars = useMemo(
    () => projectStatusBars(projects),
    [projects],
  );
  const priorityBars = useMemo(
    () => incidentPriorityBars(incidents),
    [incidents],
  );
  const funnel = useMemo(
    () => incidentStatusFunnel(incidents),
    [incidents],
  );
  const sentimentBars = useMemo(
    () => engagementSentimentBars(engagements),
    [engagements],
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-tl-trust">Overview</p>
          <h1 className="font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
            Workspace health
          </h1>
          <p className="max-w-2xl text-sm text-tl-ink-muted">
            Overall graphs for this workspace. Open a module for records and
            evidence. Desk: {DESK_TIER_LABELS[tier]}
            {isPlanOwner ? " · Plan Owner" : ""}.
          </p>
        </div>
        <DashboardOverviewToolbar
          planId={planId}
          extra={
            showNotesPulse
              ? [{ href: "/app/engagement-plan", label: "Engagement plan" }]
              : []
          }
        />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open projects" value={String(totals.projectCount)} />
        <KpiCard
          label="Empowerment achieved"
          value={pctLabel(totals.empowermentPct)}
          tone={
            totals.empowermentPct != null && totals.empowermentPct >= 80
              ? "default"
              : "attention"
          }
        />
        <KpiCard label="Open cases" value={String(totals.openCases)} />
        <KpiCard
          label="Avg trust pulse"
          value={totals.avgTrust != null ? `${totals.avgTrust}/100` : "—"}
        />
      </div>

      <MelVarianceAlert projects={openProjects} commitments={commitments} />
      <MelAdaptWatch incidents={incidents} />

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChartCard
          title="Project status"
          hint="Workspace mix"
        >
          {statusBars.length ? (
            <VerticalBarChart bars={statusBars} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No projects yet.</p>
          )}
        </OverviewChartCard>
        <OverviewChartCard
          title="Case pipeline"
          hint="Open through closed"
        >
          {incidents.length ? (
            <FunnelChart steps={funnel} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No cases yet.</p>
          )}
        </OverviewChartCard>
        <OverviewChartCard
          title="Open cases by priority"
          hint="P1–P4 across the workspace"
        >
          {priorityBars.length ? (
            <VerticalBarChart bars={priorityBars} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No open cases.</p>
          )}
        </OverviewChartCard>
        {spendBars.length > 0 ? (
          <OverviewChartCard
            title="Empowerment spend"
            hint="Achieved % by project"
          >
            <HorizontalBarChart bars={spendBars} maxHeight={200} />
          </OverviewChartCard>
        ) : hireBars.length > 0 ? (
          <OverviewChartCard
            title="Local hire vs target"
            hint="Achieved % by project"
          >
            <VerticalBarChart bars={hireBars} />
          </OverviewChartCard>
        ) : showNotesPulse && sentimentBars.length > 0 ? (
          <OverviewChartCard
            title="Note sentiment mix"
            hint="Applied note sentiment — not a trust observation"
          >
            <VerticalBarChart bars={sentimentBars} />
          </OverviewChartCard>
        ) : (
          <OverviewChartCard
            title="Empowerment spend"
            hint="Capture employment or B-BBEE packs to chart spend"
          >
            <p className="text-sm text-tl-ink-muted">
              No empowerment figures on file yet.
            </p>
          </OverviewChartCard>
        )}
      </div>

      {hireBars.length > 0 && spendBars.length > 0 ? (
        <OverviewChartCard
          title="Local hire vs target"
          hint="Achieved % by project"
        >
          <VerticalBarChart bars={hireBars} />
        </OverviewChartCard>
      ) : null}

      <ModuleContributionBoard
        planId={planId}
        vip={isVip}
        mode={mode}
        email={email}
      />

      <TrustWorkspaceHub />

      <details className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-tl-ink">
          Engagement plans
        </summary>
        <div className="mt-4">
          <SepDashboardPanel planId={planId} alwaysShow />
        </div>
      </details>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-tl-ink">Projects</h2>
          <Link
            href="/app/projects"
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            Open project dashboards
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-tl-line bg-tl-surface px-4 py-6 text-sm text-tl-ink-muted">
            {projects.length === 0 ? (
              <>
                No projects yet.{" "}
                <Link
                  href="/app/projects?new=1"
                  className="text-tl-trust-ink underline"
                >
                  Add a project
                </Link>{" "}
                to start the overview.
              </>
            ) : (
              <>
                Open delivery is empty — {projects.length} completed or closed.{" "}
                <Link href="/app/projects" className="text-tl-trust-ink underline">
                  Open the project list
                </Link>{" "}
                to reach those dashboards.
              </>
            )}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {rows.slice(0, 6).map((row) => (
              <li key={row.project.id}>
                <Link
                  href={`/app/projects/${encodeURIComponent(row.project.id)}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-tl-line bg-tl-surface px-4 py-3 text-sm hover:bg-tl-paper"
                >
                  <span className="min-w-0 truncate font-medium text-tl-ink">
                    {row.project.name}
                  </span>
                  <ProjectStatusChip status={row.project.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
