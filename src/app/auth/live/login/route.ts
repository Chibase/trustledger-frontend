import { NextResponse } from "next/server";
import { isUserRole } from "@/types/rbac";
import {
  TL_AUTH_PENDING_COOKIE,
  accessEmailVerificationEnabled,
  accessVerificationReady,
  hashLoginOtp,
  mintLoginOtp,
  pendingAuthMaxAgeSeconds,
  signPendingLiveAuth,
} from "@/lib/accessVerification";
import {
  entitlementAllowsLiveAccess,
  getCustomerEntitlementByName,
  getCustomerEntitlementByOwnerEmail,
} from "@/lib/entitlementCloud";
import { fetchSessionContext, frappeLogin } from "@/lib/frappeServer";
import { decideLiveSeatKind, getInviteeCustomerName } from "@/lib/inviteeCloud";
import { applyLiveSessionCookies } from "@/lib/liveSessionCookies";
import { isVipCustomerName } from "@/lib/planLabel";
import { isVipShowcaseLiveLoginMailbox } from "@/lib/vipShowcaseAuth";
import { isPlanId } from "@/config/plans";
import { PLAN_OWNER_DESK_TIER } from "@/types/deskTier";
import {
  assertLiveOperatorAccess,
  assertOpsAccess,
  normalizeIdentity,
  operatorGateMessage,
} from "@/lib/platformOperator";
import { sendLoginOtpEmail } from "@/lib/transactionalEmail";
import { byteStringHeaderErrorMessage } from "@/lib/leadCapture";

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

  if (isVipShowcaseLiveLoginMailbox(usr)) {
    return NextResponse.json(
      {
        error:
          "That mailbox is for the VIP showcase workspace, not TrustLedger Cloud. Use /login/vip.",
        redirectTo: "/login/vip",
      },
      { status: 409 },
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

    const ownerEnt = await getCustomerEntitlementByOwnerEmail(email);
    const inviteeCustomer = ownerEnt?.customerName
      ? null
      : await getInviteeCustomerName(email);
    const seatKind = decideLiveSeatKind({
      sessionPlanOwner: Boolean(session.isPlanOwner),
      ownerCustomerName: ownerEnt?.customerName,
      inviteeCustomerName: inviteeCustomer,
    });
    const treatAsPlanOwner = seatKind === "owner";

    let ent = ownerEnt?.customerName ? ownerEnt : null;
    if (!ent?.customerName && inviteeCustomer) {
      ent = await getCustomerEntitlementByName(inviteeCustomer);
    }

    const vip =
      isVipCustomerName(ent?.customerLabel) ||
      isVipCustomerName(ent?.customerName);
    const planId =
      (ent?.planId && isPlanId(ent.planId) ? ent.planId : null) ||
      (vip ? "institutional" : null);

    // OD-4 — when lockdown is off, buyers still need trial/active entitlement.
    if (!opsGate.ok) {
      if (seatKind === "unbound") {
        return NextResponse.json(
          {
            error:
              "No TrustLedger Cloud organisation is linked to this login. Ask your Plan Owner to send a team invite, or sign in as Plan Owner.",
          },
          { status: 403 },
        );
      }
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
    const deskTier =
      session.deskTier ||
      (treatAsPlanOwner && planId ? PLAN_OWNER_DESK_TIER[planId] : undefined);
    const sessionRole =
      treatAsPlanOwner
        ? session.trustLedgerRole
        : session.appRole || session.trustLedgerRole;

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
        role: sessionRole,
        fullName: session.fullName,
        home,
        platformOperator: opsGate.ok,
        otpHash,
        exp: Date.now() + maxAge * 1000,
        isPlanOwner: treatAsPlanOwner,
        deskTier,
        planId: planId || undefined,
        vip: vip || undefined,
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
      role: sessionRole,
      roles: session.roles,
      platformOperator: opsGate.ok,
      home,
    });

    applyLiveSessionCookies(response, {
      sid,
      role: sessionRole,
      email,
      fullName: session.fullName,
      isPlanOwner: treatAsPlanOwner,
      deskTier,
      planId: planId || undefined,
      vip: vip || undefined,
    });

    return response;
  } catch (error) {
    const byteMsg = byteStringHeaderErrorMessage(error);
    const message =
      byteMsg ||
      (error instanceof Error ? error.message : "Login failed");
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
