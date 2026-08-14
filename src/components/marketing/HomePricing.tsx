import Link from "next/link";
import {
  formatPlanPrice,
  getPaystackPlans,
} from "@/lib/paystackPlans";
import { DATA_PROTECTION_BLURB } from "@/config/planComparison";
import { HomePricingComparison } from "@/components/marketing/HomePricingComparison";
import { HomePricingPrivacyExtras } from "@/components/marketing/HomePricingPrivacyExtras";
import { chibasePublicHref } from "@/lib/security/hosts";

export function HomePricing() {
  const plans = getPaystackPlans();

  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-t border-tl-line bg-tl-surface py-16 sm:py-20"
      aria-labelledby="pricing-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-tl-trust">Pricing</p>
          <h2
            id="pricing-title"
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink"
          >
            Plans connected to Paystack checkout
          </h2>
          <p className="mt-3 text-sm text-tl-ink-muted">
            ZAR excl. VAT. Subscribe verifies your card, starts a 14-day trial
            immediately, and bills the plan price only when the trial ends —
            unless you cancel first.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const href = plan.selfServe
              ? `/pay?plan=${plan.id}&utm_source=home&utm_medium=pricing&utm_campaign=buy_${plan.id}`
              : `/contact?utm_source=home&utm_medium=pricing&utm_campaign=buy_${plan.id}`;
            const cta = plan.selfServe ? "Subscribe" : "Talk to sales";
            /** Practitioner = AI / light-governance step-up (ADR-035). */
            const highlighted = plan.id === "practitioner";

            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-lg border p-5 ${
                  highlighted
                    ? "border-tl-trust bg-tl-paper shadow-sm"
                    : "border-tl-line bg-tl-paper"
                }`}
              >
                {highlighted ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
                    Most popular
                  </p>
                ) : null}
                <h3 className="mt-1 font-display text-xl font-semibold text-tl-ink">
                  {plan.label}
                </h3>
                <p className="mt-2 text-sm text-tl-ink-muted">{plan.summary}</p>
                <p className="mt-4 font-display text-2xl font-semibold tabular-nums text-tl-ink">
                  {formatPlanPrice(plan)}
                </p>
                <p className="mt-1 text-xs text-tl-ink-muted">
                  {plan.selfServe
                    ? "14-day trial available"
                    : "Scoped to your assurance needs"}
                </p>
                <div className="mt-6 flex flex-1 flex-col justify-end gap-2">
                  <Link
                    href={href}
                    className={`inline-flex justify-center rounded-md px-4 py-2.5 text-sm font-medium ${
                      highlighted
                        ? "bg-tl-trust text-white hover:bg-tl-trust-ink"
                        : "border border-tl-line text-tl-ink hover:bg-tl-surface"
                    }`}
                  >
                    {cta}
                  </Link>
                  {plan.selfServe ? (
                    <Link
                      href={`/trial?utm_source=home&utm_medium=pricing&utm_campaign=trial_${plan.id}`}
                      className="text-center text-sm font-medium text-tl-trust-ink underline underline-offset-2"
                    >
                      Start 14-day trial
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-tl-ink-muted">
          {DATA_PROTECTION_BLURB}
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-tl-ink-muted">
          Facilitation, MEL, IKS, and field intervention are{" "}
          <strong className="font-medium text-tl-ink">
            Chibase Consulting
          </strong>{" "}
          packages — separate entity, own pricing, available as an add-on to any
          of these plans at your request. They do not unlock TrustLedger
          modules.{" "}
          <a
            href={`${chibasePublicHref("/packages")}?utm_source=trustledger&utm_medium=pricing&utm_campaign=consulting_addon`}
            className="font-medium text-tl-trust-ink underline underline-offset-2"
          >
            Request a consulting package
          </a>
          .
        </p>

        <HomePricingComparison />
        <HomePricingPrivacyExtras />
      </div>
    </section>
  );
}
