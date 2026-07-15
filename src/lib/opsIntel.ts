import { frappeBase, frappeKeyPair } from "@/lib/leadCapture";

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
    feedbackRated: number;
    feedbackAvgRating: number | null;
    weakFeedback: number;
    assessmentLeads: number;
    contactLeads: number;
    recent: OpsLeadRow[];
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
      detail: "FRAPPE_API_KEY / SECRET missing — intake intel unavailable",
      health,
      intake: {
        totalRecent: 0,
        bySource: {},
        feedbackRated: 0,
        feedbackAvgRating: null,
        weakFeedback: 0,
        assessmentLeads: 0,
        contactLeads: 0,
        recent: [],
      },
    };
  }

  try {
    const recent = await fetchRecentLeads(pair.key, pair.secret);
    const bySource: Record<string, number> = {};
    let ratingSum = 0;
    let ratingCount = 0;
    let weakFeedback = 0;
    let assessmentLeads = 0;
    let contactLeads = 0;

    for (const row of recent) {
      const source = row.source || "Unsourced";
      bySource[source] = (bySource[source] || 0) + 1;
      const rating = parseRating(row.job_title);
      if (rating !== null) {
        ratingCount += 1;
        ratingSum += rating;
        if (rating <= 2) weakFeedback += 1;
      }
      if ((row.job_title || "").toLowerCase().includes("assessment")) {
        assessmentLeads += 1;
      }
      if (
        source === "Website Contact" ||
        (row.job_title || "").toLowerCase().includes("contact")
      ) {
        contactLeads += 1;
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
        feedbackRated: ratingCount,
        feedbackAvgRating:
          ratingCount > 0
            ? Math.round((ratingSum / ratingCount) * 10) / 10
            : null,
        weakFeedback,
        assessmentLeads,
        contactLeads,
        recent: recent.slice(0, 25),
      },
    };
  } catch (err) {
    return {
      ok: false,
      generatedAt,
      configured: true,
      detail: err instanceof Error ? err.message : "Ops intel failed",
      health,
      intake: {
        totalRecent: 0,
        bySource: {},
        feedbackRated: 0,
        feedbackAvgRating: null,
        weakFeedback: 0,
        assessmentLeads: 0,
        contactLeads: 0,
        recent: [],
      },
    };
  }
}
