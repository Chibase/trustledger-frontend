import { FIELD_TEMPLATES } from "@/data/fieldTemplates";

export type ResourcePackId =
  | "minutes-template"
  | "attendance-register"
  | "field-note"
  | "grievance-checklist"
  | "readiness-planner"
  | "engagement-toolkit";

export type ResourceFamily = "toolkit" | "field-template";

export type ResourceSection = {
  title: string;
  intro?: string;
  items: string[];
  /** field = fill-in lines; checkbox = toolkit ticks */
  itemStyle?: "checkbox" | "field";
};

export type ResourcePack = {
  id: ResourcePackId;
  family: ResourceFamily;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  audience: string;
  pagesHint: string;
  version: string;
  filename: string;
  sections: ResourceSection[];
};

export const TOOLKIT_PACKS: ResourcePack[] = [
  {
    id: "grievance-checklist",
    family: "toolkit",
    title: "Grievance Checklist",
    shortTitle: "Grievance checklist",
    tagline: "Stabilise intake before trust erodes",
    description:
      "A field-ready checklist to map channels, assign case ownership, set severity SLAs, and close grievances with evidence you can defend.",
    audience: "Site managers, social performance leads, liaison officers",
    pagesHint: "PDF · ~6 sections",
    version: "2026.08",
    filename: "Grievance-Checklist.pdf",
    sections: [
      {
        title: "1. Intake channel map",
        intro: "List every way a concern can arrive — then force a single case ID.",
        items: [
          "Walk-in / site desk recorded with date, complainant reference, and location",
          "Phone / WhatsApp / SMS logged into the same case convention (not a private inbox)",
          "Email / letter / municipal referral mapped to the same ID",
          "Anonymous and third-party reports accepted with a clear triage path",
          "Assisted capture available for low-literacy or low-connectivity settings",
        ],
      },
      {
        title: "2. Case identity & mandatory fields",
        items: [
          "One unique case ID from first contact through verified closure",
          "Theme / category coded consistently across sites",
          "Severity assigned at intake (with override rules documented)",
          "Site / ward / project linked on every case",
          "Named owner assigned within the intake SLA window",
        ],
      },
      {
        title: "3. Acknowledgment & update cadence",
        items: [
          "Complainant acknowledgment target defined (e.g. within 48 hours)",
          "Progress update cadence defined (e.g. every 14 days while open)",
          "Language and channel preference recorded where possible",
          "Escalation contact published when SLA is at risk",
        ],
      },
      {
        title: "4. Severity SLAs & escalation ladder",
        items: [
          "Critical / high / medium / low targets written and known to supervisors",
          "Breach list visible weekly (not buried in email)",
          "Escalation path: site → regional → executive with named roles",
          "Safety / human-rights flags trigger immediate escalation",
        ],
      },
      {
        title: "5. Closure with evidence",
        items: [
          "Closure requires outcome note + evidence stub for high-severity cases",
          "Complainant informed of outcome (or reason if not reachable)",
          "Duplicate / related cases linked before close",
          "Sample of closed cases reviewed monthly for quality",
        ],
      },
      {
        title: "6. Weekly operating rhythm",
        items: [
          "Open aging cases older than SLA reviewed every week",
          "Top themes summarised for site leadership",
          "Field friction (incomplete submissions) tracked and fixed",
          "Actions from reviews have owners and dates",
        ],
      },
    ],
  },
  {
    id: "readiness-planner",
    family: "toolkit",
    title: "SRM Readiness & 90-Day Planner",
    shortTitle: "Readiness planner",
    tagline: "Turn diagnostic gaps into a 90-day plan",
    description:
      "Score six governance dimensions, pick your top three gaps, and plan 30 / 60 / 90-day actions you can run with your own tools.",
    audience: "ESG / social performance, project directors, compliance leads",
    pagesHint: "PDF worksheet · 6 dimensions",
    version: "2026.08",
    filename: "SRM-Readiness-Planner.pdf",
    sections: [
      {
        title: "How to use this planner",
        items: [
          "Rate each dimension 1 (not in place) to 5 (embedded / governed)",
          "Circle your three lowest scores — those become your priorities",
          "Write DIY actions for 30 / 60 / 90 days",
          "Optional: complete a scored diagnostic if your organisation uses one",
        ],
      },
      {
        title: "Dimension A — Grievance intake & case lifecycle",
        intro: "Score ___ / 5",
        items: [
          "30 days: map every intake channel; define one case ID convention",
          "60 days: pilot structured triage at one priority site",
          "90 days: enforce verified closure + weekly aging review",
        ],
      },
      {
        title: "Dimension B — Ownership, SLA & escalation",
        intro: "Score ___ / 5",
        items: [
          "30 days: named owner + SLA on every high-severity open case; simple RACI",
          "60 days: reminders + escalation ladder for breaches",
          "90 days: standing SLA review with minuted owners",
        ],
      },
      {
        title: "Dimension C — Field accessibility & adoption",
        intro: "Score ___ / 5",
        items: [
          "30 days: identify three highest-friction capture points",
          "60 days: train liaison officers on assisted / multilingual intake",
          "90 days: measure submission completeness weekly",
        ],
      },
      {
        title: "Dimension D — Community engagement & trust",
        intro: "Score ___ / 5",
        items: [
          "30 days: acknowledgment and update cadences (e.g. 48h / 14-day)",
          "60 days: community feedback session on grievance channels",
          "90 days: share anonymised trends with community reps",
        ],
      },
      {
        title: "Dimension E — Reporting & ESG readiness",
        intro: "Score ___ / 5",
        items: [
          "30 days: agree minimum KPI set (volume, SLA, severity, closure, aging)",
          "60 days: monthly social performance pack for one site",
          "90 days: multi-site roll-up with audit trail",
        ],
      },
      {
        title: "Dimension F — Data quality & assurance",
        intro: "Score ___ / 5",
        items: [
          "30 days: evidence stubs on high-severity closures + duplicate check",
          "60 days: sample 10% of closed cases for quality",
          "90 days: quarterly assurance calendar with corrective actions",
        ],
      },
    ],
  },
  {
    id: "engagement-toolkit",
    family: "toolkit",
    title: "Community Engagement Toolkit",
    shortTitle: "Engagement toolkit",
    tagline: "Make engagement continuous, not episodic",
    description:
      "Agendas, RACI, acknowledgment scripts, and a commitment log so communities see credible follow-through — the foundation of social licence.",
    audience: "Community relations, stakeholder managers, project teams",
    pagesHint: "PDF toolkit · agendas + logs",
    version: "2026.08",
    filename: "Community-Engagement-Toolkit.pdf",
    sections: [
      {
        title: "1. Engagement purpose checklist",
        items: [
          "Purpose stated in one sentence (inform / consult / decide / remediate)",
          "Stakeholders mapped: who is affected, who influences, who must be informed",
          "Success looks like: what trust outcome you want after this cycle",
          "Risks named: boycott, misinformation, safety, exclusion of vulnerable groups",
        ],
      },
      {
        title: "2. Meeting agenda template",
        items: [
          "Welcome, purpose, and ground rules (10 min)",
          "Update on previous commitments — open / closed / delayed (15 min)",
          "New concerns intake — capture into case IDs where needed (20 min)",
          "Options and constraints explained in plain language (15 min)",
          "Agreed actions with owners and dates (15 min)",
          "How / when people will hear next (5 min)",
        ],
      },
      {
        title: "3. Simple RACI for community issues",
        items: [
          "Responsible: named site owner for each open issue",
          "Accountable: manager who can unblock resources",
          "Consulted: community reps / traditional authorities as appropriate",
          "Informed: complainants and internal leadership on cadence",
        ],
      },
      {
        title: "4. Acknowledgment & update script (adapt language)",
        items: [
          "We received your concern on [date] — reference [case ID]",
          "Who is handling it: [name / role]",
          "What happens next and by when",
          "How to reach us if something changes or worsens",
          "We will update you by [date] even if the issue is not yet closed",
        ],
      },
      {
        title: "5. Commitment / promise log fields",
        items: [
          "Promise statement (plain language)",
          "Made to (person / group / ward)",
          "Owner and due date",
          "Status: open / at risk / fulfilled / deferred (with reason)",
          "Evidence of fulfilment (meeting note, photo, payment ref, letter)",
        ],
      },
      {
        title: "6. After-action review (monthly)",
        items: [
          "How many engagements held vs planned",
          "Commitments opened / closed / overdue",
          "Issues escalated from engagement into grievance cases",
          "What communities said worked — and what eroded trust",
          "Two process changes for next month",
        ],
      },
    ],
  },
];

export const RESOURCE_PACKS: ResourcePack[] = [
  ...FIELD_TEMPLATES,
  ...TOOLKIT_PACKS,
];

export function resourcePacksByFamily(family: ResourceFamily): ResourcePack[] {
  return RESOURCE_PACKS.filter((p) => p.family === family);
}

export function resourcePackById(id: string): ResourcePack | undefined {
  return RESOURCE_PACKS.find((p) => p.id === id);
}

export function isResourcePackId(id: string): id is ResourcePackId {
  return RESOURCE_PACKS.some((p) => p.id === id);
}
