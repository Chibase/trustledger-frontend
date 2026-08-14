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
import { shouldEscalate } from "@/lib/themba/escalate";
import { magnetForQuestion, type ThembaMagnet } from "@/lib/themba/magnet";
import {
  detectThembaProfile,
  isProfileIdentityMessage,
  type ThembaProfile,
} from "@/lib/themba/profile";
import { thembaPolishSystemPrompt } from "@/lib/themba/prompt";
import { retrieveKnowledge } from "@/lib/themba/retrieve";
import { sanitizeThembaText } from "@/lib/themba/sanitize";

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
    "Understood — **funder / investor** lens. Social licence delay is delivery and covenant risk. I can walk ROI, risk mitigation, and board/funder report packs (produced from the operator workspace — there is no public funder login).",
  engineer:
    "Understood — **civil engineer** lens. Unresolved grievances become stoppages. I can walk rapid-response intake on the case desk, ZA place context, and how site teams keep one auditable trail.",
  project_manager:
    "Understood — **project manager** lens. TrustLedger sits beside delivery: stakeholders, engagements, commitments, and a grievance desk with SLAs so promises are visible before the next steering meeting.",
  municipal:
    "Understood — **municipal leader** lens. Oversight and funding both need engagement evidence you can defend. ZA place packs (municipalities, wards, traditional councils where packed) ship with every plan.",
  other:
    "Understood. I’ll keep answers general across the grievance desk and Stakeholder Intelligence, and tailor if you tell me more about your role.",
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
    /\b(how (do|does|to)|log|workflow|navigate|dashboard|grievance|commitment|engagement)\b/.test(
      q,
    ) ||
    topicId === "rapid-response" ||
    topicId === "features"
  ) {
    return "guide";
  }
  return "knowledge";
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

  if (identityTurn && profile) {
    const topicId =
      profile === "funder"
        ? "funder-value"
        : profile === "engineer"
          ? "engineer-value"
          : profile === "project_manager"
            ? "pm-value"
            : profile === "municipal"
              ? "municipal-value"
              : undefined;
    const extra = retrieved.item?.answer
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

  const body = retrieved.item.answer;
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
        max_tokens: 500,
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
      signal: AbortSignal.timeout(12000),
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
