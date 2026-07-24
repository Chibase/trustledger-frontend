import { NextResponse } from "next/server";
import { getFrappeBaseUrl } from "@/lib/frappeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
};

/**
 * Guest-safe: ask Frappe to email a password reset link.
 * Always returns a generic success message (no user enumeration).
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const base = getFrappeBaseUrl();
  try {
    const res = await fetch(
      `${base}/api/method/frappe.core.doctype.user.user.reset_password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ user: email }),
        cache: "no-store",
      },
    );
    // Ignore Frappe body details — always generic to the client.
    await res.text().catch(() => undefined);
  } catch {
    // Still generic — email delivery / Cloud outages must not leak.
  }

  return NextResponse.json({
    ok: true,
    message:
      "If this email is registered on TrustLedger Cloud, we sent password reset instructions. Check inbox and spam.",
  });
}
