import type {
  AssessmentAnswers,
  AssessmentDimension,
  AssessmentDimensionId,
  AssessmentQuestion,
  AssessmentResult,
  DimensionScore,
  LikertValue,
  RiskBand,
} from "@/types/assessment";

export const LIKERT_OPTIONS: { value: LikertValue; label: string }[] = [
  { value: 1, label: "Not in place" },
  { value: 2, label: "Ad hoc" },
  { value: 3, label: "Partial" },
  { value: 4, label: "Mostly consistent" },
  { value: 5, label: "Embedded / governed" },
];

export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  {
    id: "intake",
    label: "Grievance intake & case lifecycle",
    shortLabel: "Intake",
    issue: "Escalating grievances from fragmented or incomplete case capture.",
    priorityTitle: "Stabilise intake and case lifecycle",
    prioritySummary:
      "Unresolved community issues compound when channels are informal and cases lack a clear path from receipt to closure.",
    day30:
      "Map every intake channel (walk-in, phone, WhatsApp, email, site desk) and define a single case ID convention.",
    day60:
      "Pilot structured triage categories and mandatory fields for new cases at one priority site.",
    day90:
      "Enforce verified closure checklist and weekly backlog review for open cases older than SLA.",
  },
  {
    id: "ownership",
    label: "Ownership, SLA & escalation",
    shortLabel: "Ownership",
    issue: "Weak visibility and unclear accountability across sites and teams.",
    priorityTitle: "Clarify ownership, SLAs, and escalation",
    prioritySummary:
      "Leadership cannot intervene early when owners, deadlines, and escalation paths are informal or invisible.",
    day30:
      "Assign a named owner and target SLA for every open high-severity case; publish a simple RACI.",
    day60:
      "Activate automated reminders and an escalation ladder (site → regional → executive) for breached SLAs.",
    day90:
      "Review SLA compliance in a standing governance meeting with action owners minuted.",
  },
  {
    id: "field",
    label: "Field accessibility & adoption",
    shortLabel: "Field",
    issue: "Low field adoption from connectivity gaps and literacy barriers.",
    priorityTitle: "Make field capture usable offline and assisted",
    prioritySummary:
      "Data quality collapses when field teams cannot capture consistently in low-connectivity or low-literacy settings.",
    day30:
      "Identify the three highest-friction capture points and define assisted/offline workarounds.",
    day60:
      "Train site liaison officers on assisted intake scripts and multilingual prompts.",
    day90:
      "Measure field submission completeness weekly and close the top two process gaps.",
  },
  {
    id: "engagement",
    label: "Community engagement & trust",
    shortLabel: "Engagement",
    issue: "Social license erosion when communities do not see timely, credible responses.",
    priorityTitle: "Rebuild trust loops with communities",
    prioritySummary:
      "Trust deficits grow when engagement is episodic and complainants never learn what happened to their case.",
    day30:
      "Define acknowledgment and update cadences for complainants (e.g. 48h / 14-day).",
    day60:
      "Run a community feedback session on grievance channels and publish accessible how-to guidance.",
    day90:
      "Track acknowledgment and update compliance; share anonymised trend summaries with community reps.",
  },
  {
    id: "reporting",
    label: "Reporting & ESG readiness",
    shortLabel: "Reporting",
    issue: "Slow executive and regulator reporting from fragmented sources.",
    priorityTitle: "Produce board-ready social performance reporting",
    prioritySummary:
      "Board and regulator packs take weeks when metrics are assembled manually from inconsistent spreadsheets.",
    day30:
      "Agree a minimum KPI set (volume, SLA, severity, closure, aging) and a single source of truth.",
    day60:
      "Automate a monthly social performance pack for one site with consistent definitions.",
    day90:
      "Extend the pack to multi-site roll-up and retain an audit trail for board/regulator asks.",
  },
  {
    id: "assurance",
    label: "Data quality & assurance",
    shortLabel: "Assurance",
    issue: "Governance risk when case data cannot be defended under scrutiny.",
    priorityTitle: "Strengthen data quality and assurance controls",
    prioritySummary:
      "Without evidence trails, duplicate checks, and periodic assurance, reported performance is hard to defend.",
    day30:
      "Introduce mandatory evidence stubs for high-severity closures and a duplicate-check step.",
    day60:
      "Sample 10% of closed cases for completeness and owner sign-off quality.",
    day90:
      "Document an assurance calendar (quarterly review) with corrective actions tracked to closure.",
  },
];

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "intake_channels",
    dimensionId: "intake",
    prompt:
      "Community concerns can be logged through clear, known channels (not only informal word-of-mouth).",
    help: "Think walk-in desks, phone lines, digital forms, and assisted capture.",
  },
  {
    id: "intake_lifecycle",
    dimensionId: "intake",
    prompt:
      "Every grievance has a single case record from intake through verified closure.",
  },
  {
    id: "intake_categories",
    dimensionId: "intake",
    prompt:
      "Cases are categorised consistently (theme, severity, site) so trends are comparable over time.",
  },
  {
    id: "own_named",
    dimensionId: "ownership",
    prompt:
      "Every open case has a named owner accountable for progress and updates.",
  },
  {
    id: "own_sla",
    dimensionId: "ownership",
    prompt:
      "Service-level targets exist by severity, and breaches are visible to supervisors.",
  },
  {
    id: "own_escalate",
    dimensionId: "ownership",
    prompt:
      "Escalation paths to site, regional, and executive levels are defined and used when needed.",
  },
  {
    id: "field_offline",
    dimensionId: "field",
    prompt:
      "Field teams can capture or update cases even with intermittent connectivity.",
  },
  {
    id: "field_assisted",
    dimensionId: "field",
    prompt:
      "Assisted or multilingual intake is available where literacy or language is a barrier.",
  },
  {
    id: "field_adoption",
    dimensionId: "field",
    prompt:
      "Site staff actually use the agreed process day-to-day (not a parallel paper trail).",
  },
  {
    id: "eng_ack",
    dimensionId: "engagement",
    prompt:
      "Complainants receive timely acknowledgment that their concern was received.",
  },
  {
    id: "eng_updates",
    dimensionId: "engagement",
    prompt:
      "Communities receive credible progress updates before cases go quiet for long periods.",
  },
  {
    id: "eng_channels_known",
    dimensionId: "engagement",
    prompt:
      "Affected communities know how to raise a concern and what to expect next.",
  },
  {
    id: "rep_kpi",
    dimensionId: "reporting",
    prompt:
      "Leadership can see current grievance volume, aging, and SLA performance without a manual scramble.",
  },
  {
    id: "rep_board",
    dimensionId: "reporting",
    prompt:
      "Board or regulator social-performance packs can be produced from governed data within days, not weeks.",
  },
  {
    id: "assure_evidence",
    dimensionId: "assurance",
    prompt:
      "High-severity closures retain evidence and an audit trail that can withstand scrutiny.",
  },
  {
    id: "assure_review",
    dimensionId: "assurance",
    prompt:
      "Periodic quality or assurance reviews sample cases and drive corrective actions.",
  },
];

