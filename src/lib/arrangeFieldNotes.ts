import type { NarrativeCaptureSource } from "@/lib/captureStore";
import {
  arrangeLocalCommunityIntel,
  LOCAL_COMMUNITY_INTEL_SKELETON,
} from "@/lib/parseLocalCommunityIntel";
import {
  parseLabeledMinutesItems,
  parseLabeledTitle,
  type ParsedMinutesItem,
} from "@/lib/parseFieldTemplate";

/** YYYY-MM-DD from labeled paste or free text. */
export function parseMeetingHeldOn(text: string): string | undefined {
  const labeled =
    matchField(text, "Date of meeting") ||
    matchField(text, "Meeting date") ||
    matchField(text, "Date");
  const fromLabel = asIsoDate(labeled);
  if (fromLabel) return fromLabel;

  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const slash = text.match(
    /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/,
  );
  if (slash) {
    const d = Number(slash[1]);
    const m = Number(slash[2]);
    const y = slash[3];
    // Prefer D/M/Y (ZA) when day > 12; else assume D/M/Y still for ZA.
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return undefined;
}

function matchField(text: string, label: string): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\n)[ \\t]*${escaped}[ \\t]*:[ \\t]*([^\\n]*)`,
    "i",
  );
  const match = text.match(re);
  const raw = match?.[1]?.trim() ?? "";
  return raw || undefined;
}

function asIsoDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  if (/^20\d{2}-\d{2}-\d{2}$/.test(t)) return t;
  const slash = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})$/);
  if (slash) {
    const d = Number(slash[1]);
    const m = Number(slash[2]);
    const y = slash[3];
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return undefined;
}

function looksLikeNameLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 2 || t.length > 80) return false;
  if (/^(item|description|action|date|venue|time|project|meeting|purpose|kind|place)\b/i.test(t)) {
    return false;
  }
  if (/[:@|/\\]/.test(t) && !/^[A-Za-z][A-Za-z .'-]+$/.test(t)) {
    // Allow "Name — Org" style
    if (!/[—\-]/.test(t)) return false;
  }
  // Two+ words capitalised, or Initials Surname (J. Nkosi / JM Nkosi)
  if (/^[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*)+$/.test(t)) return true;
  if (/^[A-Z]{1,3}\.?\s+[A-Z][A-Za-z.'-]+$/.test(t)) return true;
  if (/^[A-Za-z][A-Za-z .'-]+\s+[—\-]\s+.+$/.test(t)) return true;
  return false;
}

function splitNameOrg(line: string): { name: string; org?: string } {
  const parts = line.split(/\s+[—\-]\s+/);
  if (parts.length >= 2) {
    return { name: parts[0].trim(), org: parts.slice(1).join(" - ").trim() };
  }
  const comma = line.split(",");
  if (comma.length === 2 && comma[0].trim().split(/\s+/).length <= 4) {
    return { name: comma[0].trim(), org: comma[1].trim() };
  }
  return { name: line.trim() };
}

function extractNameCandidates(text: string): Array<{ name: string; org?: string }> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s*•\-–\d.)]+/, "").trim())
    .filter(Boolean);
  const out: Array<{ name: string; org?: string }> = [];
  for (const line of lines) {
    if (!looksLikeNameLine(line)) continue;
    out.push(splitNameOrg(line));
    if (out.length >= 12) break;
  }
  return out;
}

function extractAgendaChunks(text: string): string[] {
  // Prefer numbered / bulleted chunks; else paragraphs.
  const numbered = text.split(/(?=(?:^|\n)\s*(?:\d+[.)]|Item\s*\d+|ITEM\s*\d+|[-•*]\s))/i);
  const chunks = numbered
    .map((c) => c.trim())
    .filter((c) => c.length > 8 && !/^(project|date of meeting|time|venue)\b/i.test(c));
  if (chunks.length >= 2) return chunks.slice(0, 8);

  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 12)
    .slice(0, 8);
}

/**
 * Map rough pasted/uploaded notes into the labeled minutes/attendance skeleton
 * so Suggest stakeholders / Apply can use field parsers. Heuristic only —
 * human edits before Apply (AI suggest → apply → save).
 */
export function arrangeRoughNotesIntoTemplate(
  source: NarrativeCaptureSource,
  roughText: string,
  skeleton: string,
): { text: string; arranged: boolean; note: string } {
  const rough = roughText.replace(/\uFEFF/, "").trim();
  if (!rough) {
    return { text: skeleton, arranged: false, note: "Nothing to arrange." };
  }

  // Already looks labeled — keep as-is (maybe merge header fields).
  if (
    /Initials and Surname\s*:/i.test(rough) ||
    /(?:^|\n)\s*ITEM\s+\d+/i.test(rough) ||
    /(?:^|\n)\s*PERSON\s+\d+/i.test(rough)
  ) {
    return {
      text: rough,
      arranged: false,
      note: "Text already has template labels — left as pasted.",
    };
  }

  if (source === "attendance") {
    const people = extractNameCandidates(rough);
    if (!people.length) {
      return {
        text: `${skeleton.trim()}\n\n--- Rough notes ---\n${rough}\n`,
        arranged: true,
        note: "No clear name lines found — blank form kept with rough notes below for edit.",
      };
    }
    let next = skeleton;
    for (let i = 0; i < people.length; i++) {
      const slot = i + 1;
      const { name, org } = people[i];
      next = next.replace(
        new RegExp(`(PERSON\\s+${slot}[\\s\\S]*?Initials and Surname:\\s*)([^\\n]*)`, "i"),
        `$1${name}`,
      );
      if (org) {
        next = next.replace(
          new RegExp(
            `(PERSON\\s+${slot}[\\s\\S]*?Organisation \\/ structure:\\s*)([^\\n]*)`,
            "i",
          ),
          `$1${org}`,
        );
      }
    }
    const held = parseMeetingHeldOn(rough);
    if (held && /Date of meeting\s*:/i.test(next)) {
      next = next.replace(
        /(Date of meeting\s*:\s*)([^\n]*)/i,
        `$1${held}`,
      );
    }
    return {
      text: next.trimEnd() + "\n",
      arranged: true,
      note: `Arranged ${people.length} attendee name(s) into the register. Review before Suggest stakeholders.`,
    };
  }

  if (source === "minutes") {
    const chunks = extractAgendaChunks(rough);
    const held = parseMeetingHeldOn(rough);
    const title =
      parseLabeledTitle(rough) ||
      rough.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 8 && l.length < 90);
    let next = skeleton;
    if (title && /(?:Meeting title|Nature of the meeting|Project \/ site)\s*:/i.test(next)) {
      next = next.replace(
        /((?:Meeting title|Nature of the meeting|Project \/ site)\s*:\s*)([^\n]*)/i,
        `$1${title.slice(0, 120)}`,
      );
    }
    if (held) {
      next = next.replace(/(Date of meeting\s*:\s*)([^\n]*)/i, `$1${held}`);
    }
    for (let i = 0; i < Math.min(chunks.length, 8); i++) {
      const slot = i + 1;
      const chunk = chunks[i].replace(/\s+/g, " ").trim();
      const firstSentence = chunk.split(/(?<=[.!?])\s+/)[0]?.slice(0, 100) || chunk.slice(0, 100);
      const rest = chunk.slice(firstSentence.length).trim() || firstSentence;
      next = next.replace(
        new RegExp(`(ITEM\\s+${slot}[\\s\\S]*?Item:\\s*)([^\\n]*)`, "i"),
        `$1${firstSentence}`,
      );
      next = next.replace(
        new RegExp(`(ITEM\\s+${slot}[\\s\\S]*?Description:\\s*)([^\\n]*)`, "i"),
        `$1${rest.slice(0, 240)}`,
      );
    }
    // Keep leftover prose for human edit.
    next = `${next.trimEnd()}\n\n--- Rough notes (review) ---\n${rough}\n`;
    return {
      text: next,
      arranged: true,
      note: `Arranged ${Math.min(chunks.length, 8)} agenda chunk(s) into minutes rows. Review Actions/Dates, then Suggest stakeholders.`,
    };
  }

  // social_intel — arrange into local community intel form (Stats SA compare keys).
  if (source === "social_intel") {
    const arranged = arrangeLocalCommunityIntel(
      rough,
      skeleton.includes("LOCAL COMMUNITY INTELLIGENCE")
        ? skeleton
        : LOCAL_COMMUNITY_INTEL_SKELETON,
    );
    return {
      text: arranged.text,
      arranged: Boolean(arranged.rows.length) || arranged.text !== skeleton,
      note: arranged.note,
    };
  }

  // pasted_report — keep free text.
  return {
    text: rough,
    arranged: false,
    note: "Kept as free text for this source.",
  };
}

export function actionItemsFromMinutes(text: string): string[] {
  const rows: ParsedMinutesItem[] = parseLabeledMinutesItems(text);
  return rows
    .map((r) => {
      const bits = [r.item, r.action, r.date].filter(Boolean);
      return bits.join(" — ");
    })
    .filter(Boolean)
    .slice(0, 8);
}
