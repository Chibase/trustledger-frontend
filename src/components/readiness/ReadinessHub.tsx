"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ASSESSMENT_LEAD_KEY,
  ASSESSMENT_STORAGE_KEY,
  dimensionById,
} from "@/data/assessment";
import {
  ASSESSMENT_UNLOCK_KEY,
  hubPrimaryCta,
  readinessUtm,
  riskToneClass,
} from "@/lib/assessmentClient";
import type { AssessmentResult } from "@/types/assessment";

type LeadMeta = { name?: string; email?: string };

export function ReadinessHub() {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [lead, setLead] = useState<LeadMeta>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const unlock = sessionStorage.getItem(ASSESSMENT_UNLOCK_KEY);
        const raw = sessionStorage.getItem(ASSESSMENT_STORAGE_KEY);
        if (!unlock || !raw) {
          router.replace("/assessment");
          return;
        }
        const saved = JSON.parse(raw) as { result?: AssessmentResult };
        if (!saved?.result) {
          router.replace("/assessment");
          return;
        }
        setResult(saved.result);
        const leadRaw = sessionStorage.getItem(ASSESSMENT_LEAD_KEY);
        if (leadRaw) {
          setLead(JSON.parse(leadRaw) as LeadMeta);
        }
        setReady(true);
      } catch {
        router.replace("/assessment");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  if (!ready || !result) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-14">
        <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
        <p className="mt-3 text-sm text-tl-ink-muted">Opening your hub…</p>
      </main>
    );
  }

  const primary = hubPrimaryCta(result.riskBand);
  const firstName = lead.name?.trim().split(/\s+/)[0];

  const options = [
    {
      id: "report" as const,
      href: "/readiness/report",
      title: "View my readiness report",
      body: "Score overview, each dimension, and TrustLedger turnaround timeframes.",
      tone: "primary" as const,
    },
    {
      id: "product" as const,
      href: `/product?${readinessUtm("product_intro")}`,
      title: "How TrustLedger works",
      body: "See the platform capabilities and onboarding path — no sample desk.",
      tone: (primary === "product" ? "accent" : "default") as
        | "accent"
        | "default",
    },
    {
      id: "trial" as const,
      href: `/trial?${readinessUtm("trial_14day")}`,
      title: "Start a 14-day trial",
      body: "Your own workspace with your data. Upgrade when you are ready.",
      tone: (primary === "trial" ? "accent" : "default") as "accent" | "default",
    },
    {
      id: "walkthrough" as const,
      href: `/quote?${readinessUtm("walkthrough")}`,
      title: "Request a walkthrough",
      body: "Talk through your top gaps and a pilot path for your sites.",
      tone: (primary === "walkthrough" ? "accent" : "default") as
        | "accent"
        | "default",
    },
  ];

  const sorted = [...options].sort((a, b) => {
    if (a.id === "report") return -1;
    if (b.id === "report") return 1;
    if (a.tone === "accent" && b.tone !== "accent") return -1;
    if (a.tone !== "accent" && b.tone === "accent") return 1;
    return 0;
  });

  const topGaps = result.topPriorities
    .slice(0, 2)
    .map((id) => dimensionById(id).shortLabel)
    .join(" · ");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        {firstName ? `${firstName}, choose your next step` : "Choose your next step"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-tl-ink-muted">
        Your diagnostic is ready. Open the full report, explore the platform, or
        move into a trial or walkthrough — whichever fits how you want to close
        the gaps.
      </p>

      <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-y border-tl-line py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Score
          </p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-tl-ink">
            {result.overallScore}
            <span className="text-base font-normal text-tl-ink-muted"> / 100</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Risk
          </p>
          <p
            className={`mt-1 font-display text-2xl font-semibold ${riskToneClass(result.riskBand)}`}
          >
            {result.riskLabel}
          </p>
        </div>
        {topGaps && (
          <div className="min-w-[12rem] flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
              Top gaps
            </p>
            <p className="mt-1 text-sm font-medium text-tl-ink">{topGaps}</p>
          </div>
        )}
      </div>

      <ul className="mt-8 space-y-3">
        {sorted.map((opt) => (
          <li key={opt.id}>
            <Link
              href={opt.href}
              className={`block rounded-md border px-4 py-4 transition-colors ${
                opt.tone === "primary"
                  ? "border-tl-trust bg-tl-trust text-white hover:bg-tl-trust-ink"
                  : opt.tone === "accent"
                    ? "border-tl-trust bg-tl-trust/5 text-tl-ink hover:bg-tl-trust/10"
                    : "border-tl-line bg-tl-surface text-tl-ink hover:border-tl-trust/50"
              }`}
            >
              <span className="block text-sm font-semibold">{opt.title}</span>
              <span
                className={`mt-1 block text-sm ${
                  opt.tone === "primary" ? "text-white/85" : "text-tl-ink-muted"
                }`}
              >
                {opt.body}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-tl-ink-muted">
        Prefer to retake?{" "}
        <Link href="/assessment" className="underline underline-offset-2">
          Start the diagnostic again
        </Link>
      </p>
    </main>
  );
}
