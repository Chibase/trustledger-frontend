import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { FirmFooter } from "@/components/chibase/FirmFooter";
import { FirmHeader } from "@/components/chibase/FirmHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHIBASE_DEFINITION, CHIBASE_NAME } from "@/lib/chibase/content";
import {
  chibaseCanonicalUrl,
  chibaseOrganizationJsonLd,
} from "@/lib/chibase/jsonLd";
import { isChibaseHost } from "@/lib/security/hosts";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const chibaseHost = isChibaseHost(host);
  const publicPath =
    (await headers()).get("x-tl-public-path") || (chibaseHost ? "/" : "/firm");
  const index =
    chibaseHost ||
    (process.env.NEXT_PUBLIC_CHIBASE_INDEX_PREVIEW || "").trim() === "1";
  const canonical = chibaseCanonicalUrl(chibaseHost, publicPath);
  return {
    title: {
      default: CHIBASE_NAME,
      template: `%s · ${CHIBASE_NAME}`,
    },
    description: CHIBASE_DEFINITION,
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: { canonical },
    openGraph: {
      title: CHIBASE_NAME,
      description: CHIBASE_DEFINITION,
      siteName: CHIBASE_NAME,
      url: canonical,
      locale: "en_ZA",
      type: "website",
    },
  };
}

export default async function FirmLayout({
  children,
}: {
  children: ReactNode;
}) {
  const host = (await headers()).get("host");
  const chibaseHost = isChibaseHost(host);
  return (
    <div className="flex min-h-full flex-col bg-tl-paper">
      <JsonLd data={chibaseOrganizationJsonLd(chibaseHost)} />
      <FirmHeader chibaseHost={chibaseHost} />
      <main className="flex-1">{children}</main>
      <FirmFooter chibaseHost={chibaseHost} />
    </div>
  );
}
