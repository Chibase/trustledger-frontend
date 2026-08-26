/**
 * Honest SLB → TrustLedger desk mapping for SEP documents.
 * Social Licence to Build is positioning (ADR-039 / THEMBA.md), not a
 * separate unreleased product suite. Protocols name shipped modules only.
 */

export type SepSlbLane = {
  id: "map" | "grievance" | "procure" | "engage" | "themba";
  slbLabel: string;
  deskLabel: string;
  href: string;
  protocol: string;
};

export const SEP_SLB_LANES: SepSlbLane[] = [
  {
    id: "map",
    slbLabel: "Stakeholder mapping & intelligence",
    deskLabel: "Stakeholders · Place / geo",
    href: "/app/stakeholders",
    protocol:
      "Power and influence sit on registry rows (high / medium / low). Place packs attach municipality, ward, and customary structure where packed. Historical grievances stay on the Incidents desk by case ID — not a side spreadsheet. Apply this plan after approval to seed prospect rows; humans still name people.",
  },
  {
    id: "grievance",
    slbLabel: "Grievance & dispute resolution",
    deskLabel: "Incidents · Report issue",
    href: "/app/incidents",
    protocol:
      "Cases follow the TrustLedger lifecycle: reported → resource deployed → investigated → resolved → verified → closed. SLA due dates and escalation levels are on the case. Lodgment is Report issue (and Capture). This plan does not claim a public SMS / WhatsApp community portal or a 24/7 staffed division.",
  },
  {
    id: "procure",
    slbLabel: "Local labour & enterprise (as cited)",
    deskLabel: "Projects · Intelligence · Commitments",
    href: "/app/intelligence",
    protocol:
      "Local hire, empowerment spend, and local-content / B-BBEE targets cited in the briefing sit on the project dossier and Intelligence cards. Standing promises become Commitments with owners. TrustLedger is not a procurement marketplace — it is the evidence trail for the KPIs the client already named.",
  },
  {
    id: "engage",
    slbLabel: "Engagement & meeting memory",
    deskLabel: "Engagements · Capture",
    href: "/app/engagements",
    protocol:
      "Imbizos, focus groups, and steering sessions are Engagements. Minutes and attendance use Capture templates so names and actions map on first paste. Commitments made in the room promote to the promise board — they do not stay in a Word file.",
  },
  {
    id: "themba",
    slbLabel: "Public Trust guide (Themba)",
    deskLabel: "Themba on public pages",
    href: "/product",
    protocol:
      "Themba answers visitors on TrustLedger public pages about how the desk works. It does not write the live grievance or registry. Field intake and AI Assist stay suggest → human apply → save on entitled plans.",
  },
];

export const SLB_PHILOSOPHY = `Social Licence to Build™ is the architecture; TrustLedger is the operating desk. The framework has three shipped anchors — not a separate unreleased suite:

1. **Strategic advisory** — readiness diagnostic, governance reports, and a human advisory handoff when the scope is Institutional or custom.
2. **SRM integration** — one trail: grievance desk plus Stakeholder Intelligence (registry, engagements, engagement plan, commitments) on entitled plans.
3. **Rapid-response workflows** — intake, named owners, SLAs, escalation, and evidence on the case desk so issues do not stall in informal channels.

This SEP is written so a tender evaluator can see *how* those desks execute the plan after award — not a generic narrative with software named in a footnote.`;
