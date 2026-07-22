/**
 * Desk tier + admin visibility matrix (browser localStorage).
 */

import type { UserRole } from "@/types/rbac";
import {
  DEFAULT_VISIBILITY_MATRIX,
  DESK_TIERS,
  ROLE_DEFAULT_DESK_TIER,
  type DeskTier,
  type TierVisibility,
  type VisibilityFlag,
  type VisibilityMatrix,
} from "@/types/deskTier";

const TIER_KEY = "tl-desk-tier";
const MATRIX_KEY = "tl-visibility-matrix";

function isDeskTier(value: string): value is DeskTier {
  return (DESK_TIERS as readonly string[]).includes(value);
}

function readDeskTierCookie(): DeskTier | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)tl-desk-tier=([^;]*)/);
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match[1]);
    return isDeskTier(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function isDeskTierLocked(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)tl-desk-tier-locked=1(?:;|$)/.test(document.cookie);
}

export function readDeskTier(role: UserRole): DeskTier {
  if (typeof window === "undefined") return ROLE_DEFAULT_DESK_TIER[role];
  const fromCookie = readDeskTierCookie();
  if (isDeskTierLocked() && fromCookie) return fromCookie;
  try {
    const raw = window.localStorage.getItem(TIER_KEY);
    if (raw && isDeskTier(raw)) return raw;
  } catch {
    /* ignore */
  }
  if (fromCookie) return fromCookie;
  return ROLE_DEFAULT_DESK_TIER[role];
}

export function writeDeskTier(tier: DeskTier) {
  if (typeof window === "undefined") return;
  if (isDeskTierLocked()) return;
  window.localStorage.setItem(TIER_KEY, tier);
  document.cookie = `tl-desk-tier=${encodeURIComponent(tier)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

function mergeMatrix(partial: Partial<VisibilityMatrix> | null): VisibilityMatrix {
  const out = structuredClone(DEFAULT_VISIBILITY_MATRIX);
  if (!partial) return out;
  for (const tier of DESK_TIERS) {
    const row = partial[tier];
    if (!row) continue;
    out[tier] = { ...out[tier], ...row };
  }
  return out;
}

export function readVisibilityMatrix(): VisibilityMatrix {
  if (typeof window === "undefined") {
    return structuredClone(DEFAULT_VISIBILITY_MATRIX);
  }
  try {
    const raw = window.localStorage.getItem(MATRIX_KEY);
    if (!raw) return structuredClone(DEFAULT_VISIBILITY_MATRIX);
    return mergeMatrix(JSON.parse(raw) as Partial<VisibilityMatrix>);
  } catch {
    return structuredClone(DEFAULT_VISIBILITY_MATRIX);
  }
}

export function writeVisibilityMatrix(matrix: VisibilityMatrix) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MATRIX_KEY, JSON.stringify(matrix));
}

export function visibilityFor(
  tier: DeskTier,
  matrix?: VisibilityMatrix,
): TierVisibility {
  return (matrix ?? readVisibilityMatrix())[tier];
}

export function canSee(
  flag: VisibilityFlag,
  tier: DeskTier,
  matrix?: VisibilityMatrix,
): boolean {
  return visibilityFor(tier, matrix)[flag];
}

/** Priority rank for supervisor queue (higher = more urgent). */
export function priorityRank(priority: string): number {
  switch (priority) {
    case "P1-Critical":
      return 4;
    case "P2-High":
      return 3;
    case "P3-Medium":
      return 2;
    case "P4-Low":
      return 1;
    default:
      return 0;
  }
}
