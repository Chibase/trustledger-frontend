/**
 * Capture hub — field notes + structured project report packs.
 * Structured packs feed ESG / B-BBEE / employment / CSI / GRM / issue log / empowerment budget report sections.
 */

export const NARRATIVE_CAPTURE_SOURCES = [
  "minutes",
  "attendance",
  "social_intel",
  "pasted_report",
] as const;

export const PACK_CAPTURE_SOURCES = [
  "project_profile",
  "bbbee",
  "employment",
  "csi",
  "esg_period",
  "grm_period",
  "issue_log",
  "budget",
] as const;

export type NarrativeCaptureSource = (typeof NARRATIVE_CAPTURE_SOURCES)[number];
export type PackCaptureSource = (typeof PACK_CAPTURE_SOURCES)[number];
export type CaptureSource = NarrativeCaptureSource | PackCaptureSource;

export function isNarrativeCaptureSource(
  source: CaptureSource,
): source is NarrativeCaptureSource {
  return (NARRATIVE_CAPTURE_SOURCES as readonly string[]).includes(source);
}

export function isPackCaptureSource(
  source: CaptureSource,
): source is PackCaptureSource {
  return (PACK_CAPTURE_SOURCES as readonly string[]).includes(source);
}

export type ProjectProfileFacts = {
  periodLabel?: string;
  clientFunder?: string;
  contractorName?: string;
  ward?: string;
  municipality?: string;
  status?: string;
  startDate?: string;
  targetEndDate?: string;
  budgetTotal?: number;
  budgetSpent?: number;
  publicSummary?: string;
  sector?: string;
  siteDescription?: string;
};

export type BbbeeFacts = {
  periodLabel?: string;
  bbbeeLevel?: string;
  ownershipPct?: number;
  blackOwnershipPct?: number;
  managementControlNotes?: string;
  skillsDevSpendZar?: number;
  preferentialProcurementZar?: number;
  esdSpendZar?: number;
  localSupplierCount?: number;
  certificateRef?: string;
  notes?: string;
};

export type EmploymentFacts = {
  periodLabel?: string;
  localHireTarget?: number;
  localHireActual?: number;
  totalWorkforce?: number;
  contractorLabour?: number;
  womenEmployed?: number;
  youthEmployed?: number;
  personsWithDisability?: number;
  wardOfOriginNotes?: string;
  trainingDays?: number;
  /** Training / skills spend captured beside training delivery (ZAR). */
  trainingSpendZar?: number;
  trainingActivityNotes?: string;
  labourDisputesOpen?: number;
  notes?: string;
};

export type CsiFacts = {
  periodLabel?: string;
  programmeName?: string;
  beneficiaryGroup?: string;
  amountZar?: number;
  beneficiariesReached?: number;
  linkedEngagement?: string;
  outcomes?: string;
  notes?: string;
};

export type EsgPeriodFacts = {
  periodLabel?: string;
  environmentalIncidents?: number;
  dustWaterNoiseNotes?: string;
  rehabilitationProgress?: string;
  communityTrustNotes?: string;
  governanceActions?: string;
  hsNearMisses?: number;
  hsLostTimeInjuries?: number;
  notes?: string;
};

export type GrmPeriodFacts = {
  periodLabel?: string;
  casesOpened?: number;
  casesClosed?: number;
  casesEscalated?: number;
  avgDaysToClose?: number;
  topThemes?: string;
  communityFeedback?: string;
  processImprovements?: string;
  notes?: string;
};

/** Desk issue log for the period — sits beside GRM on Capture hub. */
export type IssueLogFacts = {
  periodLabel?: string;
  casesLogged?: number;
  casesOpen?: number;
  casesClosed?: number;
  casesEscalated?: number;
  topThemes?: string;
  openCaseRefs?: string;
  deskNotes?: string;
  notes?: string;
};

export type BudgetFacts = {
  periodLabel?: string;
  /** Empowerment budget authorised (ZAR) — not CAPEX. */
  budgetTotalZar?: number;
  /** Empowerment spent to date (auto from training / B-BBEE packs). */
  spendToDateZar?: number;
  periodSpendZar?: number;
  contingencyZar?: number;
  claimsPendingZar?: number;
  varianceNotes?: string;
  notes?: string;
};

export type CaptureStructured =
  | { pack: "project_profile"; data: ProjectProfileFacts }
  | { pack: "bbbee"; data: BbbeeFacts }
  | { pack: "employment"; data: EmploymentFacts }
  | { pack: "csi"; data: CsiFacts }
  | { pack: "esg_period"; data: EsgPeriodFacts }
  | { pack: "grm_period"; data: GrmPeriodFacts }
  | { pack: "issue_log"; data: IssueLogFacts }
  | { pack: "budget"; data: BudgetFacts };

export type CaptureRecord = {
  id: string;
  source: CaptureSource;
  title: string;
  body: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  appliedStakeholderIds?: string[];
  /** Structured report-pack fields (ESG / B-BBEE / employment / …). */
  structured?: CaptureStructured;
};

