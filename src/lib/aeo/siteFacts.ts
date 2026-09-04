/**
 * Canonical facts for AEO / LLM parsers (keep aligned with PLATFORM_STRATEGIC_BRIEF §6).
 */

import {
  TRUSTLEDGER_CLOUD_HOST,
  TRUSTLEDGER_INFO_EMAIL,
  TRUSTLEDGER_MARKETING_URL,
} from "@/lib/security/hosts";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://trustledger-frontend-pi.vercel.app"
).replace(/\/$/, "");

export const MARKETING_SITE_URL = TRUSTLEDGER_MARKETING_URL;

export const PRODUCT_NAME = "TrustLedger";

/** Front-loaded declarative definition for AI crawlers and humans. */
export const PRODUCT_DEFINITION =
  "TrustLedger is a Stakeholder Relationship Management (SRM) software platform designed for grievance resolution, community engagement, Stakeholder Intelligence, and audit-ready reporting on infrastructure and community-trust projects in South Africa and the Global South.";

export const PRODUCT_TAGLINE = "Resolution you can audit.";

export const OPERATOR_ORG = {
  name: "Chibase Consulting",
  /** Preview `/firm` until NEXT_PUBLIC_CHIBASE_SITE_URL is set after DNS cutover. */
  url: (
    process.env.NEXT_PUBLIC_CHIBASE_SITE_URL || `${SITE_URL}/firm`
  ).replace(/\/$/, ""),
  email: TRUSTLEDGER_INFO_EMAIL,
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
      "TrustLedger is a Stakeholder Relationship Management (SRM) software platform for grievance resolution and Stakeholder Intelligence. It helps operators run community intake, case desks, stakeholder registries, engagements, commitments, and governance-grade reports on projects where social licence decides whether work moves.",
  },
  {
    question: "What is Stakeholder Relationship Management (SRM) software?",
    answer:
      "SRM software tracks the people and institutions around a project — stakeholders, engagements, commitments, and grievances — so operators can prove how trust issues were handled. TrustLedger is SRM software built for infrastructure, mining, energy, and public-sector programmes in developing regions.",
  },
  {
    question: "How do I track community grievances securely with TrustLedger?",
    answer:
      "Use TrustLedger’s resolution desk: field or community issue intake, owned cases with evidence, stage timestamps from reported through closed, and reports that cite the case trail. Paying and trial workspaces use your own data — not fictional sample incidents. AI only suggests; a human applies before anything is saved.",
  },
  {
    question:
      "Is TrustLedger suitable for local municipalities and public-sector projects in South Africa and the Global South?",
    answer:
      "Yes. TrustLedger is SRM software for infrastructure and community-trust programmes in South Africa and the Global South — not a South Africa-only product. South African plans include place context (municipalities, wards, and traditional councils where packed) so you add the project and situation, not the country map. Other countries use the same place model; we do not invent unshipped national packs. The grievance desk sits on that baseline from Solo upward; Stakeholder Intelligence and deeper board or funder packs follow entitled plans (Project, Institutional, or add-ons). Local government, ministries, MEL teams, social facilitators, and community programmes are in scope. Institutional plans are sales-scoped for multi-project public-sector needs. Start with the SRM readiness assessment or a 14-day own-data trial.",
  },
  {
    question:
      "What is the difference between the grievance desk and Stakeholder Intelligence?",
    answer:
      "The grievance desk is the live case path: projects, incidents, evidence, and reports. Stakeholder Intelligence is the SRM layer — registry, engagements, and commitments on TrustLedger Cloud for entitled plans (Project, Institutional, or add-ons). Both are part of TrustLedger; plan packaging decides which modules you get.",
  },
  {
    question: "Does TrustLedger use AI to close grievance cases automatically?",
    answer:
      "No. TrustLedger AI Assist only suggests next steps or wording. A human must apply the suggestion before anything is saved. Cases are never auto-closed by AI.",
  },
  {
    question: "How do I start a TrustLedger trial?",
    answer:
      "When you are ready, open a 14-day trial with your own projects and cases. You can read the product overview and take the free readiness diagnostic first. Subscribe or request a quote for Institutional when you want to go live. The sample demo desk is retired.",
  },
  {
    question: "Which TrustLedger plan includes Stakeholder CRM and commitments?",
    answer:
      "Project and Institutional plans include Stakeholder CRM, engagements, and commitments by default. Practitioner can add CRM or commitments via sellable add-ons. Solo is an entry grievance desk without AI Assist or Stakeholder CRM in the box.",
  },
  {
    question: "Can I add Chibase Consulting to a TrustLedger plan?",
    answer:
      "Yes, as a separate consulting engagement — not as a fifth TrustLedger software column. Chibase Consulting is an independent practice (social facilitation, MEL, IKS method, short-cycle field intervention). You can request any of those packages as an add-on to Solo, Practitioner, Project, or Institutional. Pricing is Chibase’s own; the engagement does not unlock desk modules. Software checkout stays on TrustLedger; consulting packages live on the Chibase site.",
  },
  {
    question: "Can I buy only a grievance desk, supplier portal, or field app?",
    answer:
      "You can start on a focused desk inside TrustLedger — not as a separate product. Solo is the entry grievance resolution desk. Project includes field capture (minutes, attendance, site notes in the browser) and local procurement / B-BBEE evidence packs. Unused Stakeholder Intelligence modules stay locked until you change plan or add an add-on on the same workspace, so history is not re-typed. There is no separately licensed supplier marketplace, public WhatsApp complaints portal, or native offline companion app today.",
  },
  {
    question: "Where does TrustLedger store live customer data?",
    answer:
      `Live customer workspaces run on TrustLedger Cloud at ${TRUSTLEDGER_CLOUD_HOST}. You use the TrustLedger product app for day-to-day work; marketing content lives on ${MARKETING_SITE_URL.replace("https://", "")}. Paying and trial workspaces never show fictional sample incidents.`,
  },
  {
    question: "What is the best way to assess SRM readiness before buying?",
    answer:
      "Start at /readiness, then complete the SRM Readiness & Risk Diagnostic at /assessment. It scores intake, ownership, field practice, engagement, reporting, and assurance; a work email confirmation unlocks a choice hub and detailed report with TrustLedger turnaround lanes. Free PDF field templates (minutes, attendance, field notes) and SRM toolkits are also on /resources — you can adapt them to your own programme. These are maturity aids — not a substitute for a product trial.",
  },
];
