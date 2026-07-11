"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ShellSignOutProps = {
  variant?: "light" | "ink";
};

export function ShellSignOut({ variant = "light" }: ShellSignOutProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await fetch("/auth/logout", { method: "POST" });
      router.push("/demo");
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
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
