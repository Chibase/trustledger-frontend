/**
 * OD-3 — client helper: push tl-org-data to Cloud once after live login.
 * SI-SEP plans use a separate one-shot flag so already-migrated orgs still push.
 */

import { getOrgDataBucket } from "@/lib/orgDataSpace";
import { getActiveOrg, getActiveOrgId } from "@/lib/orgStore";
import { listSepExecutions } from "@/lib/sepExecutionStore";
import { listEngagementPlans } from "@/lib/sepStore";
import { listClaimVerificationStamps } from "@/lib/trust/claimVerificationStore";
import { getTrustLayerBucket } from "@/lib/trust/layerStore";

const FLAG_PREFIX = "tl-org-migrated:";
const SEP_FLAG_PREFIX = "tl-sep-migrated:";

function migratedKey(orgId: string) {
  return `${FLAG_PREFIX}${orgId}`;
}

function sepMigratedKey(scope: string) {
  return `${SEP_FLAG_PREFIX}${scope}`;
}

export function hasMigratedOrg(orgId: string): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(migratedKey(orgId)) === "1";
}

export function markOrgMigrated(orgId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(migratedKey(orgId), "1");
}

function sepScope(): string {
  return getActiveOrgId()?.trim() || "local";
}

export function hasMigratedSep(scope = sepScope()): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(sepMigratedKey(scope)) === "1";
}

export function markSepMigrated(scope = sepScope()) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sepMigratedKey(scope), "1");
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
    observations?: number;
    participation?: number;
    community?: number;
    verifications?: number;
    plans?: number;
    failed: number;
  };
};

async function postMigrate(body: Record<string, unknown>): Promise<MigrateOrgResult> {
  const res = await fetch("/api/frappe/migrate-org", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as MigrateOrgResult & { error?: string };
  if (!res.ok) {
    return { ok: false, error: json.error || `HTTP ${res.status}` };
  }
  return json;
}

/**
 * One-shot migrate of browser engagement plans + execution overlays.
 * Independent of the org-bucket flag so SEC-era migrated workspaces still push SEP.
 */
export async function migrateSepPlansToCloud(options?: {
  customer?: string;
  orgId?: string;
  force?: boolean;
}): Promise<MigrateOrgResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Browser only" };
  }
  const scope = options?.orgId?.trim() || sepScope();
  if (!options?.force && hasMigratedSep(scope)) {
    return { ok: true, skipped: true, message: "Already migrated engagement plans" };
  }

  const plans = listEngagementPlans();
  const sepOverlays = listSepExecutions();
  if (plans.length === 0 && sepOverlays.length === 0) {
    markSepMigrated(scope);
    return { ok: true, skipped: true, message: "No engagement plans to migrate" };
  }

  try {
    const json = await postMigrate({
      customer: options?.customer,
      orgId: options?.orgId || getActiveOrgId() || undefined,
      plans,
      sepOverlays,
    });
    if (json.ok) markSepMigrated(scope);
    return json;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "SEP migrate failed",
    };
  }
}

/**
 * One-shot migrate of browser org projects/incidents/evidence to Cloud.
 * Server binds Customer from the live sign-in. `customer` is optional and
 * ignored for non-operators (browser org name often differs from Cloud name).
 * Always attempts SEP persist (separate flag).
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
  const customer = (options?.customer || org?.name || "").trim();

  let orgResult: MigrateOrgResult = {
    ok: true,
    skipped: true,
    message: "No browser org to migrate",
  };

  if (orgId && org) {
    if (!options?.force && hasMigratedOrg(orgId)) {
      orgResult = { ok: true, skipped: true, message: "Already migrated this org" };
    } else {
      const bucket = getOrgDataBucket(orgId);
      if (!bucket) {
        orgResult = { ok: true, skipped: true, message: "No org data bucket" };
      } else {
        const trust = getTrustLayerBucket(orgId);
        const verifications = listClaimVerificationStamps(orgId);
        const hasRows =
          bucket.projects.length > 0 ||
          bucket.incidents.length > 0 ||
          bucket.evidence.length > 0 ||
          trust.observations.length > 0 ||
          trust.participation.length > 0 ||
          trust.community.length > 0 ||
          verifications.length > 0;
        if (!hasRows) {
          markOrgMigrated(orgId);
          orgResult = { ok: true, skipped: true, message: "Empty org — nothing to migrate" };
        } else if (!customer) {
          orgResult = { ok: false, error: "Customer name required for migrate" };
        } else {
          try {
            const json = await postMigrate({
              customer,
              orgId,
              projects: bucket.projects,
              incidents: bucket.incidents,
              evidence: bucket.evidence,
              observations: trust.observations,
              participation: trust.participation,
              community: trust.community,
              verifications,
            });
            if (json.ok) markOrgMigrated(orgId);
            orgResult = json;
          } catch (err) {
            orgResult = {
              ok: false,
              error: err instanceof Error ? err.message : "Migrate failed",
            };
          }
        }
      }
    }
  }

  const sepResult = await migrateSepPlansToCloud({
    customer: customer || undefined,
    orgId: orgId || undefined,
    force: options?.force,
  });

  if (orgResult.skipped && sepResult.skipped) {
    return {
      ok: true,
      skipped: true,
      message: orgResult.message || sepResult.message,
    };
  }
  if (!orgResult.ok) return orgResult;
  if (!sepResult.ok) return sepResult;
  return {
    ok: true,
    message: [orgResult.message, sepResult.message].filter(Boolean).join(" · "),
    counts: {
      projects: orgResult.counts?.projects || 0,
      incidents: orgResult.counts?.incidents || 0,
      evidence: orgResult.counts?.evidence || 0,
      observations: orgResult.counts?.observations,
      participation: orgResult.counts?.participation,
      community: orgResult.counts?.community,
      verifications: orgResult.counts?.verifications,
      plans: sepResult.counts?.plans,
      failed: (orgResult.counts?.failed || 0) + (sepResult.counts?.failed || 0),
    },
  };
}
