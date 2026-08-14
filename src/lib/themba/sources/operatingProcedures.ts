import type { ThembaKnowledgeItem } from "@/lib/themba/types";
import { THEMBA_SOURCE_TITLES } from "@/lib/themba/sources/types";

const SRC = THEMBA_SOURCE_TITLES.operatingProcedures;

/**
 * Public-safe excerpts from the TrustLedger user manual (seeding spine, daily loop).
 * Do not leak stack vendor names or internal version labels.
 */
export const OPERATING_PROCEDURE_ITEMS: ThembaKnowledgeItem[] = [
  {
    id: "ops-spine",
    question: "How do I operate TrustLedger day to day — the seeding spine?",
    sourceId: "operatingProcedures",
    sourceTitle: SRC,
    answer:
      "TrustLedger is a **Social Relations Management (SRM) desk**. Workspaces start empty on purpose: you seed real (or practice) records and add as fieldwork continues. Do **not** start with Reports.\n\n**Seeding spine (memorise this order):**\n\n1. **Project** — site / programme container.\n2. **Stakeholders** — people and organisations (entitled plans).\n3. **Engagements** — meetings and contact (entitled plans).\n4. **Commitments** — promises with owners (entitled plans).\n5. **Incidents** — grievances / cases.\n6. **Capture / files** — minutes and evidence (by plan).\n7. **Reports** — compose from saved work.\n\n**Solo** skips Stakeholder Intelligence (steps 2–4 and the Capture hub). Solo still uses Project → Incidents → issue intake → monthly report. If a module is missing, it is usually a **plan gate**, not a broken screen.\n\n**Daily loop after first seed:** Meet → Engagement. Promise → Commitment. Complaint → Incident + evidence. Week / month → Report. Anytime → refine Stakeholders and Project. Stop batch-loading after the first seed — put TrustLedger on the agenda of the next site meeting.",
    keywords: [
      "operate",
      "operating",
      "procedure",
      "procedures",
      "manual",
      "seeding",
      "spine",
      "daily",
      "loop",
      "setup",
      "wizard",
      "how to use",
      "navigate",
      "workflow",
      "day to day",
      "onboarding",
    ],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/trial", label: "Start 14-day trial" },
    ],
  },
  {
    id: "ops-first-week",
    question: "What should a new workspace do in the first week?",
    sourceId: "operatingProcedures",
    sourceTitle: SRC,
    answer:
      "**Day 1 — container:** Open Projects. Rename the trial project or create one with the real site name. Add place context when fields are available (wards, municipalities, or local names). Keep count small (Solo = 1 active project).\n\n**Day 1–2 — people (entitled plans):** Open Stakeholders. Add about five people you already meet this week — community members, traditional authorities, contractor, client, liaison. Prefer five named humans over fifty empty rows.\n\n**Ongoing — contact and promises:** After each meeting, log an **Engagement** linked to project + stakeholders. Promote promises to **Commitments** with an owner and status. Update status as fieldwork moves — do not wait for month-end.\n\n**When harm or a complaint arrives:** Open Incidents → create a case on the project. Record what happened, who is affected, urgency. If AI Assist is on your plan: read the suggestion → edit → **Apply** → **Save**. AI never writes the official record alone. Attach evidence within your plan’s media quota.\n\n**Reporting cycle:** Open Reports only after the desk has activity. Start with the monthly operational pack. Higher plans unlock executive and board packs. Review before sharing externally. Empty reports mean empty desk work — seed more, do not invent fiction.",
    keywords: [
      "first week",
      "setup",
      "onboard",
      "getting started",
      "seed",
      "stakeholders",
      "incidents",
      "new workspace",
    ],
    links: [
      { href: "/product", label: "Product overview" },
      { href: "/trial", label: "Start 14-day trial" },
    ],
  },
  {
    id: "ops-ai-rules",
    question: "What are the AI Assist operating rules?",
    sourceId: "operatingProcedures",
    sourceTitle: SRC,
    answer:
      "AI Assist follows one locked pattern: **suggest → human apply → save**. Never claim or expect autonomous grievance closure. Solo has **no** AI Assist — Practitioner is the step-up for that capability. Paying and trial workspaces never show fictional sample incidents. Live workspaces run on TrustLedger Cloud.",
    keywords: ["ai", "assist", "suggest", "apply", "save", "automatic", "rules"],
    links: [{ href: "/faq", label: "FAQ" }],
  },
];
