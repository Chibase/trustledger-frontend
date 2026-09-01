import type { LedgerEntry, LedgerPublicKey } from "@/lib/ledger/types";
import { asLedgerJson } from "@/lib/ledger/canonicalize";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseEntry(raw: unknown): LedgerEntry | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.current_hash !== "string") {
    return null;
  }
  return {
    id: raw.id,
    action: typeof raw.action === "string" ? raw.action : "",
    entity_type: typeof raw.entity_type === "string" ? raw.entity_type : "",
    entity_id: typeof raw.entity_id === "string" ? raw.entity_id : "",
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : "",
    actor_id: typeof raw.actor_id === "string" ? raw.actor_id : "",
    prev_hash: typeof raw.prev_hash === "string" ? raw.prev_hash : null,
    current_hash: raw.current_hash,
    signature: typeof raw.signature === "string" ? raw.signature : null,
    kid: typeof raw.kid === "string" ? raw.kid : undefined,
    canonical_entity:
      raw.canonical_entity === undefined
        ? undefined
        : asLedgerJson(raw.canonical_entity),
  };
}

/** Accept both `{ message: LedgerEntry[] }` and `{ message: { entries } }`. */
export function parseLedgerChain(payload: unknown): {
  ok: boolean;
  entries: LedgerEntry[];
  error: string | null;
} {
  if (!isRecord(payload)) {
    return { ok: false, entries: [], error: "Could not read ledger chain." };
  }
  const message = payload.message;
  if (isRecord(message) && message.ok === false) {
    const reason =
      typeof message.reason === "string"
        ? message.reason
        : "Ledger chain request failed.";
    return { ok: false, entries: [], error: reason };
  }
  const list = Array.isArray(message)
    ? message
    : isRecord(message) && Array.isArray(message.entries)
      ? message.entries
      : null;
  if (!list) {
    return { ok: false, entries: [], error: "Could not read ledger chain." };
  }
  const entries = list
    .map(parseEntry)
    .filter((row): row is LedgerEntry => row !== null);
  return { ok: true, entries, error: null };
}

export function parsePublicKey(payload: unknown): LedgerPublicKey | null {
  if (!isRecord(payload) || !isRecord(payload.message)) return null;
  const message = payload.message;
  if (message.ok === false) return null;
  if (typeof message.public_key !== "string" || !message.public_key) {
    return null;
  }
  return {
    public_key: message.public_key,
    kid: typeof message.kid === "string" ? message.kid : undefined,
    algorithm:
      typeof message.algorithm === "string" ? message.algorithm : undefined,
    encoding: typeof message.encoding === "string" ? message.encoding : undefined,
  };
}
