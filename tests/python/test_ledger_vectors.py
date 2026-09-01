"""Acceptance tests for ledger canonicalization and hash vectors."""

from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "examples" / "python"))

from canonicalize_hash_sign import (  # noqa: E402
    HAVE_NACL,
    canonical_json,
    compute_hash,
    verify_signature,
)

VECTORS_PATH = ROOT / "tests" / "ledger_vectors" / "test_vectors.json"


def load_doc() -> dict:
    with VECTORS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def test_three_vectors_locked():
    doc = load_doc()
    assert len(doc["vectors"]) == 3
    for v in doc["vectors"]:
        assert canonical_json(v["entity"]) == v["canonical_json"]
        got = compute_hash(
            v.get("prev_hash"),
            v["entity"],
            v["ledger_timestamp"],
            v["actor_id"],
        )
        assert got == v["expected_sha256_hex"]
        assert len(got) == 64


def test_null_and_empty_prev_hash_are_equivalent():
    doc = load_doc()
    v1 = doc["vectors"][0]
    a = compute_hash(None, v1["entity"], v1["ledger_timestamp"], v1["actor_id"])
    b = compute_hash("", v1["entity"], v1["ledger_timestamp"], v1["actor_id"])
    assert a == b == v1["expected_sha256_hex"]


def test_vector3_chains_from_vector1():
    doc = load_doc()
    v1, v3 = doc["vectors"][0], doc["vectors"][2]
    assert v3["prev_hash"] == v1["expected_sha256_hex"]


def test_verify_fixture_test_only():
    if not HAVE_NACL:
        return
    doc = load_doc()
    fixture = doc["verify_fixture_test_only"]
    v1 = next(v for v in doc["vectors"] if v["id"] == fixture["vector_id"])
    pk = base64.b64decode(fixture["public_key_base64"])
    assert verify_signature(pk, fixture["signature_base64"], v1["expected_sha256_hex"])
    assert not verify_signature(pk, fixture["signature_base64"], "0" * 64)
