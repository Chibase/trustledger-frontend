import type { RiskBand } from "@/types/assessment";

/** sessionStorage keys for the readiness funnel (browser only). */
export const ASSESSMENT_PENDING_KEY = "tl-assessment-pending";
export const ASSESSMENT_UNLOCK_KEY = "tl-assessment-unlock";

export function hubPrimaryCta(
  riskBand: RiskBand,
): "report" | "trial" | "walkthrough" | "product" {
  switch (riskBand) {
    case "critical":
    case "elevated":
      return "walkthrough";
    case "moderate":
      return "trial";
    case "strong":
      return "product";
    default:
      return "report";
  }
}

export function readinessUtm(campaign: string): string {
  const params = new URLSearchParams({
    utm_source: "readiness",
    utm_medium: "cta",
    utm_campaign: campaign,
  });
  return params.toString();
}

export function riskToneClass(band: RiskBand): string {
  switch (band) {
    case "critical":
      return "text-tl-danger";
    case "elevated":
      return "text-tl-amber";
    case "moderate":
      return "text-tl-demo";
    case "strong":
      return "text-tl-trust-ink";
  }
}
