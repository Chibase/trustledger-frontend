/** Public-safe reference titles Themba may cite in replies (ADR-045). */
export const THEMBA_SOURCE_TITLES = {
  product: "TrustLedger product guide",
  operatingProcedures: "TrustLedger operating procedures",
  srmBlueprint: "SRM blueprint (six readiness dimensions)",
  iksPractice: "IKS and community participation practice frame",
  engagementToolkit: "Community Engagement Toolkit",
} as const;

export type ThembaSourceId = keyof typeof THEMBA_SOURCE_TITLES;
