"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { CreateReportWizard } from "@/components/reports/CreateReportWizard";
import { ReportsLibrary } from "@/components/reports/ReportsLibrary";
import { KpiCard } from "@/components/ui/KpiCard";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  buildProjectActivity,
  priorityBars,
  projectOpenBars,
  statusBars,
} from "@/lib/dashboardActivity";
import { listDemoIncidents, listDemoProjects } from "@/lib/demoStore";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  canDeskOpenPack,
  packsForDesk,
} from "@/lib/reportPackAccess";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import { readTrialModeFromDocument } from "@/lib/trial";
import { listTrialIncidents, listTrialProjects } from "@/lib/trialStore";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import {
  REPORT_PACK_IDS,
  REPORT_PACKS,
  planIncludesPack,
  type ReportPackId,
} from "@/types/reportPacks";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

function readInitialPack(): ReportPackId | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("pack");
  if (raw && (REPORT_PACK_IDS as readonly string[]).includes(raw)) {
    return raw as ReportPackId;
  }
  return null;
}

type ReportsHubProps = {
  role: UserRole;
  authorName: string;
  planId?: PlanId | null;
  isPlanOwner?: boolean;
};

/**
 * Reports dashboard — choose monthly / executive / board packs by need,
 * gated by plan seniority and Plan Owner desk grants.
 */
