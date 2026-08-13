/**
 * Canonical Themba knowledge beyond PUBLIC_FAQS (ADR-042 / brief §6).
 * Public voice only — TrustLedger Cloud, never stack vendor brands.
 */

import {
  PRODUCT_DEFINITION,
  PRODUCT_TAGLINE,
  PUBLIC_FAQS,
  type FaqItem,
} from "@/lib/aeo/siteFacts";

export type ThembaLink = { href: string; label: string };

export type ThembaKnowledgeItem = FaqItem & {
  id: string;
  keywords: string[];
  links?: ThembaLink[];
};

const CORE: ThembaKnowledgeItem[] = [
  {
    id: "what-is",
    question: "What is TrustLedger?",
    answer: PRODUCT_DEFINITION,
    keywords: ["what", "trustledger", "srm", "platform", "software", "about"],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/trial", label: "Start 14-day trial" },
    ],
  },
  {
    id: "promise",
    question: "What is TrustLedger’s promise?",
    answer: `${PRODUCT_TAGLINE} TrustLedger helps operators run grievance resolution and Stakeholder Intelligence where social licence decides whether work moves.`,
    keywords: ["promise", "tagline", "audit", "resolution", "trust"],
    links: [{ href: "/product", label: "Product overview" }],
  },
  {
    id: "versions",
    question: "What is the difference between Version 001 and Version 002?",
    answer:
      "Version 001 is the live grievance resolution desk (projects, incidents, human-applied AI Assist on entitled plans, reports). Version 002 is Stakeholder Intelligence — registry, engagements, and commitments on TrustLedger Cloud for entitled plans (Project, Institutional, or add-ons). Version 002 is in active use and still deepening versus a full TEDS blueprint.",
    keywords: ["version", "001", "002", "v001", "v002", "stakeholder intelligence"],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    id: "trial",
    question: "How do I start a trial?",
    answer:
      "Open a 14-day trial with your own projects and cases. Learn features on the product overview, then subscribe or request a quote for Institutional. The sample demo desk is retired — use /product, then trial or live.",
    keywords: ["trial", "try", "free", "14", "demo", "sample", "start"],
    links: [
      { href: "/trial", label: "Start 14-day trial" },
      { href: "/product", label: "Product overview" },
    ],
  },
  {
    id: "demo-retired",
    question: "Where is the demo?",
    answer:
      "The sample preview desk is retired. Use the product overview for feature purpose, then start a 14-day own-data trial or subscribe. Paying and trial workspaces never show fictional sample incidents.",
    keywords: ["demo", "sample", "preview", "guest", "inc"],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/trial", label: "Start trial" },
    ],
  },
  {
    id: "ai",
    question: "Does AI close cases automatically?",
    answer:
      "No. TrustLedger AI Assist only suggests next steps or wording. A human must apply the suggestion before anything is saved. Cases are never auto-closed by AI.",
    keywords: ["ai", "automatic", "auto", "close", "suggest", "assist"],
    links: [{ href: "/faq", label: "FAQ" }],
  },
  {
    id: "crm-real",
    question: "Is the Stakeholder CRM real on live workspaces?",
    answer:
      "On Project and Institutional plans (or with a CRM add-on), stakeholders, engagements, and commitments persist on TrustLedger Cloud when you are live. A browser trial keeps your own data until you go live.",
    keywords: ["crm", "stakeholder", "real", "cloud", "persist", "live"],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/pay", label: "Subscribe" },
    ],
  },
  {
    id: "plans",
    question: "Which plan includes Stakeholder CRM and commitments?",
    answer:
      "Project and Institutional include Stakeholder CRM, engagements, and commitments by default. Practitioner can add CRM or commitments via sellable add-ons. Solo is an entry grievance desk without AI Assist or Stakeholder CRM in the box.",
    keywords: ["plan", "pricing", "solo", "practitioner", "project", "institutional", "addon", "add-on"],
    links: [
      { href: "/pay", label: "Subscribe" },
      { href: "/quote", label: "Request a quote" },
    ],
  },
  {
    id: "za",
    question: "Is TrustLedger suitable for South African municipalities?",
    answer:
      "Yes. Every plan includes South African place context (municipalities, wards, and traditional councils where packed) — you add the project and situation, not the country map. Start with the SRM readiness assessment or a 14-day own-data trial.",
    keywords: [
      "south",
      "africa",
      "municipality",
      "municipal",
      "ward",
      "public",
      "sector",
      "za",
    ],
    links: [
      { href: "/assessment", label: "SRM readiness assessment" },
      { href: "/trial", label: "Start trial" },
    ],
  },
  {
    id: "data",
    question: "Where does TrustLedger store live customer data?",
    answer:
      "Live customer workspaces run on TrustLedger Cloud at app.trustledger.co.za. Day-to-day work happens in the TrustLedger product app; marketing lives on trustledger.co.za. Paying and trial workspaces never show fictional sample incidents.",
    keywords: ["data", "store", "cloud", "host", "security", "where"],
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/login/live", label: "Live sign-in" },
    ],
  },
  {
    id: "mobile",
    question: "Is there a mobile app?",
    answer:
      "TrustLedger is a responsive web app in the browser. There is no separate App Store or Play Store app yet.",
    keywords: ["mobile", "app", "iphone", "android", "phone", "offline"],
    links: [{ href: "/product", label: "Product overview" }],
  },
  {
    id: "readiness",
    question: "How do I assess SRM readiness before buying?",
    answer:
      "Start at /readiness, then complete the SRM Readiness & Risk Diagnostic at /assessment. A work email confirmation unlocks a choice hub and detailed report. Free printable toolkits are on /resources. These are maturity aids — not a substitute for a product trial.",
    keywords: ["readiness", "assessment", "diagnostic", "resources", "toolkit"],
    links: [
      { href: "/assessment", label: "Take the assessment" },
      { href: "/resources", label: "Free toolkits" },
    ],
  },
  {
    id: "subscribe",
    question: "How do I subscribe?",
    answer:
      "Use Subscribe on TrustLedger to pick a plan, or start a 14-day trial with your own data. Institutional and custom scopes usually go through a quote.",
    keywords: ["subscribe", "buy", "pay", "payment", "checkout"],
    links: [
      { href: "/pay", label: "Subscribe" },
      { href: "/trial", label: "Start trial" },
      { href: "/quote", label: "Request a quote" },
    ],
  },
  {
    id: "live-login",
    question: "How do I sign in to a live workspace?",
    answer:
      "After your workspace is provisioned on TrustLedger Cloud, sign in at live login. Email OTP is used when access email is enabled for your account.",
    keywords: ["login", "sign", "live", "otp", "access"],
    links: [{ href: "/login/live", label: "Live sign-in" }],
  },
  {
    id: "go-live",
    question: "Is TrustLedger live for paying customers?",
    answer:
      "Yes — the Version 001 resolution desk is operational for paying customers on TrustLedger Cloud. Stakeholder Intelligence continues to deepen; we do not over-claim a full TEDS blueprint.",
    keywords: ["live", "production", "ready", "launch", "go"],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

/** Merge PUBLIC_FAQS that are not already covered by CORE ids (by question). */
function fromPublicFaqs(): ThembaKnowledgeItem[] {
  const seen = new Set(CORE.map((c) => c.question.toLowerCase()));
  return PUBLIC_FAQS.filter((f) => !seen.has(f.question.toLowerCase())).map(
    (f, i) => ({
      id: `faq-${i}`,
      question: f.question,
      answer: f.answer,
      keywords: tokenize(f.question),
      links: [{ href: "/faq", label: "FAQ" }],
    }),
  );
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

export function thembaKnowledgeCorpus(): ThembaKnowledgeItem[] {
  return [...CORE, ...fromPublicFaqs()];
}

export const THEMBA_GREETING =
  "Hi — I’m Themba, The Trust guide for TrustLedger. Ask about the product, trial, plans, or AI Assist. For contracts, billing disputes, or account help I’ll connect you to a person.";

export const THEMBA_ESCALATE_REPLY =
  "That’s best handled by a TrustLedger person. Share a work email and a short note, or open Contact — we’ll follow up. Meanwhile you can start a 14-day trial or browse the product overview.";
