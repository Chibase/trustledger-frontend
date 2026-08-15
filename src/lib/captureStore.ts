/**
 * Capture hub — field notes + structured project report packs.
 * Each labelled pack is the project SoT for its domain (B-BBEE, employment, …):
 * period metrics + sequenced evidence pathways (same report→close spine as Issue log).
 * Pathways feed reports and trust-by-relevancy measurement.
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
 * Single evidence pathway: title → category → reporter → reported →
 * follow-ups → escalate → feedback → resolve → close.
 * Used by Issue log and every labelled report pack (B-BBEE, employment, …).
 */
export type PackEvidenceEntry = {
  id: string;
  title: string;
  category?: string;
  reporterName?: string;
  /** Date/time reported / captured */
  reportedAt?: string;
  /** Detailed description for evidence / reports */
  evidenceDetail?: string;
  /** Document / register / photo refs */
  documentRefs?: string;
  followUps?: IssueLogFollowUp[];
  escalatedTo?: string;
  escalatedAt?: string;
  feedbackAt?: string;
  /** Feedback / stakeholder response narrative */
  feedbackNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  linkedIncidentId?: string;
  notes?: string;
};

/** @deprecated alias — prefer PackEvidenceEntry */
export type IssueLogEntry = PackEvidenceEntry;

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

/** B-BBEE / empowerment pack issue themes. */
export const BBBEE_PACK_CATEGORIES = [
  { id: "ownership", label: "Ownership / shareholding" },
  { id: "management_control", label: "Management control" },
  { id: "skills_development", label: "Skills development" },
  { id: "preferential_procurement", label: "Preferential procurement" },
  { id: "esd", label: "Enterprise & supplier development" },
  { id: "verification", label: "Verification / certificate" },
  { id: "local_supplier", label: "Local supplier access" },
  { id: "other", label: "Other empowerment" },
] as const;

export const EMPLOYMENT_PACK_CATEGORIES = [
  { id: "local_hire", label: "Local hire / placement" },
  { id: "training", label: "Training / skills" },
  { id: "women_youth_pwd", label: "Women / youth / PWD" },
  { id: "labour_dispute", label: "Labour dispute" },
  { id: "contractor_labour", label: "Contractor labour" },
  { id: "ward_origin", label: "Ward / origin of labour" },
  { id: "other", label: "Other employment" },
] as const;

export const CSI_PACK_CATEGORIES = [
  { id: "programme_delivery", label: "Programme delivery" },
  { id: "beneficiary_access", label: "Beneficiary access" },
  { id: "spend_handover", label: "Spend / handover" },
  { id: "outcomes", label: "Outcomes / impact" },
  { id: "engagement_link", label: "Linked engagement" },
  { id: "other", label: "Other CSI" },
] as const;

export const ESG_PACK_CATEGORIES = [
  { id: "dust", label: "Dust" },
  { id: "water", label: "Water / effluent" },
  { id: "noise", label: "Noise" },
  { id: "waste", label: "Waste" },
  { id: "rehab", label: "Rehabilitation / closure" },
  { id: "health_safety", label: "Health & safety" },
  { id: "governance", label: "Governance / permit" },
  { id: "community_trust", label: "Community trust / social" },
  { id: "other", label: "Other ESG" },
] as const;

export const GRM_PACK_CATEGORIES = [
  { id: "intake", label: "Intake / access to GRM" },
  { id: "turnaround", label: "Turnaround / SLA" },
  { id: "escalation", label: "Escalation handling" },
  { id: "feedback", label: "Community feedback" },
  { id: "process", label: "Process improvement" },
  { id: "theme", label: "Recurring theme" },
  { id: "other", label: "Other GRM" },
] as const;

export const BUDGET_PACK_CATEGORIES = [
  { id: "envelope", label: "Empowerment envelope" },
  { id: "spend_variance", label: "Spend / variance" },
  { id: "claims", label: "Claims pending" },
  { id: "allocation", label: "Allocation / line item" },
  { id: "contingency", label: "Contingency" },
  { id: "other", label: "Other budget" },
] as const;

export type PackCategoryOption = { id: string; label: string };

/** Category options for a pack’s evidence pathways. */
export function categoriesForPack(
  pack: PackCaptureSource,
): readonly PackCategoryOption[] {
  switch (pack) {
    case "bbbee":
      return BBBEE_PACK_CATEGORIES;
    case "employment":
      return EMPLOYMENT_PACK_CATEGORIES;
    case "csi":
      return CSI_PACK_CATEGORIES;
    case "esg_period":
      return ESG_PACK_CATEGORIES;
    case "grm_period":
      return GRM_PACK_CATEGORIES;
    case "budget":
      return BUDGET_PACK_CATEGORIES;
    case "issue_log":
      return ISSUE_LOG_CATEGORIES;
    case "project_profile":
      return ISSUE_LOG_CATEGORIES;
  }
}

