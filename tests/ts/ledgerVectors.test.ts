/**
 * tsx runner (optional). Canonical Jest suite: tests/ledgerVectors.test.ts
 *
 *   npx tsx tests/ts/ledgerVectors.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalJson,
  checkVectors,
  computeHash,
  vectorExpectedHash,
  vectorTimestamp,
  type VectorDoc,
} from "../../examples/typescript/canonicalizeHashSign.ts";

async function main(): Promise<void> {
  const root = path.resolve(process.cwd());
  const doc = JSON.parse(
    fs.readFileSync(path.join(root, "tests", "ledger_vectors", "test_vectors.json"), "utf8"),
  ) as VectorDoc;

  assert.equal(doc.vectors.length, 6);

  const v1 = doc.vectors[0]!;
  assert.equal(
    computeHash(null, v1.entity, vectorTimestamp(v1), v1.actor_id),
    computeHash("", v1.entity, vectorTimestamp(v1), v1.actor_id),
  );
  assert.equal(canonicalJson(v1.entity), v1.canonical_json);

  const failed = await checkVectors(doc);
  assert.equal(failed, 0);

  const chained = doc.vectors.find((v) => v.id === "vector-3")!;
  assert.equal(chained.prev_hash, vectorExpectedHash(v1));

  console.log("tests/ts/ledgerVectors.test.ts: ok");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
