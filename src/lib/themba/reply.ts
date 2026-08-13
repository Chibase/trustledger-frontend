import {
  THEMBA_ESCALATE_REPLY,
  type ThembaLink,
} from "@/lib/themba/knowledge";
import { shouldEscalate } from "@/lib/themba/escalate";
import { retrieveKnowledge } from "@/lib/themba/retrieve";
import { sanitizeThembaText } from "@/lib/themba/sanitize";

export type ThembaChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ThembaReply = {
  reply: string;
  escalate: boolean;
  links: ThembaLink[];
  mode: "knowledge" | "escalate";
  score: number;
};

const DEFAULT_LINKS: ThembaLink[] = [
  { href: "/contact", label: "Contact" },
  { href: "/trial", label: "Start trial" },
  { href: "/product", label: "Product overview" },
];

export function composeThembaReply(question: string): ThembaReply {
  const trimmed = question.trim().slice(0, 2000);
  const retrieved = retrieveKnowledge(trimmed);
  const escalate = shouldEscalate(trimmed, retrieved.score);

  if (escalate || !retrieved.item) {
    return {
      reply: sanitizeThembaText(THEMBA_ESCALATE_REPLY),
      escalate: true,
      links: DEFAULT_LINKS,
      mode: "escalate",
      score: retrieved.score,
    };
  }

  return {
    reply: sanitizeThembaText(retrieved.item.answer),
    escalate: false,
    links: retrieved.links.length ? retrieved.links : DEFAULT_LINKS.slice(1),
    mode: "knowledge",
    score: retrieved.score,
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
  if (base.mode === "escalate") return base;

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
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You are Themba, The Trust guide for TrustLedger. Rewrite the grounded answer in 2–4 calm sentences. Do not invent features. Never name Frappe, Vercel, HubSpot, Interserv, or AccordBridge. Say TrustLedger Cloud for hosting. Keep CTAs as plain path hints only.",
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
