"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { DonutChart } from "@/components/ops/charts/DonutChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import { MultiLineChart } from "@/components/ops/charts/MultiLineChart";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import { SepDashboardPanel } from "@/components/sep/SepDashboardPanel";
import { MelCyclePanel } from "@/components/dashboard/MelCyclePanel";
import { ModuleContributionBoard } from "@/components/dashboard/ModuleContributionBoard";
import { DashboardOverviewToolbar } from "@/components/dashboard/DashboardOverviewToolbar";
import {
  DashboardQuickActions,
  planOverviewQuickActions,
} from "@/components/dashboard/DashboardQuickActions";
import { OverviewChartCard } from "@/components/dashboard/OverviewChartCard";
import { SrmDashboardFrame } from "@/components/dashboard/SrmDashboardFrame";
import {
  ExecutiveWelcome,
  OverviewActivityFeed,
  ProjectHealthBars,
  ProjectPlacesCard,
  SocialImpactStrip,
  UpcomingEngagementsCard,
} from "@/components/dashboard/executiveOverviewPanels";
import { TrustWorkspaceHub } from "@/components/trust/TrustWorkspaceHub";
import { hasCapability } from "@/lib/entitlements";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  engagementSentimentBars,
  incidentPriorityBars,
  incidentStatusFunnel,
  projectStatusBars,
} from "@/lib/dashboardOverview";
import { buildPortfolioOverview } from "@/lib/portfolioMetrics";
import { isExecutiveDashboardProject } from "@/lib/projectCategoryMap";
import { isLiveMode } from "@/config/api";
import {
  listWorkspaceIncidents,
  listWorkspaceProjects,
  preferCloudIncidentList,
  preferCloudProjectList,
} from "@/lib/workspaceData";
import {
  countActiveProjects,
  countHeldEngagements,
  countOpenCases,
  engagementTrendSeries,
  formatPeriodLabel,
  grievanceStatusSlices,
  lastMonthBuckets,
  projectHealthMix,
  projectPlaceLabels,
  recentOverviewActivity,
  socialImpactFromPacks,
  upcomingEngagements,
  welcomeFirstName,
} from "@/lib/executiveOverview";
import { projectService } from "@/services/projectService";
import { incidentService } from "@/services/incidentService";
import type { PlanId } from "@/config/plans";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Engagement } from "@/types/engagement";
import type { Stakeholder } from "@/types/stakeholder";
import type { TlMode } from "@/lib/auth.constants";
import type { UserRole } from "@/types/rbac";
import { engagementService } from "@/services/engagementService";
import { commitmentService } from "@/services/commitmentService";
import { stakeholderService } from "@/services/stakeholderService";
import type { Commitment } from "@/types/commitment";

type Props = {
  role: UserRole;
  planId?: PlanId | null;
  isPlanOwner?: boolean;
  isVip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
  userName?: string;
  seedIncidents?: Incident[];
  seedProjects?: Project[];
};

/**
 * Executive portfolio dashboard — overall graphs for the workspace.
 * UX-3: mock layout with values derived from lists on file (no invented %).
 */
