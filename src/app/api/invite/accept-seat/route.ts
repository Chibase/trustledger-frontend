import { NextResponse } from "next/server";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { frappeLogin } from "@/lib/frappeServer";
import {
  inviteeSeatGuard,
  isInviteableAppRole,
  ownerHasCloudCustomer,
  provisionInviteeOnCloud,
} from "@/lib/inviteeCloud";
import { applyLiveSessionCookies } from "@/lib/liveSessionCookies";
import { canInviteDeskTier } from "@/lib/orgSeats";
import {
  inviteBlockedReason,
  markInviteClosedServer,
} from "@/lib/orgInviteServerState";
import { verifyPortableOrgInvite } from "@/lib/orgInviteToken";
import { isPlanId } from "@/config/plans";
import { getCustomerEntitlementByName } from "@/lib/entitlementCloud";
import { isVipCustomerName } from "@/lib/planLabel";
import { isDeskTier } from "@/types/deskTier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  invite?: string;
  password?: string;
  fullName?: string;
};

/**
 * SEC-5 — provision a Cloud User on the Owner's Customer when the invitee accepts.
 * Trial orgs without a Cloud Customer skip Cloud and return cloud:false.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`invite-accept-seat:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const portable = (body.invite || "").trim();
  const password = (body.password || "").trim();
  const fullName = (body.fullName || "").trim();
  if (!portable) {
    return NextResponse.json(
      { error: "Invite link is required for a Cloud seat." },
      { status: 400 },
    );
  }

  const payload = verifyPortableOrgInvite(portable);
  if (!payload) {
    return NextResponse.json(
      { error: "Invite link is invalid or expired." },
      { status: 400 },
    );
  }

  const blocked = inviteBlockedReason(payload.inviteId);
  if (blocked === "revoked") {
    return NextResponse.json(
      { error: "This invite was revoked by the Plan Owner." },
      { status: 410 },
    );
  }
  if (blocked === "closed") {
    return NextResponse.json(
      {
        error:
          "This invite was already accepted or declined. Sign in at /login/live.",
      },
      { status: 410 },
    );
  }

  const deskTier = isDeskTier(payload.deskTier) ? payload.deskTier : null;
  const appRole = isInviteableAppRole(payload.role) ? payload.role : null;
  if (!deskTier || !appRole) {
    return NextResponse.json(
      { error: "This invite is missing a desk or role." },
      { status: 400 },
    );
  }

  const tokenVip = Boolean(
    payload.complimentaryVip || isVipCustomerName(payload.orgName),
  );

  const guard = inviteeSeatGuard({
    email: payload.email,
    ownerEmail: payload.ownerEmail,
    password,
  });
  if (guard) {
    return NextResponse.json({ error: guard }, { status: 400 });
  }

  const customerName = await ownerHasCloudCustomer(payload.ownerEmail);
  if (!customerName) {
    if (!canInviteDeskTier(payload.planId, deskTier, tokenVip ? { vip: true } : undefined)) {
      return NextResponse.json(
        {
          error:
            "This invite’s desk exposure is above the organisation’s plan. Ask your Plan Owner to send a new invite at a lower rank.",
        },
        { status: 403 },
      );
    }
    return NextResponse.json({
      ok: true,
      cloud: false,
      message:
        "This organisation is not on TrustLedger Cloud yet. You can still join the workspace in this browser.",
    });
  }

  const ent = await getCustomerEntitlementByName(customerName);
  const livePlan =
    ent?.planId && isPlanId(ent.planId) ? ent.planId : payload.planId;
  const orgVip =
    tokenVip ||
    isVipCustomerName(ent?.customerLabel) ||
    isVipCustomerName(ent?.customerName);
  if (!canInviteDeskTier(livePlan, deskTier, orgVip ? { vip: true } : undefined)) {
    return NextResponse.json(
      {
        error:
          "This invite’s desk exposure is above the organisation’s plan. Ask your Plan Owner to send a new invite at a lower rank.",
      },
      { status: 403 },
    );
  }

  const provisioned = await provisionInviteeOnCloud({
    email: payload.email,
    fullName: fullName || payload.name,
    ownerEmail: payload.ownerEmail,
    customerName,
    deskTier,
    appRole,
    password,
  });
  if (!provisioned.ok) {
    return NextResponse.json(
      { error: provisioned.error },
      { status: provisioned.status || 502 },
    );
  }

  markInviteClosedServer(payload.inviteId);

  try {
    const { sid } = await frappeLogin(payload.email, password);
    const response = NextResponse.json({
      ok: true,
      cloud: true,
      email: provisioned.email,
      customerName: provisioned.customerName,
    });
    applyLiveSessionCookies(response, {
      sid,
      role: appRole,
      email: provisioned.email,
      fullName: fullName || payload.name,
      isPlanOwner: false,
      deskTier,
      planId: livePlan,
      vip: orgVip || undefined,
    });
    return response;
  } catch {
    return NextResponse.json({
      ok: true,
      cloud: true,
      email: provisioned.email,
      customerName: provisioned.customerName,
      signedIn: false,
      message:
        "Cloud seat created. Sign in at /login/live with the password you just chose.",
    });
  }
}
