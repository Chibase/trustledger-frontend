/**
 * Marketing pricing — feature comparison + optional privacy extras (ADR-038).
 * Public copy: TrustLedger only. Prefer “cloud” over host brand names.
 */

import type { PlanId } from "@/config/plans";
import { formatZar } from "@/config/plans";

export type ComparisonValue = boolean | string;

export type ComparisonRow = {
  id: string;
  label: string;
  hint?: string;
  values: Record<PlanId, ComparisonValue>;
};

export type ComparisonGroup = {
  id: string;
  title: string;
  rows: ComparisonRow[];
};

/** Foldable “learn more” matrix under plan cards. */
export const PLAN_COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    id: "desk",
    title: "Desk & delivery",
    rows: [
      {
        id: "seats",
        label: "Seats",
        values: {
          solo: "1 (you)",
          practitioner: "1 (you)",
          project: "Owner + juniors",
          institutional: "Custom",
        },
      },
      {
        id: "projects",
        label: "Active projects",
        values: {
          solo: "1",
          practitioner: "Up to 2",
          project: "Multi-project",
          institutional: "Programme-scale",
        },
      },
      {
        id: "grievance",
        label: "Grievance / incident desk",
        values: {
          solo: true,
          practitioner: true,
          project: true,
          institutional: true,
        },
      },
      {
        id: "ai",
        label: "AI Assist (suggest → apply → save)",
        hint: "Humans always apply. No auto-resolve.",
        values: {
          solo: false,
          practitioner: true,
          project: true,
          institutional: true,
        },
      },
      {
        id: "si",
        label: "Stakeholder Intelligence (registry, engagements, engagement plan, commitments)",
        values: {
          solo: false,
          practitioner: false,
          project: true,
          institutional: true,
        },
      },
      {
        id: "capture_templates",
        label: "Field templates (minutes, attendance, field notes)",
        hint: "Labeled forms mapped to Capture so names, place, and actions read on first paste. Same PDFs are free on /resources.",
        values: {
          solo: "Download on /resources",
          practitioner: "Download on /resources",
          project: "Included in Capture hub",
          institutional: "Included in Capture hub",
        },
      },
      {
        id: "reports",
        label: "Report packs",
        values: {
          solo: "Monthly",
          practitioner: "Monthly + light governance",
          project: "Monthly + executive",
          institutional: "Full incl. board",
        },
      },
    ],
  },
  {
    id: "trust",
    title: "Trust & data protection (included)",
    rows: [
      {
        id: "workspace",
        label: "Your organisation is a separate TrustLedger workspace",
        values: {
          solo: true,
          practitioner: true,
          project: true,
          institutional: true,
        },
      },
      {
        id: "https",
        label: "Encrypted connection to TrustLedger",
        values: {
          solo: true,
          practitioner: true,
          project: true,
          institutional: true,
        },
      },
      {
        id: "no_train",
        label: "Your content is not used to train external AI models",
        values: {
          solo: true,
          practitioner: true,
          project: true,
          institutional: true,
        },
      },
      {
        id: "ops",
        label: "Platform support access is allowlisted",
        values: {
          solo: true,
          practitioner: true,
          project: true,
          institutional: true,
        },
      },
    ],
  },
  {
    id: "privacy_extras",
    title: "Optional privacy layers (add-on)",
    rows: [
      {
        id: "trust_pack",
        label: "Trust Pack — DPA-style terms, subprocessors note, purge SLA",
        values: {
          solo: "On request",
          practitioner: "On request",
          project: "Optional",
          institutional: "Included in scoping",
        },
      },
      {
        id: "isolation",
        label: "Private cloud workspace — dedicated site for your organisation",
        hint: "Funded by you; TrustLedger configures the product to your private cloud.",
        values: {
          solo: false,
          practitioner: false,
          project: "Optional",
          institutional: "Optional / typical",
        },
      },
      {
        id: "audit",
        label: "Enhanced access visibility for support actions",
        values: {
          solo: false,
          practitioner: false,
          project: "Optional",
          institutional: "Optional",
        },
      },
    ],
  },
];

export type PrivacyExtraId = "trust_pack" | "isolation" | "audit_visibility";

export type PrivacyExtra = {
  id: PrivacyExtraId;
  name: string;
  tagline: string;
  /** Short “from” label; null = talk to sales only. */
  fromZar: number | null;
  /** Plans that may select this extra. */
  availableOn: PlanId[];
  defaultOn?: PlanId[];
};

/** Optional extras — most privacy depth is opt-in (ADR-038). */
export const PRIVACY_EXTRAS: PrivacyExtra[] = [
  {
    id: "trust_pack",
    name: "Trust Pack",
    tagline:
      "Written processing terms, who supports your workspace, and a clear purge timeline when access ends.",
    fromZar: 1500,
    availableOn: ["practitioner", "project", "institutional"],
    defaultOn: ["institutional"],
  },
  {
    id: "isolation",
    name: "Private cloud workspace",
    tagline:
      "A dedicated cloud site for your organisation’s desk data — at your cost — with TrustLedger pointed only at that workspace.",
    fromZar: 8000,
    availableOn: ["project", "institutional"],
    defaultOn: [],
  },
  {
    id: "audit_visibility",
    name: "Support access visibility",
    tagline:
      "Clearer logging when TrustLedger support opens your workspace for break-glass help.",
    fromZar: 900,
    availableOn: ["project", "institutional"],
    defaultOn: [],
  },
];

export const DATA_PROTECTION_BLURB =
  "Each organisation runs in its own TrustLedger workspace. Connections are encrypted, support access is allowlisted, and your content is not used to train external AI models. Optional layers — Trust Pack, private cloud workspace, and support-access visibility — add contract and isolation depth when procurement needs them.";

export function formatExtraFrom(zar: number | null): string {
  if (zar === null) return "Talk to sales";
  return `From ${formatZar(zar)}/mo`;
}

export function contactHrefForExtras(
  planId: PlanId,
  extraIds: PrivacyExtraId[],
): string {
  const params = new URLSearchParams({
    utm_source: "home",
    utm_medium: "pricing",
    utm_campaign: "privacy_extras",
    plan: planId,
  });
  if (extraIds.length) {
    params.set("extras", extraIds.join(","));
  }
  return `/contact?${params.toString()}`;
}

export function formatComparisonCell(value: ComparisonValue): string {
  if (value === true) return "Included";
  if (value === false) return "—";
  return value;
}
