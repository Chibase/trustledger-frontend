"""Ledger canonicalization + hash vectors (pytest).

Loads tests/ledger_vectors/test_vectors.json and asserts the Python 3.10
reference implementation matches locked canonical_json and expected_hash_hex.

    python3 -m pytest tests/test_ledger_vectors.py
"""

from __future__ import annotations

import json
import locale
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "examples" / "python"))

from canonicalize_hash_sign import (  # noqa: E402
    canonical_json,
    compute_hash,
    vector_expected_hash,
    vector_timestamp,
)

VECTORS_PATH = ROOT / "tests" / "ledger_vectors" / "test_vectors.json"


def load_doc() -> dict:
    with VECTORS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def test_six_vectors_locked():
    doc = load_doc()
    assert len(doc["vectors"]) == 6
    for v in doc["vectors"]:
        assert "entity" in v
        assert "canonical_json" in v
        assert "timestamp" in v
        assert "actor_id" in v
        assert "expected_hash_hex" in v
        assert canonical_json(v["entity"]) == v["canonical_json"]
        got = compute_hash(
            v.get("prev_hash"),
            v["entity"],
            vector_timestamp(v),
            v["actor_id"],
        )
        assert got == vector_expected_hash(v)
        assert len(got) == 64
        assert got == got.lower()


def test_null_and_empty_prev_hash_are_equivalent():
    doc = load_doc()
    genesis = [v for v in doc["vectors"] if v.get("prev_hash") in (None, "")]
    assert genesis, "need at least one NULL/empty prev_hash vector"
    for v in genesis:
        ts, actor = vector_timestamp(v), v["actor_id"]
        a = compute_hash(None, v["entity"], ts, actor)
        b = compute_hash("", v["entity"], ts, actor)
        assert a == b == vector_expected_hash(v)


def test_chained_vectors_use_prior_expected_hash():
    doc = load_doc()
    by_id = {v["id"]: v for v in doc["vectors"]}
    assert by_id["vector-3"]["prev_hash"] == by_id["vector-1"]["expected_hash_hex"]
    assert by_id["vector-6"]["prev_hash"] == by_id["vector-5"]["expected_hash_hex"]


def test_hash_deterministic_across_locales():
    """json.dumps / SHA-256 must not follow LC_NUMERIC / LC_COLLATE."""
    doc = load_doc()
    previous = locale.setlocale(locale.LC_ALL)
    try:
        for loc in ("C", "en_US.UTF-8", "de_DE.UTF-8", "fr_FR.UTF-8"):
            try:
                locale.setlocale(locale.LC_ALL, loc)
            except locale.Error:
                continue
            for v in doc["vectors"]:
                got = compute_hash(
                    v.get("prev_hash"),
                    v["entity"],
                    vector_timestamp(v),
                    v["actor_id"],
                )
                assert got == v["expected_hash_hex"]
                assert canonical_json(v["entity"]) == v["canonical_json"]
    finally:
        try:
            locale.setlocale(locale.LC_ALL, previous)
        except locale.Error:
            locale.setlocale(locale.LC_ALL, "C")
