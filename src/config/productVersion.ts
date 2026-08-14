/**
 * Internal product version constants (ops / TEDS maturity).
 * Do not render PRODUCT_VERSION_LABEL in public or customer UI (ADR-044).
 */
export const PRODUCT_VERSION = "001" as const;
export const PRODUCT_VERSION_LABEL = `Version ${PRODUCT_VERSION}`;
export const NEXT_PRODUCT_VERSION = "002" as const;
export const NEXT_PRODUCT_VERSION_LABEL = `Version ${NEXT_PRODUCT_VERSION}`;

export const VERSION_001_SUMMARY =
  "Resolution desk — role workspaces, grievance intake, trial, and subscribe path.";

export const VERSION_002_SUMMARY =
  "Stakeholder Intelligence — place context, registry, engagements, commitments, reports, and ESG depth.";
