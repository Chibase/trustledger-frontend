import { NextResponse } from "next/server";
import {
  displayNameForVipEmail,
  isAllowedVipShowcaseEmail,
  isVipShowcaseEnabled,
  vipShowcaseExpectedPassword,
  vipShowcasePasswordsMatch,
  vipShowcaseRateLimitOk,
  VIP_SHOWCASE_ORG_NAME,
  VIP_SHOWCASE_PLAN_ID,
  VIP_SHOWCASE_WEEKS,
} from "@/lib/vipShowcaseAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function GET() {
  return NextResponse.json({
    enabled: isVipShowcaseEnabled(),
    planId: VIP_SHOWCASE_PLAN_ID,
    weeks: VIP_SHOWCASE_WEEKS,
  });
}

type Body = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!isVipShowcaseEnabled()) {
    return NextResponse.json(
      { error: "VIP showcase login is not enabled on this host." },
      { status: 404 },
    );
  }

  const ip = clientIp(request);
  if (!vipShowcaseRateLimitOk(ip)) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email.includes("@") || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const expected = vipShowcaseExpectedPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "VIP showcase password is not configured." },
      { status: 503 },
    );
  }

  const emailOk = isAllowedVipShowcaseEmail(email);
  const passOk = vipShowcasePasswordsMatch(password, expected);
  if (!emailOk || !passOk) {
    return NextResponse.json(
      { error: "Email or password is not recognised for VIP showcase." },
      { status: 401 },
    );
  }

  const until = new Date();
  until.setUTCDate(until.getUTCDate() + VIP_SHOWCASE_WEEKS * 7);

  return NextResponse.json({
    ok: true,
    email,
    name: displayNameForVipEmail(email),
    planId: VIP_SHOWCASE_PLAN_ID,
    organization: VIP_SHOWCASE_ORG_NAME,
    weeks: VIP_SHOWCASE_WEEKS,
    accessUntil: until.toISOString().slice(0, 10),
  });
}
