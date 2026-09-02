"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SepAnalytics } from "@/components/sep/SepAnalytics";
import { SepOutcomeBoard } from "@/components/sep/SepOutcomeBoard";
import { SepPlanSnapshotHeader } from "@/components/sep/SepPlanSnapshotHeader";
import { SepPractitionerSnapshot } from "@/components/sep/SepPractitionerSnapshot";
import { SepRoadmap } from "@/components/sep/SepRoadmap";
import { SESSION_ROLE_COOKIE, TL_USER_NAME_COOKIE } from "@/lib/auth.constants";
import { isUserRole, type UserRole } from "@/types/rbac";
import { readDeskTier } from "@/lib/deskVisibility";
import { canEditSepExecution } from "@/lib/sepExecutionAccess";
import {
  buildSepPlanSnapshot,
  buildSepTimeline,
  EMPTY_SEP_FILTERS,
  filterSepOverlay,
  loadSepExecutionView,
  type SepInPlanFilters,
} from "@/lib/sepExecutionDesk";
import { appendSepActivity } from "@/lib/sepExecutionStore";
import { readOrgOwnerCookie } from "@/lib/orgSession";
import type { EngagementPlan } from "@/types/engagementPlan";
import { SEP_MODULE_HREF } from "@/types/engagementPlan";
import type {
  SepEventSeverity,
  SepExecutionOverlay,
  SepOutcomeKind,
} from "@/types/sepExecution";

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const row = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  if (!row) return "";
  return decodeURIComponent(row.split("=").slice(1).join("="));
}

function sessionRole(): UserRole {
  const raw = readCookie(SESSION_ROLE_COOKIE);
  return isUserRole(raw) ? raw : "admin";
}

type Props = {
  plan: EngagementPlan;
  snapshotOnly?: boolean;
};

