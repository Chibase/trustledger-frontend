/**
 * Local SEP composer — maps a briefing/RFP/tender onto a sector playbook.
 * Suggestions only; humans apply. Does not call Cloud LLM (reportComposer rule).
 */

import { overlayRelocationPlaybook, detectSepProgramme } from "@/data/sepRelocation";
import { SEP_SECTOR_PLAYBOOKS } from "@/data/sepSectors";
import { buildSepDocument } from "@/lib/sepDocument";
import {
  catalogInstrumentsByIds,
  detectCatalogInstruments,
} from "@/lib/sepInstruments";
import type {
  EngagementPlan,
  SepInstrument,
  SepSectorId,
  SepSourceKind,
  SepStakeholderClass,
} from "@/types/engagementPlan";
import { SEP_SECTOR_LABELS } from "@/types/engagementPlan";

const SECTOR_HINTS: Array<{ id: SepSectorId; re: RegExp }> = [
  { id: "mining", re: /\b(mining|mine|mprda|slp|extractive|opencast|shaft)\b/i },
  { id: "energy", re: /\b(ipp|reipppp|solar|wind farm|pv plant|substation|grid connection|generation)\b/i },
  { id: "water", re: /\b(wula|water use|sanitation|wastewater|reservoir|bulk water|sewer)\b/i },
  { id: "housing", re: /\b(housing|human settlement|bn g|rental stock|informal settlement|beneficiary list|relocation|resettlement|\brap\b|migration plan|displaced household)\b/i },
  { id: "infrastructure", re: /\b(road|highway|bridge|stormwater|bulk earthworks|public works|civil works)\b/i },
  { id: "municipal", re: /\b(idp|led strategy|ward committee|mfma|municipal manager|public participation calendar)\b/i },
  { id: "conservation", re: /\b(protected area|heritage|sahra|stewardship|biodiversity|national park)\b/i },
  { id: "logistics", re: /\b(port|harbour|rail yard|freight|container terminal|truck staging)\b/i },
  { id: "agriculture", re: /\b(irrigation|smallholder|agri[- ]?park|farmers. association|grazing)\b/i },
  { id: "education", re: /\b(school|sgb|learner|education district|classroom block)\b/i },
  { id: "health", re: /\b(clinic|hospital|phc|health facility|maternity)\b/i },
];

function cleanLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 3);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function extractLabeled(text: string, labels: string[]): string {
  const label = labels
    .map((row) => row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const sameLine = new RegExp(
    `(?:^|\\n)\\s*(?:${label})(?:\\s*/\\s*procuring entity)?\\s*[:—-]\\s*([^\\n]{3,140})`,
    "i",
  );
  const same = text.match(sameLine);
  if (same?.[1]) {
    const value = same[1].replace(/\s+/g, " ").trim();
    if (value && !/^(entity|procuring entity)$/i.test(value)) return value;
  }
  const nextLine = new RegExp(
    `(?:^|\\n)\\s*(?:${label})(?:\\s*/\\s*procuring entity)?\\s*\\n\\s*([^\\n]{3,140})`,
    "i",
  );
  const next = text.match(nextLine);
  if (next?.[1]) {
    const value = next[1].replace(/\s+/g, " ").trim();
    if (
      value &&
      !/^(entity|procuring entity|sector|source|client|timeline|issued|plan id)$/i.test(
        value,
      )
    ) {
      return value;
    }
  }
  return "";
}

function stripSepPrefix(value: string): string {
  return value
    .replace(/^[•●▪‣\-–—*]\s+/, "")
    .replace(/^sep\s*[—–-]\s*/i, "")
    .trim();
}

function isJunkTitle(value: string): boolean {
  return /^(inception report|stakeholder engagement plan|sep|terms of reference|scope of work|briefing|confidential)$/i.test(
    value.trim(),
  );
}

export function detectSepSector(text: string): SepSectorId {
  const scores = new Map<SepSectorId, number>();
  for (const hint of SECTOR_HINTS) {
    const hits = text.match(new RegExp(hint.re, "gi"));
    if (hits?.length) scores.set(hint.id, hits.length);
  }
  const heading = text.split(/\r?\n/).slice(0, 8).join(" ");
  for (const hint of SECTOR_HINTS) {
    if (hint.re.test(heading)) {
      scores.set(hint.id, (scores.get(hint.id) || 0) + 3);
    }
  }
  let best: SepSectorId = "generic";
  let n = 0;
  for (const [id, count] of scores) {
    if (count > n) {
      best = id;
      n = count;
    }
  }
  return best;
}

export function detectSepSourceKind(text: string): SepSourceKind {
  if (/\brequest for proposal\b|\brfp\b/i.test(text)) return "rfp";
  if (/\btender\b|\bbid document\b|\binvitation to bid\b/i.test(text)) {
    return "tender";
  }
  if (/\bbriefing\b|\bscope of work\b|\bterms of reference\b|\btor\b/i.test(text)) {
    return "briefing";
  }
  return "paste";
}

function extractTitle(text: string): string {
  const labeled = stripSepPrefix(
    extractLabeled(text, [
      "project name",
      "project",
      "assignment",
      "programme",
      "title",
      "working title",
    ]),
  );
  if (labeled && !isJunkTitle(labeled)) return labeled.slice(0, 140);
  const lines = cleanLines(text).slice(0, 40);
  const skip =
    /^(request for proposal|invitation to bid|confidential|page \d|stakeholder engagement plan|trustledger|tender-grade|prepared on|suggestion until|not legal advice|social licence|sector|source|client|timeline|issued|plan id|working title|inception report|chibase|prepared by|prepared for|operating plan|programme|housing|tender)$/i;
  const rapLine = lines.find((line) => {
    const t = stripSepPrefix(line);
    return (
      /relocation\s*(?:and|&)\s*migration|resettlement action/i.test(t) &&
      t.length < 140 &&
      !skip.test(t) &&
      !isJunkTitle(t)
    );
  });
  if (rapLine) return stripSepPrefix(rapLine).slice(0, 140);
  const heading = lines.find((line) => {
    const t = stripSepPrefix(line);
    return t.length > 12 && t.length < 140 && !skip.test(t) && !isJunkTitle(t);
  });
  return stripSepPrefix(heading || "Stakeholder engagement plan") || "Stakeholder engagement plan";
}

function extractPlace(text: string): string {
  const labeled = extractLabeled(text, ["place", "location", "site"]);
  const skipLabeled = /not yet locked|still to be|to be confirmed|inception must/i;
  const ward = text.match(/\bward\s+(\d{1,3})\b/i);
  const muni = text.match(
    /\b([A-Z][A-Za-z]+(?:[\s-][A-Z][A-Za-z]+){0,6}\s+(?:Local|Metropolitan)\s+Municipality)\b/,
  );
  const district = text.match(
    /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2}\s+district(?:\s+municipality)?)\b/i,
  );
  const client = extractClient(text);
  const fromClient = /municipality/i.test(client) ? client : "";
  const parts = [
    labeled && !skipLabeled.test(labeled) ? labeled : null,
    muni?.[1] || fromClient || null,
    district?.[1],
    ward ? `Ward ${ward[1]}` : null,
    text.match(/\b(eastern cape|western cape|gauteng|kwazulu-natal|limpopo|mpumalanga|north west|northern cape|free state)\b/i)?.[1],
  ].filter(Boolean) as string[];
  return unique(parts).join(" · ").slice(0, 180);
}

function extractTimeline(text: string): string {
  const labeled = extractLabeled(text, [
    "timeline",
    "contract period",
    "duration",
    "programme period",
    "construction period",
  ]);
  if (labeled) return labeled;
  const span = text.match(
    /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+20\d{2}\s+(?:to|–|-|through)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+20\d{2})\b/i,
  );
  if (span?.[1]) return span[1];
  const months = text.match(/\b(\d{1,2}\s*(?:month|year)s?)\b/i);
  if (months?.[1]) return months[1];
  const years = text.match(/\b(20\d{2}\s*[–-]\s*20\d{2})\b/);
  return years?.[1] || "";
}

