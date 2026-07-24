import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
} from "@/lib/auth.constants";
import {
  TL_AUTH_PENDING_COOKIE,
  hashLoginOtp,
  mintLoginOtp,
  pendingAuthMaxAgeSeconds,
  readPendingLiveAuth,
  signPendingLiveAuth,
  verifyLoginOtp,
} from "@/lib/accessVerification";
import { sendLoginOtpEmail } from "@/lib/transactionalEmail";
import { rateLimitAllow, clientIp } from "@/lib/formGuard";
import { cookieSafeValue } from "@/lib/leadCapture";

/** Complete live login after email OTP. */
export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = (body.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`live-otp-verify:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const jar = await cookies();
  const pendingRaw = jar.get(TL_AUTH_PENDING_COOKIE)?.value;
  const pending = readPendingLiveAuth(pendingRaw);
  if (!pending) {
    return NextResponse.json(
      { error: "Verification expired. Sign in again." },
      { status: 401 },
    );
  }

  if (!verifyLoginOtp(code, pending.email, pending.otpHash)) {
    return NextResponse.json(
      { error: "Incorrect code. Check your email and try again." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: pending.email,
    fullName: pending.fullName,
    role: pending.role,
    platformOperator: pending.platformOperator,
    home: pending.home,
  });

  const cookieBase = {
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  response.cookies.set(FRAPPE_SID_COOKIE, pending.sid, {
    ...cookieBase,
    httpOnly: true,
  });
  response.cookies.set(SESSION_ROLE_COOKIE, pending.role, cookieBase);
  response.cookies.set(TL_MODE_COOKIE, "live", cookieBase);
  response.cookies.set(
    TL_USER_NAME_COOKIE,
    cookieSafeValue(pending.fullName, 80),
    cookieBase,
  );
  response.cookies.set(
    TL_USER_EMAIL_COOKIE,
    cookieSafeValue(pending.email, 120),
    cookieBase,
  );
  response.cookies.set(TL_AUTH_PENDING_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}

/** Resend OTP for an in-progress live login. */
export async function PUT() {
  const jar = await cookies();
  const pendingRaw = jar.get(TL_AUTH_PENDING_COOKIE)?.value;
  const pending = readPendingLiveAuth(pendingRaw);
  if (!pending) {
    return NextResponse.json(
      { error: "Verification expired. Sign in again." },
      { status: 401 },
    );
  }

  if (!rateLimitAllow(`live-otp-resend:${pending.email}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many resend requests. Wait a few minutes." },
      { status: 429 },
    );
  }

  const code = mintLoginOtp();
  const otpHash = hashLoginOtp(code, pending.email);
  const maxAge = pendingAuthMaxAgeSeconds();
  const nextToken = signPendingLiveAuth({
    ...pending,
    otpHash,
    exp: Date.now() + maxAge * 1000,
  });

  const mail = await sendLoginOtpEmail({
    to: pending.email,
    name: pending.fullName,
    code,
    expiresMinutes: Math.round(maxAge / 60),
  });
  if (!mail.sent) {
    return NextResponse.json(
      { error: mail.detail || "Could not resend code." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    message: "A new code was sent to your email.",
  });
  response.cookies.set(TL_AUTH_PENDING_COOKIE, nextToken, {
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  return response;
}
