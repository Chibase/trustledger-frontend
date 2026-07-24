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
          See measurable trust outcomes on your own data
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/85">
          Start a 14-day trial workspace, then upgrade straight to Paystack when
          you are ready. Access pauses when the trial ends; data is kept for 3
          months.
        </p>
        <div className="mt-8">
          <Link
            href="/trial?utm_source=home&utm_medium=final_cta&utm_campaign=trial_14day"
            onClick={() =>
              trackMarketingEvent("final_cta_click", {
                cta: "start_14day_trial",
              })
            }
            className="inline-flex w-full items-center justify-center rounded-md bg-tl-surface px-6 py-3.5 text-base font-semibold text-tl-trust-ink transition-colors hover:bg-tl-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Start 14-day trial
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
