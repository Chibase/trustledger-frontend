# Ledger / Audit Trail API

**Status:** draft for human review — do not merge until canonicalization, signature scheme, and production key custody are approved.

This document is the implementation contract for TrustLedger’s ledger (audit trail). Frontend, `srm-core` on TrustLedger Cloud (`https://app.trustledgersrm.co.za`), and import tooling MUST produce identical canonical bytes, SHA-256 hex, and ed25519 signatures for the same inputs.

Reference code (no private keys in git):

- Python 3.10+: `examples/python/canonicalize_hash_sign.py`
- TypeScript / Node: `examples/typescript/canonicalizeHashSign.ts`
- Acceptance vectors: `tests/ledger_vectors/test_vectors.json`
- How to run: `docs/LEDGER_API_EXAMPLES_README.md`

---

## 1. Purpose

The ledger is an append-only hash chain over attested snapshots of SRM entities (incidents, evidence, inspections, assets, work orders, and similar). Each entry:

1. Canonicalizes the attested entity JSON to a unique UTF-8 byte string.
2. Mixes that with the previous entry’s hash, the ledger timestamp, and the actor id.
3. Stores `SHA-256` of those bytes as `current_hash` (lowercase hex).
4. Signs the ASCII hex of `current_hash` with ed25519 so a verifier can detect tampering without the private key.

This is chain-of-custody evidence, not a general-purpose blockchain. Production signing MUST use KMS/HSM. Demo/test keypairs in the reference scripts are **TEST-ONLY** and MUST NOT be used in production.

---

## 2. Transport

| Item | Value |
|------|--------|
| Host | `https://app.trustledgersrm.co.za` (`NEXT_PUBLIC_API_BASE_URL`) |
| Envelope | Frappe `{ "message": <payload> }` |
| Auth | Session cookie / `credentials: include` (same as other Cloud methods) |
| Content-Type | `application/json` for POST bodies |

Error shape (all methods):

```json
{
  "exc_type": "ValidationError",
  "exception": "ValidationError: missing entity_id",
  "_server_messages": "[\"missing entity_id\"]",
  "message": {
    "ok": false,
    "error": "missing_entity_id",
    "reason": "entity_id is required"
  }
}
```

Clients SHOULD read `message.ok` / `message.reason` when present.

---

## 3. Endpoints

### 3.1 `POST /api/method/srm_core.api.ledger.create_entry`

Create one ledger entry. The server MUST recompute `current_hash` from the rules in §5. If `signature` is omitted, the server signs with the active KMS key. If `signature` is supplied, the server MUST verify it against the published public key before persisting.

**Request**

```json
{
  "entity_type": "evidence",
  "entity_id": "EVID-0099",
  "action": "create",
  "timestamp": "2026-08-01T09:17:30Z",
  "actor_id": "USER-INS-01",
  "canonical_entity": {
    "filename": "culvert_block_20260801.jpg",
    "gps_lat": -33.0002,
    "gps_lon": 25.7001,
    "id": "EVID-0099",
    "parent_id": "INSP-1001",
    "parent_type": "inspection",
    "timestamp": "2026-08-01T09:17:00Z",
    "uploader_id": "USER-INS-01"
  },
  "prev_hash": null,
  "signature": null
}
```

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `entity_type` | string | yes | `inspection` \| `incident` \| `evidence` \| `asset` \| `work_order` \| … |
| `entity_id` | string | yes | Stable business id |
| `action` | string | yes | `create` \| `update` \| `approve` \| `assign` \| `close` |
| `timestamp` | string | yes | ISO 8601 UTC, e.g. `2026-08-01T09:17:30Z`. This is the **ledger** timestamp mixed into the hash, not necessarily a field inside `canonical_entity`. |
| `actor_id` | string | yes | User / service account id mixed into the hash |
| `canonical_entity` | object | yes | Attested snapshot. Server canonicalizes this object; it MUST NOT hash a pre-serialized string supplied by the client. |
| `prev_hash` | string \| null | no | Previous `current_hash` (64 lowercase hex) or `null` / omitted / `""` for genesis |
| `signature` | string \| null | no | Standard Base64 ed25519 signature. Omit to have the server sign. |

**Response** `{ "message": … }`

```json
{
  "message": {
    "ok": true,
    "ledger_id": "LGR-5001",
    "entity_id": "EVID-0099",
    "prev_hash": "",
    "current_hash": "f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059",
    "signature": "oqw3ddGMvAsw8D3LsoqqVU3izSlW7RgBWgisEzTShX86Qbyp/Q+vaUndwthPktrhdi5FJvR8Vm6cbQgJqUsJCw==",
    "kid": "demo-2026-08"
  }
}
```

