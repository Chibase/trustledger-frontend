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
import { bindSessionCustomer } from "@/lib/tenantScope";
import {
  listCloudTrustBucket,
  upsertCloudCommunity,
  upsertCloudObservation,
  upsertCloudParticipation,
  upsertCloudTrustBucket,
  type TrustCloudKind,
} from "@/lib/trustCloud";
import type {
  TrustCommunityContext,
  TrustObservation,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  kind?: TrustCloudKind;
  customer?: string;
  orgId?: string;
  observation?: TrustObservation;
  participation?: TrustParticipationRecord;
  community?: TrustCommunityContext;
  observations?: TrustObservation[];
  participationRows?: TrustParticipationRecord[];
  communityRows?: TrustCommunityContext[];
};

function parseKind(raw: string | null | undefined): TrustCloudKind | null {
  if (
    raw === "observation" ||
    raw === "participation" ||
    raw === "community" ||
    raw === "bucket"
  ) {
    return raw;
  }
  return null;
}

/** Live trust layer list — empty Cloud stays empty (no mock seed). */
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
  const bound = await bindSessionCustomer(
    email,
    url.searchParams.get("customer"),
    { sid },
  );
  if (!bound.ok) {
    return NextResponse.json(
      {
        error: bound.error,
        code: bound.code,
        observations: [],
        participation: [],
        community: [],
      },
      { status: bound.status },
    );
  }
  const customer = bound.customerName;

  const result = await listCloudTrustBucket(customer);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const kind = parseKind(url.searchParams.get("kind"));
  if (kind === "observation") {
    return NextResponse.json({
      ok: true,
      kind,
      customer,
      rows: result.observations,
    });
  }
  if (kind === "participation") {
    return NextResponse.json({
      ok: true,
      kind,
      customer,
      rows: result.participation,
    });
  }
  if (kind === "community") {
    return NextResponse.json({
      ok: true,
      kind,
      customer,
      rows: result.community,
    });
  }

  return NextResponse.json({
    ok: true,
    kind: "bucket",
    customer,
    observations: result.observations,
    participation: result.participation,
    community: result.community,
  });
}

/** Live trust create/update. Overlay keys are not accepted as Cloud columns. */
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

  const kind = parseKind(body.kind || "bucket");
  if (!kind) {
    return NextResponse.json(
      { error: "kind=observation|participation|community|bucket required" },
      { status: 400 },
    );
  }

  const bound = await bindSessionCustomer(email, body.customer, { sid });
  if (!bound.ok) {
    return NextResponse.json(
      { error: bound.error, code: bound.code },
      { status: bound.status },
    );
  }
  const customer = bound.customerName;
  const orgId = body.orgId || orgIdCookie || undefined;

  if (kind === "observation") {
    if (!body.observation?.id || !body.observation.dimension) {
      return NextResponse.json(
        { error: "observation.id and dimension required" },
        { status: 400 },
      );
    }
    const r = await upsertCloudObservation(body.observation, customer, orgId);
    return NextResponse.json(
      r.ok
        ? { ok: true, kind, name: r.name, customer }
        : { ok: false, error: r.error },
      { status: r.ok ? 200 : 502 },
    );
  }

  if (kind === "participation") {
    if (!body.participation?.id) {
      return NextResponse.json(
        { error: "participation.id required" },
        { status: 400 },
      );
    }
    const r = await upsertCloudParticipation(
      body.participation,
      customer,
      orgId,
    );
    return NextResponse.json(
      r.ok
        ? { ok: true, kind, name: r.name, customer }
        : { ok: false, error: r.error },
      { status: r.ok ? 200 : 502 },
    );
  }

  if (kind === "community") {
    if (!body.community?.id) {
      return NextResponse.json(
        { error: "community.id required" },
        { status: 400 },
      );
    }
    const r = await upsertCloudCommunity(body.community, customer, orgId);
    return NextResponse.json(
      r.ok
        ? { ok: true, kind, name: r.name, customer }
        : { ok: false, error: r.error },
      { status: r.ok ? 200 : 502 },
    );
  }

  const r = await upsertCloudTrustBucket(
    {
      observations: body.observations || [],
      participation: body.participationRows || [],
      community: body.communityRows || [],
    },
    customer,
    orgId,
  );
  return NextResponse.json(
    {
      ok: r.ok,
      kind,
      customer,
      failed: r.failed,
      results: r.results,
    },
    { status: r.ok ? 200 : 502 },
  );
}
