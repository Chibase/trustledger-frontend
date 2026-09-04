/**
 * Canonical citations for SEP generation.
 * Source documents (logged in-repo, do not paraphrase into invented method):
 * - docs/sep-references/TrustLedger_SEP_Generation_Specification_v1.0.pdf
 * - docs/sep-references/Reference_Framework_for_Participatory_Social_Engagement_Methodologies.pdf
 *
 * Spec s.3: tender-grounded; no fabrication; project-specific methodology.
 * Framework s.1: do not prescribe a single methodology for every project.
 */

export const SEP_SPEC_CITE = {
  id: "TL-SEP-SPEC-1.0",
  title: "TrustLedger SRM — SEP Generation Specification",
  version: "1.0",
  short: "SEP Specification v1.0",
  path: "docs/sep-references/TrustLedger_SEP_Generation_Specification_v1.0.pdf",
} as const;

export const SEP_FRAMEWORK_CITE = {
  id: "TL-SEP-FW-1.0",
  title: "Reference Framework for Participatory Social Engagement Methodologies",
  version: "1.0",
  short: "Participatory Methodologies Framework v1.0",
  path: "docs/sep-references/Reference_Framework_for_Participatory_Social_Engagement_Methodologies.pdf",
} as const;

/** Spec s.25 — only these methodological sources may be cited unless the tender names others. */
export const SEP_METHOD_LITERATURE = [
  "Chambers, R. — Participatory Rural Appraisal (PRA) and Participatory Learning and Action (PLA).",
  "Institute of Development Studies (IDS) — PRA/PLA and participatory practice literature.",
  "Food and Agriculture Organization (FAO) — participatory appraisal methods (mapping, transects, seasonal calendars, ranking, Venn diagrams, triangulation).",
  "Israel, B.A., Schulz, A.J., Parker, E.A. & Becker, A.B. — Community-Based Participatory Research.",
  "Centers for Disease Control and Prevention (CDC) — community-based participatory research and community engagement literature.",
] as const;

/** Framework s.21 + Spec s.9.1 — requirement → method. Do not invent extra pairings. */
export const SEP_METHOD_SELECTION: Array<{
  requirement: string;
  method: "pra" | "pla" | "cbpr" | "pra_pla" | "pla_cbpr" | "pra_pla_srm";
}> = [
  { requirement: "community profile", method: "pra" },
  { requirement: "social mapping", method: "pra" },
  { requirement: "infrastructure mapping", method: "pra" },
  { requirement: "stakeholder mapping", method: "pra_pla" },
  { requirement: "community history", method: "pra" },
  { requirement: "seasonal vulnerability", method: "pra" },
  { requirement: "community priorities", method: "pra" },
  { requirement: "problem analysis", method: "pra_pla" },
  { requirement: "community action planning", method: "pla" },
  { requirement: "participatory monitoring", method: "pla" },
  { requirement: "adaptive engagement", method: "pla" },
  { requirement: "formal community research", method: "cbpr" },
  { requirement: "impact research", method: "cbpr" },
  { requirement: "community-defined indicators", method: "cbpr" },
  { requirement: "participatory evaluation", method: "cbpr" },
  { requirement: "knowledge co-production", method: "cbpr" },
  { requirement: "long-term partnership", method: "pla_cbpr" },
  { requirement: "social-risk intelligence", method: "pra_pla_srm" },
  { requirement: "grievance learning", method: "pla_cbpr" },
  { requirement: "community validation", method: "pla_cbpr" },
  { requirement: "understand local conditions", method: "pra" },
  { requirement: "identify priorities", method: "pra_pla" },
  { requirement: "co-design responses", method: "pla" },
  { requirement: "conduct participatory research", method: "cbpr" },
  { requirement: "validate findings", method: "pla_cbpr" },
  { requirement: "impact assessment", method: "cbpr" },
  { requirement: "social-risk identification", method: "pra_pla" },
];

export const SEP_PRINCIPLES = [
  "Tender-grounded: project facts originate in the uploaded tender or explicitly supplied client facts (Specification s.3).",
  "No fabrication: never invent names, numbers, sites, budgets, dates, approvals, stakeholders or commitments (Specification s.3).",
  "Fact/assumption separation: tender fact, client fact, regulatory reference, professional inference, proposed methodology, or to-be-confirmed (Specification s.3, s.17).",
  "Project-specific methodology: methods are selected because of identified project needs, not as a fixed sequence (Specification s.3; Framework s.1).",
  "Participation over consultation: inform, consult, involve, collaborate, empower — not a blanket ‘consulted’ (Specification s.10).",
  "Decision linkage: show how stakeholder input can influence project decisions (Specification s.10; Framework s.20.F).",
  "Inclusion by design (Framework s.22; Specification s.12).",
  "Evidence-based: activities have outputs, records, indicators and verification (Specification s.11, s.16; Framework s.24).",
  "Tender compliance: every identifiable SEP-related tender requirement is traceable (Specification s.18).",
  "Professional restraint: no unsupported legal advice or guaranteed approvals (Specification s.3).",
] as const;

export function citeSpec(section: string): string {
  return `(${SEP_SPEC_CITE.short}, ${section})`;
}

export function citeFramework(section: string): string {
  return `(${SEP_FRAMEWORK_CITE.short}, ${section})`;
}

export function referencesBlock(): string {
  return [
    `1. ${SEP_SPEC_CITE.title}, Version ${SEP_SPEC_CITE.version}. Internal methodological baseline for the TrustLedger SRM Social Engagement & Participation module.`,
    `2. ${SEP_FRAMEWORK_CITE.title}, Version ${SEP_FRAMEWORK_CITE.version}. Methodological reference for PRA, PLA and CBPR in tender-grade SEPs.`,
    ...SEP_METHOD_LITERATURE.map((row, i) => `${i + 3}. ${row}`),
  ].join("\n\n");
}
