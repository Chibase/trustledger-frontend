/**
 * Parse tenant-owned local community intelligence (surveys, ward notes, CLO tallies)
 * into indicator-shaped rows. Never writes into platform Stats SA packs (ADR-040).
 */

export type LocalCommunityIndicator = {
  key: string;
  label: string;
  value: number;
  unit: string;
  year?: number;
  source?: string;
  notes?: string;
};

const KNOWN_KEYS: Record<string, { key: string; label: string; unit: string }> =
  {
    unemployment: {
      key: "unemployment_rate",
      label: "Unemployment rate",
      unit: "%",
    },
    unemployment_rate: {
      key: "unemployment_rate",
      label: "Unemployment rate",
      unit: "%",
    },
    unemploymentrate: {
      key: "unemployment_rate",
      label: "Unemployment rate",
      unit: "%",
    },
    youth_neet: { key: "youth_neet", label: "Youth NEET (15–24)", unit: "%" },
    neet: { key: "youth_neet", label: "Youth NEET (15–24)", unit: "%" },
    households_piped_water: {
      key: "households_piped_water",
      label: "Households with piped water",
      unit: "%",
    },
    piped_water: {
      key: "households_piped_water",
      label: "Households with piped water",
      unit: "%",
    },
    households_electricity: {
      key: "households_electricity",
      label: "Households with electricity",
      unit: "%",
    },
    electricity: {
      key: "households_electricity",
      label: "Households with electricity",
      unit: "%",
    },
    grievance_density: {
      key: "grievance_density",
      label: "Open grievances per 10k HH",
      unit: "per 10k",
    },
    local_hire: {
      key: "local_hire_pct",
      label: "Local hire",
      unit: "%",
    },
    local_hire_pct: {
      key: "local_hire_pct",
      label: "Local hire",
      unit: "%",
    },
    households_surveyed: {
      key: "households_surveyed",
      label: "Households surveyed",
      unit: "count",
    },
    trust_score: {
      key: "community_trust_score",
      label: "Community trust score",
      unit: "/10",
    },
    community_trust_score: {
      key: "community_trust_score",
      label: "Community trust score",
      unit: "/10",
    },
  };

function slugKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[%()]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[%\s,]/g, "").trim();
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function resolveKey(labelOrKey: string): {
  key: string;
  label: string;
  unit: string;
} {
  let slug = slugKey(labelOrKey);
  // Drop trailing age bands so "Youth NEET (15–24)" → youth_neet
  slug = slug.replace(/_?\d{1,2}_?\d{1,2}$/, "").replace(/_+$/, "");
  const candidates = [
    slug,
    slug.replace(/_with_/g, "_"),
    slug.replace(/^households_with_/, "households_"),
    slug.replace(/^hh_/, "households_"),
  ];
  for (const c of candidates) {
    const known = KNOWN_KEYS[c];
    if (known) return known;
  }
  for (const [alias, meta] of Object.entries(KNOWN_KEYS)) {
    if (candidates.some((c) => c === alias || c.startsWith(`${alias}_`))) {
      return meta;
    }
  }
  return {
    key: slug || "local_metric",
    label: labelOrKey.trim() || "Local metric",
    unit: "%",
  };
}

function pushRow(
  rows: LocalCommunityIndicator[],
  partial: LocalCommunityIndicator,
) {
  if (!partial.key || !Number.isFinite(partial.value)) return;
  const existing = rows.findIndex((r) => r.key === partial.key);
  if (existing >= 0) rows[existing] = partial;
  else rows.push(partial);
  if (rows.length > 24) rows.length = 24;
}

/** Parse CSV: key|label,value,unit?,year?,source?,notes? */
function parseCsv(text: string): LocalCommunityIndicator[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (!lines.length) return [];
  const rows: LocalCommunityIndicator[] = [];
  let start = 0;
  const header = lines[0].toLowerCase();
  if (
    header.includes("key") ||
    header.includes("label") ||
    header.includes("metric") ||
    header.includes("indicator")
  ) {
    start = 1;
  }
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2) continue;
    const meta = resolveKey(cols[0]);
    const value = parseNumber(cols[1]);
    if (value == null) continue;
    const unit = cols[2]?.trim() || meta.unit;
    const year = cols[3] ? Number(cols[3]) : undefined;
    const source = cols[4]?.trim() || "Local community survey";
    const notes = cols[5]?.trim();
    pushRow(rows, {
      key: meta.key,
      label: meta.label !== meta.key ? meta.label : cols[0],
      value,
      unit: unit || meta.unit,
      year: Number.isFinite(year) ? year : undefined,
      source,
      notes: notes || undefined,
    });
  }
  return rows;
}

