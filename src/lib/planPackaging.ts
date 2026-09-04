/**
 * Resolve plan-as-container dashboards. No SQL — commercial PlanId + cookies.
 * Demo seed is the dedicated VIP showcase mailbox only. Other VIP / live Cloud keep own data.
 */

import {
  hrefForDashboardModule,
  includedDashboardKeys,
  PLAN_DASHBOARD_CATALOG,
  TIER_FLOW,
} from "@/config/tierFlow";
import { isPlanId, type PlanId } from "@/config/plans";
import { resolveClientPlanId } from "@/lib/entitlements";
import { isVipShowcaseWorkspace } from "@/lib/planLabel";
import type { TlMode } from "@/lib/auth.constants";
import { listCaptureRecords } from "@/lib/captureStore";
import { listIndicatorBriefs } from "@/lib/indicatorBriefStore";
import { getActiveOrgId } from "@/lib/orgStore";
import { listOrgStakeholders } from "@/lib/orgDataSpace";
import { listSavedReports } from "@/lib/reportStore";
import { listEngagementPlans } from "@/lib/sepStore";
import {
  listWorkspaceIncidents,
  listWorkspaceProjects,
} from "@/lib/workspaceData";
import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type {
  PlanDashboardDescriptor,
  PlanDashboardModuleKey,
  PlanDashboardPackaging,
  PlanModuleContribution,
} from "@/types/planPackaging";

function readLocalArray<T extends { id: string }>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** VIP illustrative seed — dedicated showcase trial+VIP mailbox only. */
export function demoSeedAllowed(input: {
  mode?: TlMode | null;
  vip?: boolean;
  email?: string | null;
}): boolean {
  return isVipShowcaseWorkspace(input.mode, input.vip, input.email);
}

/**
 * Commercial SKU for packaging. Trial + complimentary VIP always uses
 * Institutional sequence, even if a leftover cookie still says Solo.
 * Seed/theatre stays email-gated via `demoSeedAllowed`.
 */
export function packagingPlanId(input: {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
}): PlanId {
  if (input.vip && input.mode === "trial") return "institutional";
  const resolved = resolveClientPlanId(input.planId) || input.planId || null;
  return resolved && isPlanId(resolved) ? resolved : "project";
}

export function suggestedNextModuleKey(
  planId: PlanId,
  emptyStateFlags: { key: PlanDashboardModuleKey; empty: boolean }[],
  moduleKeys: PlanDashboardModuleKey[],
): PlanDashboardModuleKey | null {
  const empty = new Set(
    emptyStateFlags.filter((row) => row.empty).map((row) => row.key),
  );
  const gates = TIER_FLOW[planId]?.gates || [];
  for (const key of moduleKeys) {
    if (!empty.has(key)) continue;
    const gate = gates.find((row) => row.module === key);
    if (gate?.after && empty.has(gate.after)) continue;
    return key;
  }
  return moduleKeys.find((key) => empty.has(key)) || null;
}

export function isPathEntitledForPlan(
  pathname: string,
  planId: PlanId | null | undefined,
): boolean {
  const current = descriptorForPath(pathname);
  if (!current) return true;
  return includedDashboardKeys(planId).includes(current.key);
}

export function resolvePlanDashboardPackaging(input: {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
  measureEmpty?: boolean;
}): PlanDashboardPackaging {
  const planId = packagingPlanId(input);
  const keys = includedDashboardKeys(planId);
  const descriptors = keys.map((key) => PLAN_DASHBOARD_CATALOG[key]);
  const executive =
    descriptors.find((row) => row.key === "executive") ||
    PLAN_DASHBOARD_CATALOG.executive;
  const modules = descriptors.filter((row) => row.key !== "executive");
  const emptyStateFlags = input.measureEmpty
    ? descriptors.map((row) => ({
        key: row.key,
        empty: moduleRowCount(row.key) === 0,
      }))
    : descriptors.map((row) => ({ key: row.key, empty: false }));
  const suggestedNextKey = input.measureEmpty
    ? suggestedNextModuleKey(
        planId,
        emptyStateFlags,
        modules.map((row) => row.key),
      )
    : null;

  return {
    planId,
    vip: Boolean(input.vip),
    demoSeedAllowed: demoSeedAllowed({
      mode: input.mode,
      vip: input.vip,
      email: input.email,
    }),
    executiveDashboard: executive,
    moduleDashboards: modules,
    emptyStateFlags,
    suggestedNextKey,
  };
}

