/*
Reference TypeScript/Node example for canonical JSON and chain hashing.
Requires: npm install @noble/ed25519 (if you want to run signing examples)

Usage:
  # install deps
  npm install
  # run with ts-node or compile
  npx ts-node examples/typescript/canonicalizeHashSign.ts
*/

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Optional: ed25519 signing libs (uncomment after installing)
// import { utils, sign, getPublicKey } from '@noble/ed25519';

export function canonicalJsonBytes(obj: any): Buffer {
  // deterministic JSON: sort keys, separators no spaces
  const canonical = JSON.stringify(obj, Object.keys(obj).sort(), 0);
  // The above simple stringify with sorted keys is not fully robust for nested objects; for demos it's acceptable.
  // For production, use a canonicalize function that sorts object keys recursively. Here we implement a small helper.
  function canonicalize(value: any): any {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).sort();
      const out: any = {};
      for (const k of keys) out[k] = canonicalize(value[k]);
      return out;
    }
    return value;
  }
  const can = canonicalize(obj);
  const s = JSON.stringify(can);
  return Buffer.from(s, 'utf8');
}

export function computeCurrentHash(prev_hash: string | null, canonical_entity_bytes: Buffer, timestamp: string, actor_id: string): string {
  const prev = (prev_hash || '');
  const data = Buffer.concat([Buffer.from(prev, 'utf8'), canonical_entity_bytes, Buffer.from(timestamp, 'utf8'), Buffer.from(actor_id, 'utf8')]);
  const h = crypto.createHash('sha256').update(data).digest('hex');
  return h;
}

// Signing example (requires @noble/ed25519)
// export async function signCurrentHashEd25519(privateKeyHex: string, currentHashHex: string): Promise<string> {
//   const priv = Buffer.from(privateKeyHex, 'hex');
//   const sig = await sign(Buffer.from(currentHashHex, 'utf8'), priv);
//   return Buffer.from(sig).toString('base64');
// }

// Demo runner: read test vectors
if (require.main === module) {
  const root = path.resolve(__dirname, '../../');
  const vectorsPath = path.join(root, 'tests', 'ledger_vectors', 'test_vectors.json');
  if (!fs.existsSync(vectorsPath)) {
    console.error('test_vectors.json not found at', vectorsPath);
    process.exit(1);
  }
  const vectors = JSON.parse(fs.readFileSync(vectorsPath, 'utf8'));
  console.log('Computing hashes for', vectors.length, 'vectors');
  vectors.forEach((v: any, i: number) => {
    const c = canonicalJsonBytes(v.entity);
    const h = computeCurrentHash(v.prev_hash || '', c, v.ledger_timestamp, v.actor_id);
    console.log(`VECTOR ${i+1}: id=${v.entity.id} hash=${h}`);
  });
}