export function ExecutivePortfolioDashboard({
  role,
  planId = null,
  isPlanOwner = false,
  isVip = false,
  mode = null,
  email = null,
  userName = "",
  seedIncidents = [],
  seedProjects = [],
}: Props) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const showNotesPulse = hasCapability("engagements", planId);
  const showStakeholders = hasCapability("stakeholdersCrm", planId);
  const monthBuckets = useMemo(() => lastMonthBuckets(6), []);
  const periodLabel = formatPeriodLabel(monthBuckets);
  const quickActions = useMemo(
    () => planOverviewQuickActions(planId),
    [planId],
  );

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

  useEffect(() => {
    if (!showStakeholders) return;
    let cancelled = false;
    void stakeholderService.list().then((rows) => {
      if (!cancelled) setStakeholders(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [showStakeholders]);

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
  const trendPoints = useMemo(
    () => engagementTrendSeries(engagements, incidents, monthBuckets),
    [engagements, incidents, monthBuckets],
  );
  const grievanceSlices = useMemo(
    () => grievanceStatusSlices(incidents),
    [incidents],
  );
  const healthMix = useMemo(() => projectHealthMix(projects), [projects]);
  const impact = useMemo(() => socialImpactFromPacks(projects), [projects]);
  const activity = useMemo(
    () => recentOverviewActivity({ incidents, engagements }),
    [incidents, engagements],
  );
  const upcoming = useMemo(
    () => upcomingEngagements(engagements),
    [engagements],
  );
  const places = useMemo(() => projectPlaceLabels(projects), [projects]);
  const activeProjectCount = useMemo(
    () => countActiveProjects(projects),
    [projects],
  );
  const heldCount = useMemo(
    () => countHeldEngagements(engagements),
    [engagements],
  );
  const openCaseCount = useMemo(
    () => countOpenCases(incidents),
    [incidents],
  );

  const trendSeries = [
    {
      id: "engagements",
      label: "Engagements",
      color: "var(--tl-trust)",
      values: trendPoints.map((p) => p.engagements),
    },
    {
      id: "reached",
      label: "Stakeholders reached",
      color: "var(--tl-demo)",
      values: trendPoints.map((p) => p.stakeholdersReached),
    },
    {
      id: "cases",
      label: "Cases logged",
      color: "var(--tl-danger)",
      values: trendPoints.map((p) => p.grievances),
    },
  ];

  return (
    <SrmDashboardFrame
      kpiWrap
      header={
        <div className="space-y-4">
          <p className="text-sm font-medium text-tl-trust">Overview</p>
          <ExecutiveWelcome
            firstName={welcomeFirstName(userName)}
            periodLabel={periodLabel}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-tl-ink-muted">
              Desk: {DESK_TIER_LABELS[tier]}
              {isPlanOwner ? " · Plan Owner" : ""}.
            </p>
            <DashboardOverviewToolbar
              planId={planId}
              extra={
                showNotesPulse
                  ? [{ href: "/app/engagement-plan", label: "Engagement plan" }]
                  : []
              }
            />
          </div>
        </div>
      }
      kpis={
        <>
          <KpiCard
            label="Active projects"
            value={String(activeProjectCount)}
            hint="Active or approved"
            wash="trust"
          />
          {showStakeholders ? (
            <KpiCard
              label="Stakeholders"
              value={String(stakeholders.length)}
              hint="On file"
              wash="demo"
            />
          ) : null}
          {showNotesPulse ? (
            <KpiCard
              label="Engagements held"
              value={String(heldCount)}
              hint="Held or closed"
              wash="paper"
            />
          ) : null}
          <KpiCard
            label="Open cases"
            value={String(openCaseCount)}
            hint="On file"
            wash="amber"
          />
          <KpiCard
            label="Trust pulse"
            value={totals.avgTrust != null ? `${totals.avgTrust}/100` : "—"}
            hint="On file"
            wash="paper"
          />
        </>
      }
      overview={
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <OverviewChartCard
              title="Engagement trend"
              hint="Records dated in this window — not a last-period estimate."
            >
              <MultiLineChart
                labels={trendPoints.map((p) => p.label)}
                series={trendSeries}
              />
            </OverviewChartCard>
            <OverviewChartCard
              title="Grievance status"
              hint="Open, in progress, and resolved from the case register."
            >
              <DonutChart
                slices={grievanceSlices}
                centerLabel="Cases"
                empty="No cases on file."
              />
            </OverviewChartCard>
            <ProjectPlacesCard places={places} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SocialImpactStrip impact={impact} />
            <ProjectHealthBars mix={healthMix} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <OverviewActivityFeed rows={activity} />
            <UpcomingEngagementsCard rows={upcoming} />
            <DashboardQuickActions actions={quickActions} variant="stack" />
          </div>
        </>
      }
    >
      <MelCyclePanel
        projects={openProjects}
        commitments={commitments}
        incidents={incidents}
        planId={planId}
        onIncidentSaved={(next) =>
          setIncidents((current) =>
            current.map((row) => (row.id === next.id ? next : row)),
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChartCard
          title="Projects by status"
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
    </SrmDashboardFrame>
  );
}
