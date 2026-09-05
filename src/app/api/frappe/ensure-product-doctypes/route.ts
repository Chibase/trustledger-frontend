import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { ensureProductDocTypes } from "@/lib/frappeProductDocTypes";
import { ensureSepDocTypes } from "@/lib/frappeSepDocTypes";
import { ensureSiDocTypes } from "@/lib/frappeSiDocTypes";
import { ensureTrustDocTypes } from "@/lib/frappeTrustDocTypes";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  dryRun?: boolean;
  includeSi?: boolean;
  includeTrust?: boolean;
  includeSep?: boolean;
};

/** OD-2 / SI-Cloud / SI-SEP / TE-7 — ensure product + SI + SEP + trust DocTypes. */
export async function POST(request: Request) {
  if (!isFrappeOwnerIssuanceEnabled()) {
    return NextResponse.json(
      { error: "FRAPPE_OWNER_ISSUANCE is off." },
      { status: 403 },
    );
  }

  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(email);
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
  const includeTrust = body.includeTrust !== false;
  const includeSep = body.includeSep !== false;
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
  const sep = includeSep
    ? await ensureSepDocTypes({ dryRun })
    : {
        ok: true,
        dryRun,
        results: [],
        missing: [],
        message: "SEP DocTypes skipped (includeSep:false)",
      };
  const trust = includeTrust
    ? await ensureTrustDocTypes({ dryRun })
    : {
        ok: true,
        dryRun,
        results: [],
        missing: [],
        message: "Trust DocTypes skipped (includeTrust:false)",
      };

  const ok = product.ok && si.ok && sep.ok && trust.ok;
  const message = [product.message, si.message, sep.message, trust.message]
    .filter(Boolean)
    .join(" · ");

  return NextResponse.json(
    {
      ok,
      dryRun,
      message,
      product,
      si,
      sep,
      trust,
      results: [
        ...product.results,
        ...si.results,
        ...sep.results,
        ...trust.results,
      ],
      missing: [
        ...product.missing,
        ...si.missing,
        ...sep.missing,
        ...trust.missing,
      ],
    },
    { status: ok ? 200 : 502 },
  );
}
