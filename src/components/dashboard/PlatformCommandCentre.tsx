"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { DonutChart } from "@/components/ops/charts/DonutChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import { OverviewChartCard } from "@/components/dashboard/OverviewChartCard";
import {
  buildModuleContributions,
  resolvePlanDashboardPackaging,
} from "@/lib/planPackaging";
import { PLANS } from "@/config/plans";
import { getActiveOrg } from "@/lib/orgStore";
import { buildSeatSummary } from "@/lib/orgSeats";
import {
  incidentPriorityBars,
  incidentStatusFunnel,
} from "@/lib/dashboardOverview";
import {
  countOpenCases,
  grievanceStatusSlices,
  timeAwareGreeting,
  welcomeFirstName,
} from "@/lib/executiveOverview";
import { isLiveMode } from "@/config/api";
import {
  listWorkspaceIncidents,
  preferCloudIncidentList,
} from "@/lib/workspaceData";
import { incidentService } from "@/services/incidentService";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import type { UserRole } from "@/types/rbac";
import type { Incident } from "@/types/incident";
import type { OrgRecord, SeatSummary } from "@/types/org";

type Props = {
  role: UserRole;
  planId?: PlanId | null;
  isPlanOwner?: boolean;
  isVip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
  userName?: string;
  seedIncidents?: Incident[];
};

/** Derive a health status from open incident counts. */
function platformHealthStatus(
  openCases: number,
  p1Count: number,
): { label: string; tone: "trust" | "amber" | "danger"; note: string } {
  if (p1Count > 0) {
    return {
      label: "Critical attention required",
      tone: "danger",
      note: `${p1Count} P1-Critical case${p1Count === 1 ? "" : "s"} open. Investigate immediately.`,
    };
  }
  if (openCases > 5) {
    return {
      label: "Elevated case load",
      tone: "amber",
      note: `${openCases} open cases. Review and resolve before escalation.`,
    };
  }
  return {
    label: "Operational",
    tone: "trust",
    note:
      openCases > 0
        ? `${openCases} open case${openCases === 1 ? "" : "s"} in progress.`
        : "No open cases.",
  };
}

/** Attention items derived from existing data — never invented. */
type AttentionItem = {
  id: string;
  label: string;
  href: string;
  tone: "danger" | "amber" | "trust";
};

