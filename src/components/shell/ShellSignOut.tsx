"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ShellSignOutProps = {
  variant?: "light" | "ink";
  isGuest?: boolean;
};

function clearClientSessionCookies() {
  document.cookie = "session-role=; path=/; max-age=0; samesite=lax";
  document.cookie = "tl-mode=; path=/; max-age=0; samesite=lax";
}

export function ShellSignOut({
  variant = "light",
  isGuest = false,
}: ShellSignOutProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      // Clear demo/trial session and live Frappe session so the next visit
      // can pick a different account — never bounce straight into /demo.
      await Promise.allSettled([
        fetch("/auth/logout", { method: "POST" }),
        fetch("/auth/live/logout", { method: "POST" }),
      ]);
      clearClientSessionCookies();
      router.push("/login?signedOut=1");
      router.refresh();
    } finally {
      setPending(false);
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
