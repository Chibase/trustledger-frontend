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
  deleteCloudEngagementPlan,
  getCloudEngagementPlan,
  listCloudEngagementPlans,
  upsertCloudEngagementPlan,
} from "@/lib/sepCloud";
import type { EngagementPlan } from "@/types/engagementPlan";
import type { SepExecutionOverlay } from "@/types/sepExecution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  customer?: string;
  orgId?: string;
  plan?: EngagementPlan;
  overlay?: SepExecutionOverlay | null;
  includeExecution?: boolean;
  id?: string;
};

/** Live SEP list / get — empty Cloud stays empty (no mock seed). */
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
      { error: bound.error, code: bound.code, rows: [] },
      { status: bound.status },
    );
  }
  const customer = bound.customerName;
  const id = url.searchParams.get("id")?.trim();

  if (id) {
    const result = await getCloudEngagementPlan(id, customer);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      customer,
      plan: result.plan,
      overlay: result.overlay,
    });
  }

  const result = await listCloudEngagementPlans(customer);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    customer,
    rows: result.plans,
    overlays: result.overlays,
  });
}

/** Live SEP create/update (plan and/or execution overlay). */
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

  const bound = await bindSessionCustomer(email, body.customer, { sid });
  if (!bound.ok) {
    return NextResponse.json(
      { error: bound.error, code: bound.code },
      { status: bound.status },
    );
  }
  const customer = bound.customerName;
  const orgId = body.orgId || orgIdCookie || undefined;

  if (body.plan) {
    if (!body.plan.id || !body.plan.title) {
      return NextResponse.json(
        { error: "plan.id and title required" },
        { status: 400 },
      );
    }
    const includeExecution =
      body.includeExecution === true || body.overlay !== undefined;
    const r = await upsertCloudEngagementPlan(body.plan, customer, {
      orgId,
      overlay: body.overlay ?? null,
      includeExecution,
    });
    return NextResponse.json(
      r.ok
        ? { ok: true, name: r.name, customer }
        : { ok: false, error: r.error },
      { status: r.ok ? 200 : 502 },
    );
  }

  if (body.overlay?.planId) {
    const existing = await getCloudEngagementPlan(body.overlay.planId, customer);
    if (!existing.ok) {
      return NextResponse.json({ error: existing.error }, { status: 502 });
    }
    if (!existing.plan) {
      return NextResponse.json(
        { error: "Plan is not on Cloud yet — save the engagement plan first." },
        { status: 404 },
      );
    }
    const r = await upsertCloudEngagementPlan(existing.plan, customer, {
      orgId,
      overlay: body.overlay,
      includeExecution: true,
    });
    return NextResponse.json(
      r.ok
        ? { ok: true, name: r.name, customer }
        : { ok: false, error: r.error },
      { status: r.ok ? 200 : 502 },
    );
  }

  return NextResponse.json(
    { error: "plan or overlay required" },
    { status: 400 },
  );
}

export async function DELETE(request: Request) {
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
  const id = url.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const bound = await bindSessionCustomer(
    email,
    url.searchParams.get("customer"),
    { sid },
  );
  if (!bound.ok) {
    return NextResponse.json(
      { error: bound.error, code: bound.code },
      { status: bound.status },
    );
  }

  const r = await deleteCloudEngagementPlan(id, bound.customerName);
  return NextResponse.json(
    r.ok ? { ok: true, customer: bound.customerName } : { ok: false, error: r.error },
    { status: r.ok ? 200 : 502 },
  );
}
