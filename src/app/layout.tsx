import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  description:
    "Stakeholder relations management — community trust, incident resolution, and governance-grade reporting.",
  openGraph: {
    title: "TrustLedger",
    description:
      "Try the interactive Demo for community, contractor, client, and admin workflows.",
    url: siteUrl,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustLedger",
    description:
      "Stakeholder relations management with an interactive product Demo.",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
