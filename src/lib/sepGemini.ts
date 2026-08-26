/**
 * Server-side Gemini drafter for the client-facing SEP.
 * Facts and playbook rows stay local; Gemini only writes presentable prose.
 * Missing key or a bad payload → playbook template (buildSepDocument).
 */

import { geminiApiKey, geminiModel } from "@/lib/marketing/config";
import { rebuildSepDocument } from "@/lib/sepComposer";
import {
  buildSepDocument,
  clientSepDocumentUsable,
  scrubSepClientCopy,
  SEP_DOCUMENT_SPECS,
  SEP_TOOLS_PARAGRAPH,
} from "@/lib/sepDocument";
import type {
  EngagementPlan,
  SepDocumentSection,
  SepDocumentTable,
} from "@/types/engagementPlan";
import { SEP_PURPOSE_LABELS, SEP_SECTOR_LABELS } from "@/types/engagementPlan";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

const SYSTEM = `You are a South African consulting writer at Chibase Consulting.
Draft a Stakeholder Engagement Plan a municipal client or funder can send as a bid / inception document.

Voice: formal, specific, bid-grade. Implementing entity is always Chibase Consulting.
Cover the assignment: what this project is, what this document is, what the plan will do (what / how / when / who), risks, grievance redress, and how progress will be shown.

Required structure (nine sections, use the given ids and headings):
1. Project overview — subsections **1.1 The project**, **1.2 This document**, **1.3 This plan**
2. Regulatory and compliance framework — only statutes supplied in the facts
3. Stakeholder identification and mapping — include **3.1 Stakeholder categorization matrix**
4. Engagement methodology — include **4.1 Community-Based Participatory Research (CBPR)**, **4.2 Engagement schedule**, and **4.3 Tools**
5. Grievance mechanism — five stages (lodgement, acknowledgement within 48 hours, investigation, resolution, close/escalation) and **5.2 Priority risks**
6. Local economic participation — only if the briefing named targets; otherwise say they follow what the briefing names
7. Monitoring, evaluation and reporting — **7.1 Indicators** with no invented numbers
8. Assumptions and limits
9. Summary for the client

Hard bans (never write these in body or tables):
software product, dashboards, desks, Themba, Capture, Apply, execution protocol, TrustLedger Protocol, SL2B protocol, Frappe, Vercel, HubSpot, WhatsApp, SMS portal, GIS editing, 24/7 or 24-hour call centre, invented household counts, invented budgets, invented named people, invented portals, product architecture, three shipped anchors.

Do not write a heading or paragraph called TrustLedger Protocol, SL2B, or Social Licence to Build protocol. Do not annex SL2B anywhere in the document.

In section 4 only, include one short **4.3 Tools** paragraph: TrustLedger is the record of engagements, promises, and grievances; Social Licence to Build (SL2B) is the sequencing frame (who is met, in what order, how promises are kept). They are tools, not a protocol annex. Do not mention TrustLedger or SL2B in any other section.

If a fact is missing, say it will be locked at inception. Do not invent counterparts.
Relocation / RAP assignments: census → entitlements → host-community consent → move-week helpdesk → livelihood restoration. One grievance path. This is not a full RAP if the client still requires a separate RAP.
Not legal advice.

Return JSON only.`;

function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function clip(value: string, max: number): string {
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

function factsBlob(
  plan: Omit<EngagementPlan, "documentSections">,
  briefing: string,
): string {
  const named = plan.stakeholderClasses.flatMap(
    (row) => row.namedFromBrief || [],
  );
  return [
    plan.projectNameHint,
    plan.clientFunderHint,
    plan.placeHint,
    plan.timelineHint,
    plan.budgetHint || "",
    plan.tenderRefHint || "",
    plan.purposeStatement,
    plan.sourceExcerpt,
    briefing,
    named.join(" "),
    plan.instruments.map((row) => row.label).join(" "),
  ]
    .join("\n")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function inventedCount(sentence: string, allowed: string): boolean {
  const matches = sentence.match(
    /\b\d{1,4}\s+(households?|families|occupiers|beneficiar(?:y|ies)|stands?)\b/gi,
  );
  if (!matches) return false;
  return matches.some((row) => {
    const key = row.replace(/\s+/g, " ").trim().toLowerCase();
    return !allowed.includes(key);
  });
}

function inventedRand(text: string, allowed: string): string[] {
  const amounts = text.match(/\bR\s?[\d\s,]+(?:\.\d+)?(?:\s*(?:million|m|bn))?\b/gi) || [];
  return amounts.filter((row) => {
    const key = row.replace(/\s+/g, " ").trim().toLowerCase();
    return key.length >= 2 && !allowed.includes(key);
  });
}

function stripInventedFacts(text: string, allowed: string): string {
  const sentences = text.split(/(?<=[.!?])\s+|\n/);
  const kept = sentences
    .map((sentence) => {
      if (!sentence.trim()) return sentence;
      if (inventedCount(sentence, allowed)) return "";
      const extra = inventedRand(sentence, allowed);
      if (!extra.length) return sentence;
      let next = sentence;
      for (const amount of extra) {
        next = next.replace(amount, "an amount to be confirmed");
      }
      return next;
    })
    .filter((row) => row.trim().length > 0);
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function scrubBody(value: string, allowed: string): string {
  return stripInventedFacts(
    scrubSepClientCopy(clip(value, 6_000)),
    allowed,
  );
}

function asTable(value: unknown): SepDocumentTable | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.headers) || !Array.isArray(row.rows)) return null;
  const headers = row.headers.map((cell) => clip(String(cell || ""), 80)).filter(Boolean);
  if (headers.length < 2) return null;
  const rows = row.rows
    .filter((item): item is unknown[] => Array.isArray(item))
    .slice(0, 24)
    .map((item) =>
      headers.map((_, i) => clip(String(item[i] ?? ""), 400)),
    );
  if (!rows.length) return null;
  return {
    caption: row.caption ? clip(String(row.caption), 160) : undefined,
    headers,
    rows,
  };
}

