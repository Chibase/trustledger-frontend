"use client";

import Image from "next/image";
import Link from "next/link";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

export function HomeHero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-tl-surface to-tl-paper"
      aria-labelledby="hero-title"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-12 lg:px-8 lg:py-20">
        <div className="animate-[tl-banner-in_400ms_ease-out]">
          <p className="text-sm font-semibold text-tl-trust">
            Trust &amp; governance for the Global South
          </p>
          <h1
            id="hero-title"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          >
            Turn Community Risk into Measurable Trust Outcomes
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-tl-ink-muted sm:text-lg">
            Operationalise grievance resolution and governance-grade ESG
            reporting for low-connectivity, multilingual field environments —
            where social licence decides whether projects move.
          </p>

          <div className="mt-8">
            {/* Primary CTA — only dominant action in hero */}
            <Link
              href="/demo?utm_source=home&utm_medium=hero&utm_campaign=live_walkthrough"
              onClick={() =>
                trackMarketingEvent("hero_primary_cta_click", {
                  cta: "run_2min_walkthrough",
                })
              }
              className="inline-flex w-full items-center justify-center rounded-md bg-tl-trust px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-tl-trust-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust sm:w-auto"
            >
              Run 2-minute live walkthrough
            </Link>
            <p className="mt-3 max-w-md text-sm text-tl-ink-muted">
              No signup required to preview. Email only needed to save/export
              results.
            </p>
            <p className="mt-4">
              <Link
                href="/contact?utm_source=home&utm_medium=hero&utm_campaign=pilot_walkthrough"
                onClick={() =>
                  trackMarketingEvent("hero_secondary_cta_click", {
                    cta: "book_pilot_walkthrough",
                  })
                }
                className="text-sm font-medium text-tl-trust-ink underline underline-offset-4 hover:text-tl-trust focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
              >
                Book a 20-minute pilot walkthrough
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT — product visual (composition locked) */}
        <div className="relative min-w-0">
          <div
            className="overflow-hidden rounded-xl border border-tl-line bg-tl-surface shadow-[0_12px_40px_rgba(18,32,42,0.08)]"
            aria-hidden="true"
          >
            <Image
              src="/marketing/trustledger-hero-dashboard.png"
              alt=""
              width={1536}
              height={1024}
              priority
              className="h-auto w-full object-contain object-top"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
          </div>
          <p className="sr-only">
            TrustLedger product dashboard showing grievance cases, trust score,
            and SLA status.
          </p>
        </div>
      </div>
    </section>
  );
}
