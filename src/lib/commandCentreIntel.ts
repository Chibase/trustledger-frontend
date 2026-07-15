import { buildOpsOverview, type OpsActivityRow } from "@/lib/opsIntel";

export type PillarStatus = "live" | "partial" | "planned";

export type ControlPillarLink = {
  href: string;
  title: string;
  blurb: string;
  status: PillarStatus;
};

export const CONTROL_PILLARS: ControlPillarLink[] = [
  {
    href: "/ops/finance",
    title: "Finance",
    blurb: "Budget, burn, and resource utilisation.",
    status: "planned",
  },
  {
    href: "/ops/staff",
    title: "Staff",
    blurb: "Capacity, performance, and capability gaps.",
    status: "planned",
  },
  {
    href: "/ops/ai",
    title: "AI tools",
    blurb: "Monitor, upgrade, or discharge platform AI.",
    status: "partial",
  },
  {
    href: "/ops/issues",
    title: "Issues control",
    blurb: "Client-reported issues, TAT, and feeling after resolve.",
    status: "partial",
  },
];

export type FinanceLine = {
  label: string;
  budgetLabel: string;
  utilisedLabel: string;
  note: string;
};

export type FinanceOverview = {
  status: PillarStatus;
  asOf: string;
  summary: string;
  lines: FinanceLine[];
  nextWire: string[];
};

export type StaffSignal = {
  label: string;
  state: string;
  note: string;
};

export type StaffOverview = {
  status: PillarStatus;
  asOf: string;
  capacity: StaffSignal[];
  performance: StaffSignal[];
  capabilityGaps: StaffSignal[];
  /** Explicitly deferred — UI only until a later packet. */
  wellbeing: {
    deferred: true;
    headline: string;
    note: string;
  };
};

export type AiToolStatus =
  | "active_mock"
  | "active_live"
  | "watch"
  | "upgrade_candidate"
  | "discharge_candidate";

export type AiToolRow = {
  id: string;
  name: string;
  purpose: string;
  model: string;
  promptVersion: string;
  status: AiToolStatus;
  challenge: string;
  recommendation: string;
};

export type AiToolsOverview = {
  status: PillarStatus;
  asOf: string;
  summary: string;
  tools: AiToolRow[];
  telemetryNote: string;
};

export type IssueControlRow = {
  name: string;
  person: string;
  organization: string | null;
  category: string;
  status: string;
  modified: string | null;
  ageHours: number | null;
};

export type IssuesOverview = {
  status: PillarStatus;
  asOf: string;
  openCount: number;
  totalSupport: number;
  avgAgeHours: number | null;
  byCategory: { label: string; value: number }[];
  recent: IssueControlRow[];
  tatNote: string;
  feelingNote: string;
};

function parseSupportCategory(jobTitle: string | undefined): string {
  if (!jobTitle) return "Uncategorised";
  const m = jobTitle.match(/Support\s*·\s*(.+)$/i);
  return m?.[1]?.trim() || jobTitle;
}

function ageHours(modified: string | undefined): number | null {
  if (!modified) return null;
  const ms = Date.now() - new Date(modified).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / (1000 * 60 * 60));
}

function isOpenStatus(status: string | undefined): boolean {
  const s = (status || "").toLowerCase();
  if (!s) return true;
  return !/(closed|lost|converted|do not contact|resolved)/i.test(s);
}

export function buildFinanceOverview(): FinanceOverview {
  return {
    status: "planned",
    asOf: new Date().toISOString(),
    summary:
      "Budget and resource utilisation will read from Paystack, invoices, and operating books. No fabricated figures are shown.",
    lines: [
      {
        label: "Platform infrastructure",
        budgetLabel: "—",
        utilisedLabel: "—",
        note: "Hosting, Cloud site, domains",
      },
      {
        label: "AI tooling",
        budgetLabel: "—",
        utilisedLabel: "—",
        note: "Model usage once live telemetry lands",
      },
      {
        label: "Go-to-market",
        budgetLabel: "—",
        utilisedLabel: "—",
        note: "Campaigns, content, partner costs",
      },
      {
        label: "People / contractors",
        budgetLabel: "—",
        utilisedLabel: "—",
        note: "Staff and delivery capacity cost",
      },
    ],
    nextWire: [
      "Paystack settlement + Sales Invoice paid totals",
      "Monthly budget caps per cost centre",
      "Utilisation % and variance alerts",
    ],
  };
}

