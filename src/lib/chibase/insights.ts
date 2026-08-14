export type FirmInsight = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  body: string[];
};

export const FIRM_INSIGHTS: FirmInsight[] = [
  {
    slug: "social-facilitation-is-broken",
    kicker: "Practice",
    title: "Social facilitation is broken — and box-checking is why",
    summary:
      "When engagement is a compliance event, communities learn that talking changes nothing. The fix is a trail: who was heard, what was promised, what closed.",
    body: [
      "Most programmes still treat stakeholder engagement as a meeting to prove they consulted. Attendance registers go in a folder. Promises live in someone’s notebook. Grievances arrive on WhatsApp. Then a stoppage looks like it came from nowhere.",
      "Facilitation that holds is dull in the best way: one case identity, a named owner, an acknowledgment, and commitments that are still visible at the next imbizo. That is method, not a slogan.",
      "Chibase runs that practice with people. TrustLedger is the desk that keeps the evidence when the team is not in the room.",
    ],
  },
  {
    slug: "cockroach-theory",
    kicker: "Risk",
    title: "The cockroach theory: local structures adapt faster than your organogram",
    summary:
      "Host communities reorganise around a project whether you map them or not. Ignore customary and ward structures and you will meet them at the gate.",
    body: [
      "Projects enter with a stakeholder list from last year’s consultant. On the ground, influence has already moved — a traditional council, a ward committee, an SMME forum, a youth structure. Those are not obstacles. They are the operating system.",
      "Critical involvement means those structures are named counterparts with place, not a ‘community’ blob. Dual governance — municipal process and customary authority — has to be designed, not hoped for.",
      "We map that before mobilisation. The software does not replace the conversation. It stops the conversation from being lost.",
    ],
  },
];

export function insightBySlug(slug: string): FirmInsight | undefined {
  return FIRM_INSIGHTS.find((i) => i.slug === slug);
}
