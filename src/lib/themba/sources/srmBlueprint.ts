import type { ThembaKnowledgeItem } from "@/lib/themba/types";
import { THEMBA_SOURCE_TITLES } from "@/lib/themba/sources/types";

const SRC = THEMBA_SOURCE_TITLES.srmBlueprint;

/**
 * Public SRM blueprint — the six readiness dimensions used on /assessment
 * and the printable 90-day planner. This is the buyer-facing SRM model.
 */
export const SRM_BLUEPRINT_ITEMS: ThembaKnowledgeItem[] = [
  {
    id: "srm-blueprint",
    question: "What is the TrustLedger SRM blueprint?",
    sourceId: "srmBlueprint",
    sourceTitle: SRC,
    answer:
      "The **SRM blueprint** is six governance dimensions. Score each from *not in place* to *embedded / governed*. Several “ad hoc” answers means the desk and Stakeholder Intelligence are built for that gap. Take the scored diagnostic at /assessment, or use the free 90-day planner on /resources.\n\n**1. Grievance intake & case lifecycle** — Unresolved community issues compound when channels are informal and cases lack a path from receipt to closure. Stabilise: map every intake channel (walk-in, phone, WhatsApp, email, site desk) to **one case ID**; triage categories and mandatory fields; verified closure and weekly backlog review for cases older than SLA.\n\n**2. Ownership, SLA & escalation** — Leadership cannot intervene when owners, deadlines, and escalation are invisible. Stabilise: named owner and target SLA on every high-severity case; simple RACI; breach visibility; ladder site → regional → executive; standing SLA review with minuted owners.\n\n**3. Field accessibility & adoption** — Data quality collapses in low-connectivity or low-literacy settings. Stabilise: assisted / multilingual intake at the highest-friction capture points; train liaison officers; measure submission completeness weekly.\n\n**4. Community engagement & trust** — Trust erodes when engagement is episodic and complainants never learn what happened. Stabilise: acknowledgment and update cadences (e.g. 48h / 14-day); log engagements and commitments so progress is credible; share anonymised trends with community representatives.\n\n**5. Reporting & ESG readiness** — Board and regulator packs take weeks when metrics are assembled from memory. Stabilise: a minimum KPI set (volume, SLA, severity, closure, aging) from one source of truth; monthly social performance pack; multi-site roll-up with an audit trail.\n\n**6. Data quality & assurance** — Reported performance is hard to defend without evidence, duplicate checks, and periodic review. Stabilise: evidence stubs on high-severity closures; sample closed cases for completeness; a quarterly assurance calendar with corrective actions tracked to closure.\n\nThis blueprint is how TrustLedger talks about **Stakeholder Relationship Management** in the field — not a separate unreleased product. Social Licence to Build (advisory handoff, SRM integration, rapid-response case desk) is the positioning layer on top of these six dimensions.",
    keywords: [
      "srm",
      "blueprint",
      "dimension",
      "dimensions",
      "readiness",
      "maturity",
      "intake",
      "ownership",
      "sla",
      "field",
      "engagement",
      "reporting",
      "assurance",
      "esg",
      "governance",
      "framework",
    ],
    links: [
      { href: "/assessment", label: "SRM readiness diagnostic" },
      { href: "/resources", label: "90-day planner" },
      { href: "/product", label: "Product overview" },
    ],
  },
  {
    id: "srm-engagement-practice",
    question: "How should community engagement and commitments be run?",
    sourceId: "srmBlueprint",
    sourceTitle: THEMBA_SOURCE_TITLES.engagementToolkit,
    answer:
      "Engagement is continuous, not a once-off meeting. From the Community Engagement Toolkit:\n\n- **Purpose** in one sentence (inform / consult / decide / remediate), with affected people, influencers, and those who must be informed mapped.\n- **Agenda** always includes an update on previous commitments (open / closed / delayed) before new concerns are taken.\n- **RACI:** named site owner (Responsible), manager who can unblock (Accountable), community reps and traditional authorities as appropriate (Consulted), complainants and leadership on cadence (Informed).\n- **Acknowledgment script:** we received your concern on [date] — reference [case ID]; who is handling it; what happens next and by when; we will update you even if the issue is not yet closed.\n- **Commitment log:** promise in plain language, made to whom, owner, due date, status (open / at risk / fulfilled / deferred), evidence of fulfilment.\n\nIn TrustLedger this is the Engagements + Commitments modules on entitled plans, linked to the grievance desk so a meeting action can become a case or a tracked promise.",
    keywords: [
      "engagement",
      "engagements",
      "consultation",
      "participation",
      "commitment",
      "commitments",
      "raci",
      "acknowledgment",
      "toolkit",
      "meeting",
      "agenda",
    ],
    links: [
      { href: "/resources/engagement-toolkit", label: "Engagement toolkit" },
      { href: "/product", label: "Product overview" },
    ],
  },
];
