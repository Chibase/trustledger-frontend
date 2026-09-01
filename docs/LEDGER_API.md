# Ledger API & Canonicalization

This document defines the Ledger / Audit Trail API contract and the deterministic canonicalization rules used to compute chained hashes and signatures for TrustLedger SRM entities.

Purpose
- Provide a simple, unambiguous specification so frontend, backend (srm-core / Frappe) and import tooling can adopt a single, verifiable ledger format.
- Support creation, retrieval and verification of ledger entries that prove chain-of-custody for evidence, inspections, incidents and other SRM artifacts.

Principles
- Deterministic canonicalization: the same entity representation always yields the same canonical bytes regardless of language or locale.
- Simple chain formula: each ledger entry links to the previous entry via prev_hash → current_hash.
- Practical signature scheme: ed25519 signatures on the current_hash. Public key published by an endpoint for client-side verification.

Public endpoints (frontend ↔ srm-core / Frappe contract)

1. POST /api/method/srm_core.api.ledger.create_entry
- Purpose: create a ledger entry for an entity create/update action.
- Request JSON (envelope: `{ "message": { ... } }` per FRAPPE_API_CONTRACT.md):

{
  "entity_type": "inspection|incident|evidence|asset|work_order|...",
  "entity_id": "INSP-1001",
  "action": "create|update|approve|assign|close",
  "timestamp": "2026-08-01T09:17:30Z",
  "actor_id": "USER-INS-01",
  "canonical_entity": { ... },    // canonical JSON object (any serializable fields the signing party wants to attest)
  "prev_hash": "<hex or NULL>",
  "signature": "<base64 signature of current_hash>"  // optional if signing is performed by backend
}

- Response: `{ "message": { "ledger_id": "LGR-5001", "current_hash": "<hex>", "ok": true } }`

2. GET /api/method/srm_core.api.ledger.get_chain?entity_id=<id>
- Purpose: fetch the ledger chain for a given entity id.
- Response `message`: `LedgerEntry[]` where `LedgerEntry` has fields:
  - id, entity_type, entity_id, action, timestamp, actor_id, prev_hash, current_hash, signature, canonical_entity

3. POST /api/method/srm_core.api.ledger.verify_entry
- Purpose: server-side verification helper that validates a single ledger entry signature / recomputes the hash and returns the verification result.
- Request: `{ ledger_id: "LGR-5001" }`
- Response: `{ verified: true|false, reason?: "..." }`

4. GET /api/method/srm_core.api.ledger.public_key
- Purpose: fetch the public key(s) used for signature verification (for client-side verify). The response SHOULD return a small keyset and metadata (key id, algorithm, encoding).
- Response `message` example:
  {
    "kid": "demo-2026-08",
    "algorithm": "ed25519",
    "encoding": "base64",
    "public_key": "<base64 public key bytes>",
    "created_at": "2026-08-01T00:00:00Z"
  }


Deterministic canonical JSON rules (byte-level)
- Purpose: define exactly how an entity is turned into bytes for hashing.

Rules
1. Use JSON with UTF-8 encoding for all bytes.
2. Keys MUST be sorted in Unicode (lexicographic) order. Sorting is performed on the raw key strings.
3. Serialize objects with no extra whitespace and the separators (",",":") exactly. In Python: `json.dumps(obj, separators=(",",":"), sort_keys=True, ensure_ascii=False)`.
4. Arrays remain in their logical order; do not sort array elements.
5. Strings MUST preserve their content (no additional normalisation). Use `ensure_ascii=false` so multibyte characters are encoded as UTF-8 bytes.
6. Nulls, booleans and numbers are encoded using JSON canonical forms: `null`, `true`/`false`, numbers without leading zeros.
7. Date/time fields SHOULD use ISO 8601 strings in UTC (e.g., `2026-08-01T09:17:30Z`) but are treated as strings by canonicalization.

Canonicalization pseudocode (language-agnostic)

- canonical_json_bytes = UTF8(serialize_json(obj) with rules above)

Example (human-friendly):
Entity object:
{
  "asset_id": "ASSET-210",
  "condition": "Fair",
  "installation_date": "2012-05-01"
}

Canonical JSON bytes (no whitespace, sorted keys):
{"asset_id":"ASSET-210","condition":"Fair","installation_date":"2012-05-01"}


Hashing & chain formula (exact byte concatenation)
- Purpose: compute current_hash from prev_hash and canonical entity representation.

