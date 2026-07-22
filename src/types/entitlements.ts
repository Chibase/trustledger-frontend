/**
 * Product capabilities — atomic switches for plan bundles and add-ons.
 * Pricing/seats stay in plans.ts; this layer only answers "is this on?".
 */

export const CAPABILITIES = [
  "dashboard",
  "projects",
  "incidents",
  "issueIntake",
  "aiAssist",
  "captureHub",
  "stakeholdersCrm",
  "geoIntake",
  "trustPulse",
  "deskGraphs",
  "supervisorQueue",
  "governanceReports",
  "engagements",
  "commitments",
  "esgIndicators",
] as const;

export type CapabilityId = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<CapabilityId, string> = {
  dashboard: "Role dashboards",
  projects: "Projects",
  incidents: "Incidents / grievances",
  issueIntake: "Issue intake",
  aiAssist: "AI assist (suggest → apply)",
  captureHub: "Capture hub (minutes / attendance / social)",
  stakeholdersCrm: "Stakeholder CRM",
  geoIntake: "Cascading geo intake",
  trustPulse: "Trust pulse",
  deskGraphs: "Desk charts / graphs",
  supervisorQueue: "Supervisor ranked queue",
  governanceReports: "Governance reports",
  engagements: "Engagements module",
  commitments: "Commitments register",
  esgIndicators: "ESG / socio-economic indicators",
};

/** Sellable add-ons that can turn individual capabilities on above a base plan. */
export type AddonId =
  | "addon_capture"
  | "addon_crm"
  | "addon_supervisor"
  | "addon_graphs"
  | "addon_esg"
  | "addon_commitments";

export const ADDON_LABELS: Record<AddonId, string> = {
  addon_capture: "Capture hub pack",
  addon_crm: "Stakeholder CRM pack",
  addon_supervisor: "Supervisor queue pack",
  addon_graphs: "Analytics / graphs pack",
  addon_esg: "ESG indicators pack",
  addon_commitments: "Commitments pack",
};

export const ADDON_GRANTS: Record<AddonId, CapabilityId[]> = {
  addon_capture: ["captureHub"],
  addon_crm: ["stakeholdersCrm"],
  addon_supervisor: ["supervisorQueue"],
  addon_graphs: ["deskGraphs", "trustPulse"],
  addon_esg: ["esgIndicators"],
  addon_commitments: ["commitments", "engagements"],
};
