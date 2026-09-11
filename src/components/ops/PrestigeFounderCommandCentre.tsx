"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HorizontalBarChart } from "@/components/ops/charts/BarChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import { TrendChart } from "@/components/ops/charts/TrendChart";
import { ExecutiveActions } from "@/components/ops/ExecutiveActions";
import { OpsEngagementPlanPanel } from "@/components/ops/OpsEngagementPlanPanel";
import { TedsMaturityPanel } from "@/components/maturity/TedsMaturityPanel";
import {
  buildModuleContributions,
  resolvePlanDashboardPackaging,
} from "@/lib/planPackaging";
import type { PlanId } from "@/config/plans";
import { getActiveOrg } from "@/lib/orgStore";
import { buildSeatSummary } from "@/lib/orgSeats";
import {
  countOpenCases,
  timeAwareGreeting,
  welcomeFirstName,
} from "@/lib/executiveOverview";
import type { TlMode } from "@/lib/auth.constants";
import type { ExecutiveBrief } from "@/lib/executiveIntel";
import type { PaymentEvent } from "@/lib/paymentIntel";
import type { OpsOverview } from "@/lib/opsIntel";
import type { Incident } from "@/types/incident";
import type { OrgRecord, SeatSummary } from "@/types/org";

type UserIdentity = {
  name?: string | null;
  email?: string | null;
  role: string;
  mode?: TlMode | string | null;
  trialPlan?: PlanId | null;
  isVip?: boolean;
  orgId?: string | null;
};

type Props = {
  user: UserIdentity;
  brief: ExecutiveBrief;
  payments: {
    ok: boolean;
    total: number;
    recent: PaymentEvent[];
  };
  seedIncidents?: Incident[];
  opsOverview?: OpsOverview;
};

/** Attention item derived from real platform conditions. */
type AttentionItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  tone: "danger" | "amber" | "trust";
  actionLabel: string;
};

function platformHealthStatus(
  openCases: number,
  p1Count: number,
  slaBreachedCount: number,
): { label: string; tone: "trust" | "amber" | "danger"; note: string } {
  if (p1Count > 0) {
    return {
      label: "Critical Attention Required",
      tone: "danger",
      note: `${p1Count} P1-Critical case${p1Count === 1 ? "" : "s"} open. Requires founder review.`,
    };
  }
  if (slaBreachedCount > 0) {
    return {
      label: "SLA Escalation",
      tone: "danger",
      note: `${slaBreachedCount} SLA breach${slaBreachedCount === 1 ? "" : "es"} detected across platform cases.`,
    };
  }
  if (openCases > 5) {
    return {
      label: "Elevated Case Load",
      tone: "amber",
      note: `${openCases} open cases in resolution workflow.`,
    };
  }
  return {
    label: "Platform Operational",
    tone: "trust",
    note:
      openCases > 0
        ? `${openCases} active case${openCases === 1 ? "" : "s"} in standard turnaround.`
        : "All platform queues clear. No outstanding critical incidents.",
  };
}

