"use client";

import { useEffect } from "react";
import { hasCapturedEmail, saveCapturedEmail } from "@/lib/emailGate";

/**
 * Authenticated app sessions already have an email cookie/user — seed the
 * legacy lead-email gate so Capture / Reports / Issues saves are not blocked.
 */
export function SessionEmailBridge({ email }: { email?: string | null }) {
  useEffect(() => {
    const trimmed = email?.trim();
    if (!trimmed || hasCapturedEmail()) return;
    saveCapturedEmail(trimmed, "save");
  }, [email]);

  return null;
}
