// Canonicalization helpers and compute hash utilities

export function canonicalizeObject(obj: any): Uint8Array {
  // Recursively sort object keys and stringify without extra spaces
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
  const canonical = canonicalize(obj);
  const s = JSON.stringify(canonical); // no extra spaces by default
  return new TextEncoder().encode(s);
}

export async function computeCurrentHashHex(prev_hash: string | null, canonical_entity_bytes: Uint8Array, timestamp: string, actor_id: string): Promise<string> {
  const prev = new TextEncoder().encode(prev_hash || '');
  const t = new TextEncoder().encode(timestamp);
  const a = new TextEncoder().encode(actor_id);
  // concat
  const data = new Uint8Array(prev.length + canonical_entity_bytes.length + t.length + a.length);
  data.set(prev, 0);
  data.set(canonical_entity_bytes, prev.length);
  data.set(t, prev.length + canonical_entity_bytes.length);
  data.set(a, prev.length + canonical_entity_bytes.length + t.length);

  // compute sha256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