export function SepExecutionDashboard({ plan, snapshotOnly = false }: Props) {
  const [overlay, setOverlay] = useState<SepExecutionOverlay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SepInPlanFilters>(EMPTY_SEP_FILTERS);
  const [view, setView] = useState<"full" | "snapshot">(
    snapshotOnly ? "snapshot" : "full",
  );

  const actor = readCookie(TL_USER_NAME_COOKIE) || "Plan Owner";
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (snapshotOnly) {
      setCanEdit(false);
      return;
    }
    const tier = readDeskTier(sessionRole());
    setCanEdit(
      canEditSepExecution({
        deskTier: tier,
        isPlanOwner: readOrgOwnerCookie(),
      }),
    );
  }, [snapshotOnly]);

  useEffect(() => {
    try {
      const loaded = loadSepExecutionView(plan, { ownerName: actor });
      setOverlay(loaded);
      setError(null);
    } catch {
      setError("Could not load this plan’s execution overlay.");
    }
  }, [plan, actor]);

  if (error) {
    return (
      <p className="rounded-md border border-tl-danger/40 bg-tl-surface p-4 text-sm text-tl-danger">
        {error}
      </p>
    );
  }

  if (!overlay) {
    return <p className="text-sm text-tl-ink-muted">Loading plan dashboard…</p>;
  }

  const snapshot = buildSepPlanSnapshot(plan, overlay);
  const filtered = filterSepOverlay(overlay, filters);
  const timeline = buildSepTimeline(plan, filtered);
  const varianceNote =
    snapshot.kpis.scheduleVarianceDays > 0
      ? `${snapshot.kpis.scheduleVarianceDays} day(s) behind the worst milestone due date.`
      : "No milestone slip recorded.";

  function stampReview() {
    if (!overlay) return;
    const next = {
      ...overlay,
      lastReviewAt: new Date().toISOString(),
    };
    setOverlay(appendSepActivity(next, "review", "Snapshot opened for client briefing.", actor));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-tl-ink-muted">
          This dashboard is scoped to plan{" "}
          <span className="font-mono text-xs">{plan.id}</span> only.
        </p>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setView("snapshot");
                stampReview();
              }}
              className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
            >
              Open practitioner snapshot
            </button>
            {view === "snapshot" ? (
              <button
                type="button"
                onClick={() => setView("full")}
                className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
              >
                Back to execution desk
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-tl-ink-muted">Read-only client / superior view</p>
        )}
      </div>

      {view === "snapshot" || snapshotOnly || !canEdit ? (
        <SepPractitionerSnapshot snapshot={snapshot} overlay={overlay} />
      ) : null}

      <SepPlanSnapshotHeader snapshot={snapshot} />

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Roadmap from submission
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">{varianceNote}</p>
        <div className="mt-4">
          <SepRoadmap events={timeline} submittedAt={overlay.submittedAt} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto font-display text-lg font-semibold text-tl-ink">
            Tasks and activities
          </h2>
          <label className="text-sm">
            <span className="mr-2 text-tl-ink-muted">From</span>
            <input
              type="date"
              value={filters.fromOn}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, fromOn: e.target.value }))
              }
              className="rounded-md border border-tl-line px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mr-2 text-tl-ink-muted">To</span>
            <input
              type="date"
              value={filters.toOn}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, toOn: e.target.value }))
              }
              className="rounded-md border border-tl-line px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mr-2 text-tl-ink-muted">Task</span>
            <select
              value={filters.taskId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, taskId: e.target.value }))
              }
              className="rounded-md border border-tl-line px-2 py-1 text-sm"
            >
              <option value="all">All tasks</option>
              {overlay.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mr-2 text-tl-ink-muted">Milestone</span>
            <select
              value={filters.milestoneId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, milestoneId: e.target.value }))
              }
              className="rounded-md border border-tl-line px-2 py-1 text-sm"
            >
              <option value="all">All milestones</option>
              {overlay.milestones.map((mile) => (
                <option key={mile.id} value={mile.id}>
                  {mile.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mr-2 text-tl-ink-muted">Severity</span>
            <select
              value={filters.severity}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  severity: e.target.value as SepEventSeverity | "all",
                }))
              }
              className="rounded-md border border-tl-line px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          {filters.kind !== "all" ||
          filters.taskId !== "all" ||
          filters.fromOn ||
          filters.toOn ? (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_SEP_FILTERS)}
              className="rounded-md border border-tl-line px-2 py-1 text-sm hover:bg-tl-paper"
            >
              Clear in-plan filters
            </button>
          ) : null}
        </div>
        <SepAnalytics
          overlay={filtered}
          onSelectOutcome={(label) =>
            setFilters((prev) => ({
              ...prev,
              kind: label.toLowerCase() as SepOutcomeKind,
            }))
          }
        />
      </section>
      <SepOutcomeBoard
        overlay={overlay}
        viewOverlay={filtered}
        canEdit={canEdit && view === "full"}
        actor={actor}
        onChange={setOverlay}
        filterSeverity={filters.severity}
      />
      <section className="rounded-lg border border-tl-line bg-tl-paper/60 p-4">
        <h2 className="text-sm font-semibold text-tl-ink">
          Linked desks for this plan
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Drill through using this plan’s project and applied rows — not other
          programmes.
        </p>
        <ul className="mt-2 flex flex-wrap gap-3 text-sm">
          <li>
            <Link href={SEP_MODULE_HREF.engagements} className="text-tl-trust-ink underline">
              Engagements
            </Link>
          </li>
          <li>
            <Link href={SEP_MODULE_HREF.commitments} className="text-tl-trust-ink underline">
              Commitments
            </Link>
          </li>
          <li>
            <Link href={SEP_MODULE_HREF.incidents} className="text-tl-trust-ink underline">
              Incidents
            </Link>
          </li>
          {plan.projectId ? (
            <li>
              <Link
                href={`/app/projects/${encodeURIComponent(plan.projectId)}`}
                className="text-tl-trust-ink underline"
              >
                Project {plan.projectId}
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
