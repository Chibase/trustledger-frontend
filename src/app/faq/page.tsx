import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/aeo/jsonLd";
import {
  PRODUCT_DEFINITION,
  PRODUCT_TAGLINE,
  PUBLIC_FAQS,
  SITE_URL,
} from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: "FAQ — TrustLedger SRM & grievance software",
  description:
    "Answers about TrustLedger Stakeholder Relationship Management software: grievances, Stakeholder Intelligence, AI Assist, plans, trials, MEL, community participation, and public-sector use in South Africa and the Global South.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "TrustLedger FAQ — SRM & grievance software",
    description: PRODUCT_DEFINITION,
    url: `${SITE_URL}/faq`,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
};

export default function FaqPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-[#e8eef2] via-tl-paper to-tl-paper">
      <JsonLd
        data={[
          organizationJsonLd(),
          softwareApplicationJsonLd(),
          faqPageJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
      <header className="border-b border-tl-line/80 bg-tl-surface/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-tl-ink"
          >
            TrustLedger
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/product"
              className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
            >
              Product
            </Link>
            <Link
              href="/trial"
              className="rounded-md bg-tl-trust px-3 py-1.5 font-medium text-white hover:bg-tl-trust-ink"
            >
              Start trial
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold text-tl-trust">Knowledge hub</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
          TrustLedger FAQ
        </h1>
        <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
          {PRODUCT_DEFINITION} Promise: {PRODUCT_TAGLINE}
        </p>

        <div className="mt-10 space-y-4">
          {PUBLIC_FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-tl-line bg-tl-surface px-4 py-3 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-tl-ink marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  {item.question}
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-tl-ink-muted transition group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 border-t border-tl-line pt-3 text-sm leading-relaxed text-tl-ink-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <section className="mt-12 rounded-lg border border-tl-line bg-tl-surface/80 px-5 py-6">
          <h2 className="text-lg font-semibold text-tl-ink">
            Capability snapshot
          </h2>
          <p className="mt-2 text-sm text-tl-ink-muted">
            What TrustLedger includes by commercial plan (excl. VAT, monthly
            ZAR). Full pricing on the marketing site and Subscribe page.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-tl-line text-tl-ink">
                  <th className="py-2 pr-3 font-semibold">Capability</th>
                  <th className="py-2 px-2 font-semibold">Solo</th>
                  <th className="py-2 px-2 font-semibold">Practitioner</th>
                  <th className="py-2 px-2 font-semibold">Project+</th>
                </tr>
              </thead>
              <tbody className="text-tl-ink-muted">
                {[
                  ["Grievance / incident desk", "Yes", "Yes", "Yes"],
                  ["AI Assist (suggest→apply)", "—", "Yes", "Yes"],
                  ["Stakeholder CRM", "—", "Add-on", "Yes"],
                  ["Engagements & commitments", "—", "Add-on", "Yes"],
                  ["Executive report pack", "—", "—", "Yes"],
                  ["Board presentation pack", "—", "—", "Institutional"],
                ].map(([cap, solo, prac, proj]) => (
                  <tr key={cap} className="border-b border-tl-line/70">
                    <td className="py-2 pr-3 text-tl-ink">{cap}</td>
                    <td className="py-2 px-2">{solo}</td>
                    <td className="py-2 px-2">{prac}</td>
                    <td className="py-2 px-2">{proj}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/readiness"
            className="inline-flex rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-semibold text-tl-ink hover:border-tl-trust"
          >
            SRM readiness check
          </Link>
          <Link
            href="/trial"
            className="inline-flex rounded-md bg-tl-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink"
          >
            Start 14-day trial
          </Link>
          <Link
            href="/product"
            className="inline-flex rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-semibold text-tl-ink hover:border-tl-trust"
          >
            Product overview
          </Link>
        </div>
      </main>
    </div>
  );
}
