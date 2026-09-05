"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CreateReportWizard } from "@/components/reports/CreateReportWizard";
import {
  ExecutiveRiskLayout,
  FunderAssuranceLayout,
  MonthlyOpsLayout,
} from "@/components/reports/ReportLensLayout";
import { ReportsLibrary } from "@/components/reports/ReportsLibrary";
import { TrustProofPanel } from "@/components/reports/TrustProofPanel";
import { TrustIntelligencePanel } from "@/components/reports/TrustIntelligencePanel";
import { KpiCard } from "@/components/ui/KpiCard";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import {
  buildProjectActivity,
  projectOpenBars,
  statusBars,
} from "@/lib/dashboardActivity";
import { readDeskTier } from "@/lib/deskVisibility";
import { canDeskOpenPack, packsForDesk } from "@/lib/reportPackAccess";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import {
  buildPeriodActivityFacts,
  riskRowsFromFacts,
  funderSnapshotFromFacts,
} from "@/lib/reportComposer";
import {
  executiveChartGroups,
  funderChartGroups,
  monthlyChartGroups,
} from "@/lib/reportLenses";
import { loadReportWorkspaceLists } from "@/lib/reportWorkspaceLists";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import {
  REPORT_PACK_IDS,
  REPORT_PACKS,
  planIncludesPack,
  type ReportPackId,
} from "@/types/reportPacks";
import {
  REPORT_KINDS,
  type ReportKind,
} from "@/types/activityReport";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

function readInitialKind(): ReportKind | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("kind");
  if (raw && (REPORT_KINDS as readonly string[]).includes(raw)) {
    return raw as ReportKind;
  }
  return null;
}

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
  mode?: TlMode | null;
  isVip?: boolean;
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
  const [writeMode, setWriteMode] = useState(() => Boolean(readInitialKind()));
  const [urlKind] = useState<ReportKind | null>(() => readInitialKind());
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      setTier(readDeskTier(role));
      void (async () => {
        const lists = await loadReportWorkspaceLists();
        if (!cancelled) {
          setProjects(lists.projects);
          setIncidents(lists.incidents);
        }
      })();
      const fromUrl = readInitialPack();
      const allowed = packsForDesk(readDeskTier(role), planId);
      if (fromUrl && allowed.includes(fromUrl)) setPack(fromUrl);
      else if (allowed[0]) setPack(allowed[0]);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
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
  const facts = useMemo(
    () => buildPeriodActivityFacts(incidents),
    [incidents],
  );
  const riskRows = useMemo(() => riskRowsFromFacts(facts), [facts]);
  const funderSnapshot = useMemo(
    () => funderSnapshotFromFacts(facts),
    [facts],
  );
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
          Day-to-day reporting lives on the{" "}
          <Link href="/app/dashboard" className="text-tl-trust-ink underline">
            Executive dashboard
          </Link>
          → project dashboard (kind + format + level only). This hub keeps plan
          pack formats (monthly / executive / board) for Owner-controlled
          seniority. Desk: {DESK_TIER_LABELS[tier]}
          {isPlanOwner
            ? " — grant desks in Settings → Report pack access"
            : ""}
          .
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
                {active.composition} · each pack shows a different lens on the
                same workspace evidence
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
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <KpiCard label="Open cases" value={String(open.length)} />
                <KpiCard
                  label="High risk"
                  value={String(highRisk.length)}
                  tone={highRisk.length > 0 ? "attention" : "default"}
                />
                <KpiCard
                  label={`Trust · ${pulse.label}`}
                  value={`${pulse.trustIndex}`}
                />
              </div>
              <MonthlyOpsLayout
                chartGroups={monthlyChartGroups(incidents, [
                  ...statusBars(incidents),
                  ...projectOpenBars(activity),
                ])}
                showCharts
                showDetails={false}
              />
              <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
                <h3 className="text-sm font-semibold text-tl-ink">
                  Period activity (detailed)
                </h3>
                <p className="mt-2 text-sm text-tl-ink-muted">
                  Monthly pack lists cases attended, meetings, evidence, and
                  TAT — generate the full narrative with the evidence writer
                  below. Lead items:
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-tl-ink">
                  {open.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.id}</span> — {c.title} (
                      {c.priority}, {c.status}
                      {c.ownerName ? `; owner ${c.ownerName}` : ""})
                    </li>
                  ))}
                  {open.length === 0 ? (
                    <li className="list-none text-tl-ink-muted">
                      No open cases this period — closed work still appears in
                      the generated monthly narrative.
                    </li>
                  ) : null}
                </ul>
              </section>
            </div>
          ) : null}

          {active.id === "executive" ? (
            <ExecutiveRiskLayout
              rows={riskRows}
              trustIndex={pulse.trustIndex}
              trustLabel={pulse.label}
              chartGroups={executiveChartGroups(riskRows)}
              showCharts
              showDetails={false}
            />
          ) : null}

          {active.id === "board_presentation" ? (
            <FunderAssuranceLayout
              snapshot={funderSnapshot}
              chartGroups={funderChartGroups(funderSnapshot)}
              showCharts
              showDetails={false}
            />
          ) : null}

          {writeMode ? (
            <div className="rounded-lg border border-dashed border-tl-line bg-tl-paper/50 p-4">
              <p className="mb-4 text-sm text-tl-ink-muted">
                Evidence writer for this pack’s default kind (
                {active.defaultKind.replaceAll("_", " ")}). Cloud Month-End
                templates are blocked.
              </p>
              <CreateReportWizard
                key={`${active.id}-${urlKind || "pack"}`}
                role={role}
                authorName={authorName}
                initialKind={urlKind || active.defaultKind}
                initialAudience={active.defaultAudience}
              />
            </div>
          ) : null}

          <ReportsLibrary
            role={role}
            projects={projects}
            incidents={incidents}
          />
        </section>
      ) : null}

      <TrustProofPanel />
      <TrustIntelligencePanel />
    </div>
  );
}