function tableSafe(
  table: SepDocumentTable,
  allowed: string,
): boolean {
  const blob = `${table.headers.join(" ")} ${table.rows.flat().join(" ")}`;
  if (/TrustLedger Protocol|Themba|Capture|WhatsApp|SL-?2?B protocol/i.test(blob)) {
    return false;
  }
  if (inventedCount(blob, allowed)) return false;
  if (inventedRand(blob, allowed).length) return false;
  return true;
}

function pickTables(
  id: string,
  drafted: SepDocumentTable[],
  fallback: SepDocumentTable[] | undefined,
  allowed: string,
): SepDocumentTable[] | undefined {
  const local = fallback || [];
  const usable = drafted.filter((table) => tableSafe(table, allowed));
  if (id === "stakeholders" || id === "methods") {
    const candidate = usable[0];
    const base = local[0];
    if (
      candidate &&
      base &&
      candidate.headers.length === base.headers.length &&
      candidate.rows.length === base.rows.length
    ) {
      return [
        {
          ...candidate,
          rows: candidate.rows.map((row) =>
            row.map((cell) => scrubSepClientCopy(cell)),
          ),
        },
      ];
    }
    return local.length ? local : undefined;
  }
  if (usable.length) {
    return usable.slice(0, 2).map((table) => ({
      ...table,
      rows: table.rows.map((row) =>
        row.map((cell) => scrubSepClientCopy(cell)),
      ),
    }));
  }
  return local.length ? local : undefined;
}

function draftedSections(
  parsed: Record<string, unknown> | null,
): Map<string, { body: string; tables: SepDocumentTable[] }> {
  const out = new Map<string, { body: string; tables: SepDocumentTable[] }>();
  if (!parsed) return out;
  const rows = Array.isArray(parsed.sections) ? parsed.sections : [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id || "").trim();
    if (!SEP_DOCUMENT_SPECS.some((spec) => spec.id === id)) continue;
    const tables = Array.isArray(row.tables)
      ? row.tables.map(asTable).filter((table): table is SepDocumentTable => Boolean(table))
      : [];
    out.set(id, {
      body: String(row.body || ""),
      tables,
    });
  }
  return out;
}

