import { NextResponse } from "next/server";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { verifyInviteOwnerSync } from "@/lib/orgInviteToken";

type Body = { receipt: string };

/** Decode Owner sync receipt after invitee Accept/Decline. */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`invite-owner-sync:${ip}`, 60, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Missing receipt" }, { status: 400 });
  }
  const receipt = (body as Body).receipt;
  if (typeof receipt !== "string" || !receipt.trim()) {
    return NextResponse.json({ error: "Missing receipt" }, { status: 400 });
  }

  const payload = verifyInviteOwnerSync(receipt.trim());
  if (!payload) {
    return NextResponse.json(
      { error: "Sync link is invalid or expired." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    decision: payload.decision,
    payload: {
      orgId: payload.orgId,
      orgName: payload.orgName,
      planId: payload.planId,
      ownerEmail: payload.ownerEmail,
      ownerName: payload.ownerName,
      inviteId: payload.inviteId,
      token: payload.token,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      deskTier: payload.deskTier,
    },
  });
}
