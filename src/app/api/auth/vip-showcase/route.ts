import { NextResponse } from "next/server";
import { isPlatformOperatorIdentity } from "@/lib/platformOperator";
import {
  displayNameForVipEmail,
  isAllowedVipShowcaseEmail,
  isVipShowcaseEnabled,
  vipShowcaseClientIp,
  vipShowcaseExpectedPassword,
  vipShowcasePasswordsMatch,
  vipShowcaseRateLimitOk,
  VIP_SHOWCASE_DEFAULT_EMAIL,
  VIP_SHOWCASE_ORG_NAME,
  VIP_SHOWCASE_PLAN_ID,
  VIP_SHOWCASE_WEEKS,
} from "@/lib/vipShowcaseAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const ip = vipShowcaseClientIp(request);
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
  const password = (body.password || "").trim();
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
    const operatorAttempt =
      isPlatformOperatorIdentity(email) ||
      email === "admin@chibaseconsulting.co.za";
    return NextResponse.json(
      {
        error: operatorAttempt
          ? `That mailbox is the Platform Operator / master plan. Use ${VIP_SHOWCASE_DEFAULT_EMAIL} here, or /login/live for Ops.`
          : "Email or password is not recognised for VIP showcase.",
      },
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
