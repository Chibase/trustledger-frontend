Ledger API Spec examples and tests

This branch ledger/spec includes:

- docs/LEDGER_API.md: canonicalization rules, hash formula and ledger endpoints
- examples/python/canonicalize_hash_sign.py: python reference implementation for canonicalization, hashing and ed25519 signing (demo only)
- examples/typescript/canonicalizeHashSign.ts: TypeScript reference implementation for canonicalization and hashing
- tests/ledger_vectors/test_vectors.json: sample input vectors
- tests/python/test_ledger_vectors.py: pytest that verifies hash determinism
- tests/ts/ledgerVectors.test.ts: jest test verifying TS hash determinism

How to run the Python example and tests

1. Create a virtualenv and install dependencies (PyNaCl optional):

    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install pytest
    pip install pynacl  # optional, required only for signing examples

2. Run the example script:

    python3 examples/python/canonicalize_hash_sign.py

3. Run pytest:

    pytest tests/python/test_ledger_vectors.py

How to run the TypeScript example and tests

1. Ensure node (>=16) and npm are installed.
2. Install dependencies (for running TS example or jest):

    npm init -y
    npm install --save-dev ts-node typescript jest @types/jest

3. To run the TypeScript example (no signing):

    npx ts-node examples/typescript/canonicalizeHashSign.ts

4. To run the jest tests (configure jest or use npx jest):

    npx jest tests/ts/ledgerVectors.test.ts --config

Notes
- The signing examples require ed25519 libs (PyNaCl for Python, @noble/ed25519 or tweetnacl in Node). These are optional for hashing/determinism tests.
- The canonicalization implemented in the TS example includes a simple recursive key sort; if you have a production canonicalizer, prefer that. The Python implementation uses json.dumps sort_keys=True which handles nested objects deterministically.
- No private keys are committed. The example scripts will generate ephemeral test keypairs when run with signing libraries available.
