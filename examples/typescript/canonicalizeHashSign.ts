/**
 * Ledger canonical JSON + SHA-256 chain hash + ed25519 sign/verify.
 *
 * TypeScript / Node reference for docs/LEDGER_API.md.
 * Matches Python 3.10 json.dumps(separators=(',', ':'), sort_keys=True, ensure_ascii=False).
 *
 *   npx tsx examples/typescript/canonicalizeHashSign.ts
 *
 * Signing uses Node Web Crypto Ed25519 (Node 19+) by default.
 * Optional isomorphic lib: npm install @noble/ed25519 (or tweetnacl) — same raw 32-byte keys.
 *
 * TEST-ONLY: the demo runner generates an ephemeral keypair, prints the public key,
 * signs vector-1, verifies, and drops the private key. Nothing is written to disk.
 */

import { createHash, webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function sortKeys(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    const out: { [key: string]: JsonValue } = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeys(value[key]!);
    }
    return out;
  }
  return value;
}

/** Deterministic JSON string: sorted keys, separators (",", ":"), UTF-8 / ensure_ascii=false. */
export function canonicalJson(obj: JsonValue): string {
  return JSON.stringify(sortKeys(obj));
}

/**
 * SHA-256 lowercase hex of:
 *   prev_hash_bytes + canonical_entity_bytes + timestamp_bytes + actor_id_bytes
 * null / "" prev_hash → empty prev_hash_bytes.
 */
export function computeHash(
  prevHash: string | null | undefined,
  entity: JsonValue,
  timestamp: string,
  actorId: string,
): string {
  const prev = prevHash ? Buffer.from(prevHash, "utf8") : Buffer.alloc(0);
  const data = Buffer.concat([
    prev,
    Buffer.from(canonicalJson(entity), "utf8"),
    Buffer.from(timestamp, "utf8"),
    Buffer.from(actorId, "utf8"),
  ]);
  return createHash("sha256").update(data).digest("hex");
}

export async function signHashEd25519(
  privateKey: CryptoKey,
  currentHashHex: string,
): Promise<string> {
  const sig = await webcrypto.subtle.sign(
    "Ed25519",
    privateKey,
    Buffer.from(currentHashHex, "utf8"),
  );
  return Buffer.from(sig).toString("base64");
}

export async function verifySignature(
  publicKeyBytes: Uint8Array,
  signatureB64: string,
  currentHashHex: string,
): Promise<boolean> {
  try {
    const key = await webcrypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      "Ed25519",
      false,
      ["verify"],
    );
    return webcrypto.subtle.verify(
      "Ed25519",
      key,
      Buffer.from(signatureB64, "base64"),
      Buffer.from(currentHashHex, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function generateTestKeypair(): Promise<{
  privateKey: CryptoKey;
  publicKeyBytes: Uint8Array;
}> {
  const pair = await webcrypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]);
  const publicKeyBytes = new Uint8Array(
    await webcrypto.subtle.exportKey("raw", pair.publicKey),
  );
  return { privateKey: pair.privateKey, publicKeyBytes };
}

export type LedgerVector = {
  id: string;
  entity: JsonValue;
  prev_hash: string | null;
  timestamp?: string;
  ledger_timestamp?: string;
  actor_id: string;
  canonical_json: string;
  expected_hash_hex?: string;
  expected_sha256_hex?: string;
};

export type VectorDoc = {
  vectors: LedgerVector[];
  verify_fixture_test_only?: {
    vector_id: string;
    public_key_base64: string;
    signature_base64: string;
  };
};

export function vectorTimestamp(v: LedgerVector): string {
  return v.timestamp || v.ledger_timestamp || "";
}

export function vectorExpectedHash(v: LedgerVector): string {
  return v.expected_hash_hex || v.expected_sha256_hex || "";
}

function loadVectors(root: string): VectorDoc {
  const vectorsPath = path.join(root, "tests", "ledger_vectors", "test_vectors.json");
  if (!fs.existsSync(vectorsPath)) {
    throw new Error(`test_vectors.json not found at ${vectorsPath}`);
  }
  return JSON.parse(fs.readFileSync(vectorsPath, "utf8")) as VectorDoc;
}

export async function checkVectors(doc: VectorDoc): Promise<number> {
  let failed = 0;
  for (const v of doc.vectors) {
    const gotCanon = canonicalJson(v.entity);
    const expected = vectorExpectedHash(v);
    const gotHash = computeHash(
      v.prev_hash,
      v.entity,
      vectorTimestamp(v),
      v.actor_id,
    );
    console.log(`${v.id}: canonical=${gotCanon}`);
    console.log(`${v.id}: sha256=${gotHash}`);
    if (gotCanon !== v.canonical_json) {
      console.error(`${v.id}: FAIL canonical JSON mismatch`);
      failed += 1;
    }
    if (gotHash !== expected) {
      console.error(`${v.id}: FAIL hash mismatch expected ${expected}`);
      failed += 1;
    }
  }
  return failed;
}

function repoRoot(): string {
  const argv1 = process.argv[1]?.replace(/\\/g, "/") ?? "";
  if (/(^|\/)canonicalizeHashSign\.(ts|js)$/.test(argv1)) {
    return path.resolve(path.dirname(process.argv[1]!), "..", "..");
  }
  return process.cwd();
}

async function main(): Promise<void> {
  const doc = loadVectors(repoRoot());
  let failed = await checkVectors(doc);

  const fixture = doc.verify_fixture_test_only;
  if (fixture) {
    const vector = doc.vectors.find((v) => v.id === fixture.vector_id);
    if (!vector) {
      console.error("FAIL verify fixture vector missing");
      failed += 1;
    } else {
      const pk = Buffer.from(fixture.public_key_base64, "base64");
      const ok = await verifySignature(
        pk,
        fixture.signature_base64,
        vectorExpectedHash(vector),
      );
      console.log(`verify_fixture_test_only (${fixture.vector_id}): ${ok}`);
      if (!ok) failed += 1;
    }
  }

  const { privateKey, publicKeyBytes } = await generateTestKeypair();
  console.log("\nGenerated ephemeral ed25519 keypair (TEST-ONLY; not saved)");
  console.log("public_key_base64:", Buffer.from(publicKeyBytes).toString("base64"));
  const first = doc.vectors[0]!;
  const h = computeHash(
    first.prev_hash,
    first.entity,
    vectorTimestamp(first),
    first.actor_id,
  );
  const sig = await signHashEd25519(privateKey, h);
  console.log("ephemeral_signature_base64 (vector-1):", sig);
  console.log(
    "ephemeral_verify_ok:",
    await verifySignature(publicKeyBytes, sig, h),
  );

  if (failed) {
    process.exit(1);
  }
}

const argv1 = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (/(^|\/)canonicalizeHashSign\.(ts|js)$/.test(argv1)) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
