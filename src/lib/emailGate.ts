const EMAIL_KEY = "tl-lead-email";
const PAYLOAD_KEY = "tl-lead-payload";

export function readCapturedEmail(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(EMAIL_KEY);
  return value?.trim() || null;
}

export function saveCapturedEmail(email: string, reason: "print" | "save") {
  const trimmed = email.trim();
  window.localStorage.setItem(EMAIL_KEY, trimmed);
  window.localStorage.setItem(
    PAYLOAD_KEY,
    JSON.stringify({
      email: trimmed,
      reason,
      capturedAt: new Date().toISOString(),
    }),
  );
}

export function hasCapturedEmail(): boolean {
  return Boolean(readCapturedEmail());
}
