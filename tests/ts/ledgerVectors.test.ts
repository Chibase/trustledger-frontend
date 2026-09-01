/**
 * Acceptance checks for ledger vectors (run with npx tsx — no Jest required).
 *
 *   npx tsx tests/ts/ledgerVectors.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalJson,
  checkVectors,
  computeHash,
  verifySignature,
  type JsonValue,
} from "../../examples/typescript/canonicalizeHashSign.ts";

type VectorDoc = {
  vectors: Array<{
    id: string;
    entity: JsonValue;
    prev_hash: string | null;
    ledger_timestamp: string;
    actor_id: string;
    canonical_json: string;
    expected_sha256_hex: string;
  }>;
  verify_fixture_test_only: {
    vector_id: string;
    public_key_base64: string;
    signature_base64: string;
  };
};

async function main(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const doc = JSON.parse(
    fs.readFileSync(path.join(root, "tests", "ledger_vectors", "test_vectors.json"), "utf8"),
  ) as VectorDoc;

  assert.equal(doc.vectors.length, 3);

  const v1 = doc.vectors[0]!;
  assert.equal(
    computeHash(null, v1.entity, v1.ledger_timestamp, v1.actor_id),
    computeHash("", v1.entity, v1.ledger_timestamp, v1.actor_id),
  );

  assert.equal(doc.vectors[2]!.prev_hash, v1.expected_sha256_hex);
  assert.equal(canonicalJson(v1.entity), v1.canonical_json);

  const failed = await checkVectors(doc);
  assert.equal(failed, 0);

  const fixture = doc.verify_fixture_test_only;
  const pk = Buffer.from(fixture.public_key_base64, "base64");
  assert.equal(
    await verifySignature(pk, fixture.signature_base64, v1.expected_sha256_hex),
    true,
  );
  assert.equal(await verifySignature(pk, fixture.signature_base64, "0".repeat(64)), false);

  console.log("ledgerVectors.test.ts: ok");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