function confineToolsToMethods(id: string, body: string): string {
  if (id === "methods") {
    if (
      /TrustLedger/i.test(body) &&
      /SL-?2?B|Social Licence to Build/i.test(body)
    ) {
      return body;
    }
    return `${body}\n\n${SEP_TOOLS_PARAGRAPH}`.trim();
  }
  return body
    .replace(/\bTrustLedger(?:\s+SRM)?\b/gi, "")
    .replace(/\bSocial Licence to Build(?:™)?\b/gi, "")
    .replace(/\bSL-?2?B\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

export function mergeDraftedSections(
  plan: Omit<EngagementPlan, "documentSections">,
  parsed: Record<string, unknown> | null,
  briefing = "",
): { sections: SepDocumentSection[]; draftedCount: number } {
  const fallback = buildSepDocument(plan);
  const drafted = draftedSections(parsed);
  const allowed = factsBlob(plan, briefing);
  let draftedCount = 0;
  const sections = fallback.map((section) => {
    const spec = SEP_DOCUMENT_SPECS.find((row) => row.id === section.id);
    const incoming = drafted.get(section.id);
    const body = incoming
      ? scrubBody(incoming.body, allowed)
      : section.body;
    const usedDraft = Boolean(incoming && body.length >= 80);
    if (usedDraft) draftedCount += 1;
    const tables = pickTables(
      section.id,
      incoming?.tables || [],
      section.tables,
      allowed,
    );
    const next: SepDocumentSection = {
      id: section.id,
      heading: spec?.heading || section.heading,
      body: confineToolsToMethods(section.id, usedDraft ? body : section.body),
    };
    if (tables?.length) next.tables = tables;
    return next;
  });
  return { sections, draftedCount };
}

function factsForPrompt(
  plan: Omit<EngagementPlan, "documentSections">,
  briefing: string,
): string {
  return JSON.stringify(
    {
      projectName: plan.projectNameHint,
      procuringEntity: plan.clientFunderHint || null,
      implementingEntity: "Chibase Consulting",
      location: plan.placeHint || null,
      duration: plan.timelineHint || null,
      budgetAsBriefed: plan.budgetHint || null,
      tenderRef: plan.tenderRefHint || null,
      sector: SEP_SECTOR_LABELS[plan.sectorId],
      programme:
        plan.programmeKind === "relocation"
          ? "relocation / RAP / physical or economic displacement"
          : "standard stakeholder engagement",
      purpose: plan.purposeStatement,
      instruments: plan.instruments.map((row) => row.label),
      stakeholderClasses: plan.stakeholderClasses.map((row) => ({
        label: row.label,
        who: row.why,
        named: row.namedFromBrief || [],
        objective: SEP_PURPOSE_LABELS[row.purpose],
        influence: row.influence,
      })),
      activities: plan.activities.map((row) => ({
        title: row.title,
        method: row.method,
        when: row.timingHint,
        owner: row.ownerHint,
        record: scrubSepClientCopy(row.evidenceHint),
      })),
      briefingExtract: clip(briefing || plan.sourceExcerpt || "", 8_000),
    },
    null,
    2,
  );
}

async function callGemini(
  key: string,
  plan: Omit<EngagementPlan, "documentSections">,
  briefing: string,
): Promise<string> {
  const user = `Facts (do not invent beyond this pack):
${factsForPrompt(plan, briefing)}

Return JSON:
{
  "sections": [
    {
      "id": "summary|compliance|stakeholders|methods|grievance|led|monitoring|assumptions|conclusion",
      "heading": "canonical numbered heading",
      "body": "markdown with **1.1** style subsections where required",
      "tables": [
        { "headers": ["..."], "rows": [["..."]] }
      ]
    }
  ]
}

Include all nine ids. Stakeholder and schedule tables must have the same row count as the facts pack classes and activities. Do not add a protocol field.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    geminiModel(),
  )}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const json = (await res.json()) as GeminiGenerateResponse;
  if (!res.ok) {
    console.warn("[sep/gemini] HTTP", res.status, json.error?.message);
    return "";
  }
  return (
    json.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim() || ""
  );
}

export async function draftSepDocument(
  plan: EngagementPlan,
  briefing = "",
): Promise<{ plan: EngagementPlan; synthesizer: "gemini" | "template" }> {
  const prepared = rebuildSepDocument(
    {
      ...plan,
      documentSections: Array.isArray(plan.documentSections)
        ? plan.documentSections
        : [],
    },
    {
      touch: false,
      document: plan.documentDrafter === "gemini" ? "keep" : "rebuild",
    },
  );
  const fallback: EngagementPlan = {
    ...prepared,
    documentDrafter: prepared.documentDrafter || "template",
    documentSections: prepared.documentSections.length
      ? prepared.documentSections
      : buildSepDocument(prepared),
  };
  const key = geminiApiKey();
  if (!key) return { plan: fallback, synthesizer: "template" };

  try {
    const text = await callGemini(key, prepared, briefing);
    const parsed = extractJsonObject(text);
    const { sections, draftedCount } = mergeDraftedSections(
      prepared,
      parsed,
      briefing,
    );
    if (
      draftedCount < 6 ||
      !clientSepDocumentUsable({
        programmeKind: prepared.programmeKind,
        documentSections: sections,
      })
    ) {
      return { plan: fallback, synthesizer: "template" };
    }
    return {
      plan: {
        ...prepared,
        documentDrafter: "gemini",
        documentSections: sections,
      },
      synthesizer: "gemini",
    };
  } catch (err) {
    console.warn("[sep/gemini] draft failed", err instanceof Error ? err.message : "error");
    return { plan: fallback, synthesizer: "template" };
  }
}

export function isSepDraftablePlan(value: unknown): value is EngagementPlan {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length > 80) return false;
  if (typeof row.title !== "string" || row.title.length > 240) return false;
  if (typeof row.sectorId !== "string") return false;
  if (!Array.isArray(row.stakeholderClasses) || row.stakeholderClasses.length > 40) {
    return false;
  }
  if (!Array.isArray(row.activities) || row.activities.length > 40) return false;
  if (!Array.isArray(row.phases) || row.phases.length > 16) return false;
  if (!Array.isArray(row.instruments) || row.instruments.length > 24) return false;
  return true;
}