const KEY = "tl-capture-records";

function readJson<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(value));
}

export function listCaptureRecords(): CaptureRecord[] {
  return readJson<CaptureRecord[]>([]);
}

export function saveCaptureRecord(row: CaptureRecord) {
  const rows = listCaptureRecords().filter((r) => r.id !== row.id);
  rows.unshift(row);
  writeJson(rows);
}

/** Most recent structured pack for a project (if any). */
export function latestPackCapture(
  projectId: string,
  pack: PackCaptureSource,
): CaptureRecord | undefined {
  return listCaptureRecords().find(
    (r) =>
      r.projectId === projectId &&
      r.structured?.pack === pack &&
      r.source === pack,
  );
}

export function createCaptureId(): string {
  return `CAP-${Date.now().toString().slice(-6)}`;
}

export function emptyStructured(pack: PackCaptureSource): CaptureStructured {
  switch (pack) {
    case "project_profile":
      return { pack, data: {} };
    case "bbbee":
      return { pack, data: {} };
    case "employment":
      return { pack, data: {} };
    case "csi":
      return { pack, data: {} };
    case "esg_period":
      return { pack, data: {} };
    case "grm_period":
      return { pack, data: {} };
    case "issue_log":
      return { pack, data: {} };
    case "budget":
      return { pack, data: {} };
  }
}

function line(label: string, value: string | number | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  return `${label}: ${value}`;
}

/** Flatten structured packs into searchable narrative for AI / appendix. */
export function structuredToBody(structured: CaptureStructured): string {
  const d = structured.data as Record<string, unknown>;
  const header = `CAPTURE PACK: ${structured.pack.toUpperCase().replaceAll("_", " ")}`;
  const rows = Object.entries(d)
    .map(([key, value]) => {
      if (value === undefined || value === null || value === "") return null;
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
      return line(label, value as string | number);
    })
    .filter(Boolean);
  return [header, "", ...rows].join("\n");
}

export type AggregatedPackFacts = {
  projectProfiles: ProjectProfileFacts[];
  bbbee: BbbeeFacts[];
  employment: EmploymentFacts[];
  csi: CsiFacts[];
  esg: EsgPeriodFacts[];
  grm: GrmPeriodFacts[];
  issueLogs: IssueLogFacts[];
  budget: BudgetFacts[];
};

export function aggregatePackFacts(
  records: CaptureRecord[],
  projectId?: string,
): AggregatedPackFacts {
  const scoped = projectId
    ? records.filter((r) => !r.projectId || r.projectId === projectId)
    : records;
  const out: AggregatedPackFacts = {
    projectProfiles: [],
    bbbee: [],
    employment: [],
    csi: [],
    esg: [],
    grm: [],
    issueLogs: [],
    budget: [],
  };
  for (const row of scoped) {
    const s = row.structured;
    if (!s) continue;
    switch (s.pack) {
      case "project_profile":
        out.projectProfiles.push(s.data);
        break;
      case "bbbee":
        out.bbbee.push(s.data);
        break;
      case "employment":
        out.employment.push(s.data);
        break;
      case "csi":
        out.csi.push(s.data);
        break;
      case "esg_period":
        out.esg.push(s.data);
        break;
      case "grm_period":
        out.grm.push(s.data);
        break;
      case "issue_log":
        out.issueLogs.push(s.data);
        break;
      case "budget":
        out.budget.push(s.data);
        break;
    }
  }
  return out;
}

export const PACK_SOURCE_META: Record<
  PackCaptureSource,
  { label: string; hint: string; reports: string }
> = {
  project_profile: {
    label: "Project profile",
    hint: "Site, contractor, empowerment budget, geo, and programme summary for every report.",
    reports: "Monthly · MEL · Board",
  },
  bbbee: {
    label: "B-BBEE / Empowerment",
    hint: "Ownership, management control, skills, procurement, and ESD for empowerment reports.",
    reports: "B-BBEE · Board",
  },
  employment: {
    label: "Employment",
    hint: "Local hire, workforce composition, training days + spend, and labour disputes.",
    reports: "B-BBEE · ESG · Board",
  },
  csi: {
    label: "CSI programme",
    hint: "Community investment programmes, beneficiaries, and spend.",
    reports: "CSI · Board",
  },
  esg_period: {
    label: "ESG period",
    hint: "Environmental, social, and governance notes for the reporting period.",
    reports: "ESG · Environmental · H&S · Board",
  },
  grm_period: {
    label: "GRM period",
    hint: "Case volumes, themes, turnaround, and process improvements.",
    reports: "GRM · Issue handling · Monthly",
  },
  issue_log: {
    label: "Issue log",
    hint: "Desk issue log for the period — open cases, themes, and notes beside GRM.",
    reports: "Issue handling · GRM · Monthly",
  },
  budget: {
    label: "Empowerment budget",
    hint: "Empowerment envelope and spent (skills, training, procurement, ESD) — not CAPEX.",
    reports: "MEL · Board · Budget section",
  },
};
