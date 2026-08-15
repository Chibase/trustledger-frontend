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
  const re = new RegExp(
    `(?:^|\\n)[ \\t]*${label}[ \\t]*:[ \\t]*([^\\n]*)`,
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

function splitAttendeeBlocks(text: string): string[] {
  const parts = text.split(/(?=(?:^|\n)\s*Name\s*:)/i);
  return parts
    .map((p) => p.trim())
    .filter((p) => /^name\s*:/i.test(p) && field(p, "Name"));
}

/**
 * Read labeled field-template paste (minutes / register / field note)
 * into stakeholder candidates. Empty slots are ignored.
 */
export function parseLabeledStakeholders(
  text: string,
): SuggestedStakeholder[] {
  const blocks = splitAttendeeBlocks(text);
  const rows: SuggestedStakeholder[] = [];
  for (const block of blocks) {
    const name = field(block, "Name");
    if (!name) continue;
    const organisation = field(block, "Organisation");
    const kind = asKind(field(block, "Kind"));
    const role = field(block, "Role");
    const contact = field(block, "Contact");
    const influence = asInfluence(field(block, "Influence"));
    const extras = [role, contact].filter(Boolean).join(" · ");
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
  return field(text, "Title") || field(text, "Project / site");
}
