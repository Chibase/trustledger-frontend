import { NextResponse } from "next/server";
import { bootstrapCrmViews, crmSetupTokenOk } from "@/lib/crmSetup";

/**
 * One-shot / idempotent CRM Desk bootstrap.
 * Requires header: x-tl-crm-setup: <CRM_SETUP_TOKEN>
 * Remove CRM_SETUP_TOKEN from Vercel after use.
 */
export async function POST(request: Request) {
  const token = request.headers.get("x-tl-crm-setup");
  if (!crmSetupTokenOk(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await bootstrapCrmViews();
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "CRM setup failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
