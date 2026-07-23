import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { ensureProductDocTypes } from "@/lib/frappeProductDocTypes";
import { ensureSiDocTypes } from "@/lib/frappeSiDocTypes";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { dryRun?: boolean; includeSi?: boolean };

/** OD-2 / SI-Cloud — ensure product + SI DocTypes on Frappe. */
export async function POST(request: Request) {
  if (!isFrappeOwnerIssuanceEnabled()) {
    return NextResponse.json(
      { error: "FRAPPE_OWNER_ISSUANCE is off." },
      { status: 403 },
    );
  }

  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertLiveOperatorAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const dryRun = body.dryRun !== false;
  const includeSi = body.includeSi !== false;
  const product = await ensureProductDocTypes({ dryRun });
  const si = includeSi
    ? await ensureSiDocTypes({ dryRun })
    : {
        ok: true,
        dryRun,
        results: [],
        missing: [],
        message: "SI DocTypes skipped (includeSi:false)",
      };

  const ok = product.ok && si.ok;
  const message = [product.message, si.message].filter(Boolean).join(" · ");

  return NextResponse.json(
    {
      ok,
      dryRun,
      message,
      product,
      si,
      results: [...product.results, ...si.results],
      missing: [...product.missing, ...si.missing],
    },
    { status: ok ? 200 : 502 },
  );
}
