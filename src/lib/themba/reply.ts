import {
  THEMBA_ESCALATE_REPLY,
  type ThembaLink,
} from "@/lib/themba/knowledge";
import {
  conversionActionsFor,
  followUpChipsFor,
  type ThembaAction,
  type ThembaChip,
} from "@/lib/themba/actions";
import { THEMBA_BUG_REPLY, isProductDefectReport } from "@/lib/themba/bugDetect";
import { shouldEscalate, wantsHuman } from "@/lib/themba/escalate";
import { magnetForQuestion, type ThembaMagnet } from "@/lib/themba/magnet";
import {
  detectThembaProfile,
  isProfileIdentityMessage,
  type ThembaProfile,
} from "@/lib/themba/profile";
import { thembaPolishSystemPrompt } from "@/lib/themba/prompt";
import { retrieveKnowledge } from "@/lib/themba/retrieve";
import { sanitizeThembaText } from "@/lib/themba/sanitize";
import type { ThembaKnowledgeItem } from "@/lib/themba/types";

export type ThembaChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ThembaReplyMode = "knowledge" | "escalate" | "marketing" | "guide";

export type ThembaReply = {
  reply: string;
  escalate: boolean;
  links: ThembaLink[];
  actions: ThembaAction[];
  chips: ThembaChip[];
  mode: ThembaReplyMode;
  score: number;
  profile: ThembaProfile | null;
  magnet: ThembaMagnet | null;
  bugHint: boolean;
};

const DEFAULT_LINKS: ThembaLink[] = [
  { href: "/contact", label: "Contact" },
  { href: "/trial", label: "Start trial" },
  { href: "/product", label: "Product overview" },
];

const PROFILE_WELCOME: Record<ThembaProfile, string> = {
  funder:
    "Understood — **funder / investor** lens. Social licence delay is delivery and covenant risk across Global South programmes. I can walk ROI, risk mitigation, and board/funder report packs (produced from the operator workspace — there is no public funder login).",
  engineer:
    "Understood — **civil engineer** lens. Unresolved grievances become stoppages. I can walk rapid-response intake on the case desk, place context (ZA packs included for South African plans; the same model elsewhere), and how site teams keep one auditable trail.",
  project_manager:
    "Understood — **project / programme manager** lens. TrustLedger sits beside delivery: stakeholders, engagements, commitments, and a grievance desk with SLAs so promises are visible before the next steering meeting.",
  municipal:
    "Understood — **local government / public-sector** lens. Oversight and funding both need engagement evidence you can defend — in South Africa and across the Global South. ZA place packs are included baseline for SA plans, not the whole market.",
  mel:
    "Understood — **MEL / M&E** lens. I will treat TrustLedger as the evidence spine beside your results framework: case SLAs, engagement and commitment trails, and report packs you can defend — with room for community-defined outcomes, not only KPI dashboards.",
  community:
    "Understood — **community member / traditional authority** lens. There is no public community login today; operators and facilitators should keep a fair trail on your behalf (case IDs, acknowledgments, promises that do not vanish after the meeting).",
  social_facilitator:
    "Understood — **social facilitation** lens. I can walk how consultations, customary counterparts, and commitments stay on one trail after the meeting ends — and how IKS is treated as practice, not folklore.",
  other:
    "Understood. I’ll keep answers general across the grievance desk and Stakeholder Intelligence — including MEL, facilitation, and community participation — and tailor if you tell me more about your role.",
};

const PROFILE_TOPIC: Record<ThembaProfile, string | undefined> = {
  funder: "funder-value",
  engineer: "engineer-value",
  project_manager: "pm-value",
  municipal: "municipal-value",
  mel: "mel-value",
  community: "community-value",
  social_facilitator: "facilitator-value",
  other: undefined,
};

function lensFor(question: string, topicId?: string): ThembaReplyMode {
  const q = question.toLowerCase();
  if (
    /\b(roi|risk|compliance|funder|investor|business case|why buy|value)\b/.test(
      q,
    ) ||
    topicId === "funder-value" ||
    topicId === "roi-risk"
  ) {
    return "marketing";
  }
  if (
    /\b(how (do|does|to)|log|workflow|navigate|dashboard|grievance|commitment|engagement|mel|facilitat)\b/.test(
      q,
    ) ||
    topicId === "rapid-response" ||
    topicId === "features" ||
    topicId === "ops-spine" ||
    topicId === "srm-blueprint"
  ) {
    return "guide";
  }
  return "knowledge";
}

function excerpt(text: string, max = 900): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const last = Math.max(cut.lastIndexOf("\n\n"), cut.lastIndexOf(". "));
  return `${(last > 240 ? cut.slice(0, last + 1) : cut).trim()}…`;
}

