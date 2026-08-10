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
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageJsonLd } from "@/lib/aeo/jsonLd";
import {
  PRODUCT_DEFINITION,
  PRODUCT_TITLE_DEFAULT,
  SITE_URL,
} from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: {
    absolute: PRODUCT_TITLE_DEFAULT,
  },
  description: PRODUCT_DEFINITION,
  alternates: { canonical: "/" },
  openGraph: {
    title: PRODUCT_TITLE_DEFAULT,
    description: PRODUCT_DEFINITION,
    url: SITE_URL,
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
    title: PRODUCT_TITLE_DEFAULT,
    description: PRODUCT_DEFINITION,
    images: ["/marketing/trustledger-hero-dashboard.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd()} />
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