The `signature` value above is the **TEST-ONLY** fixture from `tests/ledger_vectors/test_vectors.json` (`verify_fixture_test_only`). Production signatures will differ.

---

### 3.2 `GET /api/method/srm_core.api.ledger.get_chain?entity_id=<id>`

Return the ordered chain for one entity (oldest first).

**Request:** query string `entity_id` (required). Example: `/api/method/srm_core.api.ledger.get_chain?entity_id=EVID-0099`

Frappe also accepts `POST` with `{ "entity_id": "EVID-0099" }`. Implementations MUST support the GET form above.

**Response** `{ "message": … }`

```json
{
  "message": {
    "ok": true,
    "entity_id": "EVID-0099",
    "entries": [
      {
        "id": "LGR-5001",
        "entity_type": "evidence",
        "entity_id": "EVID-0099",
        "action": "create",
        "timestamp": "2026-08-01T09:17:30Z",
        "actor_id": "USER-INS-01",
        "prev_hash": "",
        "current_hash": "f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059",
        "signature": "oqw3ddGMvAsw8D3LsoqqVU3izSlW7RgBWgisEzTShX86Qbyp/Q+vaUndwthPktrhdi5FJvR8Vm6cbQgJqUsJCw==",
        "kid": "demo-2026-08",
        "canonical_entity": {
          "filename": "culvert_block_20260801.jpg",
          "gps_lat": -33.0002,
          "gps_lon": 25.7001,
          "id": "EVID-0099",
          "parent_id": "INSP-1001",
          "parent_type": "inspection",
          "timestamp": "2026-08-01T09:17:00Z",
          "uploader_id": "USER-INS-01"
        }
      }
    ]
  }
}
```

`LedgerEntry` fields: `id`, `entity_type`, `entity_id`, `action`, `timestamp`, `actor_id`, `prev_hash`, `current_hash`, `signature`, `kid` (optional), `canonical_entity`.

---

### 3.3 `POST /api/method/srm_core.api.ledger.verify_entry`

Server-side verify: recompute `current_hash` and check the ed25519 signature.

**Request**

```json
{
  "ledger_id": "LGR-5001"
}
```

Optional alternate: `{ "entity_id": "EVID-0099", "current_hash": "<hex>" }` to select one link without `ledger_id`.

**Response** `{ "message": … }`

```json
{
  "message": {
    "ok": true,
    "ledger_id": "LGR-5001",
    "verified": true,
    "hash_match": true,
    "signature_valid": true,
    "reason": null
  }
}
```

On failure: `verified: false` and `reason` one of `hash_mismatch` | `bad_signature` | `missing_public_key` | `entry_not_found`.

---

### 3.4 `GET /api/method/srm_core.api.ledger.public_key`

Publish the current verification key. No private key material.

**Request:** none (optional `?kid=` to select a historical key).

**Response** `{ "message": … }`

```json
{
  "message": {
    "ok": true,
    "kid": "demo-2026-08",
    "algorithm": "ed25519",
    "encoding": "base64",
    "public_key": "ktdnmKwz9NE9/9D8PAwjzPhRZLN3ZjTMnChUZ58Hy1c=",
    "created_at": "2026-08-01T00:00:00Z"
  }
}
```

| Field | Rule |
|-------|------|
| `algorithm` | Always `ed25519` for this spec version |
| `encoding` | `base64` (default) = standard Base64 of **32 raw public-key bytes**. `hex` = 64 lowercase hex chars of the same 32 bytes |
| `public_key` | Public key only. Never a seed, PKCS8 blob, or PEM private key |

The `public_key` value above is TEST-ONLY (`verify_fixture_test_only` in the vector file).

---

## 4. Deterministic canonical JSON (byte-level)

`canonical_entity` is an in-memory JSON value (object / array / string / number / boolean / null). Implementations MUST serialize it to UTF-8 bytes using **exactly** these rules. The Python 3.10 reference is:

```python
json.dumps(obj, separators=(',', ':'), sort_keys=True, ensure_ascii=False).encode('utf-8')
```

