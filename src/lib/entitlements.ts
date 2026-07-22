/**
 * Resolve plan + add-on entitlements. Browser overrides for demo/ops preview.
 */

import { DEMO_CAPABILITIES, PLAN_CAPABILITIES } from "@/config/entitlements";
import type { PlanId } from "@/config/plans";
import {
  ADDON_GRANTS,
  CAPABILITIES,
  type AddonId,
  type CapabilityId,
} from "@/types/entitlements";

const ADDONS_KEY = "tl-entitlement-addons";
const OVERRIDE_KEY = "tl-entitlement-overrides";

export type EntitlementSnapshot = {
  planId: PlanId | "demo";
  capabilities: Set<CapabilityId>;
  addons: AddonId[];
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listEnabledAddons(): AddonId[] {
  const rows = readJson<string[]>(ADDONS_KEY, []);
  return rows.filter((id): id is AddonId => id in ADDON_GRANTS);
}

export function writeEnabledAddons(addons: AddonId[]) {
  writeJson(ADDONS_KEY, addons);
}

/** Optional hard on/off overrides (admin preview). null = inherit. */
export function readCapabilityOverrides(): Partial<
  Record<CapabilityId, boolean>
> {
  return readJson(OVERRIDE_KEY, {});
}

export function writeCapabilityOverrides(
  overrides: Partial<Record<CapabilityId, boolean>>,
) {
  writeJson(OVERRIDE_KEY, overrides);
}

export function resolveEntitlements(
  planId?: PlanId | null,
): EntitlementSnapshot {
  const baseList = planId
    ? PLAN_CAPABILITIES[planId]
    : DEMO_CAPABILITIES;
  const capabilities = new Set<CapabilityId>(baseList);
  const addons = listEnabledAddons();
  for (const addon of addons) {
    for (const cap of ADDON_GRANTS[addon]) capabilities.add(cap);
  }
  const overrides = readCapabilityOverrides();
  for (const id of CAPABILITIES) {
    if (typeof overrides[id] === "boolean") {
      if (overrides[id]) capabilities.add(id);
      else capabilities.delete(id);
    }
  }
  return {
    planId: planId ?? "demo",
    capabilities,
    addons,
  };
}

export function hasCapability(
  capability: CapabilityId,
  planId?: PlanId | null,
): boolean {
  return resolveEntitlements(planId).capabilities.has(capability);
}

/** Server-safe: plan matrix only (no localStorage add-ons). */
export function hasCapabilityForPlan(
  capability: CapabilityId,
  planId?: PlanId | null,
): boolean {
  const list = planId ? PLAN_CAPABILITIES[planId] : DEMO_CAPABILITIES;
  return list.includes(capability);
}
