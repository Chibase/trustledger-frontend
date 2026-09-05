/**
 * Live-aware SEP persist. Trial / VIP seed stay on the sync local store.
 * Live entitled workspaces prefer Cloud; empty Cloud stays empty.
 */

import { isLiveMode } from "@/config/api";
import {
  cacheEngagementPlan,
  deleteEngagementPlan,
  getEngagementPlan,
  listEngagementPlans,
  saveEngagementPlan,
} from "@/lib/sepStore";
import {
  getSepExecution,
  saveSepExecution,
} from "@/lib/sepExecutionStore";
import type { EngagementPlan } from "@/types/engagementPlan";
import type { SepExecutionOverlay } from "@/types/sepExecution";

/** Overlay extras onto Cloud ids only. Local-only rows are not appended. */
export function overlayLocalPlansOntoCloud(
  cloud: EngagementPlan[],
  local: EngagementPlan[],
): EngagementPlan[] {
  const localById = new Map(local.map((row) => [row.id, row]));
  return cloud.map((row) => {
    const extra = localById.get(row.id);
    if (!extra) return row;
    return { ...extra, ...row };
  });
}

async function isOwnDataWorkspace(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  return readTrialModeFromDocument() || isCustomerWorkspaceClient();
}

async function fetchCloudList(): Promise<{
  plans: EngagementPlan[];
  overlays: Record<string, SepExecutionOverlay>;
} | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/frappe/sep", {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) return { plans: [], overlays: {} };
    if (!res.ok) return null;
    const json = (await res.json()) as {
      rows?: EngagementPlan[];
      overlays?: Record<string, SepExecutionOverlay>;
    };
    return {
      plans: Array.isArray(json.rows) ? json.rows : [],
      overlays: json.overlays && typeof json.overlays === "object" ? json.overlays : {},
    };
  } catch {
    return null;
  }
}

async function fetchCloudPlan(id: string): Promise<{
  plan: EngagementPlan | null;
  overlay: SepExecutionOverlay | null;
} | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/frappe/sep?id=${encodeURIComponent(id)}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) return { plan: null, overlay: null };
    if (!res.ok) return null;
    const json = (await res.json()) as {
      plan?: EngagementPlan | null;
      overlay?: SepExecutionOverlay | null;
    };
    return {
      plan: json.plan || null,
      overlay: json.overlay || null,
    };
  } catch {
    return null;
  }
}

async function postCloud(body: {
  plan?: EngagementPlan;
  overlay?: SepExecutionOverlay | null;
  includeExecution?: boolean;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/frappe/sep", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function cacheCloudOverlays(overlays: Record<string, SepExecutionOverlay>) {
  for (const overlay of Object.values(overlays)) {
    saveSepExecution(overlay, { persistCloud: false });
  }
}

export async function listEngagementPlansLive(): Promise<EngagementPlan[]> {
  if (typeof window === "undefined") return [];

  if (isLiveMode()) {
    const cloud = await fetchCloudList();
    if (cloud) {
      cacheCloudOverlays(cloud.overlays);
      for (const plan of cloud.plans) cacheEngagementPlan(plan);
      return overlayLocalPlansOntoCloud(cloud.plans, listEngagementPlans());
    }
    const own = await isOwnDataWorkspace();
    if (own) return listEngagementPlans();
  }

  return listEngagementPlans();
}

export async function getEngagementPlanLive(
  id: string,
): Promise<EngagementPlan | null> {
  if (!id.trim()) return null;
  if (typeof window === "undefined") return getEngagementPlan(id);

  if (isLiveMode()) {
    const cloud = await fetchCloudPlan(id);
    if (cloud) {
      if (cloud.overlay) {
        saveSepExecution(cloud.overlay, { persistCloud: false });
      }
      if (cloud.plan) {
        cacheEngagementPlan(cloud.plan);
        const local = getEngagementPlan(id);
        return overlayLocalPlansOntoCloud(
          [cloud.plan],
          local ? [local] : [],
        )[0] || cloud.plan;
      }
      return null;
    }
  }

  return getEngagementPlan(id);
}

export async function saveEngagementPlanLive(
  plan: EngagementPlan,
): Promise<EngagementPlan> {
  const overlay = getSepExecution(plan.id);
  if (typeof window !== "undefined" && isLiveMode()) {
    const body: {
      plan: EngagementPlan;
      overlay?: SepExecutionOverlay;
      includeExecution?: boolean;
    } = { plan };
    if (overlay) {
      body.overlay = overlay;
      body.includeExecution = true;
    }
    const pushed = await postCloud(body);
    if (!pushed) {
      throw new Error("Could not save on TrustLedger Cloud");
    }
    return saveEngagementPlan(plan);
  }
  return saveEngagementPlan(plan);
}

export async function deleteEngagementPlanLive(id: string): Promise<void> {
  if (typeof window !== "undefined" && isLiveMode()) {
    try {
      await fetch(`/api/frappe/sep?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch {
      /* local delete still runs */
    }
  }
  deleteEngagementPlan(id);
}

/** Fire-and-forget overlay upsert used by the local execution store. */
export async function pushSepExecutionToCloud(
  overlay: SepExecutionOverlay,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isLiveMode()) return;
  await postCloud({ overlay, includeExecution: true });
}

export async function listEngagementPlansForProjectLive(
  projectId: string,
): Promise<EngagementPlan[]> {
  const id = projectId.trim();
  if (!id) return [];
  const rows = await listEngagementPlansLive();
  return rows.filter((row) => row.projectId === id);
}
