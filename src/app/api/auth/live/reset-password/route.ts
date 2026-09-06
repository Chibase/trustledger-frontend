import { NextResponse } from "next/server";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { completeLivePasswordReset } from "@/lib/passwordReset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  token?: string;
  newPassword?: string;
};

/** Guest-safe: set a new Cloud password from a signed reset email link. */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`live-reset-password:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many reset attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await completeLivePasswordReset({
    token: body.token || "",
    newPassword: body.newPassword || "",
  });
  return NextResponse.json(result.body, { status: result.status });
}
