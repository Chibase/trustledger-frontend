import {
  activityLabel,
  buildOpsOverview,
  type OpsActivityKind,
  type OpsActivityRow,
  type OpsOverview,
} from "@/lib/opsIntel";

export type WeeklyPoint = {
  key: string;
  label: string;
  total: number;
  byActivity: Record<OpsActivityKind, number>;
};

export type FunnelStep = {
  key: OpsActivityKind | "pipeline";
  label: string;
  value: number;
};

export type RatingBucket = { rating: number; count: number };

export type ExecutiveBrief = {
  ok: boolean;
  generatedAt: string;
  detail?: string;
  healthOk: boolean | null;
  kpis: {
    pipelineSignals: number;
    demoInterest: number;
    assessments: number;
    experienceScore: number | null;
    weakFeedback: number;
    contactEnquiries: number;
  };
  weekly: WeeklyPoint[];
  mix: { kind: OpsActivityKind; label: string; value: number }[];
  funnel: FunnelStep[];
  ratings: RatingBucket[];
  readiness: { band: string; count: number }[];
  talkingPoints: string[];
  sampleNote: string | null;
};

function emptyWeekActivity(): Record<OpsActivityKind, number> {
  return {
    demo: 0,
    assessment: 0,
    feedback: 0,
    contact: 0,
    support: 0,
    other: 0,
  };
}

function weekKey(d: Date): string {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy.toISOString().slice(0, 10);
}

function weekLabel(key: string): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildWeekly(rows: OpsActivityRow[], weeks = 8): WeeklyPoint[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    keys.push(weekKey(d));
  }
  const map = new Map<string, WeeklyPoint>();
  for (const key of keys) {
    map.set(key, {
      key,
      label: weekLabel(key),
      total: 0,
      byActivity: emptyWeekActivity(),
    });
  }
  for (const row of rows) {
    if (!row.modified) continue;
    const key = weekKey(new Date(row.modified));
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    bucket.byActivity[row.activity] += 1;
  }
  return keys.map((k) => map.get(k)!);
}

function buildTalkingPoints(
  intake: OpsOverview["intake"],
  weekly: WeeklyPoint[],
  healthOk: boolean | null,
): string[] {
  const points: string[] = [];
  const last = weekly[weekly.length - 1]?.total ?? 0;
  const prev = weekly[weekly.length - 2]?.total ?? 0;
  if (intake.totalRecent > 0) {
    points.push(
      `${intake.totalRecent} platform engagement signals in the latest CRM window (demos, assessments, feedback, contact, and support).`,
    );
  } else {
    points.push(
      "Engagement pipeline is still early — board brief will densify as demos and assessments land.",
    );
  }
  if (prev > 0) {
    const delta = Math.round(((last - prev) / prev) * 100);
    points.push(
      delta >= 0
        ? `Week-on-week activity is up ${delta}% versus the prior week.`
        : `Week-on-week activity is down ${Math.abs(delta)}% versus the prior week — watch conversion follow-up.`,
    );
  } else if (last > 0) {
    points.push(`Current week shows ${last} new signals as the baseline week builds.`);
  }
  if (intake.demoLeads > 0 || intake.assessmentLeads > 0) {
    points.push(
      `Demand mix: ${intake.demoLeads} demo-interest and ${intake.assessmentLeads} assessment/readiness signals.`,
    );
  }
  if (intake.feedbackAvgRating != null) {
    points.push(
      `Experience score averages ${intake.feedbackAvgRating}/5 across ${intake.feedbackRated} rated responses` +
        (intake.weakFeedback > 0
          ? ` — ${intake.weakFeedback} weak (≤2) need owner attention.`
          : "."),
    );
  }
  if (intake.contactLeads > 0) {
    points.push(
      `${intake.contactLeads} direct contact enquiries — useful pipeline for investor traction narrative.`,
    );
  }
  if (healthOk === true) {
    points.push("Platform health checks are green for the public product surface.");
  } else if (healthOk === false) {
    points.push("Platform health has a failing check — resolve before board walkthrough.");
  }
  return points.slice(0, 6);
}

export async function buildExecutiveBrief(): Promise<ExecutiveBrief> {
  const overview = await buildOpsOverview();
  const rows = overview.intake.recent;
  // Recent is capped; use full recent window from intake counts + rows we have.
  const weekly = buildWeekly(rows, 8);
  const mix = (
    Object.entries(overview.intake.byActivity) as [OpsActivityKind, number][]
  )
    .filter(([, v]) => v > 0)
    .map(([kind, value]) => ({ kind, label: activityLabel(kind), value }))
    .sort((a, b) => b.value - a.value);

  const funnel: FunnelStep[] = [
    {
      key: "demo",
      label: "Demo interest",
      value: overview.intake.demoLeads,
    },
    {
      key: "assessment",
      label: "Assessments",
      value: overview.intake.assessmentLeads,
    },
    {
      key: "feedback",
      label: "Feedback",
      value: overview.intake.feedbackRated || overview.intake.byActivity.feedback,
    },
    {
      key: "contact",
      label: "Contact",
      value: overview.intake.contactLeads,
    },
  ];

  const ratingCounts = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: rows.filter((r) => r.rating === rating).length,
  }));

  const readinessMap = new Map<string, number>();
  for (const row of rows) {
    if (!row.readiness) continue;
    const band = row.readiness;
    readinessMap.set(band, (readinessMap.get(band) || 0) + 1);
  }
  const readiness = [...readinessMap.entries()]
    .map(([band, count]) => ({ band, count }))
    .sort((a, b) => b.count - a.count);

  const healthOk = overview.health ? overview.health.ok : null;
  const talkingPoints = buildTalkingPoints(overview.intake, weekly, healthOk);

  return {
    ok: overview.ok,
    generatedAt: overview.generatedAt,
    detail: overview.detail,
    healthOk,
    kpis: {
      pipelineSignals: overview.intake.totalRecent,
      demoInterest: overview.intake.demoLeads,
      assessments: overview.intake.assessmentLeads,
      experienceScore: overview.intake.feedbackAvgRating,
      weakFeedback: overview.intake.weakFeedback,
      contactEnquiries: overview.intake.contactLeads,
    },
    weekly,
    mix,
    funnel,
    ratings: ratingCounts,
    readiness,
    talkingPoints,
    sampleNote:
      overview.intake.totalRecent < 5
        ? "Early signal set — charts reflect the latest CRM Lead window and will strengthen with volume."
        : null,
  };
}
