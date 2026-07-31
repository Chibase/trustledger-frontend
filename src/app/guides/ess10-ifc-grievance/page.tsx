import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/aeo/jsonLd";
import { PRODUCT_NAME, SITE_URL } from "@/lib/aeo/siteFacts";

const GUIDE_FAQS = [
  {
    question:
      "What is a World Bank ESS10 grievance mechanism in practical terms?",
    answer:
      "ESS10 expects project-affected people to have an accessible channel to raise concerns, receive a response, and see how issues were handled — with a trail that can be reviewed. Digitising that mechanism usually means structured intake, ownership, evidence, stage timestamps, and reports — not only an email inbox.",
  },
  {
    question: "How does IFC Performance Standard 1 relate to grievance desks?",
    answer:
      "IFC PS1 expects effective stakeholder engagement and a grievance mechanism as part of social and environmental management. Software does not replace the standard; it helps operators run intake, case handling, and evidence so assurance teams can see what happened.",
  },
  {
    question: "Can TrustLedger certify IFC or World Bank compliance?",
    answer:
      "No. TrustLedger is operational SRM software. It supports how many organisations implement PS1-style and ESS10-aligned grievance mechanisms in practice. Certification and lender approval remain with the borrower, consultants, and the finance institution.",
  },
  {
    question:
      "Is TrustLedger grievance management software for South African mining?",
    answer:
      "Yes — the Version 001 resolution desk is used for community grievances on programmes where mining, energy, and infrastructure social licence is at stake. South African municipalities, wards, and traditional councils (where packed) ship with every plan.",
  },
] as const;

export const metadata: Metadata = {
  title: "Digitising ESS10 & IFC PS1 grievance mechanisms — TrustLedger",
  description:
    "How TrustLedger helps South African and Global South operators digitise World Bank ESS10 and IFC Performance Standard 1–style grievance mechanisms — intake, ownership, evidence, and audit-ready reports.",
  alternates: { canonical: "/guides/ess10-ifc-grievance" },
  openGraph: {
    title: "ESS10 & IFC PS1 grievance mechanisms on TrustLedger",
    description:
      "Operational guide to digitising grievance mechanisms aligned with ESS10 and IFC PS1 practice — not a certification claim.",
    url: `${SITE_URL}/guides/ess10-ifc-grievance`,
    siteName: PRODUCT_NAME,
    locale: "en_ZA",
    type: "article",
  },
};

export default function Ess10IfcGuidePage() {
  return (
    <MarketingChrome active="guides">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides/ess10-ifc-grievance" },
            {
              name: "ESS10 & IFC PS1",
              path: "/guides/ess10-ifc-grievance",
            },
          ]),
          faqPageJsonLd([...GUIDE_FAQS]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "Digitising ESS10 and IFC PS1 grievance mechanisms with TrustLedger",
            description:
              "Operational guide for South African and Global South programmes implementing grievance desks aligned with ESS10 and IFC PS1 practice.",
            author: {
              "@type": "Organization",
              name: PRODUCT_NAME,
              url: SITE_URL,
            },
            mainEntityOfPage: `${SITE_URL}/guides/ess10-ifc-grievance`,
            about: [
              "World Bank ESS10",
              "IFC Performance Standards",
              "Grievance mechanism",
              "Stakeholder Relationship Management",
              "South Africa",
            ],
          },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold text-tl-trust">Guide</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
          Digitising an ESS10 or IFC PS1 grievance mechanism
        </h1>
        <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
          AI buyer prompts often ask how to digitise World Bank ESS10 or IFC
          Performance Standard 1 grievance mechanisms. This guide explains what
          that means in operations — and how TrustLedger SRM supports the desk
          without claiming certification.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-tl-ink">
            What “digitising” should mean
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-tl-ink-muted">
            <li>Accessible intake for project-affected people and field teams</li>
            <li>Named ownership and priority on every case</li>
            <li>Evidence and notes attached to the trail</li>
            <li>Stage timestamps from reported through closed</li>
            <li>Reports that cite the same system the desk runs on</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-tl-ink">
            How TrustLedger maps to that desk
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-tl-ink-muted">
            <li>
              Version 001 grievance resolution desk — intake, cases, evidence,
              close-out
            </li>
            <li>
              Version 002 Stakeholder Intelligence — registry, engagements,
              commitments beside the case trail on entitled plans
            </li>
            <li>
              South African place context included; Global South programmes in
              mind
            </li>
            <li>
              AI Assist suggests wording or next steps only; a human applies
              before save — cases are never auto-closed by AI
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-tl-ink">
            Honest boundary
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
            Lenders, IFC, and the World Bank do not “approve” TrustLedger by
            installing software. Your ESMPs, consultants, and facility
            agreements remain authoritative. TrustLedger is the operational
            system of record for the grievance and stakeholder trail.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-tl-ink">FAQ</h2>
          {GUIDE_FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-tl-line bg-tl-surface px-4 py-3 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-tl-ink marker:content-none [&::-webkit-details-marker]:hidden">
                {item.question}
              </summary>
              <p className="mt-3 border-t border-tl-line pt-3 text-sm leading-relaxed text-tl-ink-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/assessment"
            className="inline-flex rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-semibold text-tl-ink hover:border-tl-trust"
          >
            SRM readiness assessment
          </Link>
          <Link
            href="/compare/grievance-app"
            className="inline-flex rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-semibold text-tl-ink hover:border-tl-trust"
          >
            vs grievance.app
          </Link>
          <Link
            href="/trial"
            className="inline-flex rounded-md bg-tl-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink"
          >
            Start 14-day trial
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}
