/**
 * TE-10 local stamps for human-applied trust-claim verification.
 * Separate from `tl-trust-layer` and Cloud DocTypes. Overlay-like: not posted
 * to SI. Linked evidence is still not verification until apply.
 */

import {
  stampFromClaim,
  type TrustClaimVerificationStamp,
} from "@/lib/trust/claimVerification";
import { isTrustDimensionId } from "@/lib/trust/dimensions";
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
  return {
    id: raw.id || `TCV-${raw.fingerprint}`,
    dimension: raw.dimension,
    fingerprint: raw.fingerprint,
    verifiedAt: raw.verifiedAt || new Date().toISOString(),
    source: "human_apply",
  };
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

/**
 * Human apply of verification. Suggestion only until this runs.
 * Does not write SRM, Cloud trust DocTypes, or Trust pulse.
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

export function clearClaimVerificationStamps(
  orgId: string,
  storage: ClaimVerificationStorage | null = browserStorage(),
): void {
  const root = readRoot(storage);
  delete root[orgId];
  writeRoot(storage, root);
}
