import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolvePlanDashboardPackaging } from "@/lib/planPackaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/app/plans/dashboards
 * Current workspace packaging: executive + tier-ordered module dashboards.
 * Empty flags are client-measured (browser stores).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const packaging = resolvePlanDashboardPackaging({
    planId: user.trialPlan || null,
    vip: Boolean(user.isVip),
    mode: user.mode,
    measureEmpty: false,
  });
  return NextResponse.json({
    planId: packaging.planId,
    vip: packaging.vip,
    demoSeedAllowed: packaging.demoSeedAllowed,
    executiveDashboard: packaging.executiveDashboard,
    moduleDashboards: packaging.moduleDashboards,
    emptyStateFlags: packaging.emptyStateFlags,
  });
}
