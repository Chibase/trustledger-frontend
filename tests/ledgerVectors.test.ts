/**
 * Jest suite: ledger canonicalization + hash vectors.
 *
 * Loads tests/ledger_vectors/test_vectors.json and asserts the TypeScript
 * reference matches locked canonical_json and expected_hash_hex.
 *
 *   npx jest --config jest.ledger.config.cjs
 */
import fs from "node:fs";
import path from "node:path";
import {
  canonicalJson,
  computeHash,
  vectorExpectedHash,
  vectorTimestamp,
  type LedgerVector,
} from "../examples/typescript/canonicalizeHashSign";

type VectorDoc = {
  vectors: LedgerVector[];
};

const VECTORS_PATH = path.join(
  __dirname,
  "ledger_vectors",
  "test_vectors.json",
);

function loadDoc(): VectorDoc {
  return JSON.parse(fs.readFileSync(VECTORS_PATH, "utf8")) as VectorDoc;
}

describe("ledger canonicalization vectors", () => {
  const doc = loadDoc();

  test("six locked vectors: canonical JSON and SHA-256 hex", () => {
    expect(doc.vectors).toHaveLength(6);
    for (const v of doc.vectors) {
      expect(v.entity).toBeDefined();
      expect(v.canonical_json).toBeDefined();
      expect(v.timestamp).toBeDefined();
      expect(v.actor_id).toBeDefined();
      expect(v.expected_hash_hex).toBeDefined();
      expect(canonicalJson(v.entity)).toBe(v.canonical_json);
      const got = computeHash(
        v.prev_hash,
        v.entity,
        vectorTimestamp(v),
        v.actor_id,
      );
      expect(got).toBe(vectorExpectedHash(v));
      expect(got).toHaveLength(64);
      expect(got).toBe(got.toLowerCase());
    }
  });

  test("null and empty prev_hash produce the same hash", () => {
    const genesis = doc.vectors.filter(
      (v) => v.prev_hash === null || v.prev_hash === "",
    );
    expect(genesis.length).toBeGreaterThan(0);
    for (const v of genesis) {
      const ts = vectorTimestamp(v);
      const a = computeHash(null, v.entity, ts, v.actor_id);
      const b = computeHash("", v.entity, ts, v.actor_id);
      expect(a).toBe(b);
      expect(a).toBe(vectorExpectedHash(v));
    }
  });

  test("chained vectors mix in the prior expected_hash_hex", () => {
    const byId = Object.fromEntries(doc.vectors.map((v) => [v.id, v]));
    expect(byId["vector-3"]!.prev_hash).toBe(byId["vector-1"]!.expected_hash_hex);
    expect(byId["vector-6"]!.prev_hash).toBe(byId["vector-5"]!.expected_hash_hex);
  });

  test("hashes are locale-independent (TZ does not change concat bytes)", () => {
    const previous = process.env.TZ;
    try {
      for (const tz of ["UTC", "Africa/Johannesburg", "America/New_York"]) {
        process.env.TZ = tz;
        for (const v of doc.vectors) {
          const got = computeHash(
            v.prev_hash,
            v.entity,
            vectorTimestamp(v),
            v.actor_id,
          );
          expect(got).toBe(v.expected_hash_hex);
        }
      }
    } finally {
      if (previous === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previous;
      }
    }
  });
});
