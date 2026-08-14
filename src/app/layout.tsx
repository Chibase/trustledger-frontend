import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { headers } from "next/headers";
import { JsonLd } from "@/components/seo/JsonLd";
import { ThembaWidget } from "@/components/themba/ThembaWidget";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "@/lib/aeo/jsonLd";
import { PRODUCT_DEFINITION } from "@/lib/aeo/siteFacts";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustledger-frontend-pi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TrustLedger",
    template: "%s · TrustLedger",
  },
  description: PRODUCT_DEFINITION,
  openGraph: {
    title: "TrustLedger — Resolution you can audit",
    description: PRODUCT_DEFINITION,
    url: siteUrl,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustLedger — Resolution you can audit",
    description: PRODUCT_DEFINITION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = (await headers()).get("x-tl-site");
  const isFirm = site === "chibase";
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {isFirm ? null : (
          <JsonLd
            data={[
              organizationJsonLd(),
              softwareApplicationJsonLd(),
              webSiteJsonLd(),
            ]}
          />
        )}
        {children}
        {isFirm ? null : <ThembaWidget />}
        <Analytics />
      </body>
    </html>
  );
}
