"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import { buildProjectActivity } from "@/lib/dashboardActivity";
import { readDeskTier } from "@/lib/deskVisibility";
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

const QUICK_LINKS: Array<{
  href: string;
  label: string;
  hint: string;
}> = [
  { href: "/app/projects", label: "Projects", hint: "Sites & delivery" },
  { href: "/app/incidents", label: "Incidents", hint: "Open cases" },
  { href: "/app/capture", label: "Capture", hint: "Minutes & registers" },
  { href: "/app/stakeholders", label: "Stakeholders", hint: "CRM registry" },
  { href: "/app/reports", label: "Reports", hint: "Packs & write" },
  { href: "/app/issues/report", label: "Report issue", hint: "New intake" },
];

/**
 * Primary Activity dashboard — overall navigation + project activity pulse.
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

  useEffect(() => {
    setTier(readDeskTier(role));
    setIncidents(listWorkspaceIncidents(seedIncidents));
    setProjects(listWorkspaceProjects(seedProjects));
  }, [role, seedIncidents, seedProjects]);

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

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-sm font-medium text-tl-trust">Activity dashboard</p>
        <h1 className="font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
          {isPlanOwner ? "Plan Owner command" : "Workspace activity"}
        </h1>
        <p className="max-w-2xl text-sm text-tl-ink-muted">
          Navigate the desk and scan project activity. Reporting packs live on
          the companion{" "}
          <Link href="/app/reports" className="text-tl-trust-ink underline">
            Reports dashboard
          </Link>
          . Desk: {DESK_TIER_LABELS[tier]}
          {isPlanOwner ? " · you control pack access in Settings" : ""}.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-base font-semibold text-tl-ink">
          Overall navigation
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
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
      </section>

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

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-tl-ink">
            Project activity
          </h2>
          <Link
            href="/app/projects"
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            All projects
          </Link>
        </div>
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
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold text-tl-ink">
          Reports available to this desk
        </h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
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
      </section>
    </div>
  );
}