export function buildStaffOverview(): StaffOverview {
  return {
    status: "planned",
    asOf: new Date().toISOString(),
    capacity: [
      {
        label: "Platform Owner",
        state: "Active",
        note: "Sole live operator under ADR-013 lockdown",
      },
      {
        label: "Junior ops seats",
        state: "Not opened",
        note: "Add PLATFORM_OPERATOR_EMAILS when you hire",
      },
      {
        label: "Delivery contractors",
        state: "Untracked",
        note: "Capacity board lands with HR packet",
      },
    ],
    performance: [
      {
        label: "Issue response ownership",
        state: "Pending metrics",
        note: "Will link to Issues control TAT",
      },
      {
        label: "Lead follow-up SLA",
        state: "Pending metrics",
        note: "From CRM Lead status transitions",
      },
    ],
    capabilityGaps: [
      {
        label: "Support coverage depth",
        state: "Watch",
        note: "Single-operator risk until staff seats open",
      },
      {
        label: "Finance ops discipline",
        state: "Watch",
        note: "Needs books + Paystack desk hygiene",
      },
    ],
    wellbeing: {
      deferred: true,
      headline: "Staff wellbeing — flagged for later",
      note: "Burnout, workload balance, and wellbeing check-ins are intentionally not instrumented yet. This panel stays a placeholder until you approve a sensitive HR data path.",
    },
  };
}

export function buildAiToolsOverview(): AiToolsOverview {
  const mock =
    process.env.NEXT_PUBLIC_AI_MOCK !== "false" &&
    process.env.NEXT_PUBLIC_AI_MOCK !== "0";

  const runtime: AiToolStatus = mock ? "active_mock" : "active_live";

  return {
    status: "partial",
    asOf: new Date().toISOString(),
    summary: mock
      ? "Platform AI is in demo/mock mode. Registry is live for governance; invocation metrics come next."
      : "Platform AI is pointed at TrustLedger Cloud. Telemetry for upgrade/discharge decisions is still scaffolded.",
    tools: [
      {
        id: "triage",
        name: "Incident triage",
        purpose: "Category, priority, and impact hints on issue intake",
        model: "grok-4.5",
        promptVersion: "srm-ai-v0",
        status: runtime,
        challenge: "Needs live accuracy scoring vs human apply rate",
        recommendation: mock
          ? "Keep in mock until Cloud AI path is verified"
          : "Monitor apply-rate; upgrade prompt if confidence drifts",
      },
      {
        id: "draft",
        name: "Response drafting",
        purpose: "Suggested community/client response copy",
        model: "grok-4.5",
        promptVersion: "srm-ai-v0",
        status: runtime,
        challenge: "Tone/governance risk if applied without review",
        recommendation: "Keep suggest → apply → save; never auto-send",
      },
      {
        id: "sentiment",
        name: "Sentiment assist",
        purpose: "Intensity estimate for incident narrative",
        model: "grok-4.5",
        promptVersion: "srm-ai-v0",
        status: "watch",
        challenge: "Keyword mock vs real multilingual nuance",
        recommendation: "Discharge mock path once Cloud model is stable",
      },
      {
        id: "report-brief",
        name: "Report brief",
        purpose: "Executive report narrative assist",
        model: "grok-4.5",
        promptVersion: "srm-ai-v0",
        status: "upgrade_candidate",
        challenge: "Board tone needs stronger institutional voice",
        recommendation: "Candidate for prompt upgrade before investor packs",
      },
    ],
    telemetryNote:
      "Next packet: per-tool invocation count, failure rate, median confidence, human reject rate, and explicit Upgrade / Discharge actions.",
  };
}

function toIssueRow(row: OpsActivityRow): IssueControlRow {
  return {
    name: row.name,
    person: row.lead_name || row.name,
    organization: row.organization || null,
    category: parseSupportCategory(row.job_title),
    status: row.status || "New",
    modified: row.modified || null,
    ageHours: ageHours(row.modified),
  };
}

export async function buildIssuesOverview(): Promise<IssuesOverview> {
  const overview = await buildOpsOverview();
  const support = overview.intake.recent.filter((r) => r.activity === "support");
  const open = support.filter((r) => isOpenStatus(r.status));
  const ages = open
    .map((r) => ageHours(r.modified))
    .filter((n): n is number => n != null);
  const avgAgeHours =
    ages.length > 0
      ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
      : null;

  const byCat = new Map<string, number>();
  for (const row of support) {
    const cat = parseSupportCategory(row.job_title);
    byCat.set(cat, (byCat.get(cat) || 0) + 1);
  }

  return {
    status: support.length ? "partial" : "planned",
    asOf: overview.generatedAt,
    openCount: open.length,
    totalSupport: support.length,
    avgAgeHours,
    byCategory: [...byCat.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    recent: support.slice(0, 20).map(toIssueRow),
    tatNote:
      "Turnaround time needs opened/resolved timestamps from the support workflow. Age since last CRM modify is shown as a temporary proxy only.",
    feelingNote:
      "Client feeling after resolution is not captured yet. Next: short post-resolve pulse (1–5 + exact words) linked to each ticket.",
  };
}

export function aiStatusLabel(status: AiToolStatus): string {
  switch (status) {
    case "active_mock":
      return "Active (mock)";
    case "active_live":
      return "Active (live)";
    case "watch":
      return "Watch";
    case "upgrade_candidate":
      return "Upgrade candidate";
    case "discharge_candidate":
      return "Discharge candidate";
    default:
      return status;
  }
}

export function pillarStatusLabel(status: PillarStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "partial":
      return "Partial";
    default:
      return "Scaffold";
  }
}
