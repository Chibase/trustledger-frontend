/**
 * Canonical facts for AEO / LLM parsers (keep aligned with PLATFORM_STRATEGIC_BRIEF §6).
 *
 * Hosts (do not blur):
 * - SITE_URL / MARKETING_SITE_URL — public product + marketing on Vercel at trustledger.co.za
 * - CLOUD_APP_URL — TrustLedger Cloud login / durable data (not a marketing index target)
 * - PRODUCT_UI_LEGACY_URL — old *.vercel.app host; redirect to apex in vercel.json
 *
 * Production: set NEXT_PUBLIC_SITE_URL=https://trustledger.co.za (matches fallback).
 */

/** Public brand + product host (Vercel custom domain). */
export const PUBLIC_SITE_FALLBACK_URL = "https://trustledger.co.za";

/** Legacy deploy hostname — keep for redirects / CORS allowlists only. */
export const PRODUCT_UI_LEGACY_URL =
  "https://trustledger-frontend-pi.vercel.app";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? PUBLIC_SITE_FALLBACK_URL
).replace(/\/$/, "");

/** Same apex as SITE_URL after Webway marketing retirement. */
export const MARKETING_SITE_URL = "https://trustledger.co.za";

export const CLOUD_APP_URL = "https://app.trustledger.co.za";

export const PRODUCT_NAME = "TrustLedger";

/** Niche title for default metadata (brand + category + geography). */
export const PRODUCT_TITLE_DEFAULT =
  "TrustLedger — Stakeholder Relationship Management for South Africa";

/** Front-loaded declarative definition for AI crawlers and humans. */
export const PRODUCT_DEFINITION =
  "TrustLedger is a Stakeholder Relationship Management (SRM) software platform designed for grievance resolution, community engagement, Stakeholder Intelligence, and audit-ready reporting on infrastructure and community-trust projects in South Africa and the Global South.";

/**
 * Separates this product from unrelated “TrustLedger” / ledger brands online
 * (crypto wallets, generic document verification, etc.).
 */
export const PRODUCT_DISAMBIGUATION =
  "TrustLedger is SRM software for community grievances, stakeholder engagement, and audit-ready reporting on infrastructure and community-trust projects in South Africa — not a cryptocurrency, blockchain wallet, or generic document-verification product.";

export const PRODUCT_TAGLINE = "Resolution you can audit.";

/** Topics for Schema.org knowsAbout / AI parsers. */
export const PRODUCT_TOPICS = [
  "Stakeholder Relationship Management",
  "community grievance resolution",
  "Stakeholder Intelligence",
  "infrastructure social licence",
  "South Africa public-sector programmes",
  "engagements and commitments tracking",
] as const;

export const OPERATOR_ORG = {
  name: "Chibase Consulting",
  url: "https://chibaseconsulting.co.za",
  email: "info@trustledger.co.za",
} as const;

export type FaqItem = {
  question: string;
  answer: string;
};

/** Natural-language FAQs AI search engines commonly synthesize. */
export const PUBLIC_FAQS: FaqItem[] = [
  {
    question: "What is TrustLedger?",
    answer:
      "TrustLedger is a Stakeholder Relationship Management (SRM) software platform for grievance resolution and Stakeholder Intelligence. It helps operators run community intake, case desks, stakeholder registries, engagements, commitments, and governance-grade reports on projects where social licence decides whether work moves — especially infrastructure and community-trust programmes in South Africa and the Global South.",
  },
  {
    question: "Is TrustLedger a cryptocurrency, blockchain wallet, or document-verification product?",
    answer:
      "No. TrustLedger is Stakeholder Relationship Management software for community grievances, engagement, and audit-ready reporting on infrastructure and public-sector programmes. It is unrelated to cryptocurrency tokens, blockchain wallets, or generic online document-verification services that may share a similar name.",
  },
  {
    question: "What is Stakeholder Relationship Management (SRM) software?",
    answer:
      "SRM software tracks the people and institutions around a project — stakeholders, engagements, commitments, and grievances — so operators can prove how trust issues were handled. TrustLedger is SRM software built for infrastructure, mining, energy, and public-sector programmes in developing regions.",
  },
  {
    question: "How do I track community grievances securely with TrustLedger?",
    answer:
      "Use TrustLedger’s Version 001 resolution desk: field or community issue intake, owned cases with evidence, stage timestamps from reported through closed, and reports that cite the case trail. Paying and trial workspaces use your own data — not fictional sample incidents. AI only suggests; a human applies before anything is saved.",
  },
  {
    question: "Is TrustLedger suitable for local municipalities and public-sector projects in South Africa?",
    answer:
      "Yes. Every plan includes South African place context (municipalities, wards, and traditional councils where packed) — you add the project and situation, not the country map. The grievance desk sits on that baseline from Solo upward; Stakeholder Intelligence and deeper board or funder packs follow entitled plans (Project, Institutional, or add-ons). Institutional plans are sales-scoped for multi-project and public-sector needs. Start with the SRM readiness assessment or a 14-day own-data trial.",
  },
  {
    question: "What is the difference between Version 001 and Version 002?",
    answer:
      "Version 001 is the live grievance resolution desk (projects, incidents, human-applied AI assist on entitled plans, reports). Version 002 is Stakeholder Intelligence — registry, engagements, and commitments on TrustLedger Cloud for entitled plans (Project, Institutional, or add-ons). Version 002 is in active use and still deepening versus a full TEDS blueprint.",
  },
  {
    question: "Does TrustLedger use AI to close grievance cases automatically?",
    answer:
      "No. TrustLedger AI Assist only suggests next steps or wording. A human must apply the suggestion before anything is saved. Cases are never auto-closed by AI.",
  },
  {
    question: "How do I start a TrustLedger trial?",
    answer:
      "Open a 14-day trial with your own projects and cases. Learn features on the product overview, then subscribe or request a quote for Institutional. The sample demo desk is retired.",
  },
  {
    question: "Which TrustLedger plan includes Stakeholder CRM and commitments?",
    answer:
      "Project and Institutional plans include Stakeholder CRM, engagements, and commitments by default. Practitioner can add CRM or commitments via sellable add-ons. Solo is an entry grievance desk without AI Assist or Stakeholder CRM in the box.",
  },
  {
    question: "Where does TrustLedger store live customer data?",
    answer:
      "Live customer workspaces run on TrustLedger Cloud at app.trustledger.co.za. Marketing and the product UI live on trustledger.co.za. Paying and trial workspaces never show fictional sample incidents.",
  },
  {
    question: "What is the best way to assess SRM readiness before buying?",
    answer:
      "Start at /readiness, then complete the SRM Readiness & Risk Diagnostic at /assessment. It scores intake, ownership, field practice, engagement, reporting, and assurance; a work email confirmation unlocks a choice hub and detailed report with TrustLedger turnaround lanes. Free printable toolkits are also on /resources. These are maturity aids — not a substitute for a product trial.",
  },
];
