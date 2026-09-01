#!/usr/bin/env python3
"""Ledger canonical JSON + SHA-256 chain hash + ed25519 sign/verify.

Python 3.10+ reference for docs/LEDGER_API.md.

    pip install pynacl
    python3 examples/python/canonicalize_hash_sign.py

Functions:
    canonical_json(obj) -> str
    compute_hash(prev_hash, entity, timestamp, actor_id) -> hex
    sign_hash_ed25519(private_key_bytes, current_hash_hex) -> base64
    verify_signature(public_key_bytes, signature_b64, current_hash_hex) -> bool

TEST-ONLY: when run as a script this generates an ephemeral ed25519 keypair,
prints the public key, signs vector-1, verifies, and discards the private key.
No private keys are written to disk.
"""

from __future__ import annotations

import base64
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

try:
    from nacl.signing import SigningKey, VerifyKey

    HAVE_NACL = True
except ImportError:  # pragma: no cover
    HAVE_NACL = False

ROOT = Path(__file__).resolve().parents[2]
VECTORS_PATH = ROOT / "tests" / "ledger_vectors" / "test_vectors.json"


def canonical_json(obj: Any) -> str:
    """Deterministic JSON string (UTF-8 code units; no extra whitespace)."""
    return json.dumps(obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False)


def compute_hash(
    prev_hash: str | None,
    entity: Any,
    timestamp: str,
    actor_id: str,
) -> str:
    """SHA-256 hex of prev_hash_bytes + canonical_entity_bytes + timestamp + actor_id."""
    prev = b"" if prev_hash in (None, "") else str(prev_hash).encode("utf-8")
    data = (
        prev
        + canonical_json(entity).encode("utf-8")
        + timestamp.encode("utf-8")
        + actor_id.encode("utf-8")
    )
    return hashlib.sha256(data).hexdigest()


def sign_hash_ed25519(private_key_bytes: bytes, current_hash_hex: str) -> str:
    """Sign UTF-8 ASCII hex of current_hash. Returns standard Base64."""
    if not HAVE_NACL:
        raise RuntimeError("PyNaCl required for signing (pip install pynacl)")
    sk = SigningKey(private_key_bytes)
    sig = sk.sign(current_hash_hex.encode("utf-8")).signature
    return base64.b64encode(sig).decode("ascii")


def verify_signature(
    public_key_bytes: bytes,
    signature_b64: str,
    current_hash_hex: str,
) -> bool:
    if not HAVE_NACL:
        raise RuntimeError("PyNaCl required for verification (pip install pynacl)")
    vk = VerifyKey(public_key_bytes)
    try:
        vk.verify(current_hash_hex.encode("utf-8"), base64.b64decode(signature_b64))
        return True
    except Exception:
        return False


def generate_test_keypair() -> tuple[bytes, bytes]:
    """Return (private_32, public_32). TEST-ONLY. Do not persist."""
    if not HAVE_NACL:
        raise RuntimeError("PyNaCl required to generate a test keypair (pip install pynacl)")
    sk = SigningKey.generate()
    return sk.encode(), sk.verify_key.encode()


def load_vectors() -> dict[str, Any]:
    with VECTORS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def check_vectors(doc: dict[str, Any]) -> int:
    failed = 0
    for v in doc["vectors"]:
        got_canon = canonical_json(v["entity"])
        got_hash = compute_hash(
            v.get("prev_hash"),
            v["entity"],
            v["ledger_timestamp"],
            v["actor_id"],
        )
        print(f"{v['id']}: canonical={got_canon}")
        print(f"{v['id']}: sha256={got_hash}")
        if got_canon != v["canonical_json"]:
            print(f"{v['id']}: FAIL canonical JSON mismatch", file=sys.stderr)
            failed += 1
        if got_hash != v["expected_sha256_hex"]:
            print(f"{v['id']}: FAIL hash mismatch expected {v['expected_sha256_hex']}", file=sys.stderr)
            failed += 1
    return failed


def check_verify_fixture(doc: dict[str, Any]) -> int:
    fixture = doc.get("verify_fixture_test_only") or {}
    if not fixture:
        return 0
    if not HAVE_NACL:
        print("skip TEST-ONLY signature fixture (pip install pynacl)")
        return 0
    vector = next(v for v in doc["vectors"] if v["id"] == fixture["vector_id"])
    current_hash = vector["expected_sha256_hex"]
    pk = base64.b64decode(fixture["public_key_base64"])
    ok = verify_signature(pk, fixture["signature_base64"], current_hash)
    print(f"verify_fixture_test_only ({fixture['vector_id']}): {ok}")
    if not ok:
        print("FAIL TEST-ONLY signature fixture did not verify", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    if not VECTORS_PATH.is_file():
        print("No test_vectors.json at", VECTORS_PATH, file=sys.stderr)
        return 1
    doc = load_vectors()
    failed = check_vectors(doc) + check_verify_fixture(doc)

    if HAVE_NACL:
        sk_bytes, pk_bytes = generate_test_keypair()
        print("\nGenerated ephemeral ed25519 keypair (TEST-ONLY; not saved)")
        print("public_key_base64:", base64.b64encode(pk_bytes).decode("ascii"))
        first = doc["vectors"][0]
        h = compute_hash(
            first.get("prev_hash"),
            first["entity"],
            first["ledger_timestamp"],
            first["actor_id"],
        )
        sig = sign_hash_ed25519(sk_bytes, h)
        print("ephemeral_signature_base64 (vector-1):", sig)
        print("ephemeral_verify_ok:", verify_signature(pk_bytes, sig, h))
        del sk_bytes
    else:
        print("\nPyNaCl not installed — hash checks only (pip install pynacl for sign/verify)")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
