import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  TL_ORG_ID_COOKIE,
  TL_USER_EMAIL_COOKIE,
} from "@/lib/auth.constants";
import { getCustomerEntitlementByOwnerEmail } from "@/lib/entitlementCloud";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import {
  listCloudSiRows,
  upsertCloudCommitment,
  upsertCloudEngagement,
  upsertCloudStakeholder,
  type SiKind,
} from "@/lib/siCloud";
import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { Stakeholder } from "@/types/stakeholder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  kind?: SiKind;
  customer?: string;
  orgId?: string;
  stakeholder?: Stakeholder;
  engagement?: Engagement;
  commitment?: Commitment;
};

function parseKind(raw: string | null | undefined): SiKind | null {
  if (raw === "stakeholder" || raw === "engagement" || raw === "commitment") {
    return raw;
  }
  return null;
}

async function resolveCustomer(
  email: string | undefined,
  override?: string,
): Promise<string | null> {
  const fromBody = (override || "").trim();
  if (fromBody) return fromBody;
  if (!email) return null;
  const ent = await getCustomerEntitlementByOwnerEmail(email);
  return ent?.customerName || null;
}

/** Live SI list — empty Cloud stays empty (no mock seed). */
export async function GET(request: Request) {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Not logged in to live session" }, { status: 401 });
  }
  const gate = assertLiveOperatorAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const kind = parseKind(url.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json(
      { error: "kind=stakeholder|engagement|commitment required" },
      { status: 400 },
    );
  }

  const customer = await resolveCustomer(
    email,
    url.searchParams.get("customer") || undefined,
  );
  if (!customer) {
    return NextResponse.json(
      { error: "No Frappe Customer linked to this account", rows: [] },
      { status: 404 },
    );
  }

  const result = await listCloudSiRows(kind, customer);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const rows =
    kind === "stakeholder"
      ? result.stakeholders || []
      : kind === "engagement"
        ? result.engagements || []
        : result.commitments || [];

  return NextResponse.json({ ok: true, kind, customer, rows });
}

/** Live SI create/update. */
export async function POST(request: Request) {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const orgIdCookie = jar.get(TL_ORG_ID_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Not logged in to live session" }, { status: 401 });
  }
  const gate = assertLiveOperatorAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = parseKind(body.kind || null);
  if (!kind) {
    return NextResponse.json(
      { error: "kind=stakeholder|engagement|commitment required" },
      { status: 400 },
    );
  }

  const customer = await resolveCustomer(email, body.customer);
  if (!customer) {
    return NextResponse.json(
      { error: "No Frappe Customer linked — pass customer or provision Owner" },
      { status: 400 },
    );
  }

  const orgId = body.orgId || orgIdCookie || undefined;

  if (kind === "stakeholder") {
    if (!body.stakeholder?.id || !body.stakeholder.name) {
      return NextResponse.json(
        { error: "stakeholder.id and name required" },
        { status: 400 },
      );
    }
    const r = await upsertCloudStakeholder(body.stakeholder, customer, orgId);
    return NextResponse.json(
      r.ok
        ? { ok: true, kind, name: r.name, customer }
        : { ok: false, error: r.error },
      { status: r.ok ? 200 : 502 },
    );
  }

  if (kind === "engagement") {
    if (!body.engagement?.id || !body.engagement.title) {
      return NextResponse.json(
        { error: "engagement.id and title required" },
        { status: 400 },
      );
    }
    const r = await upsertCloudEngagement(body.engagement, customer, orgId);
    return NextResponse.json(
      r.ok
        ? { ok: true, kind, name: r.name, customer }
        : { ok: false, error: r.error },
      { status: r.ok ? 200 : 502 },
    );
  }

  if (!body.commitment?.id || !body.commitment.title) {
    return NextResponse.json(
      { error: "commitment.id and title required" },
      { status: 400 },
    );
  }
  const r = await upsertCloudCommitment(body.commitment, customer, orgId);
  return NextResponse.json(
    r.ok
      ? { ok: true, kind, name: r.name, customer }
      : { ok: false, error: r.error },
    { status: r.ok ? 200 : 502 },
  );
}
