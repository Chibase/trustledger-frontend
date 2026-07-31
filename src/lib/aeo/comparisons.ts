/**
 * Competitor comparison corpus for AEO / buyer prompts (BrandRadar 2026-07-31).
 * Keep factual — no invented rankings, awards, or SOC2 claims.
 */

export type ComparisonSlug =
  | "jambo"
  | "borealis"
  | "simply-stakeholders"
  | "grievance-app";

export type ComparisonPage = {
  slug: ComparisonSlug;
  competitorName: string;
  competitorShort: string;
  title: string;
  /** Meta + OG description */
  description: string;
  /** H1 supporting sentence */
  lead: string;
  /** Fair one-liner on the other product */
  competitorFocus: string;
  trustLedgerFit: string[];
  chooseTrustLedgerWhen: string[];
  chooseThemWhen: string[];
  relatedProbe: string;
};

export const COMPARISONS: ComparisonPage[] = [
  {
    slug: "jambo",
    competitorName: "Jambo",
    competitorShort: "Jambo",
    title: "TrustLedger vs Jambo — SRM software for South Africa",
    description:
      "Compare TrustLedger and Jambo for stakeholder relationship management in South Africa: grievance desks, community engagement, Global South focus, and audit-ready reporting.",
    lead: "Both sit in the stakeholder / social performance software category. This page explains where TrustLedger South Africa fits if you are shortlisting SRM tools for mining, energy, or infrastructure programmes.",
    competitorFocus:
      "Jambo is a widely cited international stakeholder and social performance platform that often appears in category comparisons and directory roundups.",
    trustLedgerFit: [
      "South African SRM product with ZA municipalities, wards, and traditional councils packed into every plan",
      "Live grievance resolution desk with evidence and stage timestamps (Version 001)",
      "Stakeholder Intelligence — registry, engagements, commitments — for entitled plans (Version 002)",
      "AI Assist that only suggests; a human must apply before anything is saved",
      "Own-data 14-day trial and ZAR commercial plans from Solo upward",
    ],
    chooseTrustLedgerWhen: [
      "You need a South African–operated desk with local place context out of the box",
      "Grievance case trails and board-ready reports matter as much as a CRM register",
      "You want suggest→apply AI, not automated case closure",
      "You prefer ZAR pricing and a short own-data trial before a multi-year enterprise deal",
    ],
    chooseThemWhen: [
      "You already standardised on Jambo across a global portfolio and need one vendor everywhere",
      "Your RFP explicitly requires a specific international platform already contracted by a parent company",
    ],
    relatedProbe: "Best stakeholder relationship management software, SA",
  },
  {
    slug: "borealis",
    competitorName: "Borealis",
    competitorShort: "Borealis",
    title: "TrustLedger vs Borealis — community & stakeholder software",
    description:
      "TrustLedger vs Borealis for community engagement and stakeholder management on South African infrastructure and extractives projects.",
    lead: "Borealis is frequently named alongside global SRM suites. TrustLedger is built as TrustLedger SRM for South Africa and the Global South — grievance resolution you can audit.",
    competitorFocus:
      "Borealis is an established international stakeholder engagement and social performance suite often recommended in buyer shortlists.",
    trustLedgerFit: [
      "Designed for community-trust and social-licence risk on infrastructure and extractives programmes",
      "Grievance desk plus Stakeholder Intelligence on one TrustLedger Cloud workspace",
      "South African geo baseline included — you add projects and people, not the country map",
      "Human-applied AI Assist; no auto-closed cases",
      "Plans from Solo grievance desk through Institutional scoping",
    ],
    chooseTrustLedgerWhen: [
      "Your operating theatre is South Africa / Global South and local place intel is table stakes",
      "You need a resolution desk that produces an audit trail for funders and boards",
      "You want to start with own-data trial or Solo without a heavyweight roll-out",
    ],
    chooseThemWhen: [
      "You need a mature global suite already embedded with your international consultants",
      "Your assurance programme already maps exclusively to Borealis workflows",
    ],
    relatedProbe: "Community engagement software for SA infrastructure",
  },
  {
    slug: "simply-stakeholders",
    competitorName: "Simply Stakeholders",
    competitorShort: "Simply Stakeholders",
    title: "TrustLedger vs Simply Stakeholders — SRM shortlist",
    description:
      "How TrustLedger compares with Simply Stakeholders for stakeholder relationship management, grievances, and South African project use.",
    lead: "Simply Stakeholders often appears in SRM software roundups. Use this page when a buyer prompt asks for TrustLedger South Africa beside international CRM-style stakeholder tools.",
    competitorFocus:
      "Simply Stakeholders is a stakeholder mapping and engagement tool commonly listed in SRM directories and comparison articles.",
    trustLedgerFit: [
      "Stakeholder registry linked to engagements, commitments, and grievance cases",
      "Operational resolution desk — not only mapping or influence charts",
      "ZA place context and Global South programme framing",
      "Governance-grade activity and executive report packs on entitled plans",
      "Clear commercial path: trial → ZAR subscribe or Institutional quote",
    ],
    chooseTrustLedgerWhen: [
      "You need case ownership, evidence, and close-out — not only stakeholder maps",
      "Mining, energy, municipal, or infrastructure social licence is the risk",
      "You want South African packaging and TrustLedger Cloud tenancy",
    ],
    chooseThemWhen: [
      "Your primary need is lightweight stakeholder mapping without a grievance desk",
      "An existing Simply Stakeholders licence already covers the programme",
    ],
    relatedProbe: "Best stakeholder relationship management software, SA",
  },
  {
    slug: "grievance-app",
    competitorName: "grievance.app",
    competitorShort: "grievance.app",
    title: "TrustLedger vs grievance.app — IFC / ESS10 grievance desks",
    description:
      "Compare TrustLedger and grievance.app for digitising IFC PS1-style and World Bank ESS10-aligned grievance mechanisms on South African projects.",
    lead: "Compliance-oriented prompts often surface grievance.app. TrustLedger is broader SRM — grievance desk plus Stakeholder Intelligence — operated from South Africa.",
    competitorFocus:
      "grievance.app is frequently cited for digitising grievance mechanisms in IFC / ESS10 conversations.",
    trustLedgerFit: [
      "Intake → owned cases → evidence → stage timestamps → audit-ready reports",
      "Supports how operators implement IFC PS1-style and ESS10-aligned mechanisms in practice (operational software — not a certification body)",
      "Stakeholders, engagements, and commitments sit beside the grievance desk on entitled plans",
      "South African place intel included; mining and infrastructure programmes in mind",
      "AI Assist never auto-closes a case",
    ],
    chooseTrustLedgerWhen: [
      "You need the grievance mechanism inside a full SRM workspace (people, engagements, commitments)",
      "South African geo and ZAR packaging matter to the buying team",
      "Board and funder reporting must cite the same system that runs the desk",
    ],
    chooseThemWhen: [
      "You only need a narrow grievance channel product already approved by a lender",
      "Your assurance advisor has already mandated grievance.app for the facility",
    ],
    relatedProbe: "Digitising an ESS10 or IFC PS1 grievance mechanism",
  },
];

export function getComparison(slug: string): ComparisonPage | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}

export function comparisonSlugs(): ComparisonSlug[] {
  return COMPARISONS.map((c) => c.slug);
}
