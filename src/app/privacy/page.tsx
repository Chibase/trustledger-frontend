import type { Metadata } from "next";
import Link from "next/link";
import {
  OPERATOR_ORG,
  PRODUCT_DEFINITION,
  SITE_URL,
} from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: {
    absolute: "Privacy — TrustLedger",
  },
  description:
    "How TrustLedger handles personal information for marketing, trials, and customer workspaces (POPIA-aware summary).",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy — TrustLedger",
    description: PRODUCT_DEFINITION,
    url: `${SITE_URL}/privacy`,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-full bg-gradient-to-b from-[#e8eef2] via-tl-paper to-tl-paper">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
          Privacy
        </h1>
        <p className="mt-3 text-sm text-tl-ink-muted">
          Summary of how we handle personal information. Last updated 10 August
          2026. For contract-grade terms (DPA / Trust Pack),{" "}
          <Link href="/contact" className="underline underline-offset-2">
            contact us
          </Link>
          .
        </p>

        <div className="prose-tl mt-10 space-y-8 text-sm leading-relaxed text-tl-ink">
          <section>
            <h2 className="font-display text-xl font-semibold">Who we are</h2>
            <p className="mt-2 text-tl-ink-muted">
              TrustLedger is operated by {OPERATOR_ORG.name} (
              <a
                href={OPERATOR_ORG.url}
                className="underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                {OPERATOR_ORG.url.replace(/^https?:\/\//, "")}
              </a>
              ). Contact:{" "}
              <a
                href={`mailto:${OPERATOR_ORG.email}`}
                className="underline underline-offset-2"
              >
                {OPERATOR_ORG.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              What we collect
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-tl-ink-muted">
              <li>
                <strong className="text-tl-ink">Marketing and leads</strong> —
                name, work email, organisation, role, message, and optional
                assessment or quote details you submit on trustledger.co.za.
              </li>
              <li>
                <strong className="text-tl-ink">Trials and billing</strong> —
                account and payment references needed to open a workspace and
                process Paystack charges you authorise.
              </li>
              <li>
                <strong className="text-tl-ink">Product use</strong> — content
                you enter in your TrustLedger workspace (cases, stakeholders,
                reports, files) and technical logs needed to secure and run the
                service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Why we use it</h2>
            <p className="mt-2 text-tl-ink-muted">
              To respond to enquiries, run trials and subscriptions, deliver the
              SRM product, improve reliability and security, and meet lawful
              obligations. We do not sell personal information. Your workspace
              content is not used to train external AI models.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Where it lives</h2>
            <p className="mt-2 text-tl-ink-muted">
              Public site and forms: trustledger.co.za. Live customer workspaces:
              TrustLedger Cloud at app.trustledger.co.za. Each organisation runs
              in its own workspace; platform support access is allowlisted.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Retention</h2>
            <p className="mt-2 text-tl-ink-muted">
              Lead and marketing records are kept while useful for follow-up or
              legal need. Trial workspace data is retained for three months after
              an unused trial ends unless you upgrade or ask us to delete sooner.
              Paying customers: retention follows your plan and any written purge
              commitment (Trust Pack / contract).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Your choices</h2>
            <p className="mt-2 text-tl-ink-muted">
              Email {OPERATOR_ORG.email} to access, correct, or request deletion
              of personal information we hold about you, or to opt out of
              marketing mail. Product Operators can also manage workspace users
              inside the app.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-tl-ink-muted">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>
          {" · "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
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
