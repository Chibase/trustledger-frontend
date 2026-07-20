import { frappeBase, frappeKeyPair } from "@/lib/leadCapture";

export type OpsActivityKind =
  | "demo"
  | "assessment"
  | "feedback"
  | "contact"
  | "support"
  | "other";

export type OpsLeadRow = {
  name: string;
  lead_name?: string;
  email?: string;
  organization?: string;
  job_title?: string;
  source?: string;
  status?: string;
  modified?: string;
};

export type OpsActivityRow = OpsLeadRow & {
  activity: OpsActivityKind;
  intent: string;
  rating: number | null;
  readiness: string | null;
};

export type OpsOverview = {
  ok: boolean;
  generatedAt: string;
  configured: boolean;
  detail?: string;
  health: {
    ok: boolean;
    checks: { label: string; ok: boolean; ms?: number; status?: number }[];
  } | null;
  intake: {
    totalRecent: number;
    bySource: Record<string, number>;
    byActivity: Record<OpsActivityKind, number>;
    feedbackRated: number;
    feedbackAvgRating: number | null;
    weakFeedback: number;
    assessmentLeads: number;
    contactLeads: number;
    demoLeads: number;
    supportTickets: number;
    recent: OpsActivityRow[];
  };
};

function authHeaders(key: string, secret: string): HeadersInit {
  return {
    Authorization: `token ${key}:${secret}`,
    Accept: "application/json",
  };
}

function parseRating(jobTitle: string | undefined): number | null {
  if (!jobTitle) return null;
  const m = jobTitle.match(/Feedback\s*·\s*([1-5])\s*\/\s*5/i);
  if (!m) return null;
  return Number(m[1]);
}

function parseReadiness(jobTitle: string | undefined): string | null {
  if (!jobTitle) return null;
  const m = jobTitle.match(/Assessment\s*·\s*([^·]+)/i);
  return m?.[1]?.trim() || null;
}

export function classifyActivity(row: OpsLeadRow): OpsActivityKind {
  const title = (row.job_title || "").toLowerCase();
  const source = (row.source || "").toLowerCase();
  if (title.includes("feedback") || source.includes("feedback")) return "feedback";
  if (title.includes("support") || source.includes("support")) return "support";
  if (title.includes("assessment") || source.includes("assessment")) {
    return "assessment";
  }
  if (title.includes("contact") || source.includes("contact")) return "contact";
  if (title.includes("demo") || source.includes("demo")) return "demo";
  return "other";
}

export function activityLabel(kind: OpsActivityKind): string {
  switch (kind) {
    case "demo":
      return "Demo interest";
    case "assessment":
      return "Assessment / readiness";
    case "feedback":
      return "Experience feedback";
    case "contact":
      return "Contact enquiry";
    case "support":
      return "Support ticket";
    default:
      return "Other activity";
  }
}

function toActivityRow(row: OpsLeadRow): OpsActivityRow {
  const activity = classifyActivity(row);
  const rating = parseRating(row.job_title);
  const readiness = parseReadiness(row.job_title);
  const intent =
    row.job_title?.trim() ||
    row.source ||
    "Website activity";
  return { ...row, activity, intent, rating, readiness };
}

function emptyIntake(): OpsOverview["intake"] {
  return {
    totalRecent: 0,
    bySource: {},
    byActivity: {
      demo: 0,
      assessment: 0,
      feedback: 0,
      contact: 0,
      support: 0,
      other: 0,
    },
    feedbackRated: 0,
    feedbackAvgRating: null,
    weakFeedback: 0,
    assessmentLeads: 0,
    contactLeads: 0,
    demoLeads: 0,
    supportTickets: 0,
    recent: [],
  };
}

async function fetchRecentLeads(
  key: string,
  secret: string,
): Promise<OpsLeadRow[]> {
  const fields = encodeURIComponent(
    JSON.stringify([
      "name",
      "lead_name",
      "email",
      "organization",
      "job_title",
      "source",
      "status",
      "modified",
    ]),
  );
  const res = await fetch(
    `${frappeBase()}/api/resource/CRM%20Lead?fields=${fields}&limit_page_length=100&order_by=modified%20desc`,
    {
      headers: authHeaders(key, secret),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`CRM Lead list failed (${res.status})`);
  }
  const json = (await res.json()) as { data?: OpsLeadRow[] };
  return Array.isArray(json.data) ? json.data : [];
}

async function fetchHealth(): Promise<OpsOverview["health"]> {
  try {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://trustledger-frontend-pi.vercel.app";
    const res = await fetch(`${base.replace(/\/$/, "")}/api/health`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      ok: boolean;
      checks: { label: string; ok: boolean; ms?: number; status?: number }[];
    };
    return { ok: json.ok, checks: json.checks || [] };
  } catch {
    return null;
  }
}

export async function buildOpsOverview(): Promise<OpsOverview> {
  const generatedAt = new Date().toISOString();
  const pair = frappeKeyPair();
  const health = await fetchHealth();

  if (!pair) {
    return {
      ok: false,
      generatedAt,
      configured: false,
      detail: "FRAPPE_API_KEY / SECRET missing — activity intel unavailable",
      health,
      intake: emptyIntake(),
    };
  }

  try {
    const rows = await fetchRecentLeads(pair.key, pair.secret);
    const recent = rows.map(toActivityRow);
    const bySource: Record<string, number> = {};
    const byActivity: Record<OpsActivityKind, number> = {
      demo: 0,
      assessment: 0,
      feedback: 0,
      contact: 0,
      support: 0,
      other: 0,
    };
    let ratingSum = 0;
    let ratingCount = 0;
    let weakFeedback = 0;

    for (const row of recent) {
      const source = row.source || "Unsourced";
      bySource[source] = (bySource[source] || 0) + 1;
      byActivity[row.activity] += 1;
      if (row.rating !== null) {
        ratingCount += 1;
        ratingSum += row.rating;
        if (row.rating <= 2) weakFeedback += 1;
      }
    }

    return {
      ok: true,
      generatedAt,
      configured: true,
      health,
      intake: {
        totalRecent: recent.length,
        bySource,
        byActivity,
        feedbackRated: ratingCount,
        feedbackAvgRating:
          ratingCount > 0
            ? Math.round((ratingSum / ratingCount) * 10) / 10
            : null,
        weakFeedback,
        assessmentLeads: byActivity.assessment,
        contactLeads: byActivity.contact,
        demoLeads: byActivity.demo,
        supportTickets: byActivity.support,
        recent,
      },
    };
  } catch (err) {
    return {
      ok: false,
      generatedAt,
      configured: true,
      detail: err instanceof Error ? err.message : "Ops intel failed",
      health,
      intake: emptyIntake(),
    };
  }
}
