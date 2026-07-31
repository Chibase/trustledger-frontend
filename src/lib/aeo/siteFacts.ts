/**
 * Canonical facts for AEO / LLM parsers (keep aligned with PLATFORM_STRATEGIC_BRIEF §6).
 * ADR-042: public site defaults to apex trustledger.co.za (set NEXT_PUBLIC_SITE_URL in Production).
 */

export const CANONICAL_PUBLIC_ORIGIN = "https://trustledger.co.za";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_PUBLIC_ORIGIN
).replace(/\/$/, "");

/** Organization schema entity URL — always the apex brand host. */
export const MARKETING_SITE_URL = CANONICAL_PUBLIC_ORIGIN;

export const PRODUCT_NAME = "TrustLedger";

/** Disambiguators for schema / titles — product name stays TrustLedger (ADR-039). */
export const PRODUCT_ALTERNATE_NAMES = [
  "TrustLedger SRM",
  "TrustLedger South Africa",
] as const;

/** Front-loaded declarative definition for AI crawlers and humans. */
export const PRODUCT_DEFINITION =
  "TrustLedger is a Stakeholder Relationship Management (SRM) software platform from South Africa (operated by Chibase Consulting) for grievance resolution, community engagement, Stakeholder Intelligence, and audit-ready reporting on infrastructure and community-trust projects in South Africa and the Global South. It is not related to similarly named fintech, accounting, or crypto products outside this SRM category.";

export const PRODUCT_TAGLINE = "Resolution you can audit.";

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
      "TrustLedger (also referred to as TrustLedger SRM or TrustLedger South Africa) is a Stakeholder Relationship Management software platform for grievance resolution and Stakeholder Intelligence. Operated by Chibase Consulting, it helps operators run community intake, case desks, stakeholder registries, engagements, commitments, and governance-grade reports on projects where social licence decides whether work moves.",
  },
  {
    question: "Is TrustLedger the UK fintech, US accounting firm, or crypto product with the same name?",
    answer:
      "No. This TrustLedger is South African SRM software for grievance desks, community engagement, and Stakeholder Intelligence on infrastructure and community-trust projects. It is a distinct product from any UK fintech, US accounting practice, or crypto token that happens to share the TrustLedger name. The public site is trustledger.co.za; live workspaces run on TrustLedger Cloud at app.trustledger.co.za.",
  },
  {
    question: "What is Stakeholder Relationship Management (SRM) software?",
    answer:
      "SRM software tracks the people and institutions around a project — stakeholders, engagements, commitments, and grievances — so operators can prove how trust issues were handled. TrustLedger is SRM software built for infrastructure, mining, energy, and public-sector programmes in developing regions.",
  },
  {
    question: "Does TrustLedger support IFC Performance Standards or World Bank ESS10 grievance mechanisms?",
    answer:
      "TrustLedger’s grievance resolution desk is built so operators can run intake, ownership, evidence, stage timestamps, and audit-ready reports that support how many organisations implement IFC PS1-style and ESS10-aligned grievance mechanisms in practice. It is operational software — not a certification body — and does not claim automatic IFC or World Bank approval. Use the public FAQ, product overview, or SRM readiness assessment to see how the desk maps to your assurance process.",
  },
  {
    question: "How do I track community grievances securely with TrustLedger?",
    answer:
      "Use TrustLedger’s Version 001 resolution desk: field or community issue intake, owned cases with evidence, stage timestamps from reported through closed, and reports that cite the case trail. Paying and trial workspaces use your own data — not fictional sample incidents. AI only suggests; a human applies before anything is saved.",
  },
  {
    question: "What is the best grievance management software for SA mining?",
    answer:
      "For South African mining and extractives programmes, look for a grievance desk that records intake, ownership, evidence, and close-out with a trail funders can review — plus local place context. TrustLedger is grievance management and SRM software built for that setting: Version 001 resolution desk, ZA municipalities/wards/traditional councils where packed, and Stakeholder Intelligence on entitled plans. Start with the SRM readiness assessment or a 14-day own-data trial at trustledger.co.za.",
  },
  {
    question: "What community engagement software works for SA infrastructure projects?",
    answer:
      "Infrastructure programmes need engagement logs, commitments with owners and due dates, and a path from community issues into a grievance desk. TrustLedger combines community engagement (engagements and commitments) with Stakeholder Intelligence and the resolution desk on TrustLedger Cloud — with South African place intel included. Compare options on /compare or open /product.",
  },
  {
    question: "Is TrustLedger suitable for local municipalities and public-sector projects in South Africa?",
    answer:
      "Yes. Every plan includes South African place context (municipalities, wards, and traditional councils where packed) — you add the project and situation, not the country map. The grievance desk sits on that baseline from Solo upward; Stakeholder Intelligence and deeper board or funder packs follow entitled plans (Project, Institutional, or add-ons). Institutional plans are sales-scoped for multi-project and public-sector needs. Start with the SRM readiness assessment or a 14-day own-data trial.",
  },
  {
    question: "Where can I read TrustLedger South Africa reviews or a product overview?",
    answer:
      "Independent review directories are still being populated. Until then, use the product overview at /product, the FAQ hub at /faq, fair comparisons at /compare, and the SRM readiness assessment at /assessment. TrustLedger South Africa is the Chibase Consulting SRM product at trustledger.co.za — distinct from other companies using the TrustLedger name.",
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
      "Live customer workspaces run on TrustLedger Cloud at app.trustledger.co.za. Day-to-day product work uses the TrustLedger app; the public product and marketing site is trustledger.co.za. Paying and trial workspaces never show fictional sample incidents.",
  },
  {
    question: "What is the best way to assess SRM readiness before buying?",
    answer:
      "Use TrustLedger’s public SRM Readiness & Risk Diagnostic at /assessment. It scores intake, ownership, field practice, engagement, reporting, and assurance, then unlocks results with a work email. It is a maturity diagnostic — not a substitute for a product trial.",
  },
];
