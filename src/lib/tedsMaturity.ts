/**
 * TEDS Volume 1 MVP maturity vs shipped TrustLedger (Version 001 / 002).
 * Single source for docs + ops/app dashboards.
 */

export type MaturityStatus =
  | "not_started"
  | "seeded"
  | "partial"
  | "live"
  | "future";

export type MaturityAudience = "board" | "admin" | "ops" | "public";

export type TedsDomainId =
  | "geo"
  | "stakeholders"
  | "projects"
  | "engagements"
  | "grievances"
  | "commitments"
  | "reporting"
  | "administration"
  | "intelligence"
  | "commercial";

export type TedsDomainMaturity = {
  id: TedsDomainId;
  tedsName: string;
  tedsChapter: string;
  status: MaturityStatus;
  /** 0–100 contribution toward MVP */
  score: number;
  availableNow: string;
  stillNeeded: string[];
  href?: string;
};

const STATUS_LABEL: Record<MaturityStatus, string> = {
  not_started: "Not started",
  seeded: "Seeded (demo data)",
  partial: "Partial",
  live: "Live / production-ready",
  future: "Future (post-MVP)",
};

const STATUS_TONE: Record<MaturityStatus, "default" | "attention" | "ok"> = {
  not_started: "attention",
  seeded: "ok",
  partial: "attention",
  live: "ok",
  future: "default",
};

export function maturityStatusLabel(s: MaturityStatus): string {
  return STATUS_LABEL[s];
}

export function maturityStatusTone(s: MaturityStatus) {
  return STATUS_TONE[s];
}

/** Locked assessment — update when packets complete (ADR-023 / ROADMAP_V002). */
export const TEDS_DOMAIN_MATURITY: TedsDomainMaturity[] = [
  {
    id: "geo",
    tedsName: "Geographic Intelligence",
    tedsChapter: "TEDS Ch.9 Domain 1",
    status: "seeded",
    score: 70,
    availableNow:
      "ZA pack: 9 provinces, 52 districts, 213 munis/metros, 4 468 wards, 15 traditional councils; browse UI; multi-country pack schema.",
    stillNeeded: [
      "Stats SA / peer-country socio-economic indicators on places",
      "Lat/lng enrichment for wards where missing",
      "Frappe Geo DocTypes + live sync",
      "Additional country packs (e.g. NA, BW, MZ)",
    ],
    href: "/app/geo",
  },
  {
    id: "stakeholders",
    tedsName: "Stakeholder Registry (CRM)",
    tedsChapter: "TEDS Ch.9 Domain 2",
    status: "partial",
    score: 70,
    availableNow:
      "List + detail + create UI; live BFF persists to TL Stakeholder on Frappe Cloud; trial own-data (no sample seed).",
    stillNeeded: [
      "Relationship mapping graph",
      "Influence / interest matrices",
      "Merge / dedupe tooling",
    ],
    href: "/app/stakeholders",
  },
  {
    id: "projects",
    tedsName: "Project Management",
    tedsChapter: "TEDS Ch.9 Domain 3",
    status: "partial",
    score: 40,
    availableNow:
      "Project list/detail, budget fields, ward labels; role dashboards.",
    stillNeeded: [
      "Programmes / sites / milestones / project teams",
      "Link projects to geo place ids + stakeholders",
      "Frappe Project DocType depth",
    ],
    href: "/app/projects",
  },
  {
    id: "engagements",
    tedsName: "Engagement Management",
    tedsChapter: "TEDS Ch.9 Domain 4",
    status: "partial",
    score: 72,
    availableNow:
      "Engagements list/detail; Capture hub apply → CRM + Engagement; live BFF → TL Engagement on Cloud; trial own-data.",
    stillNeeded: [
      "Structured attendance register rows",
      "Link engagements to geo place ids",
    ],
    href: "/app/engagements",
  },
  {
    id: "grievances",
    tedsName: "Issue & Grievance Management",
    tedsChapter: "TEDS Ch.9 Domain 5",
    status: "partial",
    score: 78,
    availableNow:
      "Case desk Advance / Verify & close stamps (reported→deploy→investigate→resolve→verify→close); local persistence; geo intake; natures; TAT targets; AI suggest→apply; trust pulse.",
    stillNeeded: [
      "Mirror lifecycle stamps on Frappe TL Incident",
      "Client policy admin UI for thresholds and TAT defaults",
      "Live escalation queues by staff tier",
    ],
    href: "/app/incidents",
  },
  {
    id: "commitments",
    tedsName: "Commitment Management",
    tedsChapter: "TEDS Ch.9 Domain 6",
    status: "partial",
    score: 70,
    availableNow:
      "Commitments status board + detail; promote from engagements; live BFF → TL Commitment on Cloud; trial own-data.",
    stillNeeded: [
      "Evidence file attach on Cloud",
      "Owner assignment from seats/CRM",
    ],
    href: "/app/commitments",
  },
  {
    id: "reporting",
    tedsName: "Reporting",
    tedsChapter: "TEDS Ch.9 Domain 7",
    status: "partial",
    score: 40,
    availableNow:
      "Trust/TAT on client reports; role trust pulse; AI report brief; ops executive brief (TEDS maturity ops-only).",
    stillNeeded: [
      "Standard operational packs from live/geo/CRM data",
      "Export / print packs for clients",
      "Heat maps / spatial summaries",
    ],
    href: "/app/reports",
  },
  {
    id: "administration",
    tedsName: "Administration",
    tedsChapter: "TEDS Ch.9 Domain 8",
    status: "partial",
    score: 30,
    availableNow:
      "Settings, demo/trial/live modes, platform operator lockdown, ops allowlist.",
    stillNeeded: [
      "Customer workspaces & Plan Owner invites (post lockdown)",
      "Org-scoped permissions matrix",
      "Audit trail UI",
    ],
    href: "/app/settings",
  },
  {
    id: "intelligence",
    tedsName: "Intelligence / ESG depth",
    tedsChapter: "TEDS Ch.9 Layer 3 + future",
    status: "partial",
    score: 55,
    availableNow:
      "/app/intelligence indicator cards + mock AI brief suggest→apply→save; geo pack indicator slots.",
    stillNeeded: [
      "Stats SA / municipal indicator ingest into geo pack JSON",
      "Live Grok briefs via srm-core (never from browser)",
      "Executive packs driven by CRM + geo + grievances",
    ],
    href: "/app/intelligence",
  },
  {
    id: "commercial",
    tedsName: "Commercial & access (soft launch)",
    tedsChapter: "Beyond TEDS MVP — product shell",
    status: "partial",
    score: 60,
    availableNow:
      "Version 001 desk: trial, Paystack, marketing Now/Next, WordPress CTAs.",
    stillNeeded: [
      "Auto Plan Owner after pay (lift ADR-013 when ready)",
      "Honest soft launch only after V002 core credible (ADR-023)",
    ],
    href: "/pay",
  },
];

