import type { Metadata } from "next";
import { HomeBenefitStrip } from "@/components/marketing/HomeBenefitStrip";
import { HomeFinalCta } from "@/components/marketing/HomeFinalCta";
import { HomeFooter } from "@/components/marketing/HomeFooter";
import { HomeHeader } from "@/components/marketing/HomeHeader";
import { HomeHero } from "@/components/marketing/HomeHero";
import { HomeHowItWorks } from "@/components/marketing/HomeHowItWorks";
import { HomePricing } from "@/components/marketing/HomePricing";
import { HomeSectors } from "@/components/marketing/HomeSectors";
import { HomeTrustProof } from "@/components/marketing/HomeTrustProof";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustledger-frontend-pi.vercel.app";

export const metadata: Metadata = {
  title: "Turn Community Risk into Measurable Trust Outcomes",
  description:
    "TrustLedger helps operators run grievance resolution and governance-grade ESG reporting in low-connectivity, multilingual field environments. Preview in 2 minutes — no signup required.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TrustLedger — Measurable Trust Outcomes",
    description:
      "Preview grievance resolution, trust visibility, and audit-ready ESG evidence. No signup required to walk through the product.",
    url: siteUrl,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/marketing/trustledger-hero-dashboard.png",
        width: 1536,
        height: 1024,
        alt: "TrustLedger dashboard overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustLedger — Measurable Trust Outcomes",
    description:
      "Run a 2-minute live walkthrough. No signup required to preview.",
    images: ["/marketing/trustledger-hero-dashboard.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <main>
        <HomeHero />
        <HomeBenefitStrip />
        <HomeHowItWorks />
        <HomeTrustProof />
        <HomeSectors />
        <HomePricing />
        <HomeFinalCta />
      </main>
      <HomeFooter />
    </>
  );
}
