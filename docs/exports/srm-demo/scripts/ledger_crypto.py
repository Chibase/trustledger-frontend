#!/usr/bin/env python3
"""Ledger hash chaining and Ed25519 signatures for the TrustLedger SRM demo pack.

Canonical entity representation
-------------------------------
canonical_entity_representation is UTF-8 JSON with:
  * sorted object keys
  * compact separators (',' ':')
  * no insignificant whitespace
  * ensure_ascii=False (Unicode preserved)

This is RFC 8785-adjacent (sorted keys, compact) but not full JCS
(no number normalisation). All demo entities are strings/ints/floats
already in stable form.

Hash
----
current_hash = "sha256:" + hex(SHA256(prev_hash + canonical + timestamp + actor_id))

Genesis prev_hash is stored as "NULL" and treated as 64 zero hex chars
("0" * 64) when hashing.

Signature
---------
Ed25519 over UTF-8 bytes of current_hash. Stored as "sig:" + base64.
Test keypair only — replace before any production use.
"""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
from typing import Any, Mapping

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

GENESIS_PREV = "NULL"
GENESIS_MATERIAL = "0" * 64
HASH_PREFIX = "sha256:"
SIG_PREFIX = "sig:"


def canonical_dumps(obj: Any) -> str:
    """Deterministic JSON used as canonical_entity_representation."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def materialise_prev(prev_hash: str | None) -> str:
    if not prev_hash or prev_hash == GENESIS_PREV:
        return GENESIS_MATERIAL
    return prev_hash


def compute_current_hash(
    prev_hash: str | None,
    canonical_entity_representation: str,
    timestamp: str,
    actor_id: str,
) -> str:
    prev = materialise_prev(prev_hash)
    material = f"{prev}{canonical_entity_representation}{timestamp}{actor_id}".encode(
        "utf-8"
    )
    return HASH_PREFIX + hashlib.sha256(material).hexdigest()


def sign_hash(private_key: Ed25519PrivateKey, current_hash: str) -> str:
    sig = private_key.sign(current_hash.encode("utf-8"))
    return SIG_PREFIX + base64.b64encode(sig).decode("ascii")


def verify_signature(
    public_key: Ed25519PublicKey, current_hash: str, signature: str
) -> bool:
    raw = signature[len(SIG_PREFIX) :] if signature.startswith(SIG_PREFIX) else signature
    try:
        public_key.verify(base64.b64decode(raw), current_hash.encode("utf-8"))
        return True
    except Exception:
        return False


def entity_representation(row: Mapping[str, Any], exclude: tuple[str, ...] = ()) -> str:
    payload = {k: v for k, v in row.items() if k not in exclude}
    return canonical_dumps(payload)


def generate_keypair() -> Ed25519PrivateKey:
    return Ed25519PrivateKey.generate()


def save_keypair(private_key: Ed25519PrivateKey, keys_dir: Path) -> None:
    keys_dir.mkdir(parents=True, exist_ok=True)
    (keys_dir / "ledger_ed25519_private.pem").write_bytes(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    (keys_dir / "ledger_ed25519_public.pem").write_bytes(
        private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    (keys_dir / "README.md").write_text(
        "# Test keypair — not for production\n\n"
        "These Ed25519 keys sign **synthetic** demo ledger entries only.\n"
        "Replace with a hardware-backed or organisation-controlled key before any "
        "production TrustLedger Cloud workspace uses ledger signatures.\n\n"
        "- Private: `ledger_ed25519_private.pem` (local signing / import script)\n"
        "- Public: `ledger_ed25519_public.pem` (verification in Audit Trail Viewer)\n",
        encoding="utf-8",
    )


def load_private_key(path: Path) -> Ed25519PrivateKey:
    data = path.read_bytes()
    key = serialization.load_pem_private_key(data, password=None)
    if not isinstance(key, Ed25519PrivateKey):
        raise TypeError(f"Expected Ed25519 private key at {path}")
    return key


def load_public_key(path: Path) -> Ed25519PublicKey:
    data = path.read_bytes()
    key = serialization.load_pem_public_key(data)
    if not isinstance(key, Ed25519PublicKey):
        raise TypeError(f"Expected Ed25519 public key at {path}")
    return key


def load_or_create_keypair(keys_dir: Path) -> Ed25519PrivateKey:
    priv_path = keys_dir / "ledger_ed25519_private.pem"
    if priv_path.exists():
        return load_private_key(priv_path)
    key = generate_keypair()
    save_keypair(key, keys_dir)
    return key
