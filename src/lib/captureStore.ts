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
  source: string,
): source is NarrativeCaptureSource {
  return (NARRATIVE_CAPTURE_SOURCES as readonly string[]).includes(source);
}

export function isPackCaptureSource(
  source: string,
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

/** Categories for issue log pathway (desk + Capture). */
export const ISSUE_LOG_CATEGORIES = [
  { id: "environment", label: "Environment" },
  { id: "employment", label: "Employment / labour" },
  { id: "theft", label: "Theft / loss" },
  { id: "safety", label: "Safety / security" },
  { id: "dust", label: "Dust" },
  { id: "noise", label: "Noise" },
  { id: "water", label: "Water / utilities" },
  { id: "access_road", label: "Access / roads" },
  { id: "land", label: "Land / resettlement" },
  { id: "community_disgruntlement", label: "Community disgruntlement" },
  { id: "other", label: "Other" },
] as const;

export type IssueLogCategoryId = (typeof ISSUE_LOG_CATEGORIES)[number]["id"];

/** One follow-up action on the pathway (repeatable). */
export type IssueLogFollowUp = {
  id: string;
  /** Action taken */
  action: string;
  /** Outcome of that action */
  outcome?: string;
  /** When the follow-up happened (datetime-local or ISO) */
  at?: string;
};

/**
 * Single issue pathway: report → follow-ups → escalate → feedback → resolve → close.
 * Captured in the Issue log pack and available as report evidence.
 */
export type IssueLogEntry = {
  id: string;
  title: string;
  category?: string;
  reporterName?: string;
  /** Date/time reported / captured */
  reportedAt?: string;
  followUps?: IssueLogFollowUp[];
  escalatedTo?: string;
  escalatedAt?: string;
  feedbackAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  linkedIncidentId?: string;
  notes?: string;
};

/** Desk issue log for the period — sits beside GRM on Capture hub. */
export type IssueLogFacts = {
  periodLabel?: string;
  /** Structured pathways (preferred SoT for evidence / reports). */
  entries?: IssueLogEntry[];
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

export function createIssueLogEntryId(): string {
  return `ISL-${Date.now().toString(36).slice(-6)}`;
}

export function createIssueLogFollowUpId(): string {
  return `FU-${Date.now().toString(36).slice(-5)}`;
}

export function emptyIssueLogEntry(): IssueLogEntry {
  return {
    id: createIssueLogEntryId(),
    title: "",
    category: "",
    reporterName: "",
    reportedAt: "",
    followUps: [
      {
        id: createIssueLogFollowUpId(),
        action: "",
        outcome: "",
        at: "",
      },
    ],
    escalatedTo: "",
    escalatedAt: "",
    feedbackAt: "",
    resolvedAt: "",
    closedAt: "",
    notes: "",
  };
}

export function issueLogCategoryLabel(category?: string): string {
  if (!category) return "";
  const hit = ISSUE_LOG_CATEGORIES.find((c) => c.id === category);
  return hit?.label || category;
}

/** Derive period rollup counts from pathway entries. */
export function deriveIssueLogRollup(entries: IssueLogEntry[]): {
  casesLogged: number;
  casesOpen: number;
  casesClosed: number;
  casesEscalated: number;
  topThemes: string;
  openCaseRefs: string;
} {
  const logged = entries.filter((e) => e.title.trim());
  const closed = logged.filter((e) => Boolean(e.closedAt));
  const escalated = logged.filter((e) => Boolean(e.escalatedTo || e.escalatedAt));
  const open = logged.filter((e) => !e.closedAt);
  const themes = [
    ...new Set(
      logged
        .map((e) => issueLogCategoryLabel(e.category))
        .filter(Boolean),
    ),
  ];
  return {
    casesLogged: logged.length,
    casesOpen: open.length,
    casesClosed: closed.length,
    casesEscalated: escalated.length,
    topThemes: themes.join(", "),
    openCaseRefs: open
      .map((e) => e.linkedIncidentId || e.title.slice(0, 40))
      .filter(Boolean)
      .join(" · "),
  };
}

/** Markdown blocks for report evidence — report → close pathway. */
export function formatIssueLogEntries(entries: IssueLogEntry[]): string[] {
  const blocks: string[] = [];
  entries.forEach((entry, idx) => {
    if (!entry.title.trim()) return;
    const cat = issueLogCategoryLabel(entry.category);
    const lines: string[] = [
      `### Issue ${idx + 1}: ${entry.title}`,
      cat ? `- **Category:** ${cat}` : null,
      entry.reporterName
        ? `- **Person reporting:** ${entry.reporterName}`
        : null,
      entry.reportedAt
        ? `- **Reported / captured:** ${entry.reportedAt}`
        : null,
    ].filter(Boolean) as string[];
    const fus = (entry.followUps || []).filter(
      (fu) => fu.action.trim() || fu.outcome?.trim() || fu.at,
    );
    if (fus.length) {
      lines.push(`- **Follow-ups:**`);
      fus.forEach((fu, fi) => {
        lines.push(
          `  ${fi + 1}. ${fu.action || "—"}${fu.outcome ? ` → outcome: ${fu.outcome}` : ""}${fu.at ? ` (${fu.at})` : ""}`,
        );
      });
    }
    if (entry.escalatedTo || entry.escalatedAt) {
      lines.push(
        `- **Escalated:** ${entry.escalatedTo || "—"}${entry.escalatedAt ? ` @ ${entry.escalatedAt}` : ""}`,
      );
    }
    if (entry.feedbackAt) {
      lines.push(`- **Feedback:** ${entry.feedbackAt}`);
    }
    if (entry.resolvedAt) {
      lines.push(`- **Resolved:** ${entry.resolvedAt}`);
    }
    if (entry.closedAt) {
      lines.push(`- **Closed:** ${entry.closedAt}`);
    }
    if (entry.linkedIncidentId) {
      lines.push(`- **Linked desk case:** ${entry.linkedIncidentId}`);
    }
    if (entry.notes?.trim()) {
      lines.push(`- **Notes:** ${entry.notes.trim()}`);
    }
    blocks.push(lines.join("\n"));
  });
  return blocks;
}

/** Flatten pathway entries — latest pack only (captures save newest-first). */
export function collectIssueLogEntries(
  packs: IssueLogFacts[],
): IssueLogEntry[] {
  for (const pack of packs) {
    const titled = (pack.entries || []).filter((e) => e.title?.trim());
    if (titled.length) return titled;
  }
  return [];
}

/** Flatten structured packs into searchable narrative for AI / appendix. */
export function structuredToBody(structured: CaptureStructured): string {
  const header = `CAPTURE PACK: ${structured.pack.toUpperCase().replaceAll("_", " ")}`;
  if (structured.pack === "issue_log") {
    const d = structured.data;
    const rollup = [
      line("Period", d.periodLabel),
      line("Cases logged", d.casesLogged),
      line("Cases open", d.casesOpen),
      line("Cases closed", d.casesClosed),
      line("Cases escalated", d.casesEscalated),
      line("Themes", d.topThemes),
      line("Open refs", d.openCaseRefs),
      line("Desk notes", d.deskNotes),
      line("Notes", d.notes),
    ].filter(Boolean);
    const pathways = formatIssueLogEntries(d.entries || []);
    return [header, "", ...rollup, "", ...pathways].filter(Boolean).join("\n");
  }
  const d = structured.data as Record<string, unknown>;
  const rows = Object.entries(d)
    .map(([key, value]) => {
      if (value === undefined || value === null || value === "") return null;
      if (typeof value === "object") return null;
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
    hint: "Pathway per issue: title → category → reporter → reported → follow-ups → escalate → feedback → resolve → close.",
    reports: "Issue handling · GRM · Issue pathway · Monthly",
  },
  budget: {
    label: "Empowerment budget",
    hint: "Empowerment envelope and spent (skills, training, procurement, ESD) — not CAPEX.",
    reports: "MEL · Board · Budget section",
  },
};
