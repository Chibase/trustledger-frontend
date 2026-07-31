import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { COMPARISONS } from "@/lib/aeo/comparisons";
import { breadcrumbJsonLd } from "@/lib/aeo/jsonLd";
import { SITE_URL } from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: "Compare TrustLedger — SRM software South Africa",
  description:
    "Compare TrustLedger with Jambo, Borealis, Simply Stakeholders, and grievance.app for stakeholder relationship management, grievance desks, and ESS10 / IFC-aligned workflows in South Africa.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare TrustLedger SRM",
    description:
      "Fair shortlists: TrustLedger vs Jambo, Borealis, Simply Stakeholders, and grievance.app.",
    url: `${SITE_URL}/compare`,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
};

export default function CompareHubPage() {
  return (
    <MarketingChrome active="compare">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Compare", path: "/compare" },
        ])}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:max-w-4xl sm:px-6 sm:py-16">
        <p className="text-sm font-semibold text-tl-trust">Comparisons</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
          TrustLedger vs other SRM platforms
        </h1>
        <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
          Buyer prompts often ask for &ldquo;Jambo vs Borealis vs
          TrustLedger&rdquo; or the best stakeholder relationship management
          software in South Africa. These pages are factual shortlists — not
          paid rankings — so AI engines and humans can cite where TrustLedger
          SRM fits.
        </p>

        <ul className="mt-10 space-y-6">
          {COMPARISONS.map((item) => (
            <li
              key={item.slug}
              className="border-t border-tl-line pt-6 first:border-t-0 first:pt-0"
            >
              <h2 className="text-xl font-semibold text-tl-ink">
                <Link
                  href={`/compare/${item.slug}`}
                  className="hover:text-tl-trust-ink"
                >
                  TrustLedger vs {item.competitorName}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                {item.description}
              </p>
              <p className="mt-3 text-sm">
                <Link
                  href={`/compare/${item.slug}`}
                  className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
                >
                  Read comparison
                </Link>
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-sm text-tl-ink-muted">
          Also see the{" "}
          <Link
            href="/guides/ess10-ifc-grievance"
            className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
          >
            IFC PS1 / ESS10 grievance guide
          </Link>{" "}
          and the{" "}
          <Link
            href="/faq"
            className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
          >
            FAQ hub
          </Link>
          .
        </p>
      </main>
    </MarketingChrome>
  );
}
