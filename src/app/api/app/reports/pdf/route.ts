import { NextResponse } from "next/server";
import { DEMO_CAPABILITIES, PLAN_CAPABILITIES } from "@/config/entitlements";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import {
  buildClientReportPdf,
  isClientReportPdfPayload,
} from "@/lib/reportPdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to export a report." },
      { status: 401 },
    );
  }

  const caps = user.trialPlan
    ? PLAN_CAPABILITIES[user.trialPlan]
    : DEMO_CAPABILITIES;
  if (!caps.includes("governanceReports")) {
    return NextResponse.json(
      { error: "Report export is not available on this plan." },
      { status: 403 },
    );
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`report-pdf:${ip}`, 20, 15 * 60 * 1000)) {
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

  if (!isClientReportPdfPayload(body)) {
    return NextResponse.json(
      { error: "Missing or invalid report payload." },
      { status: 400 },
    );
  }

  try {
    const pdf = await buildClientReportPdf(body);
    const safe =
      body.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || "trustledger-report";
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: new Headers({
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${safe}.pdf"`,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not build the PDF." },
      { status: 500 },
    );
  }
}
