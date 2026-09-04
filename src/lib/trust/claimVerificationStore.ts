/**
 * TE-10 / TE-11 stamps for human-applied trust-claim verification.
 * Live customer/trial SoT is Cloud (`TL Trust Claim Verification`).
 * Local key `tl-trust-claim-verifications` is a cache / demo store.
 * Overlay-like keys are not posted to SI. Linked evidence is still not
 * verification until human apply.
 */

import { isLiveMode } from "@/config/api";
import {
  stampFromClaim,
  type TrustClaimVerificationStamp,
} from "@/lib/trust/claimVerification";
import { isTrustDimensionId } from "@/lib/trust/dimensions";
import {
  fetchTrustLayerFromCloud,
  pushClaimVerificationToCloud,
  pushClaimVerificationsToCloud,
} from "@/lib/trust/trustCloudClient";
import type { TrustProofClaim } from "@/lib/trust/proofReport";

export const CLAIM_VERIFICATION_STORAGE_KEY = "tl-trust-claim-verifications";

export type ClaimVerificationStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

type StampRoot = Record<string, TrustClaimVerificationStamp[]>;

function browserStorage(): ClaimVerificationStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createMemoryClaimVerificationStorage(): ClaimVerificationStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function readRoot(store: ClaimVerificationStorage | null): StampRoot {
  if (!store) return {};
  try {
    const raw = store.getItem(CLAIM_VERIFICATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StampRoot;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRoot(store: ClaimVerificationStorage | null, root: StampRoot) {
  if (!store) return;
  store.setItem(CLAIM_VERIFICATION_STORAGE_KEY, JSON.stringify(root));
}

function normalizeStamp(
  raw: Partial<TrustClaimVerificationStamp> | null | undefined,
): TrustClaimVerificationStamp | null {
  if (!raw || typeof raw !== "object") return null;
  if (raw.source !== "human_apply") return null;
  if (!isTrustDimensionId(raw.dimension) || !raw.fingerprint) return null;
  const verifiedAt = String(raw.verifiedAt || "").trim();
  if (!verifiedAt) return null;
  return {
    id: raw.id || `TCV-${raw.fingerprint}`,
    dimension: raw.dimension,
    fingerprint: raw.fingerprint,
    verifiedAt,
    source: "human_apply",
  };
}

function mergeById(
  local: TrustClaimVerificationStamp[],
  cloud: TrustClaimVerificationStamp[],
): TrustClaimVerificationStamp[] {
  const map = new Map<string, TrustClaimVerificationStamp>();
  for (const row of local) map.set(row.id, row);
  for (const row of cloud) map.set(row.id, row);
  return [...map.values()];
}

function localOnly(
  local: TrustClaimVerificationStamp[],
  cloud: TrustClaimVerificationStamp[],
): TrustClaimVerificationStamp[] {
  const cloudIds = new Set(cloud.map((row) => row.id));
  return local.filter((row) => !cloudIds.has(row.id));
}

function shouldUseTrustCloud(): boolean {
  return typeof window !== "undefined" && isLiveMode();
}

export function listClaimVerificationStamps(
  orgId: string,
  storage: ClaimVerificationStorage | null = browserStorage(),
): TrustClaimVerificationStamp[] {
  if (!orgId) return [];
  const rows = readRoot(storage)[orgId] || [];
  return rows
    .map((row) => normalizeStamp(row))
    .filter((row): row is TrustClaimVerificationStamp => Boolean(row));
}

export function replaceClaimVerificationStamps(
  orgId: string,
  stamps: TrustClaimVerificationStamp[],
  storage: ClaimVerificationStorage | null = browserStorage(),
): TrustClaimVerificationStamp[] {
  if (!orgId) return [];
  const next = stamps
    .map((row) => normalizeStamp(row))
    .filter((row): row is TrustClaimVerificationStamp => Boolean(row));
  const root = readRoot(storage);
  root[orgId] = next;
  writeRoot(storage, root);
  return next;
}

/**
 * Cloud wins on id. Returns local-only rows so a first live login can migrate.
 */
export function mergeClaimVerificationStampsFromCloud(
  orgId: string,
  cloud: TrustClaimVerificationStamp[],
  storage: ClaimVerificationStorage | null = browserStorage(),
): TrustClaimVerificationStamp[] {
  const local = listClaimVerificationStamps(orgId, storage);
  const cloudRows = cloud
    .map((row) => normalizeStamp(row))
    .filter((row): row is TrustClaimVerificationStamp => Boolean(row));
  replaceClaimVerificationStamps(
    orgId,
    mergeById(local, cloudRows),
    storage,
  );
  return localOnly(local, cloudRows);
}

/**
 * Human apply of verification. Suggestion only until this runs.
 * Writes the local cache. Does not write SRM or Trust pulse.
 * Live workspaces should call `applyClaimVerificationAsync` so Cloud is SoT.
 */
export function applyClaimVerification(
  input: {
    orgId: string;
    claim: Pick<TrustProofClaim, "dimension" | "evidenceIds" | "observationIds">;
    verifiedAt?: string;
  },
  storage: ClaimVerificationStorage | null = browserStorage(),
): TrustClaimVerificationStamp | null {
  const orgId = input.orgId || "local";
  if (!input.claim.evidenceIds.length) return null;
  const stamp = stampFromClaim(input.claim, input.verifiedAt);
  const root = readRoot(storage);
  const current = (root[orgId] || [])
    .map((row) => normalizeStamp(row))
    .filter((row): row is TrustClaimVerificationStamp => Boolean(row))
    .filter((row) => row.fingerprint !== stamp.fingerprint);
  current.push(stamp);
  root[orgId] = current;
  writeRoot(storage, root);
  return stamp;
}

export async function applyClaimVerificationAsync(
  input: {
    orgId: string;
    claim: Pick<TrustProofClaim, "dimension" | "evidenceIds" | "observationIds">;
    verifiedAt?: string;
  },
  storage: ClaimVerificationStorage | null = browserStorage(),
): Promise<TrustClaimVerificationStamp | null> {
  const stamp = applyClaimVerification(input, storage);
  if (stamp && shouldUseTrustCloud()) {
    await pushClaimVerificationToCloud(stamp, input.orgId || "local");
  }
  return stamp;
}

export async function loadClaimVerificationStampsAsync(
  orgId: string,
  storage: ClaimVerificationStorage | null = browserStorage(),
): Promise<TrustClaimVerificationStamp[]> {
  const local = listClaimVerificationStamps(orgId, storage);
  if (!shouldUseTrustCloud()) return local;

  const cloud = await fetchTrustLayerFromCloud();
  if (!cloud) return local;

  const extras = mergeClaimVerificationStampsFromCloud(
    orgId,
    cloud.verifications,
    storage,
  );
  if (extras.length) {
    await pushClaimVerificationsToCloud(extras, orgId);
  }
  return listClaimVerificationStamps(orgId, storage);
}

export function clearClaimVerificationStamps(
  orgId: string,
  storage: ClaimVerificationStorage | null = browserStorage(),
): void {
  const root = readRoot(storage);
  delete root[orgId];
  writeRoot(storage, root);
}
