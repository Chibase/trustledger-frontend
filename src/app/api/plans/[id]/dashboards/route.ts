import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isPlanId } from "@/config/plans";
import { resolvePlanDashboardPackaging } from "@/lib/planPackaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/plans/:id/dashboards — session packaging (id is the commercial
 * plan instance / workspace; module list is still the signed-in user's tier).
 */
export async function GET(_request: Request, { params }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { id } = await params;
  const planHint = isPlanId(id) ? id : user.trialPlan || null;
  const packaging = resolvePlanDashboardPackaging({
    planId: planHint,
    vip: Boolean(user.isVip),
    mode: user.mode,
    measureEmpty: false,
  });
  return NextResponse.json({
    planId: packaging.planId,
    requestId: id,
    vip: packaging.vip,
    demoSeedAllowed: packaging.demoSeedAllowed,
    executiveDashboard: packaging.executiveDashboard,
    moduleDashboards: packaging.moduleDashboards,
    emptyStateFlags: packaging.emptyStateFlags,
    suggestedNextKey: packaging.suggestedNextKey,
    sequence: [
      packaging.executiveDashboard.key,
      ...packaging.moduleDashboards.map((row) => row.key),
    ],
  });
}
