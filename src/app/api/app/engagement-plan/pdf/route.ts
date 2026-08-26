import { NextResponse } from "next/server";
import { DEMO_CAPABILITIES, PLAN_CAPABILITIES } from "@/config/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { buildSepPdf, isSepPlanPayload } from "@/lib/sepPdf";

export const runtime = "nodejs";

/**
 * Branded SEP PDF. Plan JSON lives in the browser store; the route only
 * renders what the signed-in desk posts. No Cloud LLM.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to export an engagement plan." },
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
  if (!rateLimitAllow(`sep-pdf:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many PDF exports. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const plan =
    body && typeof body === "object" && "plan" in body
      ? (body as { plan: unknown }).plan
      : body;
  if (!isSepPlanPayload(plan)) {
    return NextResponse.json(
      { error: "Missing or invalid engagement plan." },
      { status: 400 },
    );
  }

  try {
    const pdf = await buildSepPdf(plan);
    const safe = plan.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || plan.id;
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${safe}.pdf"`,
    });
    return new NextResponse(new Uint8Array(pdf), { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: "Could not build the PDF." },
      { status: 500 },
    );
  }
}