export type TedsMaturityReport = {
  generatedAt: string;
  productVersion: string;
  nextVersion: string;
  /** Weighted MVP closeness 0–100 (excludes pure 'future' framing) */
  mvpProgressPct: number;
  headline: string;
  summary: string;
  domains: TedsDomainMaturity[];
  priorityNext: string[];
  publicMessage: string;
};

export function buildTedsMaturityReport(): TedsMaturityReport {
  const domains = TEDS_DOMAIN_MATURITY;
  const core = domains.filter((d) => d.id !== "commercial");
  const mvpProgressPct = Math.round(
    core.reduce((sum, d) => sum + d.score, 0) / core.length,
  );

  return {
    generatedAt: new Date().toISOString(),
    productVersion: "001",
    nextVersion: "002",
    mvpProgressPct,
    headline: `TEDS MVP ≈ ${mvpProgressPct}% realised in product`,
    summary:
      "Version 001 ships the resolution desk. Version 002 Stakeholder Intelligence now has Cloud DocTypes + live BFF for registry, engagements, and commitments. Remaining gaps: geo depth, grievance Cloud stamps, Stats SA, relationship graphs.",
    domains,
    priorityNext: [
      "Ops: Create product + SI DocTypes, then Smoke Stakeholder→Engagement→Commitment",
      "Buyer live smoke: empty Cloud CRM → add stakeholder → list on Cloud",
      "Stronger grievance lifecycle stamps on Frappe TL Incident",
      "Stats SA socio-economic indicators on geo pack",
      "CRM relationship links + influence matrices",
    ],
    publicMessage:
      "Version 001 is the live resolution desk. Version 002 Stakeholder Intelligence core runs on Cloud for registry, engagements, and commitments — the SRM engine.",
  };
}

export function domainsForAudience(
  audience: MaturityAudience,
): TedsDomainMaturity[] {
  if (audience === "public") {
    return TEDS_DOMAIN_MATURITY.filter((d) =>
      ["geo", "stakeholders", "grievances", "reporting", "commercial"].includes(
        d.id,
      ),
    );
  }
  return TEDS_DOMAIN_MATURITY;
}