/** Stitch primary + supporting document sources and cite titles. */
export function composeGroundedAnswer(items: ThembaKnowledgeItem[]): string {
  if (items.length === 0) return "";
  const [primary, ...rest] = items;
  let body = primary.answer;
  const seenIds = new Set<string>([primary.id]);

  for (const extra of rest) {
    if (seenIds.has(extra.id)) continue;
    const isDoc =
      extra.sourceId === "operatingProcedures" ||
      extra.sourceId === "srmBlueprint" ||
      extra.sourceId === "iksPractice";
    if (
      !isDoc &&
      extra.sourceId === (primary.sourceId ?? "product")
    ) {
      continue;
    }
    seenIds.add(extra.id);
    const title = extra.sourceTitle ?? extra.question;
    body += `\n\n**From ${title}**\n\n${excerpt(extra.answer)}`;
  }

  const titles = [
    ...new Set(
      items
        .map((i) => i.sourceTitle)
        .filter((t): t is string => Boolean(t)),
    ),
  ];
  if (titles.length > 0) {
    body += `\n\n*Sources: ${titles.join("; ")}.*`;
  }
  return body;
}

export type ComposeThembaOptions = {
  profile?: ThembaProfile | null;
};

export function composeThembaReply(
  question: string,
  options: ComposeThembaOptions = {},
): ThembaReply {
  const trimmed = question.trim().slice(0, 2000);
  const profile = detectThembaProfile(trimmed, options.profile ?? null);
  const identityTurn = Boolean(
    profile && isProfileIdentityMessage(trimmed),
  );
  const retrieved = retrieveKnowledge(trimmed);
  const bugHint = isProductDefectReport(trimmed);
  const magnet = magnetForQuestion(trimmed);
  const escalate = shouldEscalate(trimmed, retrieved.score);

  if (bugHint && !identityTurn && retrieved.score < 0.55) {
    return {
      reply: sanitizeThembaText(THEMBA_BUG_REPLY),
      escalate: true,
      links: DEFAULT_LINKS,
      actions: conversionActionsFor(profile),
      chips: followUpChipsFor(profile),
      mode: "escalate",
      score: retrieved.score,
      profile,
      magnet: null,
      bugHint: true,
    };
  }

  if (identityTurn && profile && !bugHint && !wantsHuman(trimmed)) {
    const topicId = PROFILE_TOPIC[profile];
    const extra = retrieved.items.length
      ? `\n\n${composeGroundedAnswer(retrieved.items)}`
      : retrieved.item?.answer
        ? `\n\n${retrieved.item.answer}`
        : "";
    return {
      reply: sanitizeThembaText(`${PROFILE_WELCOME[profile]}${extra}`),
      escalate: false,
      links: retrieved.links.length ? retrieved.links : DEFAULT_LINKS.slice(1),
      actions: conversionActionsFor(profile),
      chips: followUpChipsFor(profile, topicId),
      mode: lensFor(trimmed, topicId),
      score: Math.max(retrieved.score, 0.8),
      profile,
      magnet,
      bugHint: false,
    };
  }

  if (escalate || !retrieved.item) {
    return {
      reply: sanitizeThembaText(THEMBA_ESCALATE_REPLY),
      escalate: true,
      links: DEFAULT_LINKS,
      actions: conversionActionsFor(profile),
      chips: followUpChipsFor(profile),
      mode: "escalate",
      score: retrieved.score,
      profile,
      magnet,
      bugHint: false,
    };
  }

  const body = composeGroundedAnswer(retrieved.items);
  const reply = bugHint ? `${body}\n\n${THEMBA_BUG_REPLY}` : body;

  return {
    reply: sanitizeThembaText(reply),
    escalate: bugHint,
    links: retrieved.links.length ? retrieved.links : DEFAULT_LINKS.slice(1),
    actions: conversionActionsFor(profile),
    chips: followUpChipsFor(profile, retrieved.item.id),
    mode: lensFor(trimmed, retrieved.item.id),
    score: retrieved.score,
    profile,
    magnet,
    bugHint,
  };
}

/**
 * Optional server-side polish when THEMBA_XAI_API_KEY / XAI_API_KEY is set.
 * Always grounded on the composed knowledge reply; falls back on any failure.
 */
export async function maybePolishWithLlm(
  question: string,
  base: ThembaReply,
): Promise<ThembaReply> {
  if (base.escalate) return base;

  const key = (
    process.env.THEMBA_XAI_API_KEY ||
    process.env.XAI_API_KEY ||
    ""
  ).trim();
  if (!key) return base;

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.THEMBA_XAI_MODEL || "grok-2-latest",
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: thembaPolishSystemPrompt(base.profile),
          },
          {
            role: "user",
            content: `Visitor question: ${question}\n\nGrounded answer (must stay faithful):\n${base.reply}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(14000),
    });
    if (!res.ok) return base;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const polished = data.choices?.[0]?.message?.content?.trim();
    if (!polished) return base;
    return {
      ...base,
      reply: sanitizeThembaText(polished),
    };
  } catch {
    return base;
  }
}
