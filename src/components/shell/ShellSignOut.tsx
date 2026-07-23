"use client";

import { useState } from "react";

type ShellSignOutProps = {
  variant?: "light" | "ink";
  isGuest?: boolean;
};

function clearClientSessionCookies() {
  // Clear with and without SameSite — browsers match on attributes.
  const expired = "path=/; max-age=0";
  for (const name of ["session-role", "tl-mode", "tl-user-name", "tl-user-email"]) {
    document.cookie = `${name}=; ${expired}`;
    document.cookie = `${name}=; ${expired}; samesite=lax`;
  }
}

export function ShellSignOut({
  variant = "light",
  isGuest = false,
}: ShellSignOutProps) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      // Clear demo/trial session and live Frappe session so the next visit
      // can pick a different account — never bounce straight into /demo.
      await Promise.allSettled([
        fetch("/auth/logout", { method: "POST", credentials: "same-origin" }),
        fetch("/auth/live/logout", {
          method: "POST",
          credentials: "same-origin",
        }),
      ]);
      clearClientSessionCookies();
      // Hard navigation avoids soft-nav races where middleware still sees
      // session-role and 307s /login → /app/dashboard.
      window.location.assign("/login?signedOut=1");
    } catch {
      clearClientSessionCookies();
      window.location.assign("/login?signedOut=1");
    }
  }

  const className =
    variant === "ink"
      ? "text-xs font-medium text-white/60 hover:text-white disabled:opacity-50"
      : "text-xs font-medium text-tl-ink-muted hover:text-tl-trust-ink disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={className}
    >
      {pending ? "Leaving…" : isGuest ? "Leave trial" : "Sign out"}
    </button>
  );
}