export function PrestigeFounderCommandCentre({
  user,
  brief,
  payments,
  seedIncidents = [],
  opsOverview,
}: Props) {
  const incidents = seedIncidents;
  const [activeOrg, setActiveOrg] = useState<OrgRecord | null>(null);
  const [seats, setSeats] = useState<SeatSummary | null>(null);

  // Platform build progress from plan packaging
  const [aggregateProgressPct, setAggregateProgressPct] = useState(0);
  const [moduleBars, setModuleBars] = useState<{ label: string; value: number }[]>([]);
  const [nextEmptyLabel, setNextEmptyLabel] = useState<string | null>(null);
  const [nextEmptyHref, setNextEmptyHref] = useState<string | null>(null);

  useEffect(() => {
    const refreshOrgData = () => {
      const active = getActiveOrg();
      setActiveOrg(active);
      setSeats(active ? buildSeatSummary(active) : null);

      const resolvedMode: TlMode | null =
        user.mode === "live" || user.mode === "trial" || user.mode === "demo"
          ? user.mode
          : null;

      const packaging = resolvePlanDashboardPackaging({
        planId: user.trialPlan,
        vip: user.isVip,
        mode: resolvedMode,
        email: user.email,
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

    refreshOrgData();
    window.addEventListener("tl-workspace-seeded", refreshOrgData);
    return () => {
      window.removeEventListener("tl-workspace-seeded", refreshOrgData);
    };
  }, [user.trialPlan, user.isVip, user.mode, user.email]);

  // Derived health metrics
  const openCases = useMemo(() => countOpenCases(incidents), [incidents]);
  const p1Count = useMemo(
    () =>
      incidents.filter(
        (r) => r.status !== "Closed" && r.priority === "P1-Critical",
      ).length,
    [incidents],
  );
  const slaBreachedCount = useMemo(
    () => incidents.filter((r) => r.status !== "Closed" && r.slaBreached).length,
    [incidents],
  );
  const health = useMemo(
    () => platformHealthStatus(openCases, p1Count, slaBreachedCount),
    [openCases, p1Count, slaBreachedCount],
  );

  const planDistributionBars = useMemo(() => {
    const plan = activeOrg?.complimentaryVip
      ? "VIP Pilot"
      : activeOrg?.planId
        ? activeOrg.planId
        : user.isVip
          ? "VIP Pilot"
          : user.trialPlan || null;

    if (!plan) return [];

    const labels: Record<string, string> = {
      institutional: "Institutional",
      project: "Project",
      practitioner: "Practitioner",
      solo: "Solo",
      "VIP Pilot": "VIP Pilot",
    };

    return [{ label: labels[plan] || plan, value: 1 }];
  }, [activeOrg, user.trialPlan, user.isVip]);

  // Attention Items derived strictly from real operational conditions
  const attentionItems = useMemo(() => {
    const items: AttentionItem[] = [];

    // 1. P1 Critical Cases
    const p1s = incidents.filter(
      (r) => r.status !== "Closed" && r.priority === "P1-Critical",
    );
    for (const row of p1s.slice(0, 2)) {
      items.push({
        id: `p1-${row.id}`,
        label: `Critical P1 Incident: ${row.title || row.id}`,
        description: `Logged with high impact on project ${row.projectId || "workspace"}. Immediate intervention required.`,
        href: `/app/incidents/${encodeURIComponent(row.id)}`,
        tone: "danger",
        actionLabel: "Resolve case",
      });
    }

    // 2. SLA Breaches
    const breached = incidents.filter((r) => r.status !== "Closed" && r.slaBreached);
    if (breached.length > 0) {
      items.push({
        id: "sla-breach-item",
        label: `${breached.length} SLA Breach${breached.length === 1 ? "" : "es"} on Platform Cases`,
        description: "Turnaround time has exceeded the service level agreement threshold.",
        href: "/ops/issues",
        tone: "danger",
        actionLabel: "View SLA breaches",
      });
    }

    // 3. Low experience rating feedback
    if (brief.kpis.weakFeedback > 0) {
      items.push({
        id: "weak-feedback-item",
        label: `${brief.kpis.weakFeedback} Experience Rating Concern${brief.kpis.weakFeedback === 1 ? "" : "s"} (≤ 2/5)`,
        description: "Stakeholder feedback requires review before next executive brief.",
        href: "/ops/activity",
        tone: "amber",
        actionLabel: "Review feedback",
      });
    }

    // 4. Pending Team Invites
    if (seats && seats.invitesPending > 0) {
      items.push({
        id: "pending-invites-item",
        label: `${seats.invitesPending} Pending Team Invitation${seats.invitesPending === 1 ? "" : "s"}`,
        description: "Invited operators or team members have not yet accepted workspace access.",
        href: "/app/settings#team-seats",
        tone: "amber",
        actionLabel: "Manage invites",
      });
    }

    // 5. Next Workspace Module Setup
    if (nextEmptyLabel && nextEmptyHref) {
      items.push({
        id: "next-module-item",
        label: `Complete Development Focus: ${nextEmptyLabel}`,
        description: "Workspace configuration milestone ready for initial seed or data capture.",
        href: nextEmptyHref,
        tone: "trust",
        actionLabel: `Open ${nextEmptyLabel}`,
      });
    }

    return items;
  }, [incidents, brief.kpis.weakFeedback, seats, nextEmptyLabel, nextEmptyHref]);

  // Real recent activity items (combining payments, lead intake, verbatim feedback)
  const recentActivities = useMemo(() => {
    const list: {
      id: string;
      title: string;
      subtitle: string;
      tag: string;
      time?: string | null;
      href?: string;
    }[] = [];

    // Recent Payments
    for (const p of payments.recent.slice(0, 4)) {
      list.push({
        id: `pay-${p.name}`,
        title: `${p.planLabel} — ${p.amountLabel}`,
        subtitle: `${p.person}${p.organization ? ` · ${p.organization}` : ""} (Ref: ${p.reference || "Direct"})`,
        tag: "Payment",
        time: p.modified ? new Date(p.modified).toLocaleDateString() : null,
        href: "/ops/finance",
      });
    }

    // Recent Intake Leads
    if (opsOverview?.intake.recent) {
      for (const row of opsOverview.intake.recent.slice(0, 4)) {
        list.push({
          id: `lead-${row.name}`,
          title: `${row.activity.toUpperCase()}: ${row.lead_name || row.name}`,
          subtitle: `${row.job_title || row.source || "Platform intake"}${row.organization ? ` · ${row.organization}` : ""}`,
          tag: row.activity,
          time: row.modified ? new Date(row.modified).toLocaleDateString() : null,
          href: "/ops/activity",
        });
      }
    }

    return list.slice(0, 6);
  }, [payments.recent, opsOverview]);

  // Greeting using dynamic authenticated user identity — never hard-coded
  const greeting = timeAwareGreeting(welcomeFirstName(user.name || "Founder"));
  const asOf = new Date(brief.generatedAt).toLocaleString();

  return (
    <div className="space-y-9 print:space-y-6">
      {/* 1. FOUNDER GREETING & AUTHENTICATED IDENTITY HEADER */}
      <header className="border-b border-tl-line pb-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-tl-trust/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-tl-trust">
                Executive Command Centre
              </span>
              <span className="text-xs font-semibold text-tl-ink-muted">
                As of {asOf}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
              {greeting}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-tl-ink-muted">
              Prestige overview of platform health, commercial position, development velocity, and inbound signals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-tl-line bg-tl-surface px-3.5 py-1.5 text-xs font-semibold text-tl-ink shadow-sm">
              <span className="h-2 w-2 rounded-full bg-tl-trust" />
              {user.name || "Platform Founder"} ({user.email || "Platform Operator"})
            </span>
            <ExecutiveActions
              talkingPoints={brief.talkingPoints}
              quotes={brief.voice.quotes.slice(0, 5).map((q) => q.quote)}
            />
          </div>
        </div>
      </header>

      {/* 2. EXECUTIVE KPI / INTELLIGENCE STRIP (CONVERSION METRICS BENTO GRID) */}
      <section aria-labelledby="executive-strip-title" className="space-y-3">
        <h2 id="executive-strip-title" className="sr-only">
          Executive KPI Strip
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Bento Card 1: Platform Health */}
          <div
            className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
              health.tone === "danger"
                ? "border-tl-danger/40 bg-tl-danger/[0.04]"
                : health.tone === "amber"
                  ? "border-tl-amber/40 bg-tl-amber/[0.05]"
                  : "border-tl-trust/30 bg-tl-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-tl-ink-muted">
                Platform Condition
              </p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  health.tone === "danger"
                    ? "bg-tl-danger/15 text-tl-danger"
                    : health.tone === "amber"
                      ? "bg-tl-amber/20 text-tl-amber"
                      : "bg-tl-trust/15 text-tl-trust-ink"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
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
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-tl-ink">
              {openCases}
            </p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              {p1Count > 0 ? (
                <span className="font-semibold text-tl-danger">
                  {p1Count} P1 Critical case{p1Count === 1 ? "" : "s"} open
                </span>
              ) : slaBreachedCount > 0 ? (
                <span className="font-semibold text-tl-amber">
                  {slaBreachedCount} SLA breach{slaBreachedCount === 1 ? "" : "es"}
                </span>
              ) : (
                "0 critical issues · Turnaround stable"
              )}
            </p>
          </div>

          {/* Bento Card 2: Development Velocity */}
          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-tl-ink-muted">
                Development Progress
              </p>
              <span className="rounded bg-tl-trust/10 px-2 py-0.5 text-[10px] font-semibold text-tl-trust-ink">
                {moduleBars.length} Modules Tracked
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-tl-ink">
              {aggregateProgressPct}%
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-tl-line">
              <div
                className="h-full bg-tl-trust transition-all duration-500"
                style={{ width: `${aggregateProgressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-tl-ink-muted">
              {nextEmptyLabel ? `Active focus: ${nextEmptyLabel}` : "Full module baseline active"}
            </p>
          </div>

          {/* Bento Card 3: Current Workspace */}
          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-tl-ink-muted">
                Current Workspace
              </p>
              <span className="rounded bg-tl-paper px-2 py-0.5 text-[10px] font-semibold text-tl-ink-muted">
                Authenticated
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-tl-ink">
              {activeOrg ? "1" : "—"}
            </p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              {seats
                ? `${seats.membersUsed} seat${seats.membersUsed === 1 ? "" : "s"} occupied (${seats.invitesPending} pending)`
                : "Authenticated workspace provisioned"}
            </p>
          </div>

          {/* Bento Card 4: Inbound Traction */}
          <div className="rounded-2xl border border-tl-line bg-tl-surface p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-tl-ink-muted">
                Inbound Traction
              </p>
              <span className="rounded bg-tl-trust/10 px-2 py-0.5 text-[10px] font-semibold text-tl-trust-ink">
                CRM Window
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-tl-ink">
              {brief.kpis.pipelineSignals}
            </p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              {brief.kpis.contactEnquiries} contact enquiries ·{" "}
              {brief.kpis.experienceScore ? `${brief.kpis.experienceScore}/5 rating` : "Feedback active"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. CORE ANALYTICS BENTO: CHARTS → SUMMARY → DETAILS → ACTION */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* SECTION A: PLATFORM ACTIVITY SIGNALS (8 Cols) */}
        <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm lg:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-tl-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
                Platform Activity Signals
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
                Weekly CRM Intake Activity
              </h2>
            </div>
            <span className="text-xs font-medium text-tl-ink-muted">
              CHARTS → SUMMARY → DETAILS → ACTION
            </span>
          </div>

          {/* Chart Layer */}
          <div className="mt-5">
            {brief.weekly.length ? (
              <TrendChart
                points={brief.weekly.map((w) => ({
                  label: w.label,
                  value: w.total,
                }))}
                height={200}
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                No weekly activity data recorded yet.
              </div>
            )}
          </div>

          {/* Summary Layer */}
          <div className="mt-5 rounded-xl border border-tl-line bg-tl-paper/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-tl-trust">
              Summary
            </p>
            <p className="mt-1 text-sm leading-relaxed text-tl-ink">
              {brief.weekly.reduce((sum, w) => sum + w.total, 0)} CRM intake signals recorded across the last eight weeks.
              This count reflects total lead and engagement records logged — demos, assessments, feedback submissions, and contact events — not revenue or new-client acquisition.
            </p>
          </div>

          {/* Details & Action Layers */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-tl-ink hover:text-tl-trust">
                Investigate weekly breakdown
              </summary>
              <div className="mt-3 space-y-1.5 rounded-lg border border-tl-line bg-tl-surface p-3 text-xs text-tl-ink-muted">
                {brief.weekly.map((w) => (
                  <div key={w.key} className="flex justify-between">
                    <span>Week of {w.label}:</span>
                    <span className="font-semibold text-tl-ink">{w.total} signals</span>
                  </div>
                ))}
              </div>
            </details>

            <Link
              href="/ops/activity"
              className="inline-flex items-center gap-1.5 rounded-lg bg-tl-trust px-3.5 py-2 text-xs font-semibold text-white hover:bg-tl-trust-ink"
            >
              Inspect client activity ledger →
            </Link>
          </div>
        </section>

        {/* SECTION B: CURRENT WORKSPACE PLAN (4 Cols) */}
        <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm lg:col-span-4">
          <div className="border-b border-tl-line pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
              Commercial Packaging
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
              Current Workspace Plan
            </h2>
          </div>

          {/* Chart Layer */}
          <div className="mt-5">
            {planDistributionBars.length ? (
              <HorizontalBarChart bars={planDistributionBars} maxHeight={190} />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                No authenticated workspace configured.
              </div>
            )}
          </div>

          {/* Summary Layer */}
          <div className="mt-5 rounded-xl border border-tl-line bg-tl-paper/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-tl-trust">
              Summary
            </p>
            <p className="mt-1 text-xs leading-relaxed text-tl-ink-muted">
              {planDistributionBars.map((p) => `${p.label}: ${p.value}`).join(" · ")}.
              {activeOrg ? ` Active workspace: ${activeOrg.name}.` : ""}
            </p>
          </div>

          {/* Details & Action Layers */}
          <div className="mt-4 flex items-center justify-between gap-2 pt-2">
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-tl-ink hover:text-tl-trust">
                Plan details
              </summary>
              <div className="mt-2 text-xs text-tl-ink-muted">
                Seat & capability gates correspond to ADR-014 packaging.
              </div>
            </details>

            <Link
              href="/ops/accounts"
              className="text-xs font-semibold text-tl-trust-ink hover:underline"
            >
              Manage accounts →
            </Link>
          </div>
        </section>
      </div>

      {/* 4. PLATFORM DEVELOPMENT & ACQUISITION FUNNEL BENTO */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* SECTION C: PLATFORM DEVELOPMENT PROGRESS (6 Cols) */}
        <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm lg:col-span-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-tl-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
                Platform Build Progress
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
                Module Completion Velocity
              </h2>
            </div>
            <span className="text-xs font-semibold tabular-nums text-tl-ink">
              {aggregateProgressPct}% aggregate
            </span>
          </div>

          {/* Chart Layer */}
          <div className="mt-5">
            {moduleBars.length ? (
              <HorizontalBarChart bars={moduleBars} maxHeight={220} />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                No module progress registered.
              </div>
            )}
          </div>

          {/* Summary Layer */}
          <div className="mt-4 rounded-xl border border-tl-line bg-tl-paper/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-tl-trust">
              Summary
            </p>
            <p className="mt-1 text-sm leading-relaxed text-tl-ink">
              {nextEmptyLabel
                ? `Next identified delivery milestone is ${nextEmptyLabel}. All completed modules preserve strict audit trails.`
                : "All core Stakeholder Intelligence modules are actively provisioned."}
            </p>
          </div>

          {/* Action Layer */}
          <div className="mt-4 flex items-center justify-between pt-2">
            <details className="text-xs text-tl-ink-muted">
              <summary className="cursor-pointer font-semibold text-tl-ink">Architecture</summary>
              <p className="mt-1">Follows ADR-044 modular packaging and zero fake seed constraints.</p>
            </details>
            {nextEmptyHref && (
              <Link
                href={nextEmptyHref}
                className="rounded-lg bg-tl-trust px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-tl-trust-ink"
              >
                Open {nextEmptyLabel} →
              </Link>
            )}
          </div>
        </section>

        {/* SECTION D: ACQUISITION / MARKETING FUNNEL (6 Cols) */}
        <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm lg:col-span-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-tl-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
                Marketing Engine
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
                Acquisition & Discovery Funnel
              </h2>
            </div>
            <span className="text-xs font-medium text-tl-ink-muted">
              Interest → Depth → Voice → Enquiry
            </span>
          </div>

          {/* Chart Layer */}
          <div className="mt-5">
            {brief.funnel.length ? (
              <FunnelChart
                steps={brief.funnel.map((f) => ({
                  label: f.label,
                  value: f.value,
                }))}
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                No funnel leads recorded.
              </div>
            )}
          </div>

          {/* Summary Layer */}
          <div className="mt-4 rounded-xl border border-tl-line bg-tl-paper/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-tl-trust">
              Summary
            </p>
            <p className="mt-1 text-sm leading-relaxed text-tl-ink">
              Conversion pathway from initial demo exploration through readiness assessment to direct founder and sales enquiry.
            </p>
          </div>

          {/* Action Layer */}
          <div className="mt-4 flex items-center justify-between pt-2">
            <span className="text-xs text-tl-ink-muted">
              {brief.kpis.pipelineSignals} total signals captured
            </span>
            <Link
              href="/ops/marketing"
              className="text-xs font-semibold text-tl-trust-ink hover:underline"
            >
              Review marketing desk →
            </Link>
          </div>
        </section>
      </div>

      {/* 5. INBOUND ACTIVITY MIX & EXPERIENCE SIGNALS */}
      <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-tl-line pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
              Inbound Activity Mix
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
              Where Prospects & Clients Are Engaging
            </h2>
          </div>
          <Link
            href="/ops/activity"
            className="text-xs font-semibold text-tl-trust-ink hover:underline"
          >
            Full activity breakdown →
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-tl-ink-muted">
              Activity Type Breakdown
            </p>
            <div className="mt-3">
              {brief.mix.length ? (
                <HorizontalBarChart
                  bars={brief.mix.map((m) => ({
                    label: m.label,
                    value: m.value,
                  }))}
                  maxHeight={200}
                />
              ) : (
                <p className="text-xs text-tl-ink-muted">No mix recorded.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-tl-line bg-tl-paper/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-tl-trust">
              Sentiment & Experience Perception
            </p>
            {brief.voice.perceptionSummary ? (
              <p className="mt-2 text-sm leading-relaxed text-tl-ink">
                {brief.voice.perceptionSummary}
              </p>
            ) : (
              <p className="mt-2 text-xs text-tl-ink-muted">
                No perception summary recorded in the current signal window.
              </p>
            )}
            {brief.voice.sentiments.length > 0 && (
              <div className="mt-4">
                <HorizontalBarChart bars={brief.voice.sentiments} maxHeight={140} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. FOUNDER ATTENTION & LIVE RECENT ACTIVITY BENTO */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* REQUIRES FOUNDER ATTENTION (6 Cols) */}
        <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between border-b border-tl-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-danger">
                Action Items
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
                Requires Founder Attention
              </h2>
            </div>
            <span className="rounded-full bg-tl-paper px-2.5 py-1 text-xs font-semibold text-tl-ink">
              {attentionItems.length} item{attentionItems.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-5">
            {attentionItems.length === 0 ? (
              <div className="rounded-xl border border-tl-trust/20 bg-tl-trust/[0.04] p-5 text-center">
                <p className="text-sm font-semibold text-tl-ink">All Clear</p>
                <p className="mt-1 text-xs text-tl-ink-muted">
                  No high-priority platform issue or escalation is surfaced by current data.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {attentionItems.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-4 transition-colors ${
                      item.tone === "danger"
                        ? "border-l-4 border-l-tl-danger bg-tl-danger/[0.03]"
                        : item.tone === "amber"
                          ? "border-l-4 border-l-tl-amber bg-tl-amber/[0.04]"
                          : "border-l-4 border-l-tl-trust bg-tl-trust/[0.03]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-tl-ink">{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-tl-ink-muted">
                        {item.description}
                      </p>
                    </div>
                    <Link
                      href={item.href}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        item.tone === "danger"
                          ? "bg-tl-danger text-white hover:opacity-90"
                          : item.tone === "amber"
                            ? "bg-tl-amber text-white hover:opacity-90"
                            : "bg-tl-trust text-white hover:bg-tl-trust-ink"
                      }`}
                    >
                      {item.actionLabel} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* LIVE RECENT ACTIVITY STREAM (6 Cols) */}
        <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between border-b border-tl-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
                Activity Stream
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
                Recent Platform & Commercial Events
              </h2>
            </div>
            <Link
              href="/ops/activity"
              className="text-xs font-semibold text-tl-trust-ink hover:underline"
            >
              View ledger →
            </Link>
          </div>

          <div className="mt-5">
            {recentActivities.length === 0 ? (
              <div className="flex h-44 items-center justify-center rounded-xl bg-tl-paper text-sm text-tl-ink-muted">
                No recent activity records found.
              </div>
            ) : (
              <ul className="divide-y divide-tl-line/60">
                {recentActivities.map((act) => (
                  <li key={act.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-tl-paper px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-tl-ink-muted">
                            {act.tag}
                          </span>
                          <p className="truncate text-xs font-semibold text-tl-ink">
                            {act.title}
                          </p>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-tl-ink-muted">
                          {act.subtitle}
                        </p>
                      </div>
                      <div className="text-right">
                        {act.time && (
                          <span className="text-[10px] text-tl-ink-muted">
                            {act.time}
                          </span>
                        )}
                        {act.href && (
                          <Link
                            href={act.href}
                            className="block text-[11px] font-medium text-tl-trust hover:underline"
                          >
                            Inspect →
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* 7. QUICK ACTIONS STRIP */}
      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="sr-only">
          Quick Actions
        </h2>
        <div className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
            Executive Controls
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/app/engagement-plan"
              className="rounded-xl border border-tl-line bg-tl-paper px-4 py-2.5 text-xs font-semibold text-tl-ink hover:border-tl-trust hover:bg-tl-surface"
            >
              Engagement Plan Desk
            </Link>
            <Link
              href="/ops/issues"
              className="rounded-xl border border-tl-line bg-tl-paper px-4 py-2.5 text-xs font-semibold text-tl-ink hover:border-tl-trust hover:bg-tl-surface"
            >
              Issues Control & SLA
            </Link>
            <Link
              href="/ops/finance"
              className="rounded-xl border border-tl-line bg-tl-paper px-4 py-2.5 text-xs font-semibold text-tl-ink hover:border-tl-trust hover:bg-tl-surface"
            >
              Financial & Payment Ledger
            </Link>
            <Link
              href="/ops/accounts"
              className="rounded-xl border border-tl-line bg-tl-paper px-4 py-2.5 text-xs font-semibold text-tl-ink hover:border-tl-trust hover:bg-tl-surface"
            >
              Client Accounts & Provisioning
            </Link>
            <Link
              href="/ops/readiness"
              className="rounded-xl border border-tl-line bg-tl-paper px-4 py-2.5 text-xs font-semibold text-tl-ink hover:border-tl-trust hover:bg-tl-surface"
            >
              Delivery Readiness Diagnostic
            </Link>
            <Link
              href="/app/settings"
              className="rounded-xl border border-tl-line bg-tl-paper px-4 py-2.5 text-xs font-semibold text-tl-ink hover:border-tl-trust hover:bg-tl-surface"
            >
              Platform Settings
            </Link>
          </div>
        </div>
      </section>

      {/* 8. STAKEHOLDER ENGAGEMENT PLAN & TEDS BLUEPRINT MATURITY */}
      <OpsEngagementPlanPanel />

      <TedsMaturityPanel
        audience="board"
        variant="full"
        title="Engineering Blueprint Maturity (TEDS vs Product)"
      />

      {/* 9. BOARD TALKING POINTS & VERBATIM STAKEHOLDER QUOTES */}
      <section className="rounded-2xl border border-tl-line bg-tl-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-tl-line pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tl-ink-muted">
              Executive Narrative
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-tl-ink">
              Board & Investor Talking Points
            </h2>
          </div>
          <p className="text-xs text-tl-ink-muted">
            Derived automatically from latest verified CRM activity and telemetry.
          </p>
        </div>

        <ol className="mt-5 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-tl-ink">
          {brief.talkingPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>

        {brief.voice.quotes.length > 0 && (
          <div className="mt-6 border-t border-tl-line pt-5">
            <h3 className="text-sm font-semibold text-tl-ink">
              Verbatim Stakeholder Voice
            </h3>
            <ul className="mt-3 space-y-3">
              {brief.voice.quotes.slice(0, 3).map((q) => (
                <li
                  key={`${q.leadName}-${q.quote.slice(0, 20)}`}
                  className="rounded-lg border-l-2 border-tl-trust bg-tl-paper/60 p-3"
                >
                  <blockquote className="text-xs italic text-tl-ink">
                    “{q.quote}”
                  </blockquote>
                  <p className="mt-1 text-[11px] text-tl-ink-muted">
                    {q.person}
                    {q.organization ? ` · ${q.organization}` : ""}
                    {q.rating != null ? ` · Rating: ${q.rating}/5` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}