import json
from examples.python.canonicalize_hash_sign import canonical_json_bytes, compute_current_hash


def test_vectors_exist():
    with open('tests/ledger_vectors/test_vectors.json', 'r', encoding='utf-8') as f:
        vectors = json.load(f)
    assert len(vectors) >= 1


def test_hash_lengths_and_determinism():
    with open('tests/ledger_vectors/test_vectors.json', 'r', encoding='utf-8') as f:
        vectors = json.load(f)
    for v in vectors:
        canonical = canonical_json_bytes(v['entity'])
        h1 = compute_current_hash(v.get('prev_hash', ''), canonical, v['ledger_timestamp'], v['actor_id'])
        h2 = compute_current_hash(v.get('prev_hash', ''), canonical, v['ledger_timestamp'], v['actor_id'])
        assert isinstance(h1, str)
        assert len(h1) == 64  # hex length
        assert h1 == h2