function extractBudget(text: string): string {
  const labeled = extractLabeled(text, [
    "budget",
    "estimated budget",
    "contract value",
    "professional fees",
  ]);
  if (labeled && !/not stated|to be confirmed|n\/a/i.test(labeled)) {
    return labeled;
  }
  return "";
}

function extractClient(text: string): string {
  const labeled = extractLabeled(text, [
    "client",
    "employer",
    "procuring entity",
    "department",
  ]);
  if (labeled) return labeled;
  const org = text.match(
    /\b([A-Z][A-Za-z0-9&.’' -]{3,60}(?:Pty Ltd|Limited|Municipality|Department|Agency|SOC))\b/,
  );
  return org?.[1]?.trim() || "";
}

function extractTenderRef(text: string): string {
  const labeled = extractLabeled(text, [
    "tender reference number",
    "tender reference",
    "tender no",
    "tender number",
    "rfp reference",
    "rfp no",
    "rfp number",
    "bid number",
    "bid no",
  ]);
  return labeled.slice(0, 80);
}

function extractNamedParties(text: string): string[] {
  const flat = text.replace(/\s+/g, " ");
  const matches = flat.match(
    /\b[A-Z][A-Za-z0-9&.’']+(?:\s+[A-Z][A-Za-z0-9&.’']+){0,6}\s+(?:Pty Ltd|Ltd|Limited|Municipality|Traditional Council|Royal Council|Trust|Forum|Association)\b/g,
  );
  return preferLongestOrgs(matches || []);
}

function municipalityCore(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(local|metropolitan)\s+municipality$/i, "")
    .replace(/\s+municipality$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function preferLongestOrgs(names: string[]): string[] {
  const junk =
    /^(the|a|an)\s+(municipality|department|client)$|^municipality$|^the municipality$/i;
  const cleaned = unique(
    names
      .map((n) => n.replace(/\s+/g, " ").trim())
      .filter((n) => n && !junk.test(n)),
  );
  const sorted = [...cleaned].sort((a, b) => b.length - a.length);
  const kept: string[] = [];
  for (const name of sorted) {
    const lower = name.toLowerCase();
    const core = municipalityCore(name);
    if (
      kept.some((row) => {
        const rowLower = row.toLowerCase();
        if (rowLower.includes(lower) && row.length > name.length) return true;
        if (
          /municipality/i.test(name) &&
          /municipality/i.test(row) &&
          municipalityCore(row) === core
        ) {
          return true;
        }
        return false;
      })
    ) {
      continue;
    }
    kept.push(name);
  }
  return kept.slice(0, 6);
}

function extractPurpose(text: string): string {
  if (/\b(resettle|rap\b|relocation|migration plan|displacement)\b/i.test(text)) {
    return "Consult project-affected households on displacement, entitlement options, host sites, and livelihood restoration, and keep a grievance path that can carry RAP issues through the physical move without losing the thread.";
  }
  if (/\b(grievance|complaint|remediat)/i.test(text)) {
    return "Remediate existing harm and restore a credible update cadence — not only announce the next phase of works.";
  }
  if (/\b(decide|consent|agreement)\b/i.test(text)) {
    return "Move named counterparts from information to a recorded decision, with commitments owned after the room empties.";
  }
  if (/\b(i&ap|public participation|consult)/i.test(text)) {
    return "Consult affected people and authorities so the project can show who was heard, what was promised, and what remains open.";
  }
  return "Inform and consult the people who can grant or withhold social licence, then keep promises and grievances on one trail.";
}

function snippet(text: string, limit = 1800): string {
  const trimmed = text.replace(/\u0000/g, "").trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).trim()}…`;
}

function mergeNamedIntoClasses(
  classes: SepStakeholderClass[],
  named: string[],
): SepStakeholderClass[] {
  if (!named.length) return classes;
  const attached = new Set<string>();
  const next = classes.map((row) => {
    if (row.id === "client-funder" || row.id === "local-government") {
      const hits = named.filter((name) =>
        /municipality|department|agency|pty|ltd|soc/i.test(name),
      );
      hits.forEach((name) => attached.add(name.toLowerCase()));
      return hits.length ? { ...row, namedFromBrief: hits.slice(0, 4) } : row;
    }
    if (row.id === "traditional-authority") {
      const hits = named.filter((name) =>
        /traditional|royal|inkosi|kgosi/i.test(name),
      );
      hits.forEach((name) => attached.add(name.toLowerCase()));
      return hits.length ? { ...row, namedFromBrief: hits.slice(0, 4) } : row;
    }
    return row;
  });
  const leftover = named.filter(
    (name) =>
      !attached.has(name.toLowerCase()) &&
      !/municipality|department|pty ltd|\bltd\b|limited$/i.test(name),
  );
  if (!leftover.length) return next;
  let placed = false;
  return next.map((row) => {
    if (placed) return row;
    if (row.kind === "community_group") {
      placed = true;
      return {
        ...row,
        namedFromBrief: unique([
          ...(row.namedFromBrief || []),
          ...leftover,
        ]).slice(0, 6),
      };
    }
    return row;
  });
}

export type ComposeSepInput = {
  text: string;
  sectorId?: SepSectorId | "auto";
  projectId?: string | null;
  projectName?: string;
  placeHint?: string;
  clientHint?: string;
  timelineHint?: string;
  budgetHint?: string;
  purposeOverride?: string;
  /** Extra instruments ticked on the facts pack (or added to a tender compose). */
  instrumentIds?: string[];
  /** Operator-named PAP / I&AP organisations (not invented by the composer). */
  namedParties?: string[];
};

export type SepExtractPreview = {
  title: string;
  place: string;
  client: string;
  timeline: string;
  budget: string;
  tenderRef: string;
  sectorId: SepSectorId;
  sourceKind: SepSourceKind;
  programmeKind: import("@/types/engagementPlan").SepProgrammeKind;
  instruments: SepInstrument[];
  namedParties: string[];
};

export function previewSepExtract(text: string): SepExtractPreview {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      title: "",
      place: "",
      client: "",
      timeline: "",
      budget: "",
      tenderRef: "",
      sectorId: "generic",
      sourceKind: "paste",
      programmeKind: "standard",
      instruments: [],
      namedParties: [],
    };
  }
  return {
    title: extractTitle(trimmed),
    place: extractPlace(trimmed),
    client: extractClient(trimmed),
    timeline: extractTimeline(trimmed),
    budget: extractBudget(trimmed),
    tenderRef: extractTenderRef(trimmed),
    sectorId: detectSepSector(trimmed),
    sourceKind: detectSepSourceKind(trimmed),
    programmeKind: detectSepProgramme(trimmed),
    instruments: detectCatalogInstruments(trimmed),
    namedParties: extractNamedParties(trimmed),
  };
}

export function composeEngagementPlan(input: ComposeSepInput): EngagementPlan {
  const rawText = (input.text || "").trim();
  const usedPlaybookOnly = !rawText;
  const sectorHint =
    !input.sectorId || input.sectorId === "auto"
      ? detectSepSector(rawText)
      : input.sectorId;
  const programmeKind = detectSepProgramme(
    rawText,
    input.projectName,
    input.purposeOverride,
  );
  const basePlaybook = SEP_SECTOR_PLAYBOOKS[sectorHint];
  const playbook =
    programmeKind === "relocation"
      ? overlayRelocationPlaybook(basePlaybook)
      : basePlaybook;
  const text = rawText || playbook.summary;
  const sectorId = sectorHint;
  const named = preferLongestOrgs([
    ...(input.namedParties || []).map((row) => row.trim()).filter(Boolean),
    ...(usedPlaybookOnly ? [] : extractNamedParties(text)),
  ]);
  const now = new Date().toISOString();
  const extractedTitle = usedPlaybookOnly ? "" : extractTitle(text);
  const titleBase = stripSepPrefix(
    input.projectName?.trim() ||
      extractedTitle ||
      (programmeKind === "relocation"
        ? "Relocation and Migration Plan"
        : SEP_SECTOR_LABELS[sectorId]),
  );
  const projectTitle =
    titleBase && !isJunkTitle(titleBase)
      ? titleBase
      : programmeKind === "relocation"
        ? "Relocation and Migration Plan"
        : SEP_SECTOR_LABELS[sectorId];
  const detected = usedPlaybookOnly ? [] : detectCatalogInstruments(text);
  const sourceKind: SepSourceKind = usedPlaybookOnly
    ? "manual"
    : detectSepSourceKind(text);

  const base: Omit<EngagementPlan, "documentSections"> = {
    id: `SEP-${Date.now().toString(36).toUpperCase()}`,
    title: `SEP — ${projectTitle}`.slice(0, 160),
    status: "suggested",
    sourceKind,
    sectorId,
    programmeKind,
    projectId: input.projectId || null,
    projectNameHint: projectTitle,
    placeHint: input.placeHint?.trim() || (usedPlaybookOnly ? "" : extractPlace(text)),
    clientFunderHint:
      input.clientHint?.trim() || (usedPlaybookOnly ? "" : extractClient(text)),
    timelineHint:
      input.timelineHint?.trim() || (usedPlaybookOnly ? "" : extractTimeline(text)),
    budgetHint:
      input.budgetHint?.trim() || (usedPlaybookOnly ? "" : extractBudget(text)),
    tenderRefHint: usedPlaybookOnly ? "" : extractTenderRef(text),
    createdAt: now,
    updatedAt: now,
    sourceExcerpt: usedPlaybookOnly
      ? snippet(
          `Facts pack · ${SEP_SECTOR_LABELS[sectorId]}. ${playbook.summary}`,
        )
      : snippet(text),
    purposeStatement:
      input.purposeOverride?.trim() || extractPurpose(text),
    phases: playbook.phases,
    stakeholderClasses: mergeNamedIntoClasses(
      playbook.stakeholderClasses,
      named,
    ),
    activities: playbook.activities,
    commitments: playbook.commitments,
    instruments: uniqueInstruments([
      ...catalogInstrumentsByIds(input.instrumentIds || []),
      ...detected,
      ...playbook.instruments,
    ]),
    grievancePath: playbook.grievancePath,
    assumptions: [
      ...playbook.assumptions,
      "Composer output is a suggestion from the extract (or facts pack) plus the sector playbook. Edit before presenting to a client.",
      "Named people are only listed when they appear in the briefing or the facts pack. Do not invent counterparts.",
      "Social Licence to Build™ is mapped to shipped TrustLedger modules. This document does not claim unshipped portals, GIS editing, or a staffed 24/7 division.",
    ],
  };

  return { ...base, documentSections: buildSepDocument(base) };
}

function uniqueInstruments(
  rows: EngagementPlan["instruments"],
): EngagementPlan["instruments"] {
  const seen = new Set<string>();
  const out: EngagementPlan["instruments"] = [];
  for (const row of rows) {
    const key = row.id || row.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function rebuildSepDocument(
  plan: EngagementPlan,
  opts?: { touch?: boolean },
): EngagementPlan {
  const programmeKind =
    plan.programmeKind ||
    detectSepProgramme(plan.title, plan.projectNameHint, plan.sourceExcerpt);
  let next: Omit<EngagementPlan, "documentSections"> = {
    ...plan,
    timelineHint: plan.timelineHint || "",
    programmeKind,
    updatedAt:
      opts?.touch === false ? plan.updatedAt : new Date().toISOString(),
  };
  if (
    programmeKind === "relocation" &&
    !next.activities.some((row) => row.id === "census")
  ) {
    const overlaid = overlayRelocationPlaybook(
      SEP_SECTOR_PLAYBOOKS[next.sectorId] || SEP_SECTOR_PLAYBOOKS.generic,
    );
    const named = next.stakeholderClasses.flatMap(
      (row) => row.namedFromBrief || [],
    );
    next = {
      ...next,
      phases: overlaid.phases,
      stakeholderClasses: mergeNamedIntoClasses(
        overlaid.stakeholderClasses,
        named,
      ),
      activities: overlaid.activities,
      commitments: overlaid.commitments,
      instruments: uniqueInstruments([
        ...overlaid.instruments,
        ...next.instruments,
      ]),
      grievancePath: overlaid.grievancePath,
      assumptions: unique([...overlaid.assumptions, ...next.assumptions]),
    };
  }
  return { ...next, documentSections: buildSepDocument(next) };
}
