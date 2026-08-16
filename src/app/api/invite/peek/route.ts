import { NextResponse } from "next/server";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { inviteBlockedReason } from "@/lib/orgInviteServerState";
import { verifyPortableOrgInvite } from "@/lib/orgInviteToken";

type PeekBody = { invite: string };

function isValid(body: unknown): body is PeekBody {
  if (!body || typeof body !== "object") return false;
  return typeof (body as Record<string, unknown>).invite === "string";
}

/** Verify portable invite token and return payload for accept/reject pages. */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`invite-peek:${ip}`, 60, 15 * 60 * 1000)) {
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
  if (!isValid(body)) {
    return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
  }

  const payload = verifyPortableOrgInvite(body.invite);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invite link is invalid or expired." },
      { status: 400 },
    );
  }

  const blocked = inviteBlockedReason(payload.inviteId);
  if (blocked === "revoked") {
    return NextResponse.json(
      { ok: false, error: "This invite was revoked by the Plan Owner." },
      { status: 410 },
    );
  }
  if (blocked === "closed") {
    return NextResponse.json(
      {
        ok: false,
        error: "This invite was already accepted or declined.",
      },
      { status: 410 },
    );
  }

  return NextResponse.json({
    ok: true,
    payload: {
      ...payload,
      // Never echo a client-forged VIP claim as authoritative for the UI.
      complimentaryVip: payload.complimentaryVip || undefined,
    },
  });
}
