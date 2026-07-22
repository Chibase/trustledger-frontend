/**
 * Readable temporary passwords for Ops smoke / support resets.
 * Avoids ambiguous characters (0/O, 1/l/I).
 */

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function mintReadablePassword(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CHARS[bytes[i]! % CHARS.length]!;
  }
  return out;
}