/**
 * How strongly this pack’s pathway health influences project trust pulse.
 * Higher = more relevant to Trust building (ADR-050).
 */
export const PACK_TRUST_RELEVANCY: Record<PackCaptureSource, number> = {
  project_profile: 0,
  issue_log: 1,
  grm_period: 0.95,
  employment: 0.85,
  esg_period: 0.85,
  bbbee: 0.75,
  csi: 0.7,
  budget: 0.45,
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
  /** Verification / certificate date (YYYY-MM-DD). */
  verificationDate?: string;
  /** Named suppliers / ESD beneficiaries for evidence. */
  supplierEvidenceNotes?: string;
  ownershipEvidenceNotes?: string;
  notes?: string;
  /** Domain pathways for B-BBEE-specific matters (same sequence as Issue log). */
  entries?: PackEvidenceEntry[];
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
  /** Hire gap / placement evidence narrative. */
  localHireEvidenceNotes?: string;
  notes?: string;
  entries?: PackEvidenceEntry[];
};

export type CsiFacts = {
  periodLabel?: string;
  programmeName?: string;
  beneficiaryGroup?: string;
  amountZar?: number;
  beneficiariesReached?: number;
  linkedEngagement?: string;
  outcomes?: string;
  /** Delivery proof / attendance / handover notes. */
  deliveryEvidenceNotes?: string;
  notes?: string;
  entries?: PackEvidenceEntry[];
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
  /** Monitoring / permit / sampling refs for evidence. */
  monitoringEvidenceNotes?: string;
  notes?: string;
  entries?: PackEvidenceEntry[];
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
  entries?: PackEvidenceEntry[];
};

