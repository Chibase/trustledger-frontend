/**
 * Plan Owner controls which desks may open each report pack.
 * Defaults inherit plan seniority + pack minDesk.
 */

import type { PlanId } from "@/config/plans";
import {
  DESK_TIERS,
  DESK_TIER_RANK,
  type DeskTier,
  tierMeetsMinimum,
} from "@/types/deskTier";
import {
  REPORT_PACK_IDS,
  REPORT_PACKS,
  planIncludesPack,
  type ReportPackId,
} from "@/types/reportPacks";

const KEY = "tl-report-pack-access";

/** Per-pack: desks explicitly allowed by Plan Owner (empty = use defaults). */
export type ReportPackAccessMap = Partial<
  Record<ReportPackId, DeskTier[] | null>
>;

function readJson<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(value: ReportPackAccessMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(value));
}

export function readReportPackAccess(): ReportPackAccessMap {
  return readJson<ReportPackAccessMap>({});
}

/** Default desks for a pack on this plan (all desks at or above minDesk). */
export function defaultDesksForPack(
  packId: ReportPackId,
  planId?: PlanId | null,
): DeskTier[] {
  if (!planIncludesPack(planId, packId)) return [];
  const min = REPORT_PACKS[packId].minDesk;
  return DESK_TIERS.filter((t) => tierMeetsMinimum(t, min));
}

/** Effective allowed desks after Owner overrides. */
export function allowedDesksForPack(
  packId: ReportPackId,
  planId?: PlanId | null,
): DeskTier[] {
  if (!planIncludesPack(planId, packId)) return [];
  const map = readReportPackAccess();
  const min = REPORT_PACKS[packId].minDesk;
  if (Object.prototype.hasOwnProperty.call(map, packId)) {
    const overrides = map[packId];
    if (!overrides || overrides.length === 0) return [];
    return overrides.filter((t) => tierMeetsMinimum(t, min));
  }
  return defaultDesksForPack(packId, planId);
}

export function canDeskOpenPack(
  packId: ReportPackId,
  desk: DeskTier,
  planId?: PlanId | null,
): boolean {
  return allowedDesksForPack(packId, planId).includes(desk);
}

/** Packs the viewer may open. */
export function packsForDesk(
  desk: DeskTier,
  planId?: PlanId | null,
): ReportPackId[] {
  return REPORT_PACK_IDS.filter((id) => canDeskOpenPack(id, desk, planId));
}

/**
 * Plan Owner sets which desks may use a pack.
 * Cannot grant desks below the pack’s minDesk or packs off-plan.
 */
export function setPackDeskAccess(
  packId: ReportPackId,
  desks: DeskTier[],
  planId?: PlanId | null,
): ReportPackAccessMap {
  if (!planIncludesPack(planId, packId)) {
    return readReportPackAccess();
  }
  const min = REPORT_PACKS[packId].minDesk;
  const cleaned = desks
    .filter((t) => tierMeetsMinimum(t, min))
    .sort((a, b) => DESK_TIER_RANK[a] - DESK_TIER_RANK[b]);
  const next = { ...readReportPackAccess(), [packId]: cleaned };
  writeJson(next);
  return next;
}

export function resetPackDeskAccess(packId: ReportPackId): ReportPackAccessMap {
  const next = { ...readReportPackAccess() };
  delete next[packId];
  writeJson(next);
  return next;
}

export function packAccessSummary(
  packId: ReportPackId,
  planId?: PlanId | null,
): { onPlan: boolean; desks: DeskTier[] } {
  return {
    onPlan: planIncludesPack(planId, packId),
    desks: allowedDesksForPack(packId, planId),
  };
}
