import type { SuggestedStakeholder } from "@/types/ai";
import type { StakeholderKind, StakeholderInfluence } from "@/types/stakeholder";

const KINDS: StakeholderKind[] = [
  "individual",
  "organisation",
  "community_group",
  "traditional_authority",
  "government",
  "ngo",
  "contractor",
  "funder",
  "media",
  "union",
  "faith_based",
  "academic",
  "other",
];

const INFLUENCES: StakeholderInfluence[] = [
  "high",
  "medium",
  "low",
  "unknown",
];

function asKind(value: string | undefined): StakeholderKind {
  const v = (value || "").trim().toLowerCase().replace(/\s+/g, "_");
  return KINDS.includes(v as StakeholderKind)
    ? (v as StakeholderKind)
    : "individual";
}

function asInfluence(value: string | undefined): StakeholderInfluence {
  const v = (value || "").trim().toLowerCase();
  return INFLUENCES.includes(v as StakeholderInfluence)
    ? (v as StakeholderInfluence)
    : "unknown";
}

function field(block: string, label: string): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\n)[ \\t]*${escaped}[ \\t]*:[ \\t]*([^\\n]*)`,
    "i",
  );
  const match = block.match(re);
  const raw = match?.[1]?.trim() ?? "";
  if (
    !raw ||
    /^[_\-\s]+$/.test(raw) ||
    /^\(.*\)\s*$/.test(raw) ||
    /^[A-Za-z][A-Za-z /()]*:\s*$/.test(raw)
  ) {
    return undefined;
  }
  return raw.replace(/\s+/g, " ");
}

/** Prefer new register labels; keep legacy Name: for older pastes. */
function personName(block: string): string | undefined {
  return (
    field(block, "Initials and Surname") ||
    field(block, "Initials & Surname") ||
    field(block, "Name")
  );
}

function organisationOf(block: string): string | undefined {
  return (
    field(block, "Organisation / structure") ||
    field(block, "Organisation") ||
    field(block, "Organization")
  );
}

function contactOf(block: string): string | undefined {
  return field(block, "Contact details") || field(block, "Contact");
}

function splitAttendeeBlocks(text: string): string[] {
  const parts = text.split(
    /(?=(?:^|\n)\s*(?:PERSON\s+\d+|Initials and Surname\s*:|Initials\s*&\s*Surname\s*:|Name\s*:))/i,
  );
  return parts
    .map((p) => p.trim())
    .filter((p) => personName(p));
}

/**
 * Read labeled field-template paste (minutes / register / field note)
 * into stakeholder candidates. Empty slots are ignored.
 * Does not require ID numbers.
 */
export function parseLabeledStakeholders(
  text: string,
): SuggestedStakeholder[] {
  const blocks = splitAttendeeBlocks(text);
  const rows: SuggestedStakeholder[] = [];
  for (const block of blocks) {
    const name = personName(block);
    if (!name) continue;
    const organisation = organisationOf(block);
    const kind = asKind(field(block, "Kind"));
    const role = field(block, "Role");
    const contact = contactOf(block);
    const address = field(block, "Address");
    const influence = asInfluence(field(block, "Influence"));
    const extras = [role, contact, address].filter(Boolean).join(" · ");
    rows.push({
      name,
      kind,
      organisation,
      influence,
      rationale: extras
        ? `From labeled template (${extras}).`
        : "From labeled template field.",
    });
    if (rows.length >= 12) break;
  }
  return rows;
}

export function parseLabeledTitle(text: string): string | undefined {
  return (
    field(text, "Meeting title") ||
    field(text, "Title") ||
    field(text, "Project / site") ||
    field(text, "Nature of the meeting")
  );
}

/** Agenda rows from minutes paste: Item / Description / Action / Date. */
export type ParsedMinutesItem = {
  item: string;
  description?: string;
  action?: string;
  date?: string;
};

export function parseLabeledMinutesItems(text: string): ParsedMinutesItem[] {
  const parts = text.split(/(?=(?:^|\n)\s*(?:ITEM\s+\d+|Item(?:\s+\d+)?\s*:))/i);
  const rows: ParsedMinutesItem[] = [];
  for (const part of parts) {
    const block = part.trim();
    if (!block) continue;
    const item =
      field(block, "Item") ||
      field(block, "Item 1") ||
      field(block, "Item 2") ||
      field(block, "Item 3") ||
      field(block, "Item 4") ||
      field(block, "Item 5") ||
      field(block, "Item 6") ||
      field(block, "Item 7") ||
      field(block, "Item 8");
    if (!item) continue;
    // Prefer unnumbered Description/Action/Date within the block.
    const description =
      field(block, "Description") ||
      [...Array(8)].map((_, i) => field(block, `Description ${i + 1}`)).find(Boolean);
    const action =
      field(block, "Action") ||
      [...Array(8)].map((_, i) => field(block, `Action ${i + 1}`)).find(Boolean);
    const date =
      field(block, "Date (YYYY-MM-DD)") ||
      field(block, "Date") ||
      [...Array(8)]
        .map((_, i) => field(block, `Date ${i + 1} (YYYY-MM-DD)`))
        .find(Boolean);
    rows.push({
      item,
      description,
      action,
      date,
    });
    if (rows.length >= 20) break;
  }
  return rows;
}
