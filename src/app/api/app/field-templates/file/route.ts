import { NextResponse } from "next/server";
import { fieldTemplateById } from "@/data/fieldTemplates";
import { getCurrentUser } from "@/lib/auth";
import { hasCapabilityForPlan } from "@/lib/entitlements";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { buildResourcePackPdf } from "@/lib/resourceDocument";

export const runtime = "nodejs";

/**
 * Plan-bundled field templates for signed-in trial/live desks.
 * Public visitors still unlock the same PDFs via /resources.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.isGuest) {
    return NextResponse.json(
      {
        error:
          "Sign in to a trial or live workspace to download plan templates, or unlock them on /resources.",
      },
      { status: 401 },
    );
  }

  if (!hasCapabilityForPlan("captureHub", user.trialPlan)) {
    return NextResponse.json(
      {
        error:
          "Field templates in Capture hub are on Project and Institutional. Unlock the same PDFs on /resources, or upgrade.",
      },
      { status: 403 },
    );
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`field-template-file:${ip}`, 40, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Wait a few minutes." },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  const pack = fieldTemplateById(id);
  if (!pack) {
    return NextResponse.json({ error: "Unknown field template." }, { status: 404 });
  }

  const pdf = await buildResourcePackPdf(pack);
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Cache-Control": "no-store",
    "Content-Disposition": `attachment; filename="${pack.filename}"`,
  });
  return new NextResponse(new Uint8Array(pdf), { status: 200, headers });
}
