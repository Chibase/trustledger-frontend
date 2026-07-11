"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ShellSignOut() {
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

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="text-xs font-medium text-tl-ink-muted hover:text-tl-trust-ink disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
