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
import { HomeVersionStrip } from "@/components/marketing/HomeVersionStrip";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustledger-frontend-pi.vercel.app";

export const metadata: Metadata = {
  title: "Turn Community Risk into Measurable Trust Outcomes",
  description:
    "TrustLedger helps operators run grievance resolution and Stakeholder Intelligence in low-connectivity, multilingual field environments. Start a 14-day trial with your own workspace.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TrustLedger — Measurable Trust Outcomes",
    description:
      "Grievance resolution, Stakeholder Intelligence, and audit-ready ESG evidence. Start a trial or sign in live.",
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
      "Start a 14-day trial with your own workspace — or sign in live on Cloud.",
    images: ["/marketing/trustledger-hero-dashboard.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <main>
        <HomeHero />
        <HomeVersionStrip />
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
