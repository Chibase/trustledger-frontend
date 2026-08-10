import {
  MARKETING_SITE_URL,
  OPERATOR_ORG,
  PRODUCT_DEFINITION,
  PRODUCT_DISAMBIGUATION,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
  PRODUCT_TOPICS,
  PUBLIC_FAQS,
  SITE_URL,
  type FaqItem,
} from "@/lib/aeo/siteFacts";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PRODUCT_NAME,
    alternateName: [
      "TrustLedger SRM",
      "TrustLedger Stakeholder Relationship Management",
    ],
    legalName: OPERATOR_ORG.name,
    url: MARKETING_SITE_URL,
    logo: `${SITE_URL}/marketing/trustledger-logo.png`,
    description: PRODUCT_DEFINITION,
    disambiguatingDescription: PRODUCT_DISAMBIGUATION,
    email: OPERATOR_ORG.email,
    areaServed: ["ZA", "Global South"],
    knowsAbout: [...PRODUCT_TOPICS],
    // External entity links only — do not repeat Organization.url (marketing apex).
    sameAs: [...new Set([OPERATOR_ORG.url, SITE_URL].filter((u) => u !== MARKETING_SITE_URL))],
    brand: {
      "@type": "Brand",
      name: PRODUCT_NAME,
      slogan: PRODUCT_TAGLINE,
      description: PRODUCT_DISAMBIGUATION,
    },
  };
}

export function softwareApplicationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: PRODUCT_NAME,
    alternateName: [
      "TrustLedger SRM",
      "TrustLedger Stakeholder Intelligence",
    ],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Stakeholder Relationship Management",
    operatingSystem: "Web",
    url: `${SITE_URL}/product`,
    description: PRODUCT_DEFINITION,
    disambiguatingDescription: PRODUCT_DISAMBIGUATION,
    audience: {
      "@type": "Audience",
      audienceType:
        "Infrastructure operators, municipalities, contractors, and community-trust practitioners",
      geographicArea: {
        "@type": "AdministrativeArea",
        name: "South Africa",
      },
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ZAR",
      lowPrice: "1999",
      highPrice: "14999",
      offerCount: 3,
      url: `${SITE_URL}/pay`,
    },
    provider: {
      "@type": "Organization",
      name: OPERATOR_ORG.name,
      url: OPERATOR_ORG.url,
    },
    featureList: [
      "Grievance resolution desk",
      "Stakeholder registry (CRM)",
      "Engagements and commitments",
      "AI Assist suggest-apply-save",
      "Governance and board report packs",
      "South African geo and place context",
    ],
    keywords: PRODUCT_TOPICS.join(", "),
  };
}

export function webSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: PRODUCT_NAME,
    alternateName: "TrustLedger SRM",
    url: SITE_URL,
    description: PRODUCT_DEFINITION,
    inLanguage: "en-ZA",
    publisher: {
      "@type": "Organization",
      name: PRODUCT_NAME,
      url: MARKETING_SITE_URL,
    },
  };
}

export function faqPageJsonLd(faqs: FaqItem[] = PUBLIC_FAQS): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
