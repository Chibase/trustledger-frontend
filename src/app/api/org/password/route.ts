import { NextResponse } from "next/server";
import { requireLivePlanOwner } from "@/lib/livePlanOwner";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { getFrappeBaseUrl } from "@/lib/frappeServer";
import { siteBaseUrl } from "@/lib/hubspot";
import {
  findCustomerNameForOwnerEmail,
  setCloudUserPassword,
  userBelongsToCustomer,
} from "@/lib/cloudUserPassword";
import {
  sendTempPasswordEmail,
  transactionalEmailConfigured,
} from "@/lib/transactionalEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChangeOwnBody = {
  action: "change-own";
  currentPassword: string;
  newPassword: string;
};

type ResetMemberBody = {
  action: "reset-member";
  email: string;
  /** Optional explicit password (min 8). Otherwise a temp password is minted. */
  newPassword?: string;
  /** Email the temp password to the member when Resend is configured. */
  emailCredentials?: boolean;
};

type Body = ChangeOwnBody | ResetMemberBody;

function isBody(value: unknown): value is Body {
  if (!value || typeof value !== "object") return false;
  const a = (value as { action?: string }).action;
  return a === "change-own" || a === "reset-member";
}

/**
 * Package Plan Owner password rights:
 * - change-own: update own Cloud password (needs current password + live sid)
 * - reset-member: issue temp Cloud password for self or a User on their Customer
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`org-password:${ip}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many password requests. Try again later." },
      { status: 429 },
    );
  }

  const ownerGate = await requireLivePlanOwner();
  if (!ownerGate.ok) {
    return NextResponse.json(
      {
        error:
          ownerGate.status === 401
            ? "Sign in with a live TrustLedger Cloud Plan Owner account to manage passwords."
            : "Only the package Plan Owner can issue or reset team passwords.",
      },
      { status: ownerGate.status },
    );
  }
  const sid = ownerGate.sid;
  const ownerEmail = ownerGate.email.trim().toLowerCase();
  const ownerName = ownerGate.fullName || "Plan Owner";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isBody(body)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (body.action === "change-own") {
    const currentPassword = body.currentPassword?.trim() || "";
    const newPassword = body.newPassword?.trim() || "";
    if (currentPassword.length < 4 || newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "Current password and a new password of at least 8 characters are required.",
        },
        { status: 400 },
      );
    }

    const base = getFrappeBaseUrl();
    try {
      const res = await fetch(
        `${base}/api/method/frappe.core.doctype.user.user.update_password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Cookie: `sid=${sid}`,
          },
          body: JSON.stringify({
            old_password: currentPassword,
            new_password: newPassword,
            logout_all_sessions: 0,
          }),
          cache: "no-store",
        },
      );
      const text = await res.text();
      if (!res.ok) {
        return NextResponse.json(
          {
            error:
              "Could not change password. Check your current password and try again.",
            detail: text.slice(0, 200),
          },
          { status: 400 },
        );
      }
      return NextResponse.json({
        ok: true,
        message: "Your password was updated.",
      });
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Password change failed",
        },
        { status: 502 },
      );
    }
  }

  // reset-member
  const target = body.email.trim().toLowerCase();
  if (!target.includes("@")) {
    return NextResponse.json({ error: "Member email required" }, { status: 400 });
  }

  const customerName = await findCustomerNameForOwnerEmail(ownerEmail);
  if (!customerName) {
    return NextResponse.json(
      {
        error:
          "No Cloud Customer is linked to your Owner email yet. Ask Ops to provision your package Owner, then try again.",
      },
      { status: 404 },
    );
  }

  const allowed = await userBelongsToCustomer({
    targetEmail: target,
    customerName,
    ownerEmail,
  });
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "That email is not a Cloud login on your package. Ask them to accept a team invite (that creates their Cloud seat), or reset your own Owner login.",
      },
      { status: 403 },
    );
  }

  const result = await setCloudUserPassword({
    email: target,
    newPassword: body.newPassword,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 502 },
    );
  }

  let emailed = false;
  if (body.emailCredentials !== false && transactionalEmailConfigured()) {
    const loginUrl = `${siteBaseUrl().replace(/\/$/, "")}/login/live`;
    const mail = await sendTempPasswordEmail({
      to: target,
      name: target.split("@")[0] || "there",
      temporaryPassword: result.temporaryPassword,
      loginUrl,
      issuedByName: ownerName,
      issuedByEmail: ownerEmail,
    });
    emailed = mail.sent;
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
    temporaryPassword: result.temporaryPassword,
    emailed,
    message: emailed
      ? "Temporary password set and emailed. Ask them to sign in at /login/live and change it."
      : "Temporary password set. Copy it now — it is shown once. Share securely; email was not sent.",
  });
}
