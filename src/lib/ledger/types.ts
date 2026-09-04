/** JSON values that can appear in a ledger `canonical_entity`. */
export type LedgerJson =
  | null
  | boolean
  | number
  | string
  | LedgerJson[]
  | { [key: string]: LedgerJson };

export type LedgerEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  actor_id: string;
  prev_hash: string | null;
  current_hash: string;
  signature?: string | null;
  kid?: string;
  canonical_entity?: LedgerJson;
};

export type LedgerPublicKey = {
  kid?: string;
  algorithm?: string;
  encoding?: string;
  public_key: string;
  created_at?: string;
};

export type VerifyStatus =
  | "idle"
  | "verified"
  | "hash_mismatch"
  | "bad_signature"
  | "unavailable";
