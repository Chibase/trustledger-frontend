"use client";

import Link from "next/link";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

export function HomeFinalCta() {
  return (
    <section
      id="solutions"
      className="bg-tl-trust"
      aria-labelledby="final-cta-title"
    >
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2
          id="final-cta-title"
          className="font-display text-2xl font-semibold text-white sm:text-3xl"
        >
          See measurable trust outcomes in two minutes
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/85">
          Preview grievance resolution, trust visibility, and ESG evidence on
          sample data — then save results when you are ready.
        </p>
        <div className="mt-8">
          <Link
            href="/demo?utm_source=home&utm_medium=final_cta&utm_campaign=live_walkthrough"
            onClick={() =>
              trackMarketingEvent("final_cta_click", {
                cta: "run_2min_walkthrough",
              })
            }
            className="inline-flex w-full items-center justify-center rounded-md bg-tl-surface px-6 py-3.5 text-base font-semibold text-tl-trust-ink transition-colors hover:bg-tl-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Run 2-minute live walkthrough
          </Link>
          <p className="mt-4">
            <Link
              href="/contact?utm_source=home&utm_medium=final_cta&utm_campaign=guided_demo"
              className="text-sm font-medium text-white underline underline-offset-4 hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Book a guided demo
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
