"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isWorkEmail } from "@/data/assessment";
import { planFromUtmCampaign, PLANS, type PlanId } from "@/config/plans";
import { captureUtmFromSearchParams } from "@/lib/utm";
import { clearTrialWorkspaceData, startTrialCookies } from "@/lib/trial";
import { ensureTrialSeedProject } from "@/lib/trialStore";

function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/app/dashboard";
}

function TrialStartForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const suggestedPlan = useMemo(() => {
    const fromQuery = searchParams.get("plan");
    if (fromQuery && (fromQuery === "practitioner" || fromQuery === "project" || fromQuery === "institutional")) {
      return fromQuery;
    }
    return planFromUtmCampaign(searchParams.get("utm_campaign"));
  }, [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [planOverride, setPlanOverride] = useState<PlanId | null>(null);
  const planId = planOverride ?? suggestedPlan;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleStart(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(email)) {
      setError("Please use a work email address.");
      return;
    }

    setPending(true);
    captureUtmFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      "/trial",
    );
    clearTrialWorkspaceData();
    startTrialCookies({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      planId,
      organization: organization.trim() || undefined,
    });
    ensureTrialSeedProject();
    if (organization.trim()) {
      window.localStorage.setItem("tl-trial-org", organization.trim());
    }
    window.localStorage.setItem("tl-lead-email", email.trim().toLowerCase());
    const next = sanitizeNext(searchParams.get("next"));
    router.replace(next.startsWith("/app") ? next : "/app/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">14-day trial</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Start your TrustLedger workspace
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Explore with your own projects and incidents — not sample demo data. To
        subscribe with banking details on file for end-of-trial billing, use{" "}
        <Link href="/pay" className="font-medium text-tl-trust-ink underline">
          Subscribe
        </Link>
        . After a card-verified trial ends, access stops; we keep your data for
        3 months so you can restore it.
      </p>

      <form
        onSubmit={handleStart}
        className="mt-8 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
      >
        <div>
          <label htmlFor="trial-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="trial-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="trial-email" className="mb-1 block text-sm font-medium">
            Work email
          </label>
          <input
            id="trial-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="trial-org" className="mb-1 block text-sm font-medium">
            Organisation{" "}
            <span className="font-normal text-tl-ink-muted">(optional)</span>
          </label>
          <input
            id="trial-org"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="trial-plan" className="mb-1 block text-sm font-medium">
            Plan you are evaluating
          </label>
          <select
            id="trial-plan"
            value={planId}
            onChange={(e) => setPlanOverride(e.target.value as PlanId)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            {(Object.keys(PLANS) as PlanId[])
              .filter((id) => PLANS[id].cta === "pay")
              .map((id) => (
                <option key={id} value={id}>
                  {PLANS[id].name}
                  {PLANS[id].monthlyLaunchZar
                    ? ` — R${PLANS[id].monthlyLaunchZar!.toLocaleString("en-ZA")}/mo`
                    : ""}
                </option>
              ))}
          </select>
        </div>

        {error ? (
          <p className="text-sm text-tl-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {pending ? "Opening workspace…" : "Enter my trial workspace"}
        </button>
      </form>

      <p className="mt-4 text-xs text-tl-ink-muted">
        Learn features first?{" "}
        <Link href="/product" className="font-medium text-tl-trust-ink underline">
          Product &amp; onboarding
        </Link>
      </p>
    </main>
  );
}

export default function TrialPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Start trial</h1>
        </main>
      }
    >
      <TrialStartForm />
    </Suspense>
  );
}
