/**
 * Resolve plan + Owner toggles. Lower plans cannot enable capabilities
 * outside their matrix; Institutional may toggle the full catalogue (ADR-024).
 */

import { DEMO_CAPABILITIES, PLAN_CAPABILITIES } from "@/config/entitlements";
import { PLANS, type PlanId } from "@/config/plans";
import {
  CAPABILITIES,
  type CapabilityId,
} from "@/types/entitlements";

const OVERRIDE_KEY = "tl-entitlement-overrides";

export type EntitlementSnapshot = {
  planId: PlanId | "demo";
  capabilities: Set<CapabilityId>;
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

/** Base matrix for a plan (demo sessions use Project lens). */
export function baseCapabilitiesForPlan(
  planId?: PlanId | null,
): readonly CapabilityId[] {
  if (planId) return PLAN_CAPABILITIES[planId];
  return DEMO_CAPABILITIES;
}

/** Institutional (highest) may toggle every catalogue capability. */
export function hasFullCapabilityControl(planId?: PlanId | null): boolean {
  return planId === "institutional";
}

/** Plan Owner may turn this capability on/off for the org. */
export function canOwnerToggleCapability(
  capability: CapabilityId,
  planId?: PlanId | null,
): boolean {
  if (hasFullCapabilityControl(planId)) return true;
  return baseCapabilitiesForPlan(planId).includes(capability);
}

/** Lowest commercial plan that includes the capability (for upgrade copy). */
export function lowestPlanIncluding(capability: CapabilityId): PlanId {
  const order: PlanId[] = ["practitioner", "project", "institutional"];
  for (const id of order) {
    if (PLAN_CAPABILITIES[id].includes(capability)) return id;
  }
  return "institutional";
}

export function upgradeHrefForCapability(capability: CapabilityId): string {
  const plan = lowestPlanIncluding(capability);
  return `/pay?plan=${plan}&utm_source=settings&utm_medium=entitlement&utm_campaign=upgrade_${plan}`;
}

export function upgradeLabelForCapability(capability: CapabilityId): string {
  const plan = lowestPlanIncluding(capability);
  return `Included on ${PLANS[plan].name}`;
}

/** Owner on/off overrides. null/missing = inherit plan default. */
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

/**
 * Apply an Owner toggle. Refuses to enable capabilities outside the plan
 * unless the plan has full control (Institutional).
 */
export function setCapabilityToggle(
  capability: CapabilityId,
  enabled: boolean,
  planId?: PlanId | null,
): Partial<Record<CapabilityId, boolean>> {
  const next = { ...readCapabilityOverrides() };
  if (!canOwnerToggleCapability(capability, planId)) {
    return next;
  }
  const baseOn = baseCapabilitiesForPlan(planId).includes(capability);
  if (hasFullCapabilityControl(planId)) {
    // Institutional: explicit on/off for every switch.
    next[capability] = enabled;
  } else if (enabled === baseOn) {
    delete next[capability];
  } else {
    next[capability] = enabled;
  }
  writeCapabilityOverrides(next);
  return next;
}

export function resolveEntitlements(
  planId?: PlanId | null,
): EntitlementSnapshot {
  const baseList = baseCapabilitiesForPlan(planId);
  const capabilities = new Set<CapabilityId>(baseList);
  const overrides = readCapabilityOverrides();
  const fullControl = hasFullCapabilityControl(planId);

  for (const id of CAPABILITIES) {
    const forced = overrides[id];
    if (typeof forced !== "boolean") continue;
    if (forced) {
      // Never honour "force on" for capabilities outside a lower plan.
      if (fullControl || baseList.includes(id)) capabilities.add(id);
    } else {
      capabilities.delete(id);
    }
  }

  return {
    planId: planId ?? "demo",
    capabilities,
  };
}

export function hasCapability(
  capability: CapabilityId,
  planId?: PlanId | null,
): boolean {
  return resolveEntitlements(planId).capabilities.has(capability);
}

/** Server-safe: plan matrix only (no localStorage toggles). */
export function hasCapabilityForPlan(
  capability: CapabilityId,
  planId?: PlanId | null,
): boolean {
  return baseCapabilitiesForPlan(planId).includes(capability);
}

/** @deprecated Add-ons no longer unlock above-plan features in Settings. */
export function listEnabledAddons(): never[] {
  return [];
}

/** @deprecated */
export function writeEnabledAddons(_addons?: string[]) {
  void _addons;
  /* no-op — plan matrix + Owner toggles only */
}
