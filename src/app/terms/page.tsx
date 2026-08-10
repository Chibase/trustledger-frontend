import type { Metadata } from "next";
import Link from "next/link";
import {
  OPERATOR_ORG,
  PRODUCT_DEFINITION,
  SITE_URL,
} from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: {
    absolute: "Terms — TrustLedger",
  },
  description:
    "Terms of use for the TrustLedger website, trials, and subscription service.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms — TrustLedger",
    description: PRODUCT_DEFINITION,
    url: `${SITE_URL}/terms`,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-full bg-gradient-to-b from-[#e8eef2] via-tl-paper to-tl-paper">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
          Terms of use
        </h1>
        <p className="mt-3 text-sm text-tl-ink-muted">
          These terms cover use of trustledger.co.za, trials, and paid
          TrustLedger workspaces. Last updated 10 August 2026. Institutional or
          Trust Pack contracts may add or replace clauses for that engagement.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-tl-ink">
          <section>
            <h2 className="font-display text-xl font-semibold">The service</h2>
            <p className="mt-2 text-tl-ink-muted">
              TrustLedger is Stakeholder Relationship Management software for
              grievance resolution, engagement, and audit-ready reporting. The
              public site explains the product; durable customer data runs on
              TrustLedger Cloud. AI Assist only suggests — a human must apply
              before anything is saved.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Accounts</h2>
            <p className="mt-2 text-tl-ink-muted">
              You must provide accurate registration details and keep credentials
              secure. Plan Owners control invites and seat roles. You are
              responsible for content your users enter and for lawful use of the
              desk (including community and personal information you process).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              Trials and payment
            </h2>
            <p className="mt-2 text-tl-ink-muted">
              Trials are time-limited own-data workspaces. Paid plans are billed
              in ZAR as shown at checkout (excl. VAT unless stated). Card
              payments are processed by Paystack. Cancel before trial end to avoid
              the first charge where that option is offered at subscribe time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              Acceptable use
            </h2>
            <p className="mt-2 text-tl-ink-muted">
              Do not abuse the service, attempt to access other organisations’
              workspaces, reverse-engineer beyond lawful interoperability, or use
              TrustLedger for unlawful surveillance or harassment. We may suspend
              accounts that threaten security or other customers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              Availability and liability
            </h2>
            <p className="mt-2 text-tl-ink-muted">
              We aim for reliable operation but do not warrant uninterrupted
              access. To the fullest extent permitted by South African law,
              TrustLedger and {OPERATOR_ORG.name} are not liable for indirect or
              consequential loss, or for decisions made solely on AI suggestions.
              Nothing here limits non-excludable consumer protections.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Contact</h2>
            <p className="mt-2 text-tl-ink-muted">
              Questions:{" "}
              <a
                href={`mailto:${OPERATOR_ORG.email}`}
                className="underline underline-offset-2"
              >
                {OPERATOR_ORG.email}
              </a>{" "}
              or the{" "}
              <Link href="/contact" className="underline underline-offset-2">
                contact form
              </Link>
              .
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-tl-ink-muted">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>
          {" · "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>
          {" · "}
          <Link href="/faq" className="underline underline-offset-2">
            FAQ
          </Link>
        </p>
      </div>
    </main>
  );
}
