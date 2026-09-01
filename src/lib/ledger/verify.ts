// Ledger signature verification helper using @noble/ed25519 when available
// Falls back to throwing if noble is not installed. Add @noble/ed25519 as a dependency to the frontend package.

import * as base64 from 'base-64';

let noble: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  noble = require('@noble/ed25519');
} catch (err) {
  noble = null;
}

export async function verifySignatureBase64(pubKeyB64: string, signatureB64: string, currentHashHex: string): Promise<boolean> {
  if (!noble) {
    // In environments without noble, we cannot verify; caller should handle fallback.
    throw new Error('ed25519 verification library not available (install @noble/ed25519)');
  }
  const pub = Buffer.from(pubKeyB64, 'base64');
  const sig = Buffer.from(signatureB64, 'base64');
  // noble expects hex or Uint8Array
  const msgBytes = Buffer.from(currentHashHex, 'utf-8');
  const ok = await noble.verify(sig, msgBytes, pub);
  return ok;
}
