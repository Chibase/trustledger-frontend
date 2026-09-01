import { computeCurrentHash, canonicalJsonBytes } from '../../examples/typescript/canonicalizeHashSign';

const vectors = require('../../tests/ledger_vectors/test_vectors.json');

test('vectors exist', () => {
  expect(vectors.length).toBeGreaterThan(0);
});

test('hash lengths and determinism - ts', () => {
  for (const v of vectors) {
    const c = canonicalJsonBytes(v.entity);
    const h1 = computeCurrentHash(v.prev_hash || '', c, v.ledger_timestamp, v.actor_id);
    const h2 = computeCurrentHash(v.prev_hash || '', c, v.ledger_timestamp, v.actor_id);
    expect(typeof h1).toBe('string');
    expect(h1.length).toBe(64);
    expect(h1).toBe(h2);
  }
});
