/**
 * Optional browser store for the parallel trust layer.
 * Key `tl-trust-layer` is separate from `tl-org-data` so SRM buckets stay untouched.
 * Nothing in the app shell reads this yet — persist only when a later packet opts in.
 */

import {
  normalizeTrustCommunityContext,
} from "@/lib/trust/communityContext";
import {
  normalizeTrustObservation,
} from "@/lib/trust/observation";
import { normalizeTrustParticipation } from "@/lib/trust/participation";
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
