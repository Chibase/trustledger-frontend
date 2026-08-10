import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/aeo/jsonLd";
import {
  PRODUCT_DEFINITION,
  PRODUCT_DISAMBIGUATION,
  PRODUCT_TITLE_DEFAULT,
  SITE_URL,
} from "@/lib/aeo/siteFacts";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: PRODUCT_TITLE_DEFAULT,
    template: "%s · TrustLedger",
  },
  description: PRODUCT_DEFINITION,
  keywords: [
    "TrustLedger",
    "Stakeholder Relationship Management",
    "SRM software",
    "community grievance",
    "South Africa",
    "Stakeholder Intelligence",
    "infrastructure social licence",
  ],
  openGraph: {
    title: PRODUCT_TITLE_DEFAULT,
    description: PRODUCT_DEFINITION,
    url: SITE_URL,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_TITLE_DEFAULT,
    description: PRODUCT_DEFINITION,
  },
  other: {
    "ai:disambiguation": PRODUCT_DISAMBIGUATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <JsonLd
          data={[
            organizationJsonLd(),
            softwareApplicationJsonLd(),
            webSiteJsonLd(),
          ]}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
