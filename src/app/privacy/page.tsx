import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { OPERATOR_ORG, SITE_URL } from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How TrustLedger handles personal information for the public site, trials, and TrustLedger Cloud workspaces.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "TrustLedger Privacy",
    url: `${SITE_URL}/privacy`,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <MarketingChrome active="legal">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-tl-ink">
          Privacy
        </h1>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Last updated: 31 July 2026 · Operator: {OPERATOR_ORG.name}
        </p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-tl-ink-muted">
          <p>
            TrustLedger is operated by {OPERATOR_ORG.name}. This page summarises
            how we handle personal information on the public site
            (trustledger.co.za), contact and assessment forms, trials, and live
            TrustLedger Cloud workspaces (app.trustledger.co.za).
          </p>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">What we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Contact and sales enquiries (name, work email, organisation, message)</li>
              <li>Assessment unlock emails and diagnostic answers you submit</li>
              <li>Trial and account credentials needed to run your workspace</li>
              <li>
                Operational data you enter in a trial or paid workspace (projects,
                stakeholders, cases, evidence) — under your organisation&apos;s
                control
              </li>
              <li>Payment-related records required to process subscriptions</li>
            </ul>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">Why we process it</h2>
            <p className="mt-2">
              To respond to enquiries, provide the product, secure accounts,
              bill entitled plans, improve reliability, and meet legal duties
              (including POPIA where it applies).
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">Sharing</h2>
            <p className="mt-2">
              We use subprocessors required to host email, payments, and TrustLedger
              Cloud. We do not sell personal information. Optional deeper privacy
              layers (Trust Pack, private cloud, support-access visibility) are
              available on request via Contact.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-tl-ink">Your rights</h2>
            <p className="mt-2">
              You may request access, correction, or deletion of personal
              information we hold about you, subject to law and legitimate
              retention (for example billing records). Email{" "}
              <a
                href={`mailto:${OPERATOR_ORG.email}`}
                className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              >
                {OPERATOR_ORG.email}
              </a>{" "}
              or use{" "}
              <Link
                href="/contact"
                className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              >
                Contact
              </Link>
              .
            </p>
          </section>
          <p>
            This summary is not legal advice. Institutional buyers can request
            written processing terms as part of optional Trust Pack scoping.
          </p>
        </div>
      </main>
    </MarketingChrome>
  );
}