export function ReportsHub({
  role,
  authorName,
  planId = null,
  isPlanOwner = false,
}: ReportsHubProps) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [pack, setPack] = useState<ReportPackId | null>(null);
  const [writeMode, setWriteMode] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setTier(readDeskTier(role));
    const trial = readTrialModeFromDocument();
    const localI = trial ? listTrialIncidents() : listDemoIncidents();
    const localP = trial ? listTrialProjects() : listDemoProjects();
    const byI = new Map(
      [...mockIncidents, ...localI].map((i) => [i.id, i] as const),
    );
    const byP = new Map(
      [...mockProjects, ...localP].map((p) => [p.id, p] as const),
    );
    setIncidents([...byI.values()]);
    setProjects([...byP.values()]);
    const fromUrl = readInitialPack();
    const allowed = packsForDesk(readDeskTier(role), planId);
    if (fromUrl && allowed.includes(fromUrl)) setPack(fromUrl);
    else if (allowed[0]) setPack(allowed[0]);
  }, [role, planId]);

  const allowed = useMemo(() => packsForDesk(tier, planId), [tier, planId]);
  const activity = useMemo(
    () => buildProjectActivity(projects, incidents),
    [projects, incidents],
  );
  const open = incidents.filter((i) => i.status !== "Closed");
  const highRisk = open.filter(
    (i) => i.priority === "P1-Critical" || i.priority === "P2-High",
  );
  const pulse = trustIndexFromIncidents(incidents);
  const active = pack ? REPORT_PACKS[pack] : null;

  function selectPack(id: ReportPackId) {
    if (!canDeskOpenPack(id, tier, planId)) return;
    setPack(id);
    setWriteMode(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("pack", id);
      window.history.replaceState({}, "", url.toString());
    }
  }

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-sm font-medium text-tl-trust">Reports dashboard</p>
        <h1 className="font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
          Choose a reporting form
        </h1>
        <p className="max-w-2xl text-sm text-tl-ink-muted">
          Monthly (text + graphs), Executive (strategic / high-risk graphs), or
          Board pack (presentation for clients, board, and funders). Your plan
          ({planId ? PLANS[planId].name : "Demo · Project lens"}) and desk (
          {DESK_TIER_LABELS[tier]}) decide what opens
          {isPlanOwner
            ? " — grant desks in Settings → Report pack access"
            : ""}.
          {" "}
          <Link href="/app/dashboard" className="text-tl-trust-ink underline">
            Back to Activity dashboard
          </Link>
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-base font-semibold text-tl-ink">
          Report formats
        </h2>
        <ul className="grid gap-3 lg:grid-cols-3">
          {REPORT_PACK_IDS.map((id) => {
            const def = REPORT_PACKS[id];
            const onPlan = planIncludesPack(planId, id);
            const canOpen = canDeskOpenPack(id, tier, planId);
            const selected = pack === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={!canOpen}
                  onClick={() => selectPack(id)}
                  className={`flex h-full w-full flex-col rounded-lg border px-4 py-4 text-left transition ${
                    selected
                      ? "border-tl-trust bg-tl-trust/5"
                      : canOpen
                        ? "border-tl-line bg-tl-surface hover:border-tl-trust/40"
                        : "cursor-not-allowed border-tl-line/70 bg-tl-paper/40 opacity-60"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                    {def.composition}
                  </span>
                  <span className="mt-1 font-display text-lg font-semibold text-tl-ink">
                    {def.label}
                  </span>
                  <span className="mt-2 text-sm text-tl-ink-muted">
                    {def.description}
                  </span>
                  {!onPlan ? (
                    <span className="mt-3 text-xs font-medium text-tl-amber">
                      Requires {PLANS[def.minPlan].name}+
                    </span>
                  ) : !canOpen ? (
                    <span className="mt-3 text-xs font-medium text-tl-ink-muted">
                      Not granted to {DESK_TIER_LABELS[tier]}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        {allowed.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink-muted">
            No packs available on this desk.{" "}
            {isPlanOwner
              ? "Enable desks under Settings → Report pack access, or upgrade plan."
              : "Ask your Plan Owner to grant access, or upgrade the plan."}
          </p>
        ) : null}
      </section>

      {active && canDeskOpenPack(active.id, tier, planId) ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-tl-ink">
                {active.label}
              </h2>
              <p className="mt-1 text-sm text-tl-ink-muted">
                {active.composition} · evidence from workspace demo cases
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWriteMode((v) => !v)}
                className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
              >
                {writeMode ? "Hide AI writer" : "Write with evidence AI"}
              </button>
              <Link
                href="/app/dashboard"
                className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                Activity dashboard
              </Link>
            </div>
          </div>

          {active.id === "monthly" ? (
            <MonthlyPackView
              openCount={open.length}
              highRisk={highRisk.length}
              trustIndex={pulse.trustIndex}
              trustLabel={pulse.label}
              status={statusBars(incidents)}
              byProject={projectOpenBars(activity)}
              narrativeCases={open.slice(0, 4)}
            />
          ) : null}

          {active.id === "executive" ? (
            <ExecutivePackView
              highRisk={highRisk}
              activity={activity}
              priority={priorityBars(open)}
              trustIndex={pulse.trustIndex}
            />
          ) : null}

          {active.id === "board_presentation" ? (
            <BoardPackView
              projects={projects.length}
              openCount={open.length}
              highRisk={highRisk.length}
              trustIndex={pulse.trustIndex}
              trustLabel={pulse.label}
              status={statusBars(incidents)}
              priority={priorityBars(open)}
              topRisks={highRisk.slice(0, 5)}
            />
          ) : null}

          {writeMode ? (
            <div className="rounded-lg border border-dashed border-tl-line bg-tl-paper/50 p-4">
              <p className="mb-4 text-sm text-tl-ink-muted">
                Evidence writer for this pack’s default kind (
                {active.defaultKind.replaceAll("_", " ")}). Cloud Month-End
                templates are blocked.
              </p>
              <CreateReportWizard role={role} authorName={authorName} />
            </div>
          ) : null}

          <ReportsLibrary role={role} />
        </section>
      ) : null}
    </div>
  );
}

function MonthlyPackView({
  openCount,
  highRisk,
  trustIndex,
  trustLabel,
  status,
  byProject,
  narrativeCases,
}: {
  openCount: number;
  highRisk: number;
  trustIndex: number;
  trustLabel: string;
  status: Array<{ label: string; value: number }>;
  byProject: Array<{ label: string; value: number }>;
  narrativeCases: Incident[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Open cases" value={String(openCount)} />
        <KpiCard
          label="High risk"
          value={String(highRisk)}
          tone={highRisk > 0 ? "attention" : "default"}
        />
        <KpiCard label={`Trust · ${trustLabel}`} value={`${trustIndex}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <figure className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <figcaption className="mb-3 text-sm font-medium text-tl-ink">
            Case status mix
          </figcaption>
          <VerticalBarChart bars={status} />
        </figure>
        <figure className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <figcaption className="mb-3 text-sm font-medium text-tl-ink">
            Open cases by project
          </figcaption>
          <HorizontalBarChart bars={byProject} />
        </figure>
      </div>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">Period narrative</h3>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Operational month in review: {openCount} open matters remain on the
          desk, including {highRisk} high-risk items. Trust pulse sits at{" "}
          {trustIndex}/100 ({trustLabel}). Lead cases below — expand with the
          evidence AI writer for a full text pack.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-tl-ink">
          {narrativeCases.map((c) => (
            <li key={c.id}>
              <span className="font-medium">{c.id}</span> — {c.title} (
              {c.priority}, {c.status})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ExecutivePackView({
  highRisk,
  activity,
  priority,
  trustIndex,
}: {
  highRisk: Incident[];
  activity: ReturnType<typeof buildProjectActivity>;
  priority: Array<{ label: string; value: number }>;
  trustIndex: number;
}) {
  const hot = activity
    .filter((r) => r.highRisk > 0 || r.breached > 0)
    .sort((a, b) => b.highRisk - a.highRisk || b.breached - a.breached)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Strategic high-risk cases"
          value={String(highRisk.length)}
          tone={highRisk.length > 0 ? "attention" : "default"}
        />
        <KpiCard label="Hot projects" value={String(hot.length)} />
        <KpiCard label="Portfolio trust" value={`${trustIndex}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <figure className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <figcaption className="mb-3 text-sm font-medium text-tl-ink">
            Priority pressure (open)
          </figcaption>
          <VerticalBarChart bars={priority} />
        </figure>
        <figure className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <figcaption className="mb-3 text-sm font-medium text-tl-ink">
            Project risk heat (open / high / SLA)
          </figcaption>
          <HorizontalBarChart
            bars={hot.map((r) => ({
              label: r.project.name.split("—")[0]?.trim().slice(0, 16) || r.project.id,
              value: r.highRisk * 2 + r.breached + r.escalated,
            }))}
          />
        </figure>
      </div>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">
          Strategic issues & high risks
        </h3>
        <ul className="mt-3 divide-y divide-tl-line">
          {highRisk.length === 0 ? (
            <li className="py-2 text-sm text-tl-ink-muted">
              No P1/P2 open items in scope.
            </li>
          ) : (
            highRisk.slice(0, 6).map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{c.id}</span> — {c.title}
                </span>
                <span className="text-xs text-tl-amber">
                  {c.priority}
                  {c.slaBreached ? " · SLA" : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function BoardPackView({
  projects,
  openCount,
  highRisk,
  trustIndex,
  trustLabel,
  status,
  priority,
  topRisks,
}: {
  projects: number;
  openCount: number;
  highRisk: number;
  trustIndex: number;
  trustLabel: string;
  status: Array<{ label: string; value: number }>;
  priority: Array<{ label: string; value: number }>;
  topRisks: Incident[];
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-tl-ink-muted">
        Presentation layout — short slides of assurance metrics for clients,
        board, and funders. Print or export from the browser when ready.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="flex min-h-[14rem] flex-col justify-between rounded-lg border border-tl-line bg-tl-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Slide 1 · Assurance position
          </p>
          <div>
            <p className="font-display text-3xl font-semibold text-tl-ink">
              Trust {trustIndex}/100
            </p>
            <p className="mt-2 text-sm text-tl-ink-muted">
              {trustLabel} across {projects} projects · {openCount} open ·{" "}
              {highRisk} high risk
            </p>
          </div>
        </article>
        <article className="rounded-lg border border-tl-line bg-tl-surface p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Slide 2 · Status mix
          </p>
          <VerticalBarChart bars={status} />
        </article>
        <article className="rounded-lg border border-tl-line bg-tl-surface p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Slide 3 · Priority profile
          </p>
          <HorizontalBarChart bars={priority} />
        </article>
        <article className="rounded-lg border border-tl-line bg-tl-surface p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Slide 4 · Board asks
          </p>
          <ul className="space-y-2 text-sm text-tl-ink">
            {topRisks.length === 0 ? (
              <li className="text-tl-ink-muted">No critical asks this period.</li>
            ) : (
              topRisks.map((c) => (
                <li key={c.id}>
                  Confirm owner and next stage on{" "}
                  <span className="font-medium">{c.id}</span> ({c.title}).
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </div>
  );
}