export function moduleRowCount(key: PlanDashboardModuleKey): number {
  switch (key) {
    case "executive":
      return listWorkspaceProjects().length;
    case "projects":
      return listWorkspaceProjects().length;
    case "incidents":
      return listWorkspaceIncidents().length;
    case "capture":
      return listCaptureRecords().length;
    case "stakeholders": {
      const org = listOrgStakeholders(getActiveOrgId()).length;
      const crm = readLocalArray<{ id: string }>("tl-crm-stakeholders").length;
      return Math.max(org, crm);
    }
    case "engagements":
      return readLocalArray<Engagement>("tl-engagements").length;
    case "sep":
      return listEngagementPlans().length;
    case "commitments":
      return readLocalArray<Commitment>("tl-commitments").length;
    case "esg":
      return listIndicatorBriefs().length;
    case "reports":
      return listSavedReports().length;
    default:
      return 0;
  }
}

/**
 * Module fill score 0–100 (not a change to incident/ESG scoring).
 * Empty = 0. One row ≈ 55; saturates at 100 after several records.
 */
export function moduleFillScore(count: number): number {
  if (count <= 0) return 0;
  return Math.min(100, 40 + count * 15);
}

/**
 * Per-module contribution to the executive roll-up:
 * contributionPct = this score / sum(scores) * 100 (equal weight per module).
 * Aggregate strategy progress = mean of module fill scores.
 */
export function buildModuleContributions(
  packaging: PlanDashboardPackaging,
): {
  contributions: PlanModuleContribution[];
  aggregateProgressPct: number;
} {
  const rows = packaging.moduleDashboards.map((mod) => {
    const count = moduleRowCount(mod.key);
    const scorePct = moduleFillScore(count);
    return {
      key: mod.key,
      label: mod.label,
      href: mod.href,
      empty: count === 0,
      scorePct,
      contributionPct: 0,
      count,
    };
  });
  const sum = rows.reduce((acc, row) => acc + row.scorePct, 0);
  const contributions = rows.map((row) => ({
    ...row,
    contributionPct: sum
      ? Math.round((row.scorePct / sum) * 100)
      : Math.round(100 / Math.max(1, rows.length)),
  }));
  const aggregateProgressPct = rows.length
    ? Math.round(
        rows.reduce((acc, row) => acc + row.scorePct, 0) / rows.length,
      )
    : 0;
  return { contributions, aggregateProgressPct };
}

export function dashboardHrefFromLegacySlug(
  slug: string[] | undefined,
): string {
  if (!slug || slug.length === 0) {
    return PLAN_DASHBOARD_CATALOG.executive.href;
  }
  if (slug[0] === "modules" && slug[1]) {
    return hrefForDashboardModule(slug[1]) || PLAN_DASHBOARD_CATALOG.executive.href;
  }
  return hrefForDashboardModule(slug[0]) || PLAN_DASHBOARD_CATALOG.executive.href;
}

export function descriptorForPath(
  pathname: string,
): PlanDashboardDescriptor | null {
  const entries = Object.values(PLAN_DASHBOARD_CATALOG);
  const exact = entries.find((row) => pathname === row.href);
  if (exact) return exact;
  return (
    entries.find(
      (row) => row.key !== "executive" && pathname.startsWith(`${row.href}/`),
    ) || null
  );
}
