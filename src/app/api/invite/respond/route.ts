import { NextResponse } from "next/server";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { siteBaseUrl } from "@/lib/hubspot";
import { verifyPortableOrgInvite } from "@/lib/orgInviteToken";
import {
  sendOrgInviteDecisionEmail,
  transactionalEmailConfigured,
} from "@/lib/transactionalEmail";

type RespondBody = {
  invite: string;
  decision: "accepted" | "rejected";
};

function isValid(body: unknown): body is RespondBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.invite === "string" &&
    (b.decision === "accepted" || b.decision === "rejected")
  );
}

/** Notify Plan Owner after invitee accepts or declines (portable email link). */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`invite-respond:${ip}`, 40, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many responses. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isValid(body)) {
    return NextResponse.json({ error: "Missing invite or decision" }, { status: 400 });
  }

  const payload = verifyPortableOrgInvite(body.invite);
  if (!payload) {
    return NextResponse.json(
      { error: "Invite link is invalid or expired." },
      { status: 400 },
    );
  }

  let ownerNotified = false;
  if (transactionalEmailConfigured() && payload.ownerEmail.includes("@")) {
    const base = siteBaseUrl().replace(/\/$/, "");
    const mail = await sendOrgInviteDecisionEmail({
      to: payload.ownerEmail,
      ownerName: payload.ownerName || "Plan Owner",
      inviteeName: payload.name,
      inviteeEmail: payload.email,
      orgName: payload.orgName,
      decision: body.decision,
      settingsUrl: `${base}/app/settings#team-seats`,
    });
    ownerNotified = mail.sent;
  }

  return NextResponse.json({
    ok: true,
    decision: body.decision,
    ownerNotified,
    payload: {
      orgId: payload.orgId,
      orgName: payload.orgName,
      email: payload.email,
      name: payload.name,
      token: payload.token,
      inviteId: payload.inviteId,
    },
  });
}
