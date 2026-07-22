"use client";

/**
 * Browser helpers for trial activation tokens (no secrets).
 * Password verification always goes through `/api/trial/*`.
 */

export function readStoredActivationToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("tl-trial-activation");
}

export function writeStoredActivationToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("tl-trial-activation", token);
}