| # | Rule | Exact requirement |
|---|------|-------------------|
| 1 | Encoding | UTF-8. No BOM. |
| 2 | Key order | Object keys sorted lexicographically by Unicode code point of the raw key string. Sort **every** nested object. |
| 3 | Separators | `separators=(',', ':')` — comma and colon, **no** spaces, **no** newlines, **no** trailing commas. |
| 4 | `ensure_ascii` | `false`. Non-ASCII (e.g. `é`) is emitted as UTF-8, not `\u00e9`. |
| 5 | Arrays | Preserve element order. Do not sort array elements. Recursively canonicalize each element. |
| 6 | Strings | JSON string encoding: escape `"`, `\`, and U+0000–U+001F. Do not extra-escape `/`. Do not NFC/NFD-normalize. |
| 7 | Null / bool | `null`, `true`, `false` (lowercase). |
| 8 | Integers | No leading zeros, no decimal point (`88` not `88.0`). |
| 9 | Floats | Match Python 3.10 `json.dumps` / `repr` of an IEEE-754 binary64 value (e.g. `-33.0002`). Do not use locale decimal commas. Prefer integers in attested payloads when possible. |
| 10 | Dates | ISO 8601 UTC strings (e.g. `2026-08-01T09:17:30Z`). Canonicalization treats them as ordinary strings. |
| 11 | Forbidden | `NaN`, `Infinity`, `-Infinity`, undefined, functions, comments, `__proto__` tricks. |

TypeScript MUST recursively sort keys and then `JSON.stringify` the result (default stringify already uses `separators=(',', ':')` equivalent: no extra whitespace). Do not pass a `space` argument.

**Interop traps (do not ignore):**

- Do **not** hash a pretty-printed JSON string.
- Do **not** sort keys only at the top level.
- Avoid U+2028 / U+2029 in attested strings (some JS engines escape them; Python `ensure_ascii=False` does not). Vectors in this spec do not use those characters.
- `prev_hash` is **not** part of `canonical_entity`. It is mixed in at hash time only.

Example object:

```json
{
  "asset_id": "ASSET-210",
  "condition": "Fair",
  "installation_date": "2012-05-01"
}
```

Canonical JSON **string** (this is also the UTF-8 byte sequence):

```text
{"asset_id":"ASSET-210","condition":"Fair","installation_date":"2012-05-01"}
```

---

## 5. Hash formula (exact byte concatenation)

```text
prev_hash_bytes        = UTF-8(prev_hash_ascii)   if prev_hash is a non-empty string
                       = empty byte string         if prev_hash is null, omitted, or ""
canonical_entity_bytes = UTF-8(canonical_json(canonical_entity))
timestamp_bytes        = UTF-8(ledger timestamp string)
actor_id_bytes         = UTF-8(actor_id string)

