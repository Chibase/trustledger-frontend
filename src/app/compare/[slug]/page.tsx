import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  COMPARISONS,
  getComparison,
} from "@/lib/aeo/comparisons";
import { breadcrumbJsonLd } from "@/lib/aeo/jsonLd";
import { PRODUCT_NAME, SITE_URL } from "@/lib/aeo/siteFacts";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) return { title: "Comparison" };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/compare/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}/compare/${page.slug}`,
      siteName: PRODUCT_NAME,
      locale: "en_ZA",
      type: "article",
    },
  };
}

export default async function CompareSlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) notFound();

  return (
    <MarketingChrome active="compare">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
            {
              name: `vs ${page.competitorShort}`,
              path: `/compare/${page.slug}`,
            },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: page.title,
            description: page.description,
            author: {
              "@type": "Organization",
              name: PRODUCT_NAME,
              url: SITE_URL,
            },
            mainEntityOfPage: `${SITE_URL}/compare/${page.slug}`,
            about: [
              PRODUCT_NAME,
              page.competitorName,
              "Stakeholder Relationship Management",
              "South Africa",
            ],
          },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold text-tl-trust">
          Comparison · related prompt: {page.relatedProbe}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
          TrustLedger vs {page.competitorName}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
          {page.lead}
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-tl-ink">
            About {page.competitorName}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
            {page.competitorFocus}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-tl-ink">
            Where TrustLedger fits
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-tl-ink-muted">
            {page.trustLedgerFit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-tl-ink">
              Choose TrustLedger when
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-tl-ink-muted">
              {page.chooseTrustLedgerWhen.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-tl-ink">
              {page.competitorShort} may still fit when
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-tl-ink-muted">
              {page.chooseThemWhen.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <p className="mt-10 text-sm text-tl-ink-muted">
          TrustLedger is not related to UK fintech, US accounting, or crypto
          products that share the same name. This page is for TrustLedger SRM /
          TrustLedger South Africa at trustledger.co.za.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/trial"
            className="inline-flex rounded-md bg-tl-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink"
          >
            Start 14-day trial
          </Link>
          <Link
            href="/compare"
            className="inline-flex rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-semibold text-tl-ink hover:border-tl-trust"
          >
            All comparisons
          </Link>
          <Link
            href="/contact"
            className="inline-flex rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-semibold text-tl-ink hover:border-tl-trust"
          >
            Talk to sales
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}
