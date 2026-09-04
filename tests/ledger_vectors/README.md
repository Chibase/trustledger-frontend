# Ledger canonicalization test vectors

Locked cross-language fixtures for TrustLedger’s ledger hash chain. Spec: [`docs/LEDGER_API.md`](../../docs/LEDGER_API.md).

| File | Role |
|------|------|
| `test_vectors.json` | Six entities: `entity`, `canonical_json`, `prev_hash` (JSON `null` or hex), `timestamp`, `actor_id`, `expected_hash_hex` |
| `tests/test_ledger_vectors.py` | pytest — Python 3.10 reference (`examples/python/canonicalize_hash_sign.py`) |
| `tests/ledgerVectors.test.ts` | Jest — TypeScript reference (`examples/typescript/canonicalizeHashSign.ts`) |

Hash formula (locale-independent):

```text
data = prev_hash_bytes + utf8(canonical_json) + utf8(timestamp) + utf8(actor_id)
expected_hash_hex = lowercase hex(SHA-256(data))
```

`prev_hash` JSON `null` and `""` both mean zero-length `prev_hash_bytes`. Canonical JSON is Python 3.10 `json.dumps(..., separators=(',', ':'), sort_keys=True, ensure_ascii=False)`.

Human review: domain correctness of the six sample entities before merge.

## Python (pytest)

```bash
pip install pytest
python3 -m pytest tests/test_ledger_vectors.py
```

Optional (ed25519 demo, not required for these hash tests):

```bash
pip install pynacl
python3 examples/python/canonicalize_hash_sign.py
```

## TypeScript (Jest)

```bash
npm install   # installs jest + ts-jest from package.json
npx jest --config jest.ledger.config.cjs
```

Equivalent npm script:

```bash
npm run test:ledger
```

The Jest config **only** collects `tests/ledgerVectors.test.ts` so Storybook/UI scaffolds are not run.

## What “pass” means

Both suites must assert `compute_hash(...) == expected_hash_hex` and `canonical_json(entity) == canonical_json` for all six vectors. Python and TypeScript must emit the same hex (see `test_vectors.json`). Output must not change with `LC_*` / `TZ`.
