import { computeCurrentHashHex } from "@/lib/ledger/canonicalize";
import type { LedgerEntry, VerifyStatus } from "@/lib/ledger/types";
import { verifySignatureBase64 } from "@/lib/ledger/verify";

export type VerifyOutcome = {
  status: VerifyStatus;
  recomputedHash?: string;
};

/**
 * Recompute current_hash, then verify ed25519 over the ASCII hex.
 * Does not throw for missing key/signature — those are `unavailable`.
 */
export async function verifyLedgerEntry(
  entry: LedgerEntry,
  publicKeyB64: string | null,
  verifySig: typeof verifySignatureBase64 = verifySignatureBase64,
): Promise<VerifyOutcome> {
  if (!entry.canonical_entity) {
    return { status: "unavailable" };
  }
  const recomputedHash = await computeCurrentHashHex(
    entry.prev_hash,
    entry.canonical_entity,
    entry.timestamp,
    entry.actor_id,
  );
  if (recomputedHash !== entry.current_hash) {
    return { status: "hash_mismatch", recomputedHash };
  }
  if (!publicKeyB64) {
    return { status: "unavailable", recomputedHash };
  }
  if (!entry.signature) {
    return { status: "unavailable", recomputedHash };
  }
  try {
    const ok = await verifySig(publicKeyB64, entry.signature, recomputedHash);
    return { status: ok ? "verified" : "bad_signature", recomputedHash };
  } catch {
    return { status: "unavailable", recomputedHash };
  }
}
