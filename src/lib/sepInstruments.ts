/**
 * Tender / facts-pack instruments the SEP composer may cite.
 * Only attach a statute the briefing named or the operator ticked.
 */

import type { SepInstrument } from "@/types/engagementPlan";

export type SepInstrumentDef = SepInstrument & { re: RegExp };

export const SEP_INSTRUMENT_CATALOG: SepInstrumentDef[] = [
  {
    id: "nema-eia",
    re: /\b(nema|eia|bar\b|s&eir|scoping and eir|environmental authorisation|i&ap)\b/i,
    label: "Environmental authorisation / public participation (NEMA)",
    note: "I&AP rounds in the brief are engagements with minutes, not a side notebook.",
  },
  {
    id: "ifc",
    re: /\b(ifc performance|equator principle|ps1|esai|esmp|performance standard)\b/i,
    label: "Funder safeguard (IFC / Equator — as cited)",
    note: "Only the standard named in the RFP. Map it onto registry, engagements, and grievance.",
  },
  {
    id: "ifc-ps5",
    re: /\b(ifc\s*ps\s*5|performance standard 5|involuntary resettlement|resettlement action|\brap\b|livelihood restoration)\b/i,
    label: "Involuntary resettlement (IFC PS5 / RAP — as cited)",
    note: "Census, cut-off date, eligibility, entitlements, host community, and livelihood restoration become logged engagements and owned commitments — not an appendix RAP.",
  },
  {
    id: "mprda-slp",
    re: /\b(mprda|social and labour plan|\bslp\b|mining charter)\b/i,
    label: "Mining social performance (MPRDA / SLP — as cited)",
    note: "SLP lines become commitments with evidence, not appendix claims.",
  },
  {
    id: "wula",
    re: /\b(wula|water use licence|water-use licence)\b/i,
    label: "Water-use authorisation (as cited)",
    note: "Licence consultation conditions belong on the engagement calendar.",
  },
  {
    id: "pppfa",
    re: /\b(pppfa|preferential procurement|local content|b-?bbee)\b/i,
    label: "Preferential procurement / local content (as cited)",
    note: "Labour and procurement targets feed Intelligence + commitments.",
  },
  {
    id: "spluma",
    re: /\b(spluma|land use|rezoning|township establishment)\b/i,
    label: "Land-use process (SPLUMA — as cited)",
    note: "Statutory land-use meetings are still logged as engagements.",
  },
];

export function catalogInstrument(id: string): SepInstrument | undefined {
  const row = SEP_INSTRUMENT_CATALOG.find((item) => item.id === id);
  if (!row) return undefined;
  return { id: row.id, label: row.label, note: row.note };
}

export function catalogInstrumentsByIds(ids: string[]): SepInstrument[] {
  const out: SepInstrument[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const key = id.trim();
    if (!key || seen.has(key)) continue;
    const row = catalogInstrument(key);
    if (!row) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function detectCatalogInstruments(text: string): SepInstrument[] {
  return SEP_INSTRUMENT_CATALOG.filter((row) => row.re.test(text)).map(
    (row) => ({
      id: row.id,
      label: row.label,
      note: row.note,
    }),
  );
}

export function applySelectedInstrumentIds(
  current: SepInstrument[],
  selectedIds: string[],
): SepInstrument[] {
  const catalogIds = new Set(SEP_INSTRUMENT_CATALOG.map((row) => row.id));
  const playbookOnly = current.filter((row) => !catalogIds.has(row.id));
  const seen = new Set<string>();
  const out: SepInstrument[] = [];
  for (const row of [
    ...catalogInstrumentsByIds(selectedIds),
    ...playbookOnly,
  ]) {
    const key = row.id || row.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function joinSepPlace(parts: {
  municipality?: string;
  ward?: string;
  customary?: string;
}): string {
  const wardRaw = parts.ward?.trim() || "";
  const ward = wardRaw
    ? /^ward\b/i.test(wardRaw)
      ? wardRaw
      : `Ward ${wardRaw}`
    : "";
  return [parts.municipality?.trim(), ward, parts.customary?.trim()]
    .filter(Boolean)
    .join(" · ");
}
