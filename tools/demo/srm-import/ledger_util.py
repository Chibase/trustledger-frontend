"""Ledger hash + ed25519 helpers (docs/LEDGER_API.md). TEST-ONLY signing."""

from __future__ import annotations

import base64
import hashlib
import json
from typing import Any

try:
    from nacl.signing import SigningKey, VerifyKey

    HAVE_NACL = True
except ImportError:  # pragma: no cover
    HAVE_NACL = False


def canonical_json(obj: Any) -> str:
    return json.dumps(obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False)


def compute_hash(
    prev_hash: str | None,
    entity: Any,
    timestamp: str,
    actor_id: str,
) -> str:
    prev = b"" if prev_hash in (None, "") else str(prev_hash).encode("utf-8")
    data = (
        prev
        + canonical_json(entity).encode("utf-8")
        + timestamp.encode("utf-8")
        + actor_id.encode("utf-8")
    )
    return hashlib.sha256(data).hexdigest()


def sign_hash_ed25519(private_key_bytes: bytes, current_hash_hex: str) -> str:
    if not HAVE_NACL:
        raise RuntimeError("PyNaCl required (pip install pynacl)")
    sk = SigningKey(private_key_bytes)
    sig = sk.sign(current_hash_hex.encode("utf-8")).signature
    return base64.b64encode(sig).decode("ascii")


def verify_signature(
    public_key_bytes: bytes,
    signature_b64: str,
    current_hash_hex: str,
) -> bool:
    if not HAVE_NACL:
        raise RuntimeError("PyNaCl required (pip install pynacl)")
    vk = VerifyKey(public_key_bytes)
    try:
        vk.verify(
            current_hash_hex.encode("utf-8"),
            base64.b64decode(signature_b64),
        )
        return True
    except Exception:
        return False


def keypair_from_test_seed() -> tuple[bytes, bytes]:
    """Deterministic TEST-ONLY keypair. Never use in production."""
    if not HAVE_NACL:
        raise RuntimeError("PyNaCl required (pip install pynacl)")
    seed = hashlib.sha256(b"TrustLedger TEST-KEYPAIR-DO-NOT-USE-IN-PROD v1").digest()
    sk = SigningKey(seed)
    return sk.encode(), sk.verify_key.encode()
