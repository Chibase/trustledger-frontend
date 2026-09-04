import type { LedgerJson } from "@/lib/ledger/types";

function sortKeys(value: LedgerJson): LedgerJson {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    const out: { [key: string]: LedgerJson } = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeys(value[key]!);
    }
    return out;
  }
  return value;
}

/** Spec §4: sorted keys, separators (",", ":"), ensure_ascii=false. */
export function canonicalJson(obj: LedgerJson): string {
  return JSON.stringify(sortKeys(obj));
}

export function asLedgerJson(value: unknown): LedgerJson {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(asLedgerJson);
  }
  if (typeof value === "object") {
    const out: { [key: string]: LedgerJson } = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = asLedgerJson(nested);
    }
    return out;
  }
  return null;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const data = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    data.set(part, offset);
    offset += part.length;
  }
  return data;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Spec §5: SHA-256 hex of
 * prev_hash_bytes + canonical_entity_bytes + timestamp_bytes + actor_id_bytes.
 * null / "" prev_hash → empty prev_hash_bytes.
 */
export async function computeCurrentHashHex(
  prevHash: string | null | undefined,
  entity: LedgerJson,
  timestamp: string,
  actorId: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const prev = encoder.encode(prevHash || "");
  const data = concatBytes([
    prev,
    encoder.encode(canonicalJson(entity)),
    encoder.encode(timestamp),
    encoder.encode(actorId),
  ]);
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return toHex(new Uint8Array(digest));
}
