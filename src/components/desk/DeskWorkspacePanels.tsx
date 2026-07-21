"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { IncidentTable } from "@/components/ui/IncidentTable";
import { TrustPulse } from "@/components/trust/TrustPulse";
import { listDemoIncidents, listDemoProjects } from "@/lib/demoStore";
import {
  canSee,
  priorityRank,
  readDeskTier,
  readVisibilityMatrix,
} from "@/lib/deskVisibility";
import { averageTatHours, countOverStageTarget } from "@/lib/tatMetrics";
import { readTrialModeFromDocument } from "@/lib/trial";
import { listTrialIncidents, listTrialProjects } from "@/lib/trialStore";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";
import { ProjectStatusChip } from "@/components/ui/StatusChip";

function mergeIncidents(seed: Incident[], local: Incident[]): Incident[] {
  const byId = new Map<string, Incident>();
  for (const row of [...local, ...seed]) byId.set(row.id, row);
  return [...byId.values()];
}

function mergeProjects(seed: Project[], local: Project[]): Project[] {
  const byId = new Map<string, Project>();
  for (const row of [...local, ...seed]) byId.set(row.id, row);
  return [...byId.values()];
}

function rankFilings(rows: Incident[]): Incident[] {
  return [...rows]
    .filter((i) => i.status !== "Closed")
    .filter((i) => {
      const tier = i.filedByTier;
      return !tier || tier === "clo" || tier === "site";
    })
    .sort((a, b) => {
      const pr = priorityRank(b.priority) - priorityRank(a.priority);
      if (pr !== 0) return pr;
      if (a.slaBreached !== b.slaBreached) return a.slaBreached ? -1 : 1;
      const sa = a.sentimentScore ?? 0;
      const sb = b.sentimentScore ?? 0;
      return sa - sb;
    });
}

type DeskWorkspacePanelsProps = {
  role: UserRole;
  /** Optional server seed already loaded for this role home. */
  seedIncidents?: Incident[];
  seedProjects?: Project[];
  showProjectList?: boolean;
};

/**
 * Client panels gated by desk tier visibility: trust, supervisor queue, graphs.
 */
export function DeskWorkspacePanels({
  role,
  seedIncidents = [],
  seedProjects = [],
  showProjectList = true,
}: DeskWorkspacePanelsProps) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [matrix, setMatrix] = useState(() => readVisibilityMatrix());
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [projects, setProjects] = useState<Project[]>(seedProjects);

  useEffect(() => {
    const desk = readDeskTier(role);
    setTier(desk);
    setMatrix(readVisibilityMatrix());
    let cancelled = false;
    (async () => {
      const [iRows, pRows] = await Promise.all([
        incidentService.list(),
        projectService.list(),
      ]);
      if (cancelled) return;
      const trial = readTrialModeFromDocument();
      const localI = trial ? listTrialIncidents() : listDemoIncidents();
      const localP = trial ? listTrialProjects() : listDemoProjects();
      setIncidents(mergeIncidents([...seedIncidents, ...iRows], localI));
      setProjects(mergeProjects([...seedProjects, ...pRows], localP));
    })();
    return () => {
      cancelled = true;
    };
    // Seed arrays from RSC are stable per request; merge once on mount / role change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const open = incidents.filter((i) => i.status !== "Closed");
  const ranked = useMemo(() => rankFilings(incidents), [incidents]);

  const byPriority = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of open) {
      map.set(i.priority, (map.get(i.priority) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [open]);

  const byNature = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of open) {
      const key = String(i.nature || i.category || "Other");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .slice(0, 8);
  }, [open]);

  const overTat = countOverStageTarget(open);
  const tatBars = [
    { label: "Open", value: open.length },
    { label: "Over TAT", value: overTat },
    {
      label: "SLA breach",
      value: open.filter((i) => i.slaBreached).length,
    },
  ];

  return (
    <div className="space-y-7">
      <p className="text-xs text-tl-ink-muted">
        Desk:{" "}
        <span className="font-medium text-tl-ink">{DESK_TIER_LABELS[tier]}</span>
        {" · "}
        <Link href="/app/settings" className="text-tl-trust-ink underline">
          Change in Settings
        </Link>
      </p>

      {canSee("trustPulse", tier, matrix) ? (
        <TrustPulse
          incidents={incidents}
          levelLabel={DESK_TIER_LABELS[tier]}
          avgTatHours={averageTatHours(incidents)}
          openOverTarget={overTat}
        />
      ) : null}

      {canSee("supervisorQueue", tier, matrix) ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-tl-ink">
              Ranked filings (CLO / site → supervisor)
            </h2>
            <Link
              href="/app/incidents"
              className="text-xs font-medium text-tl-trust-ink hover:underline"
            >
              All incidents
            </Link>
          </div>
          <p className="text-xs text-tl-ink-muted">
            Sorted by urgency, SLA pressure, then sentiment (lower = hotter).
          </p>
          <IncidentTable
            incidents={ranked.slice(0, 10)}
            emptyLabel="No open junior filings in the queue."
          />
        </section>
      ) : null}

      {canSee("graphs", tier, matrix) ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
            <h2 className="text-base font-semibold text-tl-ink">
              Open by priority
            </h2>
            <div className="mt-4">
              <VerticalBarChart bars={byPriority} />
            </div>
          </section>
          <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
            <h2 className="text-base font-semibold text-tl-ink">
              {canSee("esgSignals", tier, matrix)
                ? "Nature / ESG mix"
                : "Open vs turnaround pressure"}
            </h2>
            <div className="mt-4">
              {canSee("esgSignals", tier, matrix) ? (
                <HorizontalBarChart bars={byNature} />
              ) : (
                <HorizontalBarChart bars={tatBars} />
              )}
            </div>
          </section>
        </div>
      ) : null}

      {showProjectList ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-tl-ink">Projects</h2>
            <Link
              href="/app/projects"
              className="text-xs font-medium text-tl-trust-ink hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
            {projects.slice(0, 8).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <Link
                    href={`/app/projects/${p.id}`}
                    className="font-medium text-tl-ink hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-tl-ink-muted">
                    {p.ward || "Area TBD"}
                    {canSee("budget", tier, matrix)
                      ? ` · budget R${Math.round(p.budgetTotal / 1000)}k`
                      : ""}
                  </p>
                </div>
                <ProjectStatusChip status={p.status} />
              </li>
            ))}
            {projects.length === 0 ? (
              <li className="px-4 py-4 text-sm text-tl-ink-muted">
                No projects yet — link one when reporting an issue.
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
