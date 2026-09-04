"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import { DashboardOverviewToolbar } from "@/components/dashboard/DashboardOverviewToolbar";
import { OverviewChartCard } from "@/components/dashboard/OverviewChartCard";
import { VerticalBarChart } from "@/components/ops/charts/BarChart";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import { buildProjectActivity } from "@/lib/dashboardActivity";
import {
  incidentPriorityBars,
  projectStatusBars,
} from "@/lib/dashboardOverview";
import { readDeskTier } from "@/lib/deskVisibility";
import { hasCapability } from "@/lib/entitlements";
import { packsForDesk } from "@/lib/reportPackAccess";
import {
  listWorkspaceIncidents,
  listWorkspaceProjects,
} from "@/lib/workspaceData";
import type { PlanId } from "@/config/plans";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import { REPORT_PACKS } from "@/types/reportPacks";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

type ActivityDashboardProps = {
  role: UserRole;
  planId?: PlanId | null;
  isPlanOwner?: boolean;
  seedIncidents?: Incident[];
  seedProjects?: Project[];
};

/**
 * Activity overview — overall graphs for the workspace.
 * Companion to the Reports dashboard (`/app/reports`).
 */
export function ActivityDashboard({
  role,
  planId = null,
  isPlanOwner = false,
  seedIncidents = [],
  seedProjects = [],
}: ActivityDashboardProps) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [showSep, setShowSep] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTier(readDeskTier(role));
      setIncidents(listWorkspaceIncidents(seedIncidents));
      setProjects(listWorkspaceProjects(seedProjects));
      setShowSep(hasCapability("engagements", planId));
    });
    return () => cancelAnimationFrame(frame);
  }, [role, planId, seedIncidents, seedProjects]);

  const activity = useMemo(
    () => buildProjectActivity(projects, incidents),
    [projects, incidents],
  );

  const open = incidents.filter((i) => i.status !== "Closed");
  const highRisk = open.filter(
    (i) => i.priority === "P1-Critical" || i.priority === "P2-High",
  );
  const breached = open.filter((i) => i.slaBreached);
  const availablePacks = packsForDesk(tier, planId);
  const statusBars = useMemo(() => projectStatusBars(projects), [projects]);
  const priorityBars = useMemo(
    () => incidentPriorityBars(incidents),
    [incidents],
  );

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-tl-trust">Overview</p>
          <h1 className="font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
            Workspace health
          </h1>
          <p className="max-w-2xl text-sm text-tl-ink-muted">
            Overall graphs for this workspace. Reporting packs live on the{" "}
            <Link href="/app/reports" className="text-tl-trust-ink underline">
              Reports
            </Link>{" "}
            desk. Desk: {DESK_TIER_LABELS[tier]}
            {isPlanOwner ? " · you control pack access in Settings" : ""}.
          </p>
        </div>
        <DashboardOverviewToolbar
          extra={
            showSep
              ? [{ href: "/app/engagement-plan", label: "Engagement plan" }]
              : []
          }
        />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects" value={String(projects.length)} />
        <KpiCard label="Open cases" value={String(open.length)} />
        <KpiCard
          label="High risk"
          value={String(highRisk.length)}
          tone={highRisk.length > 0 ? "attention" : "default"}
        />
        <KpiCard
          label="SLA pressure"
          value={String(breached.length)}
          tone={breached.length > 0 ? "attention" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChartCard title="Project status" hint="Workspace mix">
          {statusBars.length ? (
            <VerticalBarChart bars={statusBars} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No projects yet.</p>
          )}
        </OverviewChartCard>
        <OverviewChartCard title="Open cases by priority" hint="P1–P4">
          {priorityBars.length ? (
            <VerticalBarChart bars={priorityBars} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No open cases.</p>
          )}
        </OverviewChartCard>
      </div>

      <details className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-tl-ink">
          Project activity
        </summary>
        {activity.length === 0 ? (
          <p className="rounded-lg border border-dashed border-tl-line bg-tl-surface px-4 py-6 text-sm text-tl-ink-muted">
            No projects in this workspace yet.
          </p>
        ) : (
          <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
            {activity.map((row) => (
              <li
                key={row.project.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/app/projects/${row.project.id}`}
                      className="font-medium text-tl-ink hover:underline"
                    >
                      {row.project.name}
                    </Link>
                    <ProjectStatusChip status={row.project.status} />
                  </div>
                  <p className="mt-1 text-xs text-tl-ink-muted">
                    {row.open} open · {row.highRisk} high risk ·{" "}
                    {row.escalated} escalated · trust {row.trustIndex}/100 (
                    {row.trustLabel})
                  </p>
                </div>
                <Link
                  href={`/app/incidents?project=${encodeURIComponent(row.project.id)}`}
                  className="text-xs font-medium text-tl-trust-ink hover:underline"
                >
                  View cases
                </Link>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-tl-ink">
          Reports available to this desk
        </summary>
        <p className="mt-2 text-xs text-tl-ink-muted">
          Pack availability follows plan seniority and Plan Owner grants.
        </p>
        {availablePacks.length === 0 ? (
          <p className="mt-3 text-sm text-tl-ink-muted">
            No report packs enabled for {DESK_TIER_LABELS[tier]}. Ask your Plan
            Owner, or upgrade the commercial plan.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {availablePacks.map((id) => (
              <li key={id}>
                <Link
                  href={`/app/reports?pack=${id}`}
                  className="inline-flex rounded-md border border-tl-line bg-tl-paper px-3 py-1.5 text-xs font-medium text-tl-ink hover:border-tl-trust/50"
                >
                  {REPORT_PACKS[id].shortLabel}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/app/reports"
          className="mt-3 inline-block text-sm font-medium text-tl-trust-ink underline"
        >
          Open Reports dashboard
        </Link>
      </details>
    </div>
  );
}
