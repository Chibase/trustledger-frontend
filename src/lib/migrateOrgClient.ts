/**
 * OD-3 — client helper: push tl-org-data to Cloud once after live login.
 */

import { getOrgDataBucket } from "@/lib/orgDataSpace";
import { getActiveOrg, getActiveOrgId } from "@/lib/orgStore";

const FLAG_PREFIX = "tl-org-migrated:";

function migratedKey(orgId: string) {
  return `${FLAG_PREFIX}${orgId}`;
}

export function hasMigratedOrg(orgId: string): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(migratedKey(orgId)) === "1";
}

export function markOrgMigrated(orgId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(migratedKey(orgId), "1");
}

export type MigrateOrgResult = {
  ok: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
  counts?: {
    projects: number;
    incidents: number;
    evidence: number;
    failed: number;
  };
};

/**
 * One-shot migrate of browser org projects/incidents/evidence to Cloud.
 * `customer` must match Frappe Customer name (usually org display name).
 */
export async function migrateActiveOrgToCloud(options?: {
  customer?: string;
  force?: boolean;
}): Promise<MigrateOrgResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Browser only" };
  }

  const orgId = getActiveOrgId();
  const org = getActiveOrg();
  if (!orgId || !org) {
    return { ok: true, skipped: true, message: "No browser org to migrate" };
  }
  if (!options?.force && hasMigratedOrg(orgId)) {
    return { ok: true, skipped: true, message: "Already migrated this org" };
  }

  const bucket = getOrgDataBucket(orgId);
  if (!bucket) {
    return { ok: true, skipped: true, message: "No org data bucket" };
  }

  const hasRows =
    bucket.projects.length > 0 ||
    bucket.incidents.length > 0 ||
    bucket.evidence.length > 0;
  if (!hasRows) {
    markOrgMigrated(orgId);
    return { ok: true, skipped: true, message: "Empty org — nothing to migrate" };
  }

  const customer = (options?.customer || org.name || "").trim();
  if (!customer) {
    return { ok: false, error: "Customer name required for migrate" };
  }

  try {
    const res = await fetch("/api/frappe/migrate-org", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        customer,
        orgId,
        projects: bucket.projects,
        incidents: bucket.incidents,
        evidence: bucket.evidence,
      }),
    });
    const json = (await res.json()) as MigrateOrgResult & { error?: string };
    if (!res.ok) {
      return { ok: false, error: json.error || `HTTP ${res.status}` };
    }
    if (json.ok) markOrgMigrated(orgId);
    return json;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Migrate failed",
    };
  }
}