function buildAttentionItems(input: {
  incidents: Incident[];
  invitesPending: number;
  aggregateProgressPct: number;
  nextEmptyLabel: string | null;
  nextEmptyHref: string | null;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  // P1/P2 open cases
  const highPriority = input.incidents.filter(
    (row) =>
      row.status !== "Closed" &&
      (row.priority === "P1-Critical" || row.priority === "P2-High"),
  );
  for (const row of highPriority.slice(0, 3)) {
    items.push({
      id: `inc-${row.id}`,
      label: `${row.priority === "P1-Critical" ? "P1" : "P2"}: ${row.title || row.id}`,
      href: `/app/incidents/${encodeURIComponent(row.id)}`,
      tone: row.priority === "P1-Critical" ? "danger" : "amber",
    });
  }

  // SLA breaches
  const breached = input.incidents.filter(
    (row) => row.status !== "Closed" && row.slaBreached,
  );
  if (breached.length > 0) {
    items.push({
      id: "sla-breach",
      label: `${breached.length} SLA breach${breached.length === 1 ? "" : "es"} — resolve urgently`,
      href: "/app/incidents",
      tone: "danger",
    });
  }

  // Pending invites
  if (input.invitesPending > 0) {
    items.push({
      id: "invites",
      label: `${input.invitesPending} pending team invite${input.invitesPending === 1 ? "" : "s"}`,
      href: "/app/settings#team-seats",
      tone: "amber",
    });
  }

  // Next empty module
  if (input.nextEmptyLabel && input.nextEmptyHref) {
    items.push({
      id: "next-module",
      label: `Complete workspace setup: ${input.nextEmptyLabel}`,
      href: input.nextEmptyHref,
      tone: "trust",
    });
  }

  return items;
}

const TONE_BADGE: Record<AttentionItem["tone"], string> = {
  danger: "border-l-tl-danger bg-tl-danger/[0.05]",
  amber: "border-l-tl-amber bg-tl-amber/[0.07]",
  trust: "border-l-tl-trust bg-tl-trust/[0.06]",
};

const TONE_DOT: Record<AttentionItem["tone"], string> = {
  danger: "bg-tl-danger",
  amber: "bg-tl-amber",
  trust: "bg-tl-trust",
};

/**
 * Platform Command Centre — owner-only view.
 * Answers: "How is TrustLedger doing, what is progressing,
 * what is commercially important, and what requires my attention?"
 *
 * UX hierarchy: CHARTS -> SUMMARY -> DETAILS -> ACTION
 * Interaction model: See -> Understand -> Investigate -> Act
 */
export function PlatformCommandCentre({
  planId = null,
  isVip = false,
  mode = null,
  email = null,
  userName = "",
  seedIncidents = [],
}: Props) {
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [org, setOrg] = useState<OrgRecord | null>(null);
  const [seats, setSeats] = useState<SeatSummary | null>(null);

  // Build progress data from planPackaging (module fill %)
  const [aggregateProgressPct, setAggregateProgressPct] = useState(0);
  const [moduleBars, setModuleBars] = useState<{ label: string; value: number }[]>([]);
  const [nextEmptyLabel, setNextEmptyLabel] = useState<string | null>(null);
  const [nextEmptyHref, setNextEmptyHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadIncidents = async () => {
      if (isLiveMode()) {
        const cloud = await incidentService.list();
        if (!cancelled) setIncidents(preferCloudIncidentList(cloud));
        return;
      }
      if (!cancelled) setIncidents(listWorkspaceIncidents(seedIncidents));
    };

    const loadOrgAndModules = () => {
      const active = getActiveOrg();
      setOrg(active);
      setSeats(active ? buildSeatSummary(active) : null);

      const packaging = resolvePlanDashboardPackaging({
        planId,
        vip: isVip,
        mode,
        email,
        measureEmpty: true,
      });
      const built = buildModuleContributions(packaging);
      setAggregateProgressPct(built.aggregateProgressPct);
      setModuleBars(
        built.contributions.map((c) => ({ label: c.label, value: c.scorePct })),
      );
      const nextEmpty = built.contributions.find(
        (c) => c.key === packaging.suggestedNextKey && c.empty,
      );
      setNextEmptyLabel(nextEmpty?.label ?? null);
      setNextEmptyHref(nextEmpty?.href ?? null);
    };

    const refresh = () => {
      void loadIncidents();
      loadOrgAndModules();
    };

    const frame = requestAnimationFrame(refresh);
    window.addEventListener("tl-workspace-seeded", refresh);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("tl-workspace-seeded", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, isVip, mode, email]);

  // Derived chart data
  const priorityBars = useMemo(() => incidentPriorityBars(incidents), [incidents]);
  const funnel = useMemo(() => incidentStatusFunnel(incidents), [incidents]);
  const grievanceSlices = useMemo(() => grievanceStatusSlices(incidents), [incidents]);

  // Platform health
  const openCaseCount = useMemo(() => countOpenCases(incidents), [incidents]);
  const p1Count = useMemo(
    () =>
      incidents.filter(
        (row) => row.status !== "Closed" && row.priority === "P1-Critical",
      ).length,
    [incidents],
  );
  const health = useMemo(
    () => platformHealthStatus(openCaseCount, p1Count),
    [openCaseCount, p1Count],
  );

  // Plans & commercial
  const planName = org ? (PLANS[org.planId]?.name ?? org.planId) : null;
  const invitesPending = seats?.invitesPending ?? 0;

  // Attention items
  const attentionItems = useMemo(
    () =>
      buildAttentionItems({
        incidents,
        invitesPending,
        aggregateProgressPct,
        nextEmptyLabel,
        nextEmptyHref,
      }),
    [incidents, invitesPending, aggregateProgressPct, nextEmptyLabel, nextEmptyHref],
  );

  // Greeting from authenticated user context — never hard-coded
  const greeting = timeAwareGreeting(welcomeFirstName(userName));

  return (
    <div className="min-h-full bg-tl-paper">
      {/* Command Centre header â€” See */}
      <header className="border-b border-tl-line pb-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tl-trust">
              TrustLedger Platform Command Centre
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
              {greeting}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-tl-ink-muted">
              Build progress, commercial position, platform issues and the items that need your attention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-tl-line bg-tl-surface px-3 py-1.5 text-xs font-semibold text-tl-ink">
              Plan Owner{planName ? ` Â· ${planName}` : ""}
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                health.tone === "danger"
                  ? "bg-tl-danger/[0.08] text-tl-danger"
                  : health.tone === "amber"
                    ? "bg-tl-amber/[0.10] text-tl-ink"
                    : "bg-tl-trust/[0.08] text-tl-trust-ink"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  health.tone === "danger"
                    ? "bg-tl-danger"
                    : health.tone === "amber"
                      ? "bg-tl-amber"
                      : "bg-tl-trust"
                }`}
              />
              {health.label}
            </span>
          </div>
        </div>
      </header>

      {/* A. BUILD PROGRESS â€” Charts â†’ Summary â†’ Details â†’ Action */}
      <section className="border-b border-tl-line py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
              A Â· Build Progress
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-tl-ink">
              How TrustLedger is progressing
            </h2>
          </div>
          <span className="text-xs font-medium text-tl-ink-muted">See â†’ understand â†’ investigate</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.7fr)]">
          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-tl-ink">Workspace progress by module</p>
                <p className="mt-1 text-xs text-tl-ink-muted">
                  Current completion across the available TrustLedger workspace modules.
                </p>
              </div>
              <span className="text-2xl font-semibold tabular-nums text-tl-ink">{aggregateProgressPct}%</span>
            </div>
            {moduleBars.length ? (
              <HorizontalBarChart bars={moduleBars} maxHeight={280} />
            ) : (
              <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                No module progress data yet.
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-tl-trust/25 bg-tl-trust/[0.04] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-trust">Summary</p>
            <p className="mt-3 font-display text-4xl font-semibold tabular-nums text-tl-ink">
              {aggregateProgressPct}%
            </p>
            <p className="mt-2 text-sm leading-6 text-tl-ink-muted">
              Workspace completion is currently the clearest available view of where the platform needs build attention.
            </p>

            <details className="mt-5 border-t border-tl-line pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-tl-ink">Details</summary>
              <p className="mt-3 text-sm leading-6 text-tl-ink-muted">
                {nextEmptyLabel
                  ? `The next identified workspace item is ${nextEmptyLabel}.`
                  : "No outstanding next module is currently identified."}
              </p>
            </details>

            {nextEmptyHref && (
              <Link
                href={nextEmptyHref}
                className="mt-5 inline-flex rounded-lg bg-tl-trust px-3.5 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink"
              >
                {nextEmptyLabel ? `Open ${nextEmptyLabel}` : "Open next module"}
              </Link>
            )}
          </aside>
        </div>
      </section>

      {/* B. COMMERCIAL POSITION â€” State â†’ Summary â†’ Details â†’ Action */}
      <section className="border-b border-tl-line py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
              B Â· Plans &amp; Commercial Position
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-tl-ink">
              Commercial position at a glance
            </h2>
          </div>
          <Link
            href="/app/settings#team-seats"
            className="text-sm font-semibold text-tl-trust-ink hover:underline"
          >
            Manage seats â†’
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">Current plan</p>
            <p className="mt-3 font-display text-2xl font-semibold text-tl-ink">{planName ?? "Not configured"}</p>
            <p className="mt-1 text-sm text-tl-ink-muted">{org?.name ?? "No organisation workspace configured"}</p>
          </div>
          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">Team</p>
            <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-tl-ink">
              {org ? org.members.length : "â€”"}
            </p>
            <p className="mt-1 text-sm text-tl-ink-muted">
              {seats
                ? seats.additionalSeatCap === null
                  ? "Unlimited seats"
                  : `${seats.membersUsed} / ${seats.additionalSeatCap} seats used`
                : "No organisation on file"}
            </p>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${
            invitesPending > 0
              ? "border-tl-amber/40 bg-tl-amber/[0.06]"
              : "border-tl-line bg-tl-surface"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">Pending invites</p>
            <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-tl-ink">{invitesPending}</p>
            <p className="mt-1 text-sm text-tl-ink-muted">
              {invitesPending > 0 ? "Awaiting acceptance" : "No outstanding invitations"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-tl-line bg-tl-surface px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-tl-ink">Summary</p>
            <p className="mt-1 text-sm text-tl-ink-muted">
              {org
                ? `${planName ?? "Current plan"} is active for ${org.name}.`
                : "No organisation workspace is currently configured on this device."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <details className="max-w-xl">
              <summary className="cursor-pointer rounded-lg border border-tl-line px-3 py-2 text-sm font-semibold text-tl-ink">
                Details
              </summary>
              <div className="mt-3 rounded-lg bg-tl-paper p-3 text-sm text-tl-ink-muted">
                Current plan, team membership and pending invitation data are shown from the existing organisation context.
              </div>
            </details>
            <Link
              href="/app/settings#team-seats"
              className="rounded-lg bg-tl-trust px-3.5 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink"
            >
              Manage team
            </Link>
            <Link
              href="/app/settings#data-space"
              className="rounded-lg border border-tl-line px-3.5 py-2 text-sm font-semibold text-tl-ink hover:bg-tl-paper"
            >
              Data space
            </Link>
          </div>
        </div>
      </section>

      {/* C. PLATFORM ISSUES â€” Charts â†’ Summary â†’ Details â†’ Action */}
      <section className="border-b border-tl-line py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
              C Â· Platform Issues
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-tl-ink">
              Where intervention may be required
            </h2>
          </div>
          <Link href="/app/incidents" className="text-sm font-semibold text-tl-trust-ink hover:underline">
            View all cases â†’
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-tl-ink">Case status</p>
            <p className="mt-1 text-xs text-tl-ink-muted">Open through closed.</p>
            <div className="mt-4 min-h-[180px]">
              {incidents.length ? (
                <FunnelChart steps={funnel} />
              ) : (
                <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                  No cases on file.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-tl-ink">Open cases by priority</p>
            <p className="mt-1 text-xs text-tl-ink-muted">P1â€“P4 open cases.</p>
            <div className="mt-4 min-h-[180px]">
              {priorityBars.length ? (
                <VerticalBarChart bars={priorityBars} />
              ) : (
                <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                  No open cases.
                </div>
              )}
            </div>
            {p1Count > 0 && (
              <Link
                href="/app/incidents?priority=P1-Critical"
                className="mt-3 inline-flex rounded-lg bg-tl-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Investigate P1
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-tl-ink">Case resolution mix</p>
            <p className="mt-1 text-xs text-tl-ink-muted">Resolved, in progress and open.</p>
            <div className="mt-4 min-h-[180px]">
              <DonutChart slices={grievanceSlices} centerLabel="Cases" empty="No cases on file." />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-trust">Summary</p>
          <p className="mt-2 text-base font-semibold text-tl-ink">
            {openCaseCount === 0
              ? "No open platform cases require intervention."
              : `${openCaseCount} open platform case${openCaseCount === 1 ? "" : "s"} require attention.`}
          </p>
          <details className="mt-3 border-t border-tl-line pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-tl-ink">Details</summary>
            <p className="mt-3 text-sm leading-6 text-tl-ink-muted">
              {p1Count > 0
                ? `${p1Count} P1-Critical case${p1Count === 1 ? "" : "s"} are open and should be investigated immediately.`
                : "No P1-Critical cases are currently open."}
            </p>
          </details>
        </div>
      </section>

      {/* D. PLATFORM HEALTH â€” See â†’ Understand â†’ Investigate */}
      <section className="border-b border-tl-line py-8">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
            D Â· Platform Health
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-tl-ink">
            Current operating condition
          </h2>
        </div>

        <div className={`rounded-2xl border p-6 ${
          health.tone === "danger"
            ? "border-tl-danger/35 bg-tl-danger/[0.04]"
            : health.tone === "amber"
              ? "border-tl-amber/35 bg-tl-amber/[0.05]"
              : "border-tl-trust/25 bg-tl-trust/[0.04]"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${
                health.tone === "danger"
                  ? "bg-tl-danger"
                  : health.tone === "amber"
                    ? "bg-tl-amber"
                    : "bg-tl-trust"
              }`} />
              <div>
                <p className="font-display text-2xl font-semibold text-tl-ink">{health.label}</p>
                <p className="mt-1 text-sm text-tl-ink-muted">{health.note}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">Open cases</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-tl-ink">{openCaseCount}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-tl-line bg-tl-surface px-4 py-3">
              <p className="text-xs text-tl-ink-muted">P1 critical</p>
              <p className={`mt-1 text-xl font-semibold tabular-nums ${p1Count > 0 ? "text-tl-danger" : "text-tl-ink"}`}>{p1Count}</p>
            </div>
            <div className="rounded-xl border border-tl-line bg-tl-surface px-4 py-3">
              <p className="text-xs text-tl-ink-muted">Workspace fill</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-tl-ink">{aggregateProgressPct}%</p>
            </div>
            <div className="rounded-xl border border-tl-line bg-tl-surface px-4 py-3">
              <p className="text-xs text-tl-ink-muted">Team members</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-tl-ink">{org ? org.members.length : "â€”"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-tl-line pt-4">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-tl-ink">Details</summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-tl-ink-muted">
                Health is derived from the existing incident register. No new scoring model is introduced here.
              </p>
            </details>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/incidents" className="rounded-lg border border-tl-line bg-tl-surface px-3.5 py-2 text-sm font-semibold text-tl-ink hover:bg-tl-paper">
                Investigate cases
              </Link>
              <Link href="/app/settings" className="rounded-lg border border-tl-line bg-tl-surface px-3.5 py-2 text-sm font-semibold text-tl-ink hover:bg-tl-paper">
                Platform settings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* E. ATTENTION â€” Act */}
      <section className="py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
              E Â· Requires Your Attention
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-tl-ink">
              What needs action now
            </h2>
          </div>
          <span className="text-xs font-medium text-tl-ink-muted">Investigate â†’ Act</span>
        </div>

        {attentionItems.length === 0 ? (
          <div className="rounded-2xl border border-tl-trust/25 bg-tl-trust/[0.04] p-5">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-tl-trust" />
              <p className="text-sm font-semibold text-tl-ink">No immediate action required</p>
            </div>
            <p className="mt-2 text-sm text-tl-ink-muted">
              No high-priority platform issue is currently surfaced by the available data.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {attentionItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl border border-l-4 p-4 text-sm transition-colors hover:bg-tl-paper ${TONE_BADGE[item.tone]}`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[item.tone]}`} />
                  <span className="font-semibold text-tl-ink">{item.label}</span>
                  <span className="ml-auto text-xs font-semibold text-tl-ink-muted">Act â†’</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
