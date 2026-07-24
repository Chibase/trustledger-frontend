import { NextResponse } from "next/server";
import { isUserRole } from "@/types/rbac";
import {
  FRAPPE_SID_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  SESSION_ROLE_COOKIE,
  TL_MODE_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_USER_NAME_COOKIE,
} from "@/lib/auth.constants";
import { fetchSessionContext, frappeLogin } from "@/lib/frappeServer";
import {
  assertLiveOperatorAccess,
  assertOpsAccess,
  normalizeIdentity,
  operatorGateMessage,
} from "@/lib/platformOperator";
import {
  entitlementAllowsLiveAccess,
  getCustomerEntitlementByOwnerEmail,
} from "@/lib/entitlementCloud";
import {
  TL_AUTH_PENDING_COOKIE,
  accessEmailVerificationEnabled,
  accessVerificationReady,
  hashLoginOtp,
  mintLoginOtp,
  pendingAuthMaxAgeSeconds,
  signPendingLiveAuth,
} from "@/lib/accessVerification";
import { sendLoginOtpEmail } from "@/lib/transactionalEmail";
import {
  byteStringHeaderErrorMessage,
  cookieSafeValue,
} from "@/lib/leadCapture";

/** Strip paste junk that often lands in password managers / truncated copies. */
function sanitizeLoginCredentials(usr: string, pwd: string): {
  usr: string;
  pwd: string;
} {
  const cleanUsr = usr
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/[\u200B-\u200D\uFEFF\u2026]/g, "");
  const cleanPwd = pwd
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Trailing ellipsis usually means a truncated paste — drop it.
    .replace(/\u2026/g, "");
  return { usr: cleanUsr, pwd: cleanPwd };
}

export async function POST(request: Request) {
  let body: { usr?: string; pwd?: string };
  try {
    body = (await request.json()) as { usr?: string; pwd?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { usr, pwd } = sanitizeLoginCredentials(body.usr || "", body.pwd || "");
  if (!usr || !pwd) {
    return NextResponse.json(
      { error: "usr and pwd are required" },
      { status: 400 },
    );
  }

  try {
    const { sid } = await frappeLogin(usr, pwd);
    const session = await fetchSessionContext(sid);
    if (!isUserRole(session.trustLedgerRole)) {
      return NextResponse.json(
        { error: "Could not map your TrustLedger Cloud roles" },
        { status: 403 },
      );
    }

    const gate = assertLiveOperatorAccess(usr, session.user);
    if (!gate.ok) {
      return NextResponse.json(
        { error: operatorGateMessage(gate.reason) },
        { status: 403 },
      );
    }

    const email = normalizeIdentity(session.user || usr);
    // Operators home to Executive Board — never the customer desk.
    const opsGate = assertOpsAccess(usr, session.user, email);

    // OD-4 — when lockdown is off, buyers still need trial/active entitlement.
    if (!opsGate.ok) {
      const ent = await getCustomerEntitlementByOwnerEmail(email);
      if (ent?.status && !entitlementAllowsLiveAccess(ent.status)) {
        return NextResponse.json(
          {
            error: `Account entitlement is “${ent.status}”. Update billing or contact TrustLedger support.`,
            entitlement: ent.status,
          },
          { status: 403 },
        );
      }
    }

    const home = opsGate.ok ? "/ops/executive" : "/app/dashboard";

    // Email OTP step-up when verification is on.
    if (accessEmailVerificationEnabled()) {
      if (!accessVerificationReady()) {
        return NextResponse.json(
          {
            error:
              "Email verification is required but RESEND_API_KEY is not configured. Set Resend on Vercel or set ACCESS_EMAIL_VERIFICATION=0.",
          },
          { status: 503 },
        );
      }

      const code = mintLoginOtp();
      const otpHash = hashLoginOtp(code, email);
      const maxAge = pendingAuthMaxAgeSeconds();
      const pendingToken = signPendingLiveAuth({
        email,
        sid,
        role: session.trustLedgerRole,
        fullName: session.fullName,
        home,
        platformOperator: opsGate.ok,
        otpHash,
        exp: Date.now() + maxAge * 1000,
      });

      const mail = await sendLoginOtpEmail({
        to: email,
        name: session.fullName,
        code,
        expiresMinutes: Math.round(maxAge / 60),
      });
      if (!mail.sent) {
        return NextResponse.json(
          {
            error:
              mail.detail ||
              "Could not send verification email. Try again or contact TrustLedger support.",
          },
          { status: 503 },
        );
      }

      const hint =
        email.includes("@") && email.length > 4
          ? `${email.slice(0, 2)}...@${email.split("@")[1]}`
          : "your email";

      const response = NextResponse.json({
        ok: true,
        needsVerification: true,
        emailHint: hint,
        message: `We sent a 6-digit code to ${hint}. Enter it to finish signing in.`,
      });

      response.cookies.set(TL_AUTH_PENDING_COOKIE, pendingToken, {
        path: "/",
        maxAge,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      });
      // Do not set live session cookies until OTP is confirmed.
      return response;
    }

    const response = NextResponse.json({
      ok: true,
      user: session.user,
      fullName: session.fullName,
      role: session.trustLedgerRole,
      roles: session.roles,
      platformOperator: opsGate.ok,
      home,
    });

    const cookieBase = {
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };

    response.cookies.set(FRAPPE_SID_COOKIE, sid, {
      ...cookieBase,
      httpOnly: true,
    });
    response.cookies.set(SESSION_ROLE_COOKIE, session.trustLedgerRole, cookieBase);
    response.cookies.set(TL_MODE_COOKIE, "live", cookieBase);
    response.cookies.set(
      TL_USER_NAME_COOKIE,
      cookieSafeValue(session.fullName, 80),
      cookieBase,
    );
    response.cookies.set(
      TL_USER_EMAIL_COOKIE,
      cookieSafeValue(email, 120),
      cookieBase,
    );

    return response;
  } catch (error) {
    const byteMsg = byteStringHeaderErrorMessage(error);
    const message =
      byteMsg ||
      (error instanceof Error ? error.message : "Login failed");
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