const RISK_COPY: Record<
  RiskBand,
  { label: string; summary: string; min: number; max: number }
> = {
  critical: {
    label: "Critical",
    summary:
      "Foundational grievance and governance controls are largely missing. Prioritise intake stability and ownership before scaling reporting.",
    min: 0,
    max: 39,
  },
  elevated: {
    label: "Elevated",
    summary:
      "Partial practices exist, but gaps in accountability, field adoption, or trust loops create material operational and reputational risk.",
    min: 40,
    max: 59,
  },
  moderate: {
    label: "Moderate",
    summary:
      "Core processes are partially consistent. Focus on closing the lowest-scoring dimensions to reach governance-grade reliability.",
    min: 60,
    max: 74,
  },
  strong: {
    label: "Strong",
    summary:
      "Practices are largely embedded. Maintain assurance cadence and tighten the remaining weak spots for board-ready confidence.",
    min: 75,
    max: 100,
  },
};

export function dimensionById(
  id: AssessmentDimensionId,
): AssessmentDimension {
  const found = ASSESSMENT_DIMENSIONS.find((d) => d.id === id);
  if (!found) {
    throw new Error(`Unknown assessment dimension: ${id}`);
  }
  return found;
}

export function likertToScore(value: LikertValue): number {
  return value * 20;
}

export function scoreAssessment(answers: AssessmentAnswers): AssessmentResult {
  const dimensions: DimensionScore[] = ASSESSMENT_DIMENSIONS.map((dim) => {
    const qs = ASSESSMENT_QUESTIONS.filter((q) => q.dimensionId === dim.id);
    const values = qs.map((q) => answers[q.id]).filter(Boolean) as LikertValue[];
    const averageLikert =
      values.length === 0
        ? 0
        : values.reduce((sum, v) => sum + v, 0) / values.length;
    return {
      id: dim.id,
      label: dim.label,
      shortLabel: dim.shortLabel,
      averageLikert,
      score: Math.round(averageLikert * 20),
    };
  });

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
  );

  const riskBand = riskBandForScore(overallScore);
  const risk = RISK_COPY[riskBand];

  const topPriorities = [...dimensions]
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
    .slice(0, 3)
    .map((d) => d.id);

  return {
    overallScore,
    riskBand,
    riskLabel: risk.label,
    riskSummary: risk.summary,
    dimensions,
    topPriorities,
    completedAt: new Date().toISOString(),
  };
}

export function riskBandForScore(score: number): RiskBand {
  if (score < 40) return "critical";
  if (score < 60) return "elevated";
  if (score < 75) return "moderate";
  return "strong";
}

export function isWorkEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  const domain = trimmed.split("@")[1] ?? "";
  const freeDomains = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "yahoo.co.za",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "protonmail.com",
    "proton.me",
    "gmx.com",
    "gmx.net",
    "mail.com",
    "yandex.com",
    "yandex.ru",
    "zoho.com",
    "pm.me",
  ]);
  return !freeDomains.has(domain);
}

export const ASSESSMENT_STORAGE_KEY = "tl-assessment-result";
export const ASSESSMENT_LEAD_KEY = "tl-assessment-lead";

export const ASSESSMENT_SECTORS = [
  "Mining & Extractives",
  "Energy & Infrastructure",
  "Municipal / Public Sector",
  "Large Community-Impact Projects",
  "Other",
] as const;
