#!/usr/bin/env python3
"""
Reference implementation: canonical JSON -> SHA256 chain hash -> ed25519 sign/verify (demo/test only)

Usage:
  pip install pynacl
  python3 examples/python/canonicalize_hash_sign.py

This script provides:
- canonical_json_bytes(obj)
- compute_current_hash(prev_hash, canonical_entity_bytes, timestamp, actor_id)
- sign_current_hash(private_key_bytes, current_hash_hex) -> base64 signature
- verify_signature(public_key_bytes, signature_b64, current_hash_hex) -> bool

Note: In production use a KMS/HSM for signing. This script generates an ephemeral test keypair if libs are available.
"""

import json
import hashlib
import base64
from typing import Any

try:
    from nacl.signing import SigningKey, VerifyKey
    from nacl.exceptions import BadSignatureError
    HAVE_NACL = True
except Exception:
    HAVE_NACL = False


def canonical_json_bytes(obj: Any) -> bytes:
    """Deterministic canonical JSON bytes as defined in LEDGER_API.md"""
    return json.dumps(obj, separators=(',', ':'), sort_keys=True, ensure_ascii=False).encode('utf-8')


def compute_current_hash(prev_hash: str, canonical_entity_bytes: bytes, timestamp: str, actor_id: str) -> str:
    """Compute SHA256 hex of prev_hash_bytes + canonical_entity_bytes + timestamp_bytes + actor_id_bytes"""
    prev = (prev_hash or '').encode('utf-8')
    data = prev + canonical_entity_bytes + timestamp.encode('utf-8') + actor_id.encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def sign_current_hash_ed25519(private_key_bytes: bytes, current_hash_hex: str) -> str:
    """Sign the ASCII hex bytes of current_hash using ed25519 and return base64 signature"""
    if not HAVE_NACL:
        raise RuntimeError('PyNaCl required for signing (pip install pynacl)')
    sk = SigningKey(private_key_bytes)
    sig = sk.sign(current_hash_hex.encode('utf-8')).signature
    return base64.b64encode(sig).decode('ascii')


def verify_signature_ed25519(public_key_bytes: bytes, signature_b64: str, current_hash_hex: str) -> bool:
    if not HAVE_NACL:
        raise RuntimeError('PyNaCl required for verification (pip install pynacl)')
    vk = VerifyKey(public_key_bytes)
    sig = base64.b64decode(signature_b64)
    try:
        vk.verify(current_hash_hex.encode('utf-8'), sig)
        return True
    except Exception:
        return False


def generate_test_keypair():
    if not HAVE_NACL:
        raise RuntimeError('PyNaCl required to generate test keypair (pip install pynacl)')
    sk = SigningKey.generate()
    pk = sk.verify_key
    return sk.encode(), pk.encode()


if __name__ == '__main__':
    import pathlib
    root = pathlib.Path(__file__).resolve().parents[2]
    vectors_path = root / 'tests' / 'ledger_vectors' / 'test_vectors.json'
    try:
        with open(vectors_path, 'r', encoding='utf-8') as f:
            vectors = json.load(f)
    except FileNotFoundError:
        print('No test_vectors.json found at', vectors_path)
        vectors = []

    print('Computing hashes for', len(vectors), 'vectors')
    for i, v in enumerate(vectors, start=1):
        canonical = canonical_json_bytes(v['entity'])
        h = compute_current_hash(v.get('prev_hash', ''), canonical, v['ledger_timestamp'], v['actor_id'])
        print(f"VECTOR {i}: id={v['entity'].get('id')} hash={h}")

    if HAVE_NACL and vectors:
        sk_bytes, pk_bytes = generate_test_keypair()
        print('\nGenerated test ed25519 keypair (TEST-ONLY)')
        print('public key (base64):', base64.b64encode(pk_bytes).decode('ascii'))
        # demonstrate signing first vector
        first = vectors[0]
        first_hash = compute_current_hash(first.get('prev_hash', ''), canonical_json_bytes(first['entity']), first['ledger_timestamp'], first['actor_id'])
        sig = sign_current_hash_ed25519(sk_bytes, first_hash)
        print('example signature (base64) for first vector:', sig)
        ok = verify_signature_ed25519(pk_bytes, sig, first_hash)
        print('verification ok?', ok)
