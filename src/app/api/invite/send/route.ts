import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isPlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  TL_ORG_ID_COOKIE,
  TL_ORG_OWNER_COOKIE,
  TL_USER_EMAIL_COOKIE,
  TL_VIP_COOKIE,
} from "@/lib/auth.constants";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { siteBaseUrl } from "@/lib/hubspot";
import { canInviteDeskTier } from "@/lib/orgSeats";
import { signPortableOrgInvite } from "@/lib/orgInviteToken";
import { isVipCustomerName } from "@/lib/planLabel";
import {
  sendOrgInviteEmail,
  transactionalEmailConfigured,
} from "@/lib/transactionalEmail";
import { isDeskTier } from "@/types/deskTier";
import { DESK_TIER_LABELS } from "@/types/deskTier";
import { INVITEABLE_ROLES, type InviteableRole } from "@/types/org";

type SendBody = {
  orgId: string;
  orgName: string;
  planId: string;
  ownerEmail: string;
  ownerName: string;
  inviteId: string;
  token: string;
  email: string;
  name: string;
  role: string;
  deskTier: string;
  projectId?: string;
  projectName?: string;
};

function isValid(body: unknown): body is SendBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.orgId === "string" &&
    typeof b.orgName === "string" &&
    typeof b.planId === "string" &&
    typeof b.ownerEmail === "string" &&
    typeof b.ownerName === "string" &&
    typeof b.inviteId === "string" &&
    typeof b.token === "string" &&
    typeof b.email === "string" &&
    typeof b.name === "string" &&
    typeof b.role === "string" &&
    typeof b.deskTier === "string"
  );
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`invite-send:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many invite emails. Try again later." },
      { status: 429 },
    );
  }

  const jar = await cookies();
  const isOwner = jar.get(TL_ORG_OWNER_COOKIE)?.value === "1";
  const sessionOrgId = jar.get(TL_ORG_ID_COOKIE)?.value?.trim() || "";
  const sessionEmail =
    jar.get(TL_USER_EMAIL_COOKIE)?.value?.trim().toLowerCase() || "";
  if (!isOwner) {
    return NextResponse.json(
      {
        error:
          "Only the Plan Owner can send invite emails. Sign in as Plan Owner, then open Settings → Team / Seats.",
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isValid(body)) {
    return NextResponse.json({ error: "Missing invite fields" }, { status: 400 });
  }

  const bodyOwnerEmail = body.ownerEmail.trim().toLowerCase();
  // Live Cloud Owners often lack tl-org-id until Team/Seats stamps it. Allow
  // send when owner cookie is set and session email matches the invite Owner.
  if (sessionOrgId) {
    if (body.orgId !== sessionOrgId) {
      return NextResponse.json(
        { error: "Invite org does not match your Plan Owner session." },
        { status: 403 },
      );
    }
  } else if (
    !sessionEmail ||
    !bodyOwnerEmail.includes("@") ||
    sessionEmail !== bodyOwnerEmail
  ) {
    return NextResponse.json(
      {
        error:
          "Plan Owner workspace cookies are missing. Open Settings → Team / Seats once, then try again.",
      },
      { status: 401 },
    );
  }

  if (!isPlanId(body.planId) || !isDeskTier(body.deskTier)) {
    return NextResponse.json({ error: "Invalid plan or desk" }, { status: 400 });
  }
  if (!INVITEABLE_ROLES.includes(body.role as InviteableRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // VIP never from client body — cookie or VIP Pilot org name only.
  const vip =
    jar.get(TL_VIP_COOKIE)?.value === "1" ||
    isVipCustomerName(body.orgName);
  if (!canInviteDeskTier(body.planId, body.deskTier, vip ? { vip: true } : undefined)) {
    return NextResponse.json(
      { error: "That desk exposure is above your plan." },
      { status: 400 },
    );
  }

  const ownerEmail =
    (sessionEmail.includes("@") ? sessionEmail : bodyOwnerEmail) || "";
  if (!ownerEmail.includes("@")) {
    return NextResponse.json(
      { error: "Plan Owner email required to send invites." },
      { status: 400 },
    );
  }

  let portableToken: string;
  try {
    portableToken = signPortableOrgInvite({
      orgId: body.orgId,
      orgName: body.orgName.trim(),
      planId: body.planId,
      ownerEmail,
      ownerName: body.ownerName.trim() || "Plan Owner",
      inviteId: body.inviteId,
      token: body.token,
      email,
      name: body.name.trim() || email.split("@")[0] || "Colleague",
      role: body.role as InviteableRole,
      deskTier: body.deskTier,
      projectId: body.projectId,
      projectName: body.projectName,
      // Never stamp VIP from a client boolean — name / cookie only.
      complimentaryVip: vip || undefined,
    });
  } catch (err) {
    return NextResponse.json(
      {
        sent: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not sign invite token",
      },
      { status: 500 },
    );
  }

  const base = siteBaseUrl().replace(/\/$/, "");
  const acceptUrl = `${base}/invite/accept?invite=${encodeURIComponent(portableToken)}`;
  const rejectUrl = `${base}/invite/reject?invite=${encodeURIComponent(portableToken)}`;

  if (!transactionalEmailConfigured()) {
    return NextResponse.json(
      {
        sent: false,
        error:
          "Invite email is not configured (RESEND_API_KEY). Share the accept link manually.",
        portableToken,
        acceptUrl,
        rejectUrl,
      },
      { status: 503 },
    );
  }

  const mail = await sendOrgInviteEmail({
    to: email,
    inviteeName: body.name.trim() || "there",
    orgName: body.orgName.trim(),
    ownerName: body.ownerName.trim() || "Your Plan Owner",
    ownerEmail,
    roleLabel: body.role,
    deskLabel: DESK_TIER_LABELS[body.deskTier],
    planLabel: PLANS[body.planId].name,
    acceptUrl,
    rejectUrl,
  });

  if (!mail.sent) {
    return NextResponse.json(
      {
        sent: false,
        error: mail.detail || "Email failed",
        portableToken,
        acceptUrl,
        rejectUrl,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    sent: true,
    portableToken,
    acceptUrl,
    rejectUrl,
  });
}