Notation
- prev_hash_bytes: if prev_hash is null, use the ASCII string `""` (zero-length). If prev_hash provided, use lowercase hex ASCII bytes (e.g. `"a3b4..."`) encoded as UTF-8 bytes.
- canonical_entity_bytes: the bytes from deterministic canonical JSON above.
- timestamp_bytes: the ASCII UTF-8 bytes of the ISO 8601 timestamp string used in the ledger entry (e.g., `2026-08-01T09:17:30Z`).
- actor_id_bytes: the ASCII UTF-8 bytes of the actor id (e.g., `USER-INS-01`).

Byte concatenation order (exact):

    data = prev_hash_bytes + canonical_entity_bytes + timestamp_bytes + actor_id_bytes
    current_hash = SHA256(data)  // hex lowercase string representation (64 characters)

Notes
- Use the exact concatenation order above; changing order breaks chain compatibility.
- Use SHA-256 (hex lowercase) for current_hash. The `prev_hash` field stored in each entry is the previous ledger entry's `current_hash` (or empty string if none).


Signature scheme
- Recommend ed25519 for compact proofs and broad library support.
- Signature is computed over the binary representation of `current_hash` (i.e., the raw hex bytes). Implementation choice: sign the ASCII hex string bytes of `current_hash` (UTF-8), or sign the raw 32-bytes binary digest; this spec chooses to sign the ASCII hex string bytes to avoid ambiguity.

    signature = ed25519_sign(private_key, current_hash_ascii_bytes)
    signature_encoding: base64 (URL-safe not required; standard base64 acceptable)

- Public key encoding: base64 (raw 32 bytes for ed25519 public key) and published by GET /api/.../ledger.public_key.

Verification
- To verify an entry:
  1. Recompute canonical_entity_bytes from stored canonical_entity.
  2. Recompute current_hash using prev_hash (as stored) + canonical_entity_bytes + timestamp + actor_id.
  3. Compare recomputed_current_hash == stored current_hash. If mismatch → verification fails.
  4. Decode public_key from base64 → ed25519 public key bytes; decode signature from base64.
  5. Verify signature over recomputed_current_hash ascii bytes using ed25519 verify function.


Examples (worked example)
- Entity (compact for example):
{
  "id": "EVID-0099",
  "parent_type": "inspection",
  "parent_id": "INSP-1001",
  "filename": "culvert_block_20260801.jpg",
  "gps_lat": -33.0002,
  "gps_lon": 25.7001,
  "timestamp": "2026-08-01T09:17:00Z",
  "uploader_id": "USER-INS-01"
}

Canonical JSON (sorted keys, no whitespace):
{"filename":"culvert_block_20260801.jpg","gps_lat":-33.0002,"gps_lon":25.7001,"id":"EVID-0099","parent_id":"INSP-1001","parent_type":"inspection","timestamp":"2026-08-01T09:17:00Z","uploader_id":"USER-INS-01"}

Assume prev_hash = "" (first entry), timestamp for ledger entry = "2026-08-01T09:17:30Z" and actor_id = "USER-INS-01".

Concatenate bytes (pseudocode):
data = b"" + canonical_json_bytes + b"2026-08-01T09:17:30Z" + b"USER-INS-01"
current_hash = sha256(data) // e.g. "3f9b..." (hex)

Signature (base64) = ed25519_sign(priv_key, current_hash_ascii_bytes)

The ledger entry stored in the DB should look like:
{
  id: "LGR-5001",
  action: "create",
  entity_type: "evidence",
  entity_id: "EVID-0099",
  timestamp: "2026-08-01T09:17:30Z",
  actor_id: "USER-INS-01",
  prev_hash: "",
  current_hash: "<hex sha256>",
  signature: "<base64 sig>",
  canonical_entity: { ... }
}


Developer reference code (language examples included separately)
- See `examples/python/canonicalize_hash_sign.py` and `examples/typescript/canonicalizeHashSign.ts` in this branch for ready-to-run reference code.

Security & operational notes
- DO NOT commit private signing keys into source control.
- For production signing, use a secure key management service (KMS/HSM). Provide example KMS integration docs in docs/KEY_MANAGEMENT.md.
- Demo / test keypairs may be generated and packaged with demo artifacts — mark these clearly as TEST-ONLY and rotate them before any production use.


Next steps for integration
- Backend (srm-core / Frappe): implement the ledger methods referenced above and persist ledger entries with canonical_entity (JSON) and the signature.
- Frontend: Audit Trail Viewer should fetch the ledger chain via `get_chain` and perform client-side verification using `public_key`.
- Import tooling: import scripts must either trigger ledger creation on each imported create/update or create ledger entries post-import using `create_entry`.


Contact / review
- This spec must be reviewed and approved by the TrustLedger security lead and the srm-core backend engineer before it is merged to main.  
- Human approval checkpoints: canonicalization rules (critical) and production signing key approach (KMS choice).
