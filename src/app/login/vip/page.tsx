"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startVipShowcaseSession } from "@/lib/orgSession";
import { VIP_SHOWCASE_DEFAULT_EMAIL } from "@/lib/vipShowcaseIdentity";
import { applyVipShowcaseSeed } from "@/lib/vipShowcaseSeed";

function sanitizeNext(value: string | null): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    value.startsWith("/app")
  ) {
    return value;
  }
  return "/app/dashboard";
}

function VipShowcaseLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/vip-showcase", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (res) => {
        const json = (await res.json()) as { enabled?: boolean };
        if (!cancelled) setEnabled(Boolean(json.enabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      const emailValue = String(form.get("email") || "").trim().toLowerCase();
      const passwordValue = String(form.get("password") || "").trim();
      const res = await fetch("/api/auth/vip-showcase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        email?: string;
        name?: string;
        weeks?: number;
      };
      if (!res.ok || !payload.ok || !payload.email) {
        throw new Error(payload.error || "Sign-in failed");
      }

      const org = startVipShowcaseSession({
        email: payload.email,
        name: payload.name || payload.email,
        weeks: payload.weeks,
      });
      applyVipShowcaseSeed({
        orgId: org.id,
        email: payload.email,
        forceShowcase: true,
      });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm font-medium text-tl-trust">VIP Institutional</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-tl-ink">
        VIP showcase workspace
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Complimentary full package with an illustrative Northern Cape corridor
        programme. Sign in as{" "}
        <code className="font-mono text-xs">{VIP_SHOWCASE_DEFAULT_EMAIL}</code>
        — not the Platform Operator mailbox. This is not the retired public
        sample, and it is not a paying customer desk — declare it illustrative
        in the room.
      </p>

      {enabled === false ? (
        <p className="mt-6 rounded-md border border-tl-line bg-tl-surface p-4 text-sm text-tl-ink-muted">
          VIP showcase login is turned off on this host (
          <code className="font-mono text-xs">VIP_SHOWCASE_LOGIN=0</code>). Use
          Ops → VIP complimentary access for a live Cloud guest.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <div>
            <label htmlFor="vip-email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="vip-email"
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={VIP_SHOWCASE_DEFAULT_EMAIL}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="vip-password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="vip-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {pending ? "Opening workspace…" : "Open VIP workspace"}
          </button>
        </form>
      )}

      <p className="mt-6 text-xs text-tl-ink-muted">
        Paying Owners use{" "}
        <Link href="/login/live" className="text-tl-trust-ink underline">
          live sign-in
        </Link>
        . Own-data trial stays at{" "}
        <Link href="/trial" className="text-tl-trust-ink underline">
          /trial
        </Link>
        .
      </p>
    </main>
  );
}

export default function VipShowcaseLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">VIP showcase</h1>
        </main>
      }
    >
      <VipShowcaseLoginForm />
    </Suspense>
  );
}
