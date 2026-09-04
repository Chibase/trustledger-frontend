import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  TL_ORG_ID_COOKIE,
  TL_USER_EMAIL_COOKIE,
} from "@/lib/auth.constants";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import {
  listCloudIncidentsForCustomer,
  upsertCloudIncident,
} from "@/lib/productCloud";
import { bindSessionCustomer } from "@/lib/tenantScope";
import { omitCloudTrustOverlay } from "@/types/trustOverlay";
import type { Incident } from "@/types/incident";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  kind?: string;
  customer?: string;
  orgId?: string;
  incident?: Incident;
};

function parseKind(raw: string | null | undefined): "incident" | null {
  return raw === "incident" ? "incident" : null;
}

/** Live product list — empty Cloud stays empty (no mock seed). */
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
    return NextResponse.json({ error: "kind=incident required" }, { status: 400 });
  }

  const bound = await bindSessionCustomer(
    email,
    url.searchParams.get("customer"),
    { sid },
  );
  if (!bound.ok) {
    return NextResponse.json(
      { error: bound.error, code: bound.code, rows: [] },
      { status: bound.status },
    );
  }

  const result = await listCloudIncidentsForCustomer(bound.customerName);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    kind,
    customer: bound.customerName,
    rows: result.incidents,
  });
}

/** Live incident create/update, including process-stage stamps. */
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
    return NextResponse.json({ error: "kind=incident required" }, { status: 400 });
  }

  const bound = await bindSessionCustomer(email, body.customer, { sid });
  if (!bound.ok) {
    return NextResponse.json(
      { error: bound.error, code: bound.code },
      { status: bound.status },
    );
  }

  if (!body.incident?.id || !body.incident.title) {
    return NextResponse.json(
      { error: "incident.id and title required" },
      { status: 400 },
    );
  }

  const orgId = body.orgId || orgIdCookie || undefined;
  const r = await upsertCloudIncident(
    omitCloudTrustOverlay(body.incident),
    bound.customerName,
    orgId,
  );
  return NextResponse.json(
    r.ok
      ? { ok: true, kind, name: r.name, customer: bound.customerName }
      : { ok: false, error: r.error },
    { status: r.ok ? 200 : 502 },
  );
}
