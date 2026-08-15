"use client";

import { useState } from "react";
import {
  HoneypotField,
  RecaptchaLegalNote,
  useRecaptcha,
} from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";
import {
  formatChibasePackagePrice,
  type ChibasePackage,
} from "@/lib/chibase/packages";

export function FirmPackageCheckout({
  pkg,
  configured,
}: {
  pkg: ChibasePackage;
  configured: boolean;
}) {
  const { getToken } = useRecaptcha("chibase_package_pay");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(
    configured
      ? null
      : "Online checkout is not configured yet. Request this package instead.",
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(email)) {
      setError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    setPending(true);
    const captchaToken = await getToken();
    try {
      const res = await fetch("/api/chibase/pay/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          organization: organization.trim(),
          package: pkg.id,
          captchaToken,
          tl_hp: honeypot,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        authorizationUrl?: string;
      };
      if (!res.ok || !payload.authorizationUrl) {
        throw new Error(payload.error || "Could not start checkout");
      }
      window.location.href = payload.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed to start");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink"
        autoComplete="name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink"
        autoComplete="email"
        required
      />
      <input
        type="text"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="Organisation (optional)"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink"
        autoComplete="organization"
      />
      {error ? <p className="text-sm text-tl-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !configured}
        className="rounded-md bg-tl-trust px-5 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink disabled:opacity-60"
      >
        {pending
          ? "Starting checkout…"
          : `Pay now · ${formatChibasePackagePrice(pkg)}`}
      </button>
      <RecaptchaLegalNote />
    </form>
  );
}