data          = prev_hash_bytes + canonical_entity_bytes + timestamp_bytes + actor_id_bytes
current_hash  = lowercase hex( SHA-256(data) )     # 64 ASCII hex characters
```

`+` is byte concatenation. Order is **mandatory**. Changing order breaks every chain.

### 5.1 `null` / empty `prev_hash`

| Stored `prev_hash` | `prev_hash_bytes` |
|--------------------|-------------------|
| `null` | `b""` (length 0) |
| omitted | `b""` |
| `""` | `b""` |
| 64-char lowercase hex | those 64 ASCII characters as UTF-8 (64 bytes), **not** decoded to 32 raw digest bytes |

Genesis entries MUST use empty `prev_hash_bytes`. Subsequent entries MUST set `prev_hash` to the previous entry’s `current_hash` hex string.

### 5.2 Worked vector 1 (genesis)

Entity:

```json
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
```

Canonical JSON:

```text
{"filename":"culvert_block_20260801.jpg","gps_lat":-33.0002,"gps_lon":25.7001,"id":"EVID-0099","parent_id":"INSP-1001","parent_type":"inspection","timestamp":"2026-08-01T09:17:00Z","uploader_id":"USER-INS-01"}
```

Ledger inputs: `prev_hash = null`, `timestamp = 2026-08-01T09:17:30Z`, `actor_id = USER-INS-01`.

```text
data = b"" + canonical_entity_bytes + b"2026-08-01T09:17:30Z" + b"USER-INS-01"
current_hash = f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059
```

Python 3.10 `json.dumps` + `hashlib.sha256` and the TypeScript reference **must** both emit that hex. This is the acceptance lock.

---

## 6. Signature scheme (ed25519)

**Locked choice (breaking if changed):** sign the **UTF-8 bytes of the 64-character lowercase hex string** `current_hash`, not the raw 32-byte digest.

```text
message            = UTF-8(current_hash_hex)          # 64 bytes, ASCII
signature_raw      = ed25519_sign(private_key, message)   # 64 bytes
signature          = standard Base64(signature_raw)       # not URL-safe; no PEM wrapping
public_key         = standard Base64(raw 32-byte ed25519 public key)
```

| Item | Encoding |
|------|----------|
| Signature on the wire | standard Base64 (RFC 4648 §4), padding `=` as required |
| Public key on the wire | standard Base64 of 32 raw bytes (`encoding: "base64"`) or lowercase hex (`encoding: "hex"`) |
| Private key | **never** on the wire, **never** in git. KMS/HSM in production. Ephemeral TEST-ONLY in example scripts. |

### 6.1 TEST-ONLY verify fixture (vector 1)

Private key was generated ephemerally and is **not** in this repository.

| Item | Value |
|------|--------|
| `current_hash` | `f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059` |
| `public_key` (Base64) | `ktdnmKwz9NE9/9D8PAwjzPhRZLN3ZjTMnChUZ58Hy1c=` |
| `signature` (Base64) | `oqw3ddGMvAsw8D3LsoqqVU3izSlW7RgBWgisEzTShX86Qbyp/Q+vaUndwthPktrhdi5FJvR8Vm6cbQgJqUsJCw==` |

Verifiers (PyNaCl and Node Web Crypto Ed25519) MUST return true for this triple. Treat the key as TEST-ONLY; rotate before any production use.

### 6.2 Verify an entry

1. Canonicalize stored `canonical_entity` → bytes (§4).
2. Recompute `current_hash` from stored `prev_hash`, timestamp, `actor_id` (§5).
3. If recomputed hex ≠ stored `current_hash` → fail (`hash_mismatch`).
4. Decode `public_key` (Base64 → 32 bytes) from `public_key` endpoint (`kid` if present).
5. Decode `signature` (Base64 → 64 bytes).
6. `ed25519_verify(public_key, signature, UTF-8(recomputed_hex))`. Fail → `bad_signature`.

---

## 7. Example create round-trip (vector 1)

**Canonical JSON** — see §5.2.

**Computed hash hex:** `f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059`

**Base64 signature (TEST-ONLY):** `oqw3ddGMvAsw8D3LsoqqVU3izSlW7RgBWgisEzTShX86Qbyp/Q+vaUndwthPktrhdi5FJvR8Vm6cbQgJqUsJCw==`

Stored row:

```json
{
  "id": "LGR-5001",
  "action": "create",
  "entity_type": "evidence",
  "entity_id": "EVID-0099",
  "timestamp": "2026-08-01T09:17:30Z",
  "actor_id": "USER-INS-01",
  "prev_hash": "",
  "current_hash": "f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059",
  "signature": "oqw3ddGMvAsw8D3LsoqqVU3izSlW7RgBWgisEzTShX86Qbyp/Q+vaUndwthPktrhdi5FJvR8Vm6cbQgJqUsJCw==",
  "canonical_entity": {
    "filename": "culvert_block_20260801.jpg",
    "gps_lat": -33.0002,
    "gps_lon": 25.7001,
    "id": "EVID-0099",
    "parent_id": "INSP-1001",
    "parent_type": "inspection",
    "timestamp": "2026-08-01T09:17:00Z",
    "uploader_id": "USER-INS-01"
  }
}
```

Vectors 2–6 (unicode, nested objects, booleans/nulls, arrays of objects, chained `prev_hash`) live in `tests/ledger_vectors/test_vectors.json`.

---

## 8. Security and operations

- Do not commit private signing keys, PKCS8 PEMs, or hex seeds.
- Production: KMS/HSM; publish only `kid` + public key via `public_key`. See `docs/KEY_MANAGEMENT.md`.
- Demo/test keypairs from the example scripts: print public key, sign once, discard private key. Mark TEST-ONLY.
- `srm-core` MUST persist `canonical_entity` as structured JSON (not a display string) so verifiers can re-canonicalize.

---

## 9. Human approval (required before merge to `master`)

- [ ] Canonicalization rules and concatenation order (§4–§5) approved.
- [ ] Sign ASCII-hex of `current_hash` (not raw 32-byte digest) approved — this is breaking.
- [ ] Signature and public key encoding = standard Base64 approved.
- [ ] Production signing = KMS/HSM; TEST-ONLY fixture not used live.
- [ ] `srm-core` confirms method names and field schemas.
- [ ] Python and TypeScript scripts produce the three expected SHA-256 hex values.
- [ ] No private keys in the repository.

---

## 10. Implementation pointers

| Role | Action |
|------|--------|
| Cloud backend | Implement the four methods; persist entries; sign with KMS |
| Frontend | Fetch `get_chain` + `public_key`; recompute hash; verify signature |
| Import tooling | Call `create_entry` per imported create/update (or batch after import) |
| Reviewers | Run `docs/LEDGER_API_EXAMPLES_README.md` before merge |
