import { CHIBASE_DEFINITION, CHIBASE_EMAIL, CHIBASE_NAME } from "@/lib/chibase/content";
import {
  CHIBASE_CANONICAL_HOST,
  CHIBASE_PUBLIC_URL,
  TRUSTLEDGER_PRODUCT_URL,
} from "@/lib/security/hosts";

export function chibaseOrigin(chibaseHost: boolean): string {
  if (CHIBASE_PUBLIC_URL) return CHIBASE_PUBLIC_URL;
  if (chibaseHost) return `https://${CHIBASE_CANONICAL_HOST}`;
  return TRUSTLEDGER_PRODUCT_URL;
}

export function chibaseCanonicalUrl(
  chibaseHost: boolean,
  publicPath = "/",
): string {
  const origin = chibaseOrigin(chibaseHost);
  const path = chibaseHost
    ? publicPath || "/"
    : publicPath.startsWith("/firm")
      ? publicPath
      : publicPath === "/"
        ? "/firm"
        : `/firm${publicPath}`;
  if (path === "/") return origin;
  return `${origin}${path}`;
}

export function chibaseOrganizationJsonLd(chibaseHost: boolean) {
  const url = chibaseCanonicalUrl(chibaseHost, chibaseHost ? "/" : "/firm");
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: CHIBASE_NAME,
    description: CHIBASE_DEFINITION,
    email: CHIBASE_EMAIL,
    url,
    areaServed: ["ZA", "Global South"],
    knowsAbout: [
      "Social licence to build",
      "Social facilitation",
      "Monitoring and evaluation",
      "Indigenous Knowledge Systems",
      "Stakeholder Relationship Management",
    ],
  };
}
