# Ledger API examples and tests

Publish-ready spec: [`docs/LEDGER_API.md`](LEDGER_API.md).

This tree (branch `ledger/spec`) includes:

| Path | Role |
|------|------|
| `docs/LEDGER_API.md` | Endpoints, byte-level canonicalization, hash formula, ed25519 |
| `examples/python/canonicalize_hash_sign.py` | Python 3.10+ `canonical_json`, `compute_hash`, `sign_hash_ed25519`, `verify_signature` |
| `examples/typescript/canonicalizeHashSign.ts` | TypeScript equivalents (`canonicalJson`, `computeHash`, `signHashEd25519`, `verifySignature`) |
| `tests/ledger_vectors/test_vectors.json` | Three locked entities + expected canonical JSON + SHA-256 hex |
| `tests/python/test_ledger_vectors.py` | pytest |
| `tests/ts/ledgerVectors.test.ts` | Node assert runner (`npx tsx`) |

Both reference scripts MUST print the same `expected_sha256_hex` values. No private keys are committed. Scripts generate an ephemeral TEST-ONLY keypair at runtime and do not write it to disk.

## Python 3.10+

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install pytest pynacl
python3 examples/python/canonicalize_hash_sign.py
python3 -m pytest tests/python/test_ledger_vectors.py
```

`pynacl` is required for ed25519 sign/verify. Hash/canonical checks run without it but will skip the TEST-ONLY signature fixture.

Expected hashes:

```
vector-1: f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059
vector-2: a8968732a70660bad2f2db7547238c6970d78e5a5cde4adff3c0740b77a25d06
vector-3: e2ffac3e9aa4b466dee47b9e74c61b9bfd6d28e16a0883ec67fc8436a2308ef6
```

The script exits non-zero if a computed hash or canonical string disagrees with `test_vectors.json`.

## TypeScript / Node (Node 19+ for Ed25519 Web Crypto)

```bash
# Node >= 19 (20 LTS / 22 current recommended). tsx runs the example without a local jest config.
npx tsx examples/typescript/canonicalizeHashSign.ts
npx tsx tests/ts/ledgerVectors.test.ts
```

Optional isomorphic ed25519 (browser / older Node):

```bash
npm install @noble/ed25519
# or: npm install tweetnacl
```

The committed TypeScript example uses Node `webcrypto` Ed25519 so hashes and the TEST-ONLY verify fixture run with no extra packages. `@noble/ed25519` / tweetnacl speak the same raw 32-byte public keys and 64-byte signatures.

## What “pass” means

1. Python and TypeScript emit identical `canonical_json` strings for all three entities (including `Café` UTF-8 in vector-2 and nested key sort in vector-3).
2. Both emit the three SHA-256 hex digests above.
3. Both verify `verify_fixture_test_only` (public key + signature for vector-1).
4. `git grep` / review confirms no private keys, PEM seeds, or hex seeds in the tree.

## TEST-ONLY keys

Example scripts print `public_key_base64` and a one-shot signature, then drop the private key. The frozen fixture in `test_vectors.json` is a public key + signature only. Do not use either in production; production signing is KMS/HSM.
