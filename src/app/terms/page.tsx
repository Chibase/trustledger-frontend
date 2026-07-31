import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { OPERATOR_ORG, SITE_URL } from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "Terms for using the TrustLedger public site, trials, and commercial subscriptions.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "TrustLedger Terms",
    url: `${SITE_URL}/terms`,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <MarketingChrome active="legal">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-tl-ink">
          Terms of use
        </h1>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Last updated: 31 July 2026 · Operator: {OPERATOR_ORG.name}
        </p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-tl-ink-muted">
          <p>
            By using trustledger.co.za, starting a trial, or subscribing to
            TrustLedger, you agree to these terms. TrustLedger is operated by{" "}
            {OPERATOR_ORG.name}.
          </p>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">The service</h2>
            <p className="mt-2">
              TrustLedger is Stakeholder Relationship Management software for
              grievance resolution, community engagement, Stakeholder
              Intelligence, and related reporting. Features depend on your plan
              entitlements. Live customer workspaces run on TrustLedger Cloud at
              app.trustledger.co.za.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">Trials</h2>
            <p className="mt-2">
              Trials use your own data. Do not enter information you are not
              authorised to process. Sample demo desks are retired. If you do
              not upgrade, trial data retention follows the notice shown at
              trial start (currently up to three months unless you delete
              sooner or we agree otherwise in writing).
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">
              Acceptable use
            </h2>
            <p className="mt-2">
              You must not misuse the service, attempt unauthorised access,
              upload unlawful content, or use TrustLedger to harm individuals or
              communities. You are responsible for the accuracy of data your
              users enter and for obtaining any consents required for community
              or personal information.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">
              Fees and plans
            </h2>
            <p className="mt-2">
              Paid plans are priced in ZAR as published on the site unless a
              written quote says otherwise. Institutional and optional privacy
              layers may be sales-scoped. Subscription and billing terms shown
              at checkout apply.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">
              No over-claims
            </h2>
            <p className="mt-2">
              TrustLedger does not guarantee IFC, World Bank, or other
              certification outcomes. AI Assist only suggests; humans must apply
              before save.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">Contact</h2>
            <p className="mt-2">
              Questions:{" "}
              <a
                href={`mailto:${OPERATOR_ORG.email}`}
                className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              >
                {OPERATOR_ORG.email}
              </a>{" "}
              or{" "}
              <Link
                href="/contact"
                className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              >
                Contact
              </Link>
              . VIP / beta agreements may add terms that prevail for those
              programmes.
            </p>
          </section>
        </div>
      </main>
    </MarketingChrome>
  );
}
