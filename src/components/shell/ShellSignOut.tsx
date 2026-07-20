"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ShellSignOutProps = {
  isGuest?: boolean;
};

export function ShellSignOut({ isGuest = false }: ShellSignOutProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await fetch("/auth/logout", { method: "POST" });
      router.push(isGuest ? "/" : "/demo");
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
      className="text-sm font-medium text-tl-trust-ink underline-offset-2 hover:underline disabled:opacity-50"
    >
      {pending ? "Leaving…" : isGuest ? "Leave trial" : "Sign out"}
    </button>
  );
}