/** Labeled lines: Unemployment rate: 41% (2025) — Ward survey */
function parseLabeled(text: string): LocalCommunityIndicator[] {
  const rows: LocalCommunityIndicator[] = [];
  const re =
    /(?:^|\n)[ \t]*([A-Za-z][A-Za-z0-9 /()_%.\u2013\u2014-]{1,70})[ \t]*:[ \t]*([0-9]+(?:[.,][0-9]+)?)[ \t]*(%|per 10k|\/10|count)?[ \t]*(?:\(([12]0\d{2})\))?[ \t]*(?:[—\-–]\s*([^\n]+))?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const meta = resolveKey(m[1]);
    const value = parseNumber(m[2]);
    if (value == null) continue;
    pushRow(rows, {
      key: meta.key,
      label: meta.label,
      value,
      unit: (m[3] || meta.unit).trim(),
      year: m[4] ? Number(m[4]) : undefined,
      source: m[5]?.trim() || "Local community survey",
    });
  }
  return rows;
}

export function parseLocalCommunityIntel(
  text: string,
): LocalCommunityIndicator[] {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) return [];
  if (/[,;\t]/.test(raw.split(/\n/)[0] || "") && raw.split(/\n/).length >= 2) {
    const csv = parseCsv(raw);
    if (csv.length) return csv;
  }
  const labeled = parseLabeled(raw);
  if (labeled.length) return labeled;
  // Fallback: try CSV anyway on whole body
  return parseCsv(raw);
}

export const LOCAL_COMMUNITY_INTEL_SKELETON = `LOCAL COMMUNITY INTELLIGENCE
(Tenant-owned — verify or support Stats SA / provincial baseline; track local impact)
Place / ward: 
Survey date (YYYY-MM-DD): 
Source: (ward survey / CLO tally / community meeting / household sample)
Households surveyed: 

INDICATORS (match Stats SA keys where possible for side-by-side compare)
Unemployment rate: 
Youth NEET (15–24): 
Households with piped water: 
Households with electricity: 
Local hire: 
Community trust score: 

Or CSV:
key,value,unit,year,source,notes
unemployment_rate,41,%,2025,Ward 12 household survey,
youth_neet,48,%,2025,Youth focus group,

NOTES / LOCAL IMPACT


PEOPLE MENTIONED
PERSON 1
Initials and Surname: 
Organisation / structure: 
Contact details: 
`;

/**
 * Fill community-intel skeleton from rough notes / CSV upload.
 */
export function arrangeLocalCommunityIntel(
  roughText: string,
  skeleton: string,
): { text: string; rows: LocalCommunityIndicator[]; note: string } {
  const rough = roughText.trim();
  if (!rough) {
    return {
      text: skeleton,
      rows: [],
      note: "Inserted blank local community intelligence form.",
    };
  }
  if (
    /LOCAL COMMUNITY INTELLIGENCE/i.test(rough) ||
    (/Unemployment rate\s*:/i.test(rough) && /Youth NEET/i.test(rough))
  ) {
    const rows = parseLocalCommunityIntel(rough);
    return {
      text: rough,
      rows,
      note: rows.length
        ? `Found ${rows.length} local indicator(s) — review then Apply to attach beside Stats SA.`
        : "Form already labeled — add numeric indicators then Apply.",
    };
  }
  const rows = parseLocalCommunityIntel(rough);
  let next = skeleton;
  for (const row of rows) {
    const labelEsc = row.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${labelEsc}\\s*:\\s*)([^\\n]*)`, "i");
    if (re.test(next)) {
      next = next.replace(
        re,
        `$1${row.value}${row.unit === "%" ? "%" : ""}${row.year ? ` (${row.year})` : ""}${row.source ? ` — ${row.source}` : ""}`,
      );
    }
  }
  if (!rows.length) {
    next = `${skeleton.trim()}\n\n--- Rough notes ---\n${rough}\n`;
  } else {
    next = `${next.trim()}\n\n--- Rough notes ---\n${rough}\n`;
  }
  return {
    text: next,
    rows,
    note: rows.length
      ? `Arranged ${rows.length} local indicator(s) into the form for compare with Stats SA. Review → Apply.`
      : "No numeric indicators found — paste CSV or labeled rates (e.g. Unemployment rate: 41%), then Arrange again.",
  };
}

/** Side-by-side delta when local and platform share a key. */
export function compareLocalToBaseline(
  local: LocalCommunityIndicator[],
  baseline: Array<{ key: string; value: number; unit: string; label: string }>,
): Array<{
  key: string;
  label: string;
  localValue: number;
  baselineValue: number;
  unit: string;
  delta: number;
}> {
  const out: Array<{
    key: string;
    label: string;
    localValue: number;
    baselineValue: number;
    unit: string;
    delta: number;
  }> = [];
  for (const row of local) {
    const base = baseline.find((b) => b.key === row.key);
    if (!base) continue;
    out.push({
      key: row.key,
      label: row.label || base.label,
      localValue: row.value,
      baselineValue: base.value,
      unit: row.unit || base.unit,
      delta: Math.round((row.value - base.value) * 10) / 10,
    });
  }
  return out;
}
