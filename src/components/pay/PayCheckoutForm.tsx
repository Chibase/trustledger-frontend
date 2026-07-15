"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatZarFromCents,
  type PaystackPlan,
  type PaystackPlanId,
} from "@/lib/paystackPlans";

export function PayCheckoutForm({
  plans,
  initialPlan,
  configured,
  initialEmail = "",
  initialName = "",
  initialOrganization = "",
}: {
  plans: PaystackPlan[];
  initialPlan: PaystackPlanId;
  configured: boolean;
  initialEmail?: string;
  initialName?: string;
  initialOrganization?: string;
}) {
  const [planId, setPlanId] = useState<PaystackPlanId>(
    plans.some((p) => p.id === initialPlan) ? initialPlan : plans[0]?.id || "practitioner",
  );
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);
  const [organization, setOrganization] = useState(initialOrganization);
  const [error, setError] = useState<string | null>(
    configured ? null : "Paystack keys are not configured on this deployment yet.",
  );
  const [pending, setPending] = useState(false);

  const selected = plans.find((p) => p.id === planId) || plans[0];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (!selected?.selfServe) {
        throw new Error("Institutional plans are sales-led. Use Contact instead.");
      }
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          name,
          organization,
          plan: selected.id,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        authorizationUrl?: string;
      };
      if (!res.ok || !payload.authorizationUrl) {
        throw new Error(payload.error || "Could not start payment");
      }
      window.location.href = payload.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed to start");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Plan</legend>
        <div className="space-y-2">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`flex cursor-pointer gap-3 rounded-md border px-3 py-3 ${
                planId === plan.id
                  ? "border-tl-trust bg-tl-paper"
                  : "border-tl-line"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={planId === plan.id}
                onChange={() => setPlanId(plan.id)}
                className="mt-1"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{plan.label}</span>
                  <span className="text-sm tabular-nums">
                    {formatZarFromCents(plan.amountCents)}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-tl-ink-muted">
                  {plan.summary}
                  {!plan.selfServe ? " · Contact sales" : ""}
                  {plan.selfServe && !plan.amountCents
                    ? " · Price pending on server"
                    : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!selected?.selfServe ? (
        <p className="text-sm text-tl-ink-muted">
          Institutional is not self-serve.{" "}
          <Link href="/contact" className="font-medium text-tl-trust-ink underline">
            Contact us
          </Link>
          .
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="organization"
              className="mb-1 block text-sm font-medium"
            >
              Organisation
            </label>
            <input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
          </div>
          {error ? (
            <p className="text-sm text-tl-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || !configured || !selected.amountCents}
            className="w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {pending
              ? "Redirecting to Paystack…"
              : `Continue to Paystack · ${formatZarFromCents(selected.amountCents)}`}
          </button>
        </>
      )}
    </form>
  );
}
