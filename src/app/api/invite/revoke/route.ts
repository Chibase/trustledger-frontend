import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  TL_ORG_ID_COOKIE,
  TL_ORG_OWNER_COOKIE,
} from "@/lib/auth.constants";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { markInviteRevokedServer } from "@/lib/orgInviteServerState";

type RevokeBody = { inviteId: string; orgId: string };

function isValid(body: unknown): body is RevokeBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.inviteId === "string" && typeof b.orgId === "string";
}

/** Plan Owner marks invite revoked so email Accept/Decline links stop working. */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`invite-revoke:${ip}`, 40, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many revoke requests. Try again later." },
      { status: 429 },
    );
  }

  const jar = await cookies();
  const isOwner = jar.get(TL_ORG_OWNER_COOKIE)?.value === "1";
  const sessionOrgId = jar.get(TL_ORG_ID_COOKIE)?.value?.trim() || "";
  if (!isOwner || !sessionOrgId) {
    return NextResponse.json(
      { error: "Only the Plan Owner session can revoke invites." },
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
    return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });
  }
  if (body.orgId !== sessionOrgId) {
    return NextResponse.json(
      { error: "Invite org does not match your Plan Owner session." },
      { status: 403 },
    );
  }

  markInviteRevokedServer(body.inviteId);
  return NextResponse.json({ ok: true });
}
