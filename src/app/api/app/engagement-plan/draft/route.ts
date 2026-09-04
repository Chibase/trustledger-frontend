import { NextResponse } from "next/server";
import { DEMO_CAPABILITIES, PLAN_CAPABILITIES } from "@/config/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { draftSepDocument, isSepDraftablePlan } from "@/lib/sepGemini";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Gemini drafts the presentable SEP from extracted facts + playbook.
 * Suggestion only. Key stays server-side. Template fallback if unset.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to draft an engagement plan." },
      { status: 401 },
    );
  }

  const caps = user.trialPlan
    ? PLAN_CAPABILITIES[user.trialPlan]
    : DEMO_CAPABILITIES;
  if (!caps.includes("engagements")) {
    return NextResponse.json(
      { error: "Engagement plans are on Project and Institutional." },
      { status: 403 },
    );
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`sep-draft:${user.id}:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many drafts. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const payload =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const plan = payload.plan ?? body;
  const briefing =
    typeof payload.briefing === "string" ? payload.briefing.slice(0, 12_000) : "";
  if (!isSepDraftablePlan(plan)) {
    return NextResponse.json(
      { error: "Missing or invalid engagement plan." },
      { status: 400 },
    );
  }

  try {
    const drafted = await draftSepDocument(plan, briefing);
    return NextResponse.json(
      {
        plan: drafted.plan,
        synthesizer: drafted.synthesizer,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not draft the document." },
      { status: 500 },
    );
  }
}
