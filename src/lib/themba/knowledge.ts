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
    id: "features",
    question: "What are the features of this product?",
    answer:
      "TrustLedger is open to explore before you sign up. Core capabilities: (1) Grievance / case desk — intake, owners, stages, and evidence so community issues have an auditable path to close. (2) Stakeholder registry — people and institutions around a project with influence and place. (3) Engagements — meetings and consultations with notes and actions. (4) Commitments — promises with owners and due dates. (5) Reports — activity and executive packs built from the case and engagement trail. (6) South African place context — municipalities, wards, and traditional councils where packed, so you add the project, not the country map. (7) AI Assist on entitled plans — suggestions only; a human applies before save. How it helps: one trust trail from ward to board instead of spreadsheets and lost WhatsApps. Browse /product now; when ready, take the free readiness check or start a 14-day own-data trial.",
    keywords: [
      "feature",
      "features",
      "capability",
      "capabilities",
      "functions",
      "modules",
      "include",
      "offer",
      "does",
      "product",
      "overview",
      "help",
      "helps",
      "benefits",
      "benefit",
      "can",
      "do",
    ],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/assessment", label: "Free readiness check" },
      { href: "/trial", label: "Start 14-day trial" },
    ],
  },
  {
    id: "how-helps",
    question: "How can TrustLedger help my project or organisation?",
    answer:
      "If grievances arrive on WhatsApp, paper, or inboxes with no single owner, TrustLedger gives you one case desk with stages and evidence. If engagements and promises live in notebooks, the registry, engagements, and commitments modules keep named counterparts and due dates visible. If boards ask for social performance proof, reports cite the trail you already captured. ZA place packs mean South African operators start with municipalities and wards in place. You do not need an account to learn this — read /product, or take the free SRM readiness diagnostic to see which gaps matter most, then trial with your own data.",
    keywords: [
      "help",
      "helps",
      "benefit",
      "benefits",
      "value",
      "why",
      "useful",
      "suitable",
      "organisation",
      "organization",
      "project",
      "programme",
      "program",
    ],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/assessment", label: "Readiness diagnostic" },
      { href: "/trial", label: "Start trial" },
    ],
  },
  {
    id: "readiness-guide",
    question: "How do I know if TrustLedger is suitable for us?",
    answer:
      "Use these readiness prompts (same spine as our free diagnostic): Do you have one clear intake path for community grievances, or many informal channels? Is every open case owned with an SLA and escalation path? Can field teams capture issues consistently on site? Are engagements and commitments logged so complainants see progress? Can you produce board-ready social performance reporting from evidence, not memory? Do you have basic assurance over data quality? If several answers are “ad hoc” or “not in place,” TrustLedger’s desk and Stakeholder Intelligence are built for that gap. Take the full scored diagnostic at /assessment (work email unlocks the report), or start a 14-day trial when you want to practise on your own projects.",
    keywords: [
      "suitable",
      "suitability",
      "readiness",
      "ready",
      "fit",
      "assessment",
      "diagnostic",
      "maturity",
      "gap",
      "gaps",
      "guide",
    ],
    links: [
      { href: "/assessment", label: "Take readiness assessment" },
      { href: "/readiness", label: "Readiness overview" },
      { href: "/trial", label: "Start trial" },
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
      "When you are ready to practise with your own projects and cases, open a 14-day trial — no fictional sample incidents. You can still read the product overview and take the free readiness check first. Subscribe or request a quote for Institutional when you want to go live.",
    keywords: ["trial", "try", "free-trial", "14", "signup", "sign-up", "register"],
    links: [
      { href: "/trial", label: "Start 14-day trial" },
      { href: "/product", label: "Product overview" },
      { href: "/assessment", label: "Readiness check first" },
    ],
  },
  {
    id: "demo-retired",
    question: "Where is the demo?",
    answer:
      "The sample preview desk is retired so buyers are not confused by fictional cases. Explore capabilities on the product overview and FAQ, take the free readiness diagnostic, then start a 14-day own-data trial or subscribe. Paying and trial workspaces never show fictional sample incidents.",
    keywords: ["demo", "sample", "preview", "guest"],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/assessment", label: "Readiness check" },
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
  "Hi — I’m Themba, The Trust guide for TrustLedger. Ask about features, how the desk helps, plans, or AI Assist — no signup needed for answers. I can also walk readiness prompts to see what fits, then point you to the free diagnostic or a trial. For contracts, billing disputes, or account help I’ll connect you to a person.";

export const THEMBA_ESCALATE_REPLY =
  "That’s best handled by a TrustLedger person. Share a work email and a short note, or open Contact — we’ll follow up. Meanwhile you can browse features on the product overview, take the free readiness check, or start a 14-day trial.";
