import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import { initializeChibasePaystackTransaction } from "@/lib/chibase/paystack";
import {
  getChibasePackage,
  isChibasePackageId,
  type ChibasePackageId,
} from "@/lib/chibase/packages";
import {
  assertLeadFormGuards,
  readHoneypot,
} from "@/lib/formGuard";
import { paystackConfigured } from "@/lib/paystackServer";

type Body = {
  email?: string;
  name?: string;
  organization?: string;
  package?: string;
  captchaToken?: string;
  tl_hp?: string;
};

export async function POST(request: Request) {
  if (!paystackConfigured()) {
    return NextResponse.json(
      {
        error:
          "Checkout is not configured on this deployment yet. Request the package instead.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const guard = await assertLeadFormGuards(request, {
    routeKey: "chibase-package-pay",
    honeypot: readHoneypot(body as unknown as Record<string, unknown>),
    captchaToken: body.captchaToken,
    captchaAction: "chibase_package_pay",
  });
  if (!guard.ok) {
    if (guard.silent) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = body.name?.trim();
  const organization = body.organization?.trim();
  const packageId = (body.package || "").trim() as ChibasePackageId;
  const pkg = isChibasePackageId(packageId)
    ? getChibasePackage(packageId)
    : null;

  if (!email || !isWorkEmail(email)) {
    return NextResponse.json(
      { error: "Please use a valid work email address." },
      { status: 400 },
    );
  }
  if (!pkg) {
    return NextResponse.json(
      { error: "Unknown consulting package." },
      { status: 400 },
    );
  }
  if (!pkg.selfServe || !pkg.amountCents) {
    return NextResponse.json(
      {
        error:
          "This package is priced on request. Use Request this package instead of paying online.",
      },
      { status: 400 },
    );
  }

  try {
    const init = await initializeChibasePaystackTransaction({
      email,
      packageId: pkg.id,
      name,
      organization,
      request,
    });
    return NextResponse.json({
      ok: true,
      authorizationUrl: init.authorizationUrl,
      reference: init.reference,
      amountCents: init.amountCents,
      packageLabel: init.packageLabel,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not start checkout",
      },
      { status: 502 },
    );
  }
}
