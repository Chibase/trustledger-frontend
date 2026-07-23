import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { ensureTrustLedgerCustomFields } from "@/lib/frappeCustomFields";
import {
  listDueTrialCustomers,
  setCustomerEntitlement,
} from "@/lib/entitlementCloud";
import { assertOpsAccess } from "@/lib/platformOperator";
import { recordPaystackPayment } from "@/lib/paymentIntel";
import {
  chargePaystackAuthorization,
  paystackConfigured,
} from "@/lib/paystackServer";
import type { PaystackPlanId } from "@/lib/paystackPlans";
import { getPaystackPlan } from "@/lib/paystackPlans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorizeCron(request: Request): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

/**
 * OD-4 — charge all due trial Customers (cron or Ops with dryRun).
 * Auth: Bearer CRON_SECRET, or Platform Operator session.
 */
export async function GET(request: Request) {
  return runChargeDue(request, { dryRun: false });
}

export async function POST(request: Request) {
  let dryRun = false;
  try {
    const body = (await request.json()) as { dryRun?: boolean };
    dryRun = body.dryRun === true;
  } catch {
    dryRun = false;
  }
  return runChargeDue(request, { dryRun });
}

async function runChargeDue(
  request: Request,
  options: { dryRun: boolean },
) {
  if (!paystackConfigured()) {
    return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 });
  }

  const cronOk = authorizeCron(request);
  if (!cronOk) {
    const jar = await cookies();
    const operator = jar.get(TL_USER_EMAIL_COOKIE)?.value;
    const gate = assertOpsAccess(operator);
    if (!gate.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await ensureTrustLedgerCustomFields({ dryRun: false }).catch(() => undefined);

  const due = await listDueTrialCustomers();
  if (options.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      dueCount: due.length,
      due: due.map((d) => ({
        customer: d.name,
        email: d.ownerEmail,
        billAt: d.billAt,
        planId: d.planId,
        amountCents: d.amountCents,
      })),
      message: due.length
        ? `${due.length} Customer(s) due — set dryRun:false or wait for cron to charge.`
        : "No due trial Customers.",
    });
  }

  const results: Array<{
    customer: string;
    email: string;
    ok: boolean;
    status?: string;
    error?: string;
  }> = [];

  for (const row of due) {
    const planId = (row.planId || "practitioner") as PaystackPlanId;
    const plan = getPaystackPlan(planId);
    const amountCents = row.amountCents || plan?.amountCents || 0;
    if (!amountCents) {
      results.push({
        customer: row.name,
        email: row.ownerEmail,
        ok: false,
        error: "Missing plan amount",
      });
      continue;
    }

    const reference = `tl_due_${planId}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    try {
      const charged = await chargePaystackAuthorization({
        authorizationCode: row.authorizationCode,
        email: row.ownerEmail,
        amountCents,
        reference,
        metadata: {
          checkout_mode: "trial_due",
          plan: planId,
          plan_label: plan?.label || planId,
          product: "TrustLedger",
          customer: row.name,
        },
      });

      if (charged.ok) {
        await recordPaystackPayment({
          email: row.ownerEmail,
          organization: row.organization,
          planId,
          planLabel: plan?.label,
          amountCents: charged.amountCents,
          currency: "ZAR",
          reference: charged.reference,
          paidAt: new Date().toISOString(),
        });
        await setCustomerEntitlement(row.name, "active");
        results.push({
          customer: row.name,
          email: row.ownerEmail,
          ok: true,
          status: charged.status,
        });
      } else {
        await setCustomerEntitlement(row.name, "past_due");
        results.push({
          customer: row.name,
          email: row.ownerEmail,
          ok: false,
          status: charged.status,
          error: charged.message,
        });
      }
    } catch (err) {
      await setCustomerEntitlement(row.name, "past_due");
      results.push({
        customer: row.name,
        email: row.ownerEmail,
        ok: false,
        error: err instanceof Error ? err.message : "Charge failed",
      });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    ok: true,
    dueCount: due.length,
    charged: okCount,
    failed: results.length - okCount,
    results,
    message: due.length
      ? `Processed ${results.length} due trial(s): ${okCount} charged, ${results.length - okCount} failed/past_due.`
      : "No due trial Customers.",
  });
}
