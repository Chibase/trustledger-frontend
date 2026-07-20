import { NextResponse } from "next/server";
import { verifyFrappeApiAuth } from "@/lib/leadCapture";

/**
 * Safe auth probe for Frappe API keys on this deployment.
 * Does not return secret values — only lengths + logged-in user / error.
 */
export async function GET() {
  const result = await verifyFrappeApiAuth();
  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
