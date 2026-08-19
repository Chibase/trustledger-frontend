/**
 * Parse tenant-owned local community intelligence + project impact metrics.
 * Never writes into platform Stats SA packs (ADR-040).
 *
 * Two lanes:
 * - baseline_compare — ward surveys that verify / support provincial Stats SA
 * - project_impact — labour, training, local procurement (count + ZAR) for LED / ESG / M&E
 *   and upward funder reporting (local → municipal → provincial → national → international)
 */

export type LocalIntelDomain = "baseline_compare" | "project_impact";
export type LocalIntelCategory =
  | "baseline"
  | "labour"
  | "training"
  | "procurement"
  | "socio";
export type LocalIntelAudience = "LED" | "ESG" | "ME" | "funder" | "CLO";

export type LocalCommunityIndicator = {
  key: string;
  label: string;
  value: number;
  unit: string;
  year?: number;
  source?: string;
  notes?: string;
  domain?: LocalIntelDomain;
  category?: LocalIntelCategory;
  audiences?: LocalIntelAudience[];
};

type KeyMeta = {
  key: string;
  label: string;
  unit: string;
  domain: LocalIntelDomain;
  category: LocalIntelCategory;
  audiences: LocalIntelAudience[];
};

const KNOWN_KEYS: Record<string, KeyMeta> = {
  // —— Baseline compare (Stats SA keys) ——
  unemployment: {
    key: "unemployment_rate",
    label: "Unemployment rate",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME", "funder"],
  },
  unemployment_rate: {
    key: "unemployment_rate",
    label: "Unemployment rate",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME", "funder"],
  },
  unemploymentrate: {
    key: "unemployment_rate",
    label: "Unemployment rate",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME", "funder"],
  },
  youth_neet: {
    key: "youth_neet",
    label: "Youth NEET (15–24)",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME", "LED"],
  },
  neet: {
    key: "youth_neet",
    label: "Youth NEET (15–24)",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME", "LED"],
  },
  households_piped_water: {
    key: "households_piped_water",
    label: "Households with piped water",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME"],
  },
  piped_water: {
    key: "households_piped_water",
    label: "Households with piped water",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME"],
  },
  households_electricity: {
    key: "households_electricity",
    label: "Households with electricity",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME"],
  },
  electricity: {
    key: "households_electricity",
    label: "Households with electricity",
    unit: "%",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "ME"],
  },
  grievance_density: {
    key: "grievance_density",
    label: "Open grievances per 10k HH",
    unit: "per 10k",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ESG", "CLO"],
  },
  households_surveyed: {
    key: "households_surveyed",
    label: "Households surveyed",
    unit: "count",
    domain: "baseline_compare",
    category: "baseline",
    audiences: ["ME", "CLO"],
  },
  trust_score: {
    key: "community_trust_score",
    label: "Community trust score",
    unit: "/10",
    domain: "baseline_compare",
    category: "socio",
    audiences: ["ESG", "CLO", "funder"],
  },
  community_trust_score: {
    key: "community_trust_score",
    label: "Community trust score",
    unit: "/10",
    domain: "baseline_compare",
    category: "socio",
    audiences: ["ESG", "CLO", "funder"],
  },

  // —— Project impact: labour ——
  local_hire: {
    key: "local_hire_pct",
    label: "Local hire",
    unit: "%",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  local_hire_pct: {
    key: "local_hire_pct",
    label: "Local hire",
    unit: "%",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  labour_intake: {
    key: "labour_intake_count",
    label: "Labour intake",
    unit: "people",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  labour_intake_count: {
    key: "labour_intake_count",
    label: "Labour intake",
    unit: "people",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  labour_intake_people: {
    key: "labour_intake_count",
    label: "Labour intake",
    unit: "people",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  labour_wages: {
    key: "labour_wages_zar",
    label: "Labour wages / payroll",
    unit: "ZAR",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  labour_wages_zar: {
    key: "labour_wages_zar",
    label: "Labour wages / payroll",
    unit: "ZAR",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  labour_payroll_zar: {
    key: "labour_wages_zar",
    label: "Labour wages / payroll",
    unit: "ZAR",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  youth_employed: {
    key: "youth_employed_count",
    label: "Youth employed",
    unit: "people",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME"],
  },
  youth_employed_count: {
    key: "youth_employed_count",
    label: "Youth employed",
    unit: "people",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME"],
  },
  women_employed: {
    key: "women_employed_count",
    label: "Women employed",
    unit: "people",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME"],
  },
  women_employed_count: {
    key: "women_employed_count",
    label: "Women employed",
    unit: "people",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME"],
  },
  jobs_created: {
    key: "jobs_created_fte",
    label: "Jobs created (FTE)",
    unit: "FTE",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  jobs_created_fte: {
    key: "jobs_created_fte",
    label: "Jobs created (FTE)",
    unit: "FTE",
    domain: "project_impact",
    category: "labour",
    audiences: ["LED", "ESG", "ME", "funder"],
  },

  // —— Project impact: training ——
  training_beneficiaries: {
    key: "training_beneficiaries",
    label: "People trained",
    unit: "people",
    domain: "project_impact",
    category: "training",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  people_trained: {
    key: "training_beneficiaries",
    label: "People trained",
    unit: "people",
    domain: "project_impact",
    category: "training",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  training_spend: {
    key: "training_spend_zar",
    label: "Training spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "training",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  training_spend_zar: {
    key: "training_spend_zar",
    label: "Training spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "training",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  skills_dev: {
    key: "skills_dev_zar",
    label: "Skills development spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "training",
    audiences: ["ESG", "ME", "funder"],
  },
  skills_dev_zar: {
    key: "skills_dev_zar",
    label: "Skills development spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "training",
    audiences: ["ESG", "ME", "funder"],
  },
  skills_development_spend: {
    key: "skills_dev_zar",
    label: "Skills development spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "training",
    audiences: ["ESG", "ME", "funder"],
  },

  // —— Project impact: procurement ——
  local_procurement: {
    key: "local_procurement_zar",
    label: "Local procurement",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  local_procurement_zar: {
    key: "local_procurement_zar",
    label: "Local procurement",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  preferential_procurement: {
    key: "preferential_procurement_zar",
    label: "Preferential procurement",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["ESG", "ME", "funder"],
  },
  preferential_procurement_zar: {
    key: "preferential_procurement_zar",
    label: "Preferential procurement",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["ESG", "ME", "funder"],
  },
  local_suppliers: {
    key: "local_suppliers_count",
    label: "Local suppliers engaged",
    unit: "count",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "ME"],
  },
  local_suppliers_count: {
    key: "local_suppliers_count",
    label: "Local suppliers engaged",
    unit: "count",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "ME"],
  },
  sme_spend: {
    key: "sme_spend_zar",
    label: "SME / ESD spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "funder"],
  },
  sme_spend_zar: {
    key: "sme_spend_zar",
    label: "SME / ESD spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "funder"],
  },
  esd_spend: {
    key: "sme_spend_zar",
    label: "SME / ESD spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "funder"],
  },
  esd_spend_zar: {
    key: "sme_spend_zar",
    label: "SME / ESD spend",
    unit: "ZAR",
    domain: "project_impact",
    category: "procurement",
    audiences: ["LED", "ESG", "funder"],
  },

  // —— Socio-economic impact ——
  households_benefiting: {
    key: "households_benefiting",
    label: "Households benefiting",
    unit: "count",
    domain: "project_impact",
    category: "socio",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  income_injected: {
    key: "income_injected_zar",
    label: "Local income injected",
    unit: "ZAR",
    domain: "project_impact",
    category: "socio",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  income_injected_zar: {
    key: "income_injected_zar",
    label: "Local income injected",
    unit: "ZAR",
    domain: "project_impact",
    category: "socio",
    audiences: ["LED", "ESG", "ME", "funder"],
  },
  local_economic_value: {
    key: "income_injected_zar",
    label: "Local income injected",
    unit: "ZAR",
    domain: "project_impact",
    category: "socio",
    audiences: ["LED", "ESG", "ME", "funder"],
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
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^(?:r|zar)\s*/i, "");
  cleaned = cleaned.replace(/\s/g, "").replace(/,/g, "");
  cleaned = cleaned.replace(/%$/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function resolveKey(labelOrKey: string): KeyMeta | {
  key: string;
  label: string;
  unit: string;
  domain: LocalIntelDomain;
  category: LocalIntelCategory;
  audiences: LocalIntelAudience[];
} {
  let slug = slugKey(labelOrKey);
  slug = slug.replace(/_?\d{1,2}_?\d{1,2}$/, "").replace(/_+$/, "");
  // Normalise ZAR / rand suffixes in labels
  slug = slug
    .replace(/_zar$/, "")
    .replace(/_r$/, "")
    .replace(/_rand$/, "")
    .replace(/_rands$/, "");
  const candidates = [
    slug,
    `${slug}_zar`,
    `${slug}_count`,
    slug.replace(/_with_/g, "_"),
    slug.replace(/^households_with_/, "households_"),
    slug.replace(/^hh_/, "households_"),
    slug.replace(/^local_procurement_value$/, "local_procurement"),
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
    domain: "project_impact",
    category: "socio",
    audiences: ["ME", "funder"],
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
  if (rows.length > 40) rows.length = 40;
}

const SKIP_LABEL_SLUGS = new Set([
  "place",
  "place_ward",
  "ward",
  "survey_date",
  "survey_date_yyyy_mm_dd",
  "reporting_period",
  "period",
  "source",
  "date",
  "date_of_meeting",
  "venue",
  "time",
  "contact",
  "contact_details",
  "initials_and_surname",
  "organisation_structure",
  "organisation",
  "structure",
  "theme",
  "severity",
  "location",
  "notes",
  "local_impact",
  "person",
  "funder",
  "audience",
]);

function isKnownIndicatorKey(key: string): boolean {
  return Object.values(KNOWN_KEYS).some((m) => m.key === key);
}

function shouldSkipLabel(rawLabel: string): boolean {
  const slug = slugKey(rawLabel)
    .replace(/_?\d{1,2}_?\d{1,2}$/, "")
    .replace(/_+$/, "");
  if (SKIP_LABEL_SLUGS.has(slug)) return true;
  if (slug.startsWith("survey_date")) return true;
  if (slug.includes("contact")) return true;
  if (slug.includes("initials")) return true;
  return false;
}

function normaliseUnit(
  raw: string | undefined,
  fallback: string,
): string {
  if (!raw) return fallback;
  const u = raw.trim();
  if (/^(r|zar|rand)$/i.test(u)) return "ZAR";
  if (/^people$/i.test(u)) return "people";
  if (/^fte$/i.test(u)) return "FTE";
  if (/^count$/i.test(u)) return "count";
  if (u === "%") return "%";
  return u || fallback;
}

/** Prefer INDICATORS + PROJECT IMPACT blocks; drop PEOPLE / THEMES noise. */
function extractIntelBody(text: string): string {
  let body = text.replace(/^\uFEFF/, "");
  body = body.replace(/^[ \t]*#.*$/gm, "");
  const sections = [
    body.match(
      /INDICATORS[\s\S]*?(?=\n(?:PROJECT IMPACT|Or CSV:|NOTES|PEOPLE MENTIONED|THEMES|FUNDER ROLL-UP)\b|$)/i,
    ),
    body.match(
      /PROJECT IMPACT[\s\S]*?(?=\n(?:Or CSV:|NOTES|PEOPLE MENTIONED|THEMES|FUNDER ROLL-UP)\b|$)/i,
    ),
    body.match(
      /Or CSV:\s*\n([\s\S]*?)(?=\n(?:NOTES|PEOPLE MENTIONED|THEMES|FUNDER ROLL-UP)\b|$)/i,
    ),
  ];
  const parts: string[] = [];
  for (const m of sections) {
    if (!m) continue;
    parts.push(m[1] ?? m[0]);
  }
  if (parts.length) return parts.join("\n").trim();
  return body.trim();
}

function rowFromMeta(
  meta: ReturnType<typeof resolveKey>,
  value: number,
  unit: string,
  year?: number,
  source?: string,
  notes?: string,
): LocalCommunityIndicator {
  return {
    key: meta.key,
    label: meta.label,
    value,
    unit: normaliseUnit(unit, meta.unit),
    year,
    source: source || "Local community / project impact",
    notes,
    domain: meta.domain,
    category: meta.category,
    audiences: meta.audiences,
  };
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
    const cols = lines[i]
      .split(/[,;\t]/)
      .map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2) continue;
    if (shouldSkipLabel(cols[0])) continue;
    const meta = resolveKey(cols[0]);
    const value = parseNumber(cols[1]);
    if (value == null) continue;
    const unitCol = cols[2]?.trim();
    if (!isKnownIndicatorKey(meta.key) && !unitCol) continue;
    const year = cols[3] ? Number(cols[3]) : undefined;
    pushRow(
      rows,
      rowFromMeta(
        meta,
        value,
        unitCol || meta.unit,
        Number.isFinite(year) ? year : undefined,
        cols[4]?.trim(),
        cols[5]?.trim() || undefined,
      ),
    );
  }
  return rows;
}

/** Labeled lines incl. ZAR: Local procurement: R1 250 000 */
function parseLabeled(text: string): LocalCommunityIndicator[] {
  const rows: LocalCommunityIndicator[] = [];
  const re =
    /(?:^|\n)[ \t]*([A-Za-z][A-Za-z0-9 /()_%.\u2013\u2014-]{1,80})[ \t]*:[ \t]*(?:R\s*)?([0-9]+(?:[.,\s][0-9]+)*)[ \t]*(%|ZAR|R|rand|per 10k|\/10|count|people|FTE|jobs)?[ \t]*(?:\(([12]0\d{2})\))?[ \t]*(?:[—\-–]\s*([^\n]+))?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (shouldSkipLabel(m[1])) continue;
    const meta = resolveKey(m[1]);
    if (!isKnownIndicatorKey(meta.key)) continue;
    const value = parseNumber(m[2]);
    if (value == null) continue;
    if (!m[3] && value >= 1900 && value <= 2100 && /date/i.test(m[1])) continue;
    pushRow(
      rows,
      rowFromMeta(
        meta,
        value,
        m[3] || meta.unit,
        m[4] ? Number(m[4]) : undefined,
        m[5]?.trim(),
      ),
    );
  }
  return rows;
}

export function parseLocalCommunityIntel(
  text: string,
): LocalCommunityIndicator[] {
  const whole = text.replace(/^\uFEFF/, "").trim();
  if (!whole) return [];

  const first = whole.split(/\n/)[0] || "";
  if (/[,;\t]/.test(first) && !/:\s*[0-9R]/.test(first)) {
    const csvOnly = parseCsv(whole);
    if (csvOnly.length) return csvOnly;
  }

  const raw = extractIntelBody(whole);
  if (!raw) return [];
  const labeled = parseLabeled(raw);
  const csv = parseCsv(raw);
  if (labeled.length && csv.length) {
    const merged: LocalCommunityIndicator[] = [...labeled];
    for (const row of csv) {
      if (!merged.some((r) => r.key === row.key)) merged.push(row);
    }
    return merged.slice(0, 40);
  }
  if (labeled.length) return labeled;
  if (csv.length) return csv;
  return [];
}

export const LOCAL_COMMUNITY_INTEL_SKELETON = `LOCAL COMMUNITY INTELLIGENCE
(Tenant-owned — verify Stats SA baseline + measure project impact for LED / ESG / M&E / funders)
Place / ward: 
Survey date / reporting period (YYYY-MM-DD): 
Source: (ward survey / CLO tally / contractor LED / M&E pack)

INDICATORS — baseline compare (Stats SA keys)
Households surveyed: 
Unemployment rate: 
Youth NEET (15–24): 
Households with piped water: 
Households with electricity: 
Community trust score: 

PROJECT IMPACT — labour / training / procurement (count + ZAR)
Labour intake: 
Labour wages / payroll: 
Local hire: 
Youth employed: 
Women employed: 
Jobs created (FTE): 
People trained: 
Training spend: 
Skills development spend: 
Local procurement: 
Preferential procurement: 
Local suppliers engaged: 
SME / ESD spend: 
Households benefiting: 
Local income injected: 

Or CSV:
key,value,unit,year,source,notes
# labour_intake_count,85,people,2025,LED register,
# labour_wages_zar,2100000,ZAR,2025,Payroll,
# local_procurement_zar,1500000,ZAR,2025,Procurement log,
# training_spend_zar,320000,ZAR,2025,Skills pack,
# unemployment_rate,41,%,2025,Ward household survey,

FUNDER ROLL-UP
(Local project figures sit beside municipal / provincial Stats SA baseline — report upward without overwriting platform packs.)
Audience notes (LED / ESG / M&E / funder): 

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
      note: "Inserted blank local community intelligence + project impact form.",
    };
  }
  if (
    /LOCAL COMMUNITY INTELLIGENCE/i.test(rough) ||
    /PROJECT IMPACT/i.test(rough) ||
    (/Unemployment rate\s*:/i.test(rough) && /Youth NEET/i.test(rough))
  ) {
    const rows = parseLocalCommunityIntel(rough);
    return {
      text: rough,
      rows,
      note: rows.length
        ? `Found ${rows.length} indicator(s) — review then Apply (baseline compare + project impact for LED/ESG/M&E).`
        : "Form already labeled — add numeric baseline and impact figures then Apply.",
    };
  }
  const rows = parseLocalCommunityIntel(rough);
  let next = skeleton;
  for (const row of rows) {
    const labelEsc = row.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${labelEsc}\\s*:\\s*)([^\\n]*)`, "i");
    if (re.test(next)) {
      const display =
        row.unit === "ZAR"
          ? `R${row.value.toLocaleString("en-ZA")}`
          : row.unit === "%"
            ? `${row.value}%`
            : `${row.value}${row.unit ? ` ${row.unit}` : ""}`;
      next = next.replace(
        re,
        `$1${display}${row.year ? ` (${row.year})` : ""}${row.source ? ` — ${row.source}` : ""}`,
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
      ? `Arranged ${rows.length} row(s) for Stats SA compare + project impact. Review → Apply.`
      : "No numeric indicators found — paste CSV or labeled lines (e.g. Local procurement: R1500000), then Arrange again.",
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
    if (row.domain === "project_impact" && row.category !== "baseline") {
      // Still allow compare when key overlaps Stats SA (e.g. local_hire not in SA)
    }
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

export function partitionLocalIntel(rows: LocalCommunityIndicator[]): {
  baselineCompare: LocalCommunityIndicator[];
  projectImpact: LocalCommunityIndicator[];
  byCategory: Record<LocalIntelCategory, LocalCommunityIndicator[]>;
} {
  const baselineCompare: LocalCommunityIndicator[] = [];
  const projectImpact: LocalCommunityIndicator[] = [];
  const byCategory: Record<LocalIntelCategory, LocalCommunityIndicator[]> = {
    baseline: [],
    labour: [],
    training: [],
    procurement: [],
    socio: [],
  };
  for (const row of rows) {
    const domain =
      row.domain ||
      (row.category && row.category !== "baseline"
        ? "project_impact"
        : "baseline_compare");
    const category =
      row.category ||
      (domain === "project_impact" ? "socio" : "baseline");
    const enriched = { ...row, domain, category };
    if (domain === "project_impact") projectImpact.push(enriched);
    else baselineCompare.push(enriched);
    byCategory[category].push(enriched);
  }
  return { baselineCompare, projectImpact, byCategory };
}

export function formatIntelValue(row: {
  value: number;
  unit: string;
}): string {
  if (row.unit === "ZAR") return `R${row.value.toLocaleString("en-ZA")}`;
  if (row.unit === "%") return `${row.value}%`;
  return `${row.value}${row.unit ? ` ${row.unit}` : ""}`;
}

/** Sum ZAR impact rows for empowerment / LED envelope tracking. */
export function sumImpactZar(
  rows: LocalCommunityIndicator[],
  keys?: string[],
): number {
  return rows
    .filter(
      (r) =>
        r.unit === "ZAR" &&
        (!keys || keys.includes(r.key)) &&
        r.domain !== "baseline_compare",
    )
    .reduce((acc, r) => acc + (Number.isFinite(r.value) ? r.value : 0), 0);
}

export type FunderScale =
  | "local"
  | "municipal"
  | "provincial"
  | "national"
  | "international";

/**
 * Narrative ladder: project impact evidence at local site, read against
 * attached Stats SA baseline for upward funder reporting. Does not invent
 * provincial/national aggregates from a single project.
 */
export function buildFunderImpactLadder(opts: {
  rows: LocalCommunityIndicator[];
  geo?: {
    wardName?: string;
    municipalityName?: string;
    provinceName?: string;
    countryName?: string;
    placeLabel?: string;
  };
  baselinePlaceId?: string;
  funderName?: string;
}): Array<{ scale: FunderScale; title: string; summary: string }> {
  const { baselineCompare, projectImpact, byCategory } = partitionLocalIntel(
    opts.rows,
  );
  const zarTotal = sumImpactZar(opts.rows);
  const labourPeople =
    byCategory.labour.find((r) => r.key === "labour_intake_count")?.value ??
    byCategory.labour.find((r) => r.key === "jobs_created_fte")?.value;
  const trained = byCategory.training.find(
    (r) => r.key === "training_beneficiaries",
  )?.value;
  const proc = byCategory.procurement.find(
    (r) => r.key === "local_procurement_zar",
  )?.value;
  const place =
    opts.geo?.placeLabel ||
    opts.geo?.wardName ||
    opts.geo?.municipalityName ||
    "project site";

  const impactBits = [
    labourPeople != null ? `${labourPeople} labour/jobs` : null,
    trained != null ? `${trained} trained` : null,
    proc != null ? `R${proc.toLocaleString("en-ZA")} local procurement` : null,
    zarTotal > 0 && proc == null
      ? `R${zarTotal.toLocaleString("en-ZA")} local economic value logged`
      : zarTotal > 0 && proc != null
        ? `R${zarTotal.toLocaleString("en-ZA")} total ZAR impact logged`
        : null,
  ].filter(Boolean);

  const baselineBits = baselineCompare
    .slice(0, 4)
    .map((r) => `${r.label} ${formatIntelValue(r)}`)
    .join("; ");

  return [
    {
      scale: "local",
      title: `Local · ${place}`,
      summary: impactBits.length
        ? `Project impact: ${impactBits.join(" · ")}. Useful for LED desk, CLO, and site M&E.`
        : "Capture labour, training, and local procurement to measure site impact.",
    },
    {
      scale: "municipal",
      title: `Municipal · ${opts.geo?.municipalityName || "municipality"}`,
      summary: `${projectImpact.length} impact metric(s) available for LED / IDP evidence${
        opts.geo?.wardName ? ` (ward ${opts.geo.wardName})` : ""
      }.`,
    },
    {
      scale: "provincial",
      title: `Provincial · ${opts.geo?.provinceName || "province"}`,
      summary: baselineBits
        ? `Local survey vs Stats SA baseline${opts.baselinePlaceId ? ` (${opts.baselinePlaceId})` : ""}: ${baselineBits}.`
        : "Attach Stats SA provincial/district baseline on the dossier to verify socio-economic context.",
    },
    {
      scale: "national",
      title: `National · ${opts.geo?.countryName || "South Africa"}`,
      summary:
        "Roll project ZAR and employment figures into national programme / B-BBEE / ESG packs without altering platform Census packs.",
    },
    {
      scale: "international",
      title: `International funder${opts.funderName ? ` · ${opts.funderName}` : ""}`,
      summary:
        "Same local evidence pack supports IFIs and bilateral funders: labour intake, skills, local procurement (ZAR), and socio-economic Δ vs baseline.",
    },
  ];
}
