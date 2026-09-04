export async function verifySignatureBase64(
  publicKeyB64: string,
  signatureB64: string,
  currentHashHex: string,
): Promise<boolean> {
  const publicKey = b64ToBytes(publicKeyB64);
  const signature = b64ToBytes(signatureB64);
  const message = new TextEncoder().encode(currentHashHex);

  if (!globalThis.crypto?.subtle) {
    throw new Error("verification_unavailable");
  }
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      publicKey as BufferSource,
      "Ed25519",
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "Ed25519",
      key,
      signature as BufferSource,
      message as BufferSource,
    );
  } catch {
    throw new Error("verification_unavailable");
  }
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function verificationCryptoAvailable(): boolean {
  return Boolean(globalThis.crypto?.subtle);
}