/** Desk issue log for the period — sits beside GRM on Capture hub. */
export type IssueLogFacts = {
  periodLabel?: string;
  /** Structured pathways (preferred SoT for evidence / reports). */
  entries?: PackEvidenceEntry[];
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
  entries?: PackEvidenceEntry[];
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

export function emptyIssueLogEntry(): PackEvidenceEntry {
  return {
    id: createIssueLogEntryId(),
    title: "",
    category: "",
    reporterName: "",
    reportedAt: "",
    evidenceDetail: "",
    documentRefs: "",
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
    feedbackNotes: "",
    resolvedAt: "",
    closedAt: "",
    notes: "",
  };
}

export function emptyPackEvidenceEntry(): PackEvidenceEntry {
  return emptyIssueLogEntry();
}

/** Resolve category label across pack-specific and issue-log lists. */
export function issueLogCategoryLabel(
  category?: string,
  options?: readonly PackCategoryOption[],
): string {
  if (!category) return "";
  const lists = options
    ? [options]
    : [
        ISSUE_LOG_CATEGORIES,
        BBBEE_PACK_CATEGORIES,
        EMPLOYMENT_PACK_CATEGORIES,
        CSI_PACK_CATEGORIES,
        ESG_PACK_CATEGORIES,
        GRM_PACK_CATEGORIES,
        BUDGET_PACK_CATEGORIES,
      ];
  for (const list of lists) {
    const hit = list.find((c) => c.id === category);
    if (hit) return hit.label;
  }
  return category;
}

/** Derive period rollup counts from pathway entries. */
export function deriveIssueLogRollup(entries: PackEvidenceEntry[]): {
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
export function formatIssueLogEntries(
  entries: PackEvidenceEntry[],
  options?: { headingPrefix?: string; categories?: readonly PackCategoryOption[] },
): string[] {
  const prefix = options?.headingPrefix || "Issue";
  const blocks: string[] = [];
  entries.forEach((entry, idx) => {
    if (!entry.title.trim()) return;
    const cat = issueLogCategoryLabel(entry.category, options?.categories);
    const lines: string[] = [
      `### ${prefix} ${idx + 1}: ${entry.title}`,
      cat ? `- **Category:** ${cat}` : null,
      entry.reporterName
        ? `- **Person reporting:** ${entry.reporterName}`
        : null,
      entry.reportedAt
        ? `- **Reported / captured:** ${entry.reportedAt}`
        : null,
      entry.evidenceDetail?.trim()
        ? `- **Evidence detail:** ${entry.evidenceDetail.trim()}`
        : null,
      entry.documentRefs?.trim()
        ? `- **Document / media refs:** ${entry.documentRefs.trim()}`
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
    if (entry.feedbackAt || entry.feedbackNotes?.trim()) {
      lines.push(
        `- **Feedback:** ${entry.feedbackNotes?.trim() || "—"}${entry.feedbackAt ? ` @ ${entry.feedbackAt}` : ""}`,
      );
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
): PackEvidenceEntry[] {
  for (const pack of packs) {
    const titled = (pack.entries || []).filter((e) => e.title?.trim());
    if (titled.length) return titled;
  }
  return [];
}

/** Titled pathways from the latest facts object that carries entries. */
export function titledPackEntries(
  entries?: PackEvidenceEntry[] | null,
): PackEvidenceEntry[] {
  return (entries || []).filter((e) => e.title?.trim());
}

/**
 * Pathway health score 0–100 for one pack’s evidence entries.
 * Closed/resolved raises trust; open + escalated lowers it.
 */
export function pathwayHealthScore(entries: PackEvidenceEntry[]): {
  score: number;
  open: number;
  closed: number;
  escalatedOpen: number;
  sampleSize: number;
} {
  const logged = titledPackEntries(entries);
  if (!logged.length) {
    return { score: 50, open: 0, closed: 0, escalatedOpen: 0, sampleSize: 0 };
  }
  const closed = logged.filter((e) => Boolean(e.closedAt)).length;
  const open = logged.length - closed;
  const escalatedOpen = logged.filter(
    (e) => !e.closedAt && Boolean(e.escalatedTo || e.escalatedAt),
  ).length;
  const resolvedOpen = logged.filter(
    (e) => !e.closedAt && Boolean(e.resolvedAt),
  ).length;
  // Start neutral; closed +8 each (cap), open −6, escalated open −10, resolved-not-closed +3
  let score = 55;
  score += Math.min(40, closed * 8);
  score -= open * 6;
  score -= escalatedOpen * 10;
  score += resolvedOpen * 3;
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    open,
    closed,
    escalatedOpen,
    sampleSize: logged.length,
  };
}

export type PackPathwayBundle = {
  pack: PackCaptureSource;
  label: string;
  entries: PackEvidenceEntry[];
  relevancy: number;
  health: ReturnType<typeof pathwayHealthScore>;
};

/** Collect titled pathways from latest structured packs for a project. */
export function collectProjectPackPathways(
  projectId: string,
): PackPathwayBundle[] {
  const packs: PackCaptureSource[] = [
    "issue_log",
    "grm_period",
    "employment",
    "esg_period",
    "bbbee",
    "csi",
    "budget",
  ];
  const out: PackPathwayBundle[] = [];
  for (const pack of packs) {
    const row = latestPackCapture(projectId, pack);
    if (!row?.structured || row.structured.pack !== pack) continue;
    const data = row.structured.data as { entries?: PackEvidenceEntry[] };
    const entries = titledPackEntries(data.entries);
    if (!entries.length) continue;
    out.push({
      pack,
      label: PACK_SOURCE_META[pack].label,
      entries,
      relevancy: PACK_TRUST_RELEVANCY[pack],
      health: pathwayHealthScore(entries),
    });
  }
  return out;
}

/**
 * Trust pulse from desk cases + pack evidence pathways, weighted by pack relevancy.
 * Pack pathways are the project SoT for domain-specific Trust building evidence.
 */
export function trustFromProjectPackEvidence(
  projectId: string,
  incidentTrust: {
    trustIndex: number;
    sampleSize: number;
    label: "Strong" | "Watch" | "At risk" | "Unknown";
    avgSentiment: number | null;
  },
): {
  trustIndex: number;
  label: "Strong" | "Watch" | "At risk" | "Unknown";
  avgSentiment: number | null;
  sampleSize: number;
  packPathwayCount: number;
  packContribution: number | null;
} {
  const bundles = collectProjectPackPathways(projectId);
  const packPathwayCount = bundles.reduce((n, b) => n + b.entries.length, 0);
  if (!bundles.length) {
    return {
      ...incidentTrust,
      packPathwayCount: 0,
      packContribution: null,
    };
  }
  let weightSum = 0;
  let weighted = 0;
  for (const b of bundles) {
    const w = b.relevancy * Math.max(1, b.health.sampleSize);
    weightSum += w;
    weighted += b.health.score * w;
  }
  const packContribution = Math.round(weighted / weightSum);
  const incidentWeight = incidentTrust.sampleSize > 0 ? 0.55 : 0.25;
  const packWeight = 1 - incidentWeight;
  const trustIndex = Math.round(
    incidentTrust.trustIndex * incidentWeight + packContribution * packWeight,
  );
  const label =
    trustIndex >= 70 ? "Strong" : trustIndex >= 45 ? "Watch" : ("At risk" as const);
  return {
    trustIndex: Math.max(0, Math.min(100, trustIndex)),
    label,
    avgSentiment: incidentTrust.avgSentiment,
    sampleSize: incidentTrust.sampleSize + packPathwayCount,
    packPathwayCount,
    packContribution,
  };
}

/** Flatten structured packs into searchable narrative for AI / appendix. */
export function structuredToBody(structured: CaptureStructured): string {
  const header = `CAPTURE PACK: ${structured.pack.toUpperCase().replaceAll("_", " ")}`;
  const meta = PACK_SOURCE_META[structured.pack];
  const mandate = meta
    ? `PACK MANDATE: ${meta.label} — ${meta.mandate}`
    : null;

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
    const pathways = formatIssueLogEntries(d.entries || [], {
      headingPrefix: "Issue pathway",
      categories: ISSUE_LOG_CATEGORIES,
    });
    return [header, mandate, "", ...rollup, "", ...pathways]
      .filter(Boolean)
      .join("\n");
  }

  const d = structured.data as Record<string, unknown>;
  const entries = (d.entries as PackEvidenceEntry[] | undefined) || [];
  const rows = Object.entries(d)
    .map(([key, value]) => {
      if (key === "entries") return null;
      if (value === undefined || value === null || value === "") return null;
      if (typeof value === "object") return null;
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
      return line(label, value as string | number);
    })
    .filter(Boolean);
  const pathways = formatIssueLogEntries(entries, {
    headingPrefix: `${meta?.label || structured.pack} matter`,
    categories: categoriesForPack(structured.pack),
  });
  return [header, mandate, "", ...rows, "", ...pathways]
    .filter(Boolean)
    .join("\n");
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
  {
    label: string;
    /** Short purpose line — what this pack popularises / owns. */
    mandate: string;
    hint: string;
    reports: string;
  }
> = {
  project_profile: {
    label: "Project profile",
    mandate: "Programme identity — site, funder, geo, empowerment envelope.",
    hint: "Site, contractor, empowerment budget, geo, and programme summary for every report.",
    reports: "Monthly · MEL · Board",
  },
  bbbee: {
    label: "B-BBEE / Empowerment",
    mandate:
      "Owns B-BBEE evidence: ownership, management control, skills, preferential procurement, ESD — plus sequenced matters for this domain.",
    hint: "Period metrics and evidence pathways for empowerment / B-BBEE reports. Same pathway sequence as Issue log.",
    reports: "B-BBEE · Board · MEL",
  },
  employment: {
    label: "Employment & training",
    mandate:
      "Owns local hire, workforce composition, training delivery/spend, and labour disputes as evidence.",
    hint: "Local hire, workforce, training, and employment-specific pathways (report → close).",
    reports: "B-BBEE · ESG · Board · Monthly",
  },
  csi: {
    label: "CSI programme",
    mandate:
      "Owns community investment programmes, beneficiaries, spend, and delivery evidence.",
    hint: "Programme, beneficiaries, spend, outcomes, and CSI matter pathways.",
    reports: "CSI · Board · Monthly",
  },
  esg_period: {
    label: "ESG period",
    mandate:
      "Owns environmental, social trust, H&S, and governance evidence for the period.",
    hint: "ESG metrics plus environment / H&S / trust pathways for evidence-backed briefs.",
    reports: "ESG · Environmental · H&S · Board",
  },
  grm_period: {
    label: "GRM period",
    mandate:
      "Owns grievance volumes, themes, turnaround, and GRM process evidence.",
    hint: "Case volumes and GRM-specific pathways alongside desk cases.",
    reports: "GRM · Issue handling · Monthly",
  },
  issue_log: {
    label: "Issue log",
    mandate:
      "Cross-cutting SoT for sequenced issues: title → category → reporter → reported → follow-ups → escalate → feedback → resolve → close.",
    hint: "Pathway per issue for GRM / issue-handling evidence. Same spine used inside domain packs.",
    reports: "Issue handling · GRM · Issue pathway · Monthly",
  },
  budget: {
    label: "Empowerment budget",
    mandate:
      "Owns the empowerment envelope (not CAPEX): authorised, spent, variance, claims.",
    hint: "Empowerment budget figures and budget-matter pathways.",
    reports: "MEL · Board · Budget section",
  },
};
