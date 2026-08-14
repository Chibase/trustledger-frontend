import type { ThembaKnowledgeItem } from "@/lib/themba/types";
import { THEMBA_SOURCE_TITLES } from "@/lib/themba/sources/types";

const SRC = THEMBA_SOURCE_TITLES.iksPractice;

/**
 * IKS / community-knowledge practice frame that already ships in product.
 * Published papers are NOT loaded until approved excerpts exist in
 * docs/themba/sources/IKS_PAPERS.md — never invent titles or findings.
 */
export const IKS_PRACTICE_ITEMS: ThembaKnowledgeItem[] = [
  {
    id: "iks-practice",
    question:
      "How does TrustLedger treat Indigenous Knowledge Systems (IKS) in social facilitation, community participation, and M&E?",
    sourceId: "iksPractice",
    sourceTitle: SRC,
    answer:
      "TrustLedger treats **Indigenous Knowledge Systems (IKS)** as living practice in social facilitation, community participation, and MEL — not as folklore bolted onto a Western logframe.\n\n**What already ships in the product (practice frame, not a claimed paper citation):**\n\n- **Named counterparts, including traditional authorities.** The stakeholder registry is built for people and institutions around a project: community members, traditional councils / authorities where they exist, local government, contractors, and civil society — with influence, interests, and **place**.\n- **Place is not optional.** South African plans include municipalities, wards, and traditional councils where packed (baseline intel). Global South programmes use the same place model: you add the project and situation; you do not pretend the host community has no geography. Further national packs follow the same pattern — we do not invent unshipped country maps.\n- **Participation has a trail.** Engagements (consultations, walkabouts, imbizo-style meetings) and commitments (promises with owners and due dates) sit beside the grievance desk, so what was heard is not lost in WhatsApp.\n- **MEL that can count lived experience.** Reports are evidence packs from the case and engagement trail — volume, SLA, severity, closure, aging, open/broken commitments — not a fill-in-the-blank month-end template. Indicators should be able to sit next to community-defined outcomes, not replace them.\n- **Social facilitation is a first-class role.** Facilitators, CLOs, and public-participation practitioners need assisted intake, multilingual capture, and a RACI that consults community reps and traditional authorities — the SRM blueprint’s field and engagement dimensions.\n\n**Honesty about the published papers:** two papers on integrating IKS into mainstream social facilitation / community participation and M&E are a planned Themba source. They are **not loaded in this knowledge base yet**. Until approved excerpts are filed, Themba will not invent paper titles, findings, or quotations. If you have those papers, share approved excerpts (abstract + licensed passages) so they can be cited as a named source.\n\nUntil then, ask for a walkthrough of the registry, engagement, and MEL trail on /product, or take the free readiness diagnostic to see which of the six SRM dimensions is weakest in your programme.",
    keywords: [
      "iks",
      "indigenous",
      "knowledge",
      "system",
      "systems",
      "traditional",
      "authority",
      "authorities",
      "customary",
      "participation",
      "facilitation",
      "facilitator",
      "community",
      "lived",
      "experience",
      "culture",
      "local knowledge",
      "ubuntu",
      "imbizo",
      "kgotla",
    ],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/assessment", label: "Readiness diagnostic" },
      { href: "/resources/engagement-toolkit", label: "Engagement toolkit" },
    ],
  },
];
