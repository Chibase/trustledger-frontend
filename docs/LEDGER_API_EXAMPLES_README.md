# Ledger API examples and tests

Publish-ready spec: [`docs/LEDGER_API.md`](LEDGER_API.md). Vector README: [`tests/ledger_vectors/README.md`](../tests/ledger_vectors/README.md).

| Path | Role |
|------|------|
| `docs/LEDGER_API.md` | Endpoints, byte-level canonicalization, hash formula, ed25519 |
| `examples/python/canonicalize_hash_sign.py` | Python 3.10+ `canonical_json`, `compute_hash`, `sign_hash_ed25519`, `verify_signature` |
| `examples/typescript/canonicalizeHashSign.ts` | TypeScript equivalents (`canonicalJson`, `computeHash`, `signHashEd25519`, `verifySignature`) |
| `tests/ledger_vectors/test_vectors.json` | Six locked entities + `canonical_json` + `expected_hash_hex` |
| `tests/test_ledger_vectors.py` | pytest |
| `docs/KEY_MANAGEMENT.md` | KMS/HSM, ZIP-only TEST keys, rotation checklist |
| `examples/python/sign_via_kms_example.py` | Mocked AWS/GCP Sign call (key handle only; `TRUSTLEDGER_KMS_MOCK=1`) |

Both reference scripts MUST print the same `expected_hash_hex` values. No private keys are committed. Scripts generate an ephemeral TEST-ONLY keypair at runtime and do not write it to disk.

## Python 3.10+ (pytest)

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install pytest pynacl
python3 examples/python/canonicalize_hash_sign.py
python3 -m pytest tests/test_ledger_vectors.py
```

`pynacl` is required for ed25519 sign/verify. Hash/canonical checks run without it.

## TypeScript / Node (Jest)

```bash
npm install
npm run test:ledger
# or: npx jest --config jest.ledger.config.cjs
npx tsx examples/typescript/canonicalizeHashSign.ts
```

Node 19+ is required for the example script’s Ed25519 Web Crypto demo. Jest hash tests use Node `crypto.createHash` only.

## What “pass” means

1. Python and TypeScript emit identical `canonical_json` for all six entities.
2. Both emit the six SHA-256 hex values in `test_vectors.json`.
3. Tests stay stable across locales (`LC_*`) and `TZ`.
4. No private keys, PEM seeds, or hex seeds in the tree.

Human review of domain correctness is required before merge.
