"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SESSION_MAX_AGE_SECONDS,
  TL_TRIAL_PLAN_COOKIE,
  TRIAL_DEFAULT_ROLE,
} from "@/lib/auth.constants";
import { planFromUtmCampaign } from "@/config/plans";
import { captureUtmFromSearchParams, readUtm } from "@/lib/utm";

function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/app/dashboard";
}

function TrialEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const captured = captureUtmFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      "/demo",
    );
    const utm = captured ?? readUtm();
    const plan = planFromUtmCampaign(utm?.campaign);
    const maxAge = SESSION_MAX_AGE_SECONDS;
    document.cookie = `session-role=${TRIAL_DEFAULT_ROLE}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `tl-mode=demo; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `${TL_TRIAL_PLAN_COOKIE}=${plan}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `tl-user-name=Trial guest; path=/; max-age=${maxAge}; samesite=lax`;
    const next = sanitizeNext(searchParams.get("next"));
    router.replace(next.startsWith("/app") ? next : "/app/dashboard");
  }, [searchParams, router]);

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Opening your 14-day trial…
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        No login required. Explore sample data freely — we only ask for an email
        when you print or save.
      </p>
    </main>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">
            TrustLedger Trial
          </h1>
        </main>
      }
    >
      <TrialEntry />
    </Suspense>
  );
}
