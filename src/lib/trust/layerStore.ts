/**
 * Optional browser store for the parallel trust layer.
 * Key `tl-trust-layer` is separate from `tl-org-data` so SRM buckets stay untouched.
 * Capture apply (TE-5b) may persist field extras here. Does not write SRM.
 *
 * TE-7: live customer/trial workspaces use Cloud DocTypes as SoT.
 * Local storage is a cache / offline queue. Demo stays local-only.
 */

import {
  normalizeTrustCommunityContext,
} from "@/lib/trust/communityContext";
import {
  normalizeTrustObservation,
} from "@/lib/trust/observation";
import { normalizeTrustParticipation } from "@/lib/trust/participation";
import { isLiveMode } from "@/config/api";
import {
  fetchTrustLayerFromCloud,
  pushTrustLayerToCloud,
} from "@/lib/trust/trustCloudClient";
import {
  TRUST_LAYER_STORAGE_KEY,
  type TrustCommunityContext,
  type TrustLayerBucket,
  type TrustObservation,
  type TrustParticipationRecord,
} from "@/types/trustLayer";

export type TrustLayerStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

function browserStorage(): TrustLayerStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createMemoryTrustLayerStorage(): TrustLayerStorage {
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

function readRoot(
  storage: TrustLayerStorage | null,
): Record<string, TrustLayerBucket> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(TRUST_LAYER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TrustLayerBucket>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRoot(
  storage: TrustLayerStorage | null,
  root: Record<string, TrustLayerBucket>,
) {
  if (!storage) return;
  storage.setItem(TRUST_LAYER_STORAGE_KEY, JSON.stringify(root));
}

export function emptyTrustLayerBucket(orgId: string): TrustLayerBucket {
  return {
    orgId,
    observations: [],
    participation: [],
    community: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeBucket(
  orgId: string,
  raw: TrustLayerBucket | undefined,
): TrustLayerBucket {
  const base = emptyTrustLayerBucket(orgId);
  if (!raw) return base;
  const observations = (raw.observations || [])
    .map((row) => normalizeTrustObservation(row))
    .filter((row): row is TrustObservation => Boolean(row));
  const participation = (raw.participation || [])
    .map((row) => normalizeTrustParticipation(row))
    .filter((row): row is TrustParticipationRecord => Boolean(row));
  const community = (raw.community || [])
    .map((row) => normalizeTrustCommunityContext(row))
    .filter((row): row is TrustCommunityContext => Boolean(row));
  return {
    orgId,
    observations,
    participation,
    community,
    updatedAt: raw.updatedAt || base.updatedAt,
  };
}

export function getTrustLayerBucket(
  orgId: string,
  storage: TrustLayerStorage | null = browserStorage(),
): TrustLayerBucket {
  const root = readRoot(storage);
  return normalizeBucket(orgId, root[orgId]);
}

export function saveTrustLayerBucket(
  bucket: TrustLayerBucket,
  storage: TrustLayerStorage | null = browserStorage(),
): TrustLayerBucket {
  const next: TrustLayerBucket = {
    ...normalizeBucket(bucket.orgId, bucket),
    updatedAt: new Date().toISOString(),
  };
  const root = readRoot(storage);
  root[bucket.orgId] = next;
  writeRoot(storage, root);
  return next;
}

/** Merge derived rows into the parallel store. Does not write `tl-org-data`. */
export function mergeTrustLayerRows(
  orgId: string,
  rows: {
    observations?: TrustObservation[];
    participation?: TrustParticipationRecord[];
    community?: TrustCommunityContext[];
  },
  storage: TrustLayerStorage | null = browserStorage(),
): TrustLayerBucket {
  const current = getTrustLayerBucket(orgId, storage);
  const seenObs = new Set(current.observations.map((row) => row.id));
  const seenPart = new Set(current.participation.map((row) => row.id));
  const seenCom = new Set(current.community.map((row) => row.id));
  for (const row of rows.observations || []) {
    if (!seenObs.has(row.id)) {
      current.observations.push(row);
      seenObs.add(row.id);
    }
  }
  for (const row of rows.participation || []) {
    if (!seenPart.has(row.id)) {
      current.participation.push(row);
      seenPart.add(row.id);
    }
  }
  for (const row of rows.community || []) {
    if (!seenCom.has(row.id)) {
      current.community.push(row);
      seenCom.add(row.id);
    }
  }
  return saveTrustLayerBucket(current, storage);
}

export function clearTrustLayerBucket(
  orgId: string,
  storage: TrustLayerStorage | null = browserStorage(),
): void {
  const root = readRoot(storage);
  delete root[orgId];
  writeRoot(storage, root);
}

export function shouldUseTrustCloud(): boolean {
  return typeof window !== "undefined" && isLiveMode();
}

function mergeById<T extends { id: string }>(local: T[], cloud: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of local) map.set(row.id, row);
  for (const row of cloud) map.set(row.id, row);
  return [...map.values()];
}

function localOnly<T extends { id: string }>(local: T[], cloud: T[]): T[] {
  const cloudIds = new Set(cloud.map((row) => row.id));
  return local.filter((row) => !cloudIds.has(row.id));
}

/**
 * Live SoT is Cloud. Local cache is merged underneath; Cloud wins on id.
 * Local-only rows are pushed so a first live login migrates the browser bucket.
 */
export async function loadTrustLayerBucketAsync(
  orgId: string,
  storage: TrustLayerStorage | null = browserStorage(),
): Promise<TrustLayerBucket> {
  const local = getTrustLayerBucket(orgId, storage);
  if (!shouldUseTrustCloud()) return local;

  const cloud = await fetchTrustLayerFromCloud();
  if (!cloud) return local;

  const merged = normalizeBucket(orgId, {
    orgId,
    observations: mergeById(local.observations, cloud.observations),
    participation: mergeById(local.participation, cloud.participation),
    community: mergeById(local.community, cloud.community),
    updatedAt: new Date().toISOString(),
  });
  saveTrustLayerBucket(merged, storage);

  const extras = {
    observations: localOnly(local.observations, cloud.observations),
    participation: localOnly(local.participation, cloud.participation),
    community: localOnly(local.community, cloud.community),
  };
  if (
    extras.observations.length ||
    extras.participation.length ||
    extras.community.length
  ) {
    await pushTrustLayerToCloud(extras, orgId);
  }
  return merged;
}

export async function saveTrustLayerBucketAsync(
  bucket: TrustLayerBucket,
  storage: TrustLayerStorage | null = browserStorage(),
): Promise<TrustLayerBucket> {
  const saved = saveTrustLayerBucket(bucket, storage);
  if (shouldUseTrustCloud()) {
    await pushTrustLayerToCloud(saved, saved.orgId);
  }
  return saved;
}
