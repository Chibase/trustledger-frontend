import { createHmac, timingSafeEqual } from "crypto";
import { siteBaseUrl } from "@/lib/hubspot";
import {
  formatZarFromCents,
  getPaystackPlan,
  type PaystackPlanId,
} from "@/lib/paystackPlans";
import { computeBillAt, trialVerifyCents } from "@/lib/trialProvision";
import { TRIAL_DAYS as PLAN_TRIAL_DAYS } from "@/config/plans";

const PAYSTACK_API = "https://api.paystack.co";

export type CheckoutMode = "trial_authorize" | "pay_now";

export function paystackSecretKey(): string | null {
  const key = (process.env.PAYSTACK_SECRET_KEY || "").trim();
  return key || null;
}

export function paystackPublicKey(): string | null {
  const key = (
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    process.env.PAYSTACK_PUBLIC_KEY ||
    ""
  ).trim();
  return key || null;
}

export function paystackConfigured(): boolean {
  return Boolean(paystackSecretKey() && paystackPublicKey());
}

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackAuthorization = {
  authorization_code?: string;
  bin?: string;
  last4?: string;
  exp_month?: string;
  exp_year?: string;
  channel?: string;
  card_type?: string;
  bank?: string;
  country_code?: string;
  brand?: string;
  reusable?: boolean;
  signature?: string;
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    customer?: {
      email?: string;
      customer_code?: string;
      id?: number;
    };
    authorization?: PaystackAuthorization;
    metadata?: Record<string, unknown>;
  };
};

type PaystackChargeAuthResponse = {
  status: boolean;
  message: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
  };
};

export async function initializePaystackTransaction(input: {
  email: string;
  planId: PaystackPlanId;
  name?: string;
  organization?: string;
  callbackPath?: string;
  /** Default: trial_authorize (card verify + bill at end of trial). */
  mode?: CheckoutMode;
}): Promise<{
  authorizationUrl: string;
  reference: string;
  amountCents: number;
  planLabel: string;
  mode: CheckoutMode;
  billAt: string | null;
}> {
  const secret = paystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const plan = getPaystackPlan(input.planId);
  if (!plan || !plan.selfServe) {
    throw new Error("Plan is not available for self-serve checkout");
  }
  if (!plan.amountCents) {
    throw new Error(
      `Amount for ${plan.id} is not set. Set PAYSTACK_AMOUNT_${plan.id.toUpperCase()}_CENTS on Vercel.`,
    );
  }

  const mode: CheckoutMode = input.mode === "pay_now" ? "pay_now" : "trial_authorize";
  const amountCents =
    mode === "trial_authorize" ? trialVerifyCents() : plan.amountCents;
  const startedAt = new Date();
  const billAt =
    mode === "trial_authorize" ? computeBillAt(startedAt, PLAN_TRIAL_DAYS) : null;

  const reference = `tl_${mode === "trial_authorize" ? "trial" : "pay"}_${plan.id}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const callback =
    input.callbackPath ||
    `/pay/success?reference=${encodeURIComponent(reference)}`;

  const amountDisplay =
    mode === "trial_authorize"
      ? `${formatZarFromCents(amountCents)} card verification · then ${formatZarFromCents(plan.amountCents)}/mo after ${PLAN_TRIAL_DAYS}-day trial`
      : formatZarFromCents(plan.amountCents);

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: amountCents,
      currency: plan.currency,
      reference,
      callback_url: `${siteBaseUrl()}${callback.startsWith("/") ? callback : `/${callback}`}`,
      metadata: {
        plan: plan.id,
        plan_label: plan.label,
        plan_amount_cents: plan.amountCents,
        name: input.name || "",
        organization: input.organization || "",
        product: "TrustLedger",
        checkout_mode: mode,
        trial_days: mode === "trial_authorize" ? PLAN_TRIAL_DAYS : 0,
        bill_at: billAt ? billAt.toISOString() : "",
        billing_status: mode === "trial_authorize" ? "scheduled" : "paid",
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.label },
          {
            display_name: "Checkout",
            variable_name: "checkout_mode",
            value:
              mode === "trial_authorize"
                ? `${PLAN_TRIAL_DAYS}-day trial · card on file`
                : "Pay now",
          },
          {
            display_name: "Amount",
            variable_name: "amount_display",
            value: amountDisplay,
          },
        ],
      },
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackInitResponse;
  if (!res.ok || !json.status || !json.data?.authorization_url) {
    throw new Error(json.message || "Paystack initialize failed");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference,
    amountCents,
    planLabel: plan.label,
    mode,
    billAt: billAt ? billAt.toISOString() : null,
  };
}

export type VerifiedPaystackTransaction = {
  ok: boolean;
  status: string;
  reference: string;
  amountCents: number;
  currency: string;
  email: string | null;
  paidAt: string | null;
  planId: string | null;
  planLabel: string | null;
  planAmountCents: number | null;
  name: string | null;
  organization: string | null;
  checkoutMode: CheckoutMode;
  billAt: string | null;
  customerCode: string | null;
  authorizationCode: string | null;
  authorizationReusable: boolean;
  authorizationLast4: string | null;
  authorizationBank: string | null;
  billingStatus: string | null;
  raw: PaystackVerifyResponse["data"];
};

export async function verifyPaystackTransaction(
  reference: string,
): Promise<VerifiedPaystackTransaction> {
  const secret = paystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  const json = (await res.json()) as PaystackVerifyResponse;
  const data = json.data;
  const meta = (data?.metadata || {}) as Record<string, unknown>;
  const auth = data?.authorization;
  const modeRaw = meta.checkout_mode;
  const checkoutMode: CheckoutMode =
    modeRaw === "pay_now" ? "pay_now" : "trial_authorize";
  const planAmount =
    typeof meta.plan_amount_cents === "number"
      ? meta.plan_amount_cents
      : typeof meta.plan_amount_cents === "string"
        ? Number(meta.plan_amount_cents)
        : null;

  return {
    ok: Boolean(json.status && data?.status === "success"),
    status: data?.status || "unknown",
    reference: data?.reference || reference,
    amountCents: data?.amount || 0,
    currency: data?.currency || "ZAR",
    email: data?.customer?.email || null,
    paidAt: data?.paid_at || null,
    planId: typeof meta.plan === "string" ? meta.plan : null,
    planLabel: typeof meta.plan_label === "string" ? meta.plan_label : null,
    planAmountCents:
      planAmount != null && Number.isFinite(planAmount) ? planAmount : null,
    name: typeof meta.name === "string" ? meta.name : null,
    organization:
      typeof meta.organization === "string" ? meta.organization : null,
    checkoutMode,
    billAt: typeof meta.bill_at === "string" && meta.bill_at ? meta.bill_at : null,
    customerCode: data?.customer?.customer_code || null,
    authorizationCode: auth?.authorization_code || null,
    authorizationReusable: Boolean(auth?.reusable),
    authorizationLast4: auth?.last4 || null,
    authorizationBank: auth?.bank || null,
    billingStatus:
      typeof meta.billing_status === "string" ? meta.billing_status : null,
    raw: data,
  };
}

/** Charge a reusable authorization after trial (day-14). */
export async function chargePaystackAuthorization(input: {
  authorizationCode: string;
  email: string;
  amountCents: number;
  currency?: string;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  ok: boolean;
  status: string;
  reference: string;
  amountCents: number;
  message: string;
}> {
  const secret = paystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch(`${PAYSTACK_API}/transaction/charge_authorization`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      authorization_code: input.authorizationCode,
      email: input.email,
      amount: input.amountCents,
      currency: input.currency || "ZAR",
      reference: input.reference,
      metadata: input.metadata || {},
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackChargeAuthResponse;
  return {
    ok: Boolean(res.ok && json.status && json.data?.status === "success"),
    status: json.data?.status || (json.status ? "unknown" : "failed"),
    reference: json.data?.reference || input.reference,
    amountCents: json.data?.amount || input.amountCents,
    message: json.message || "",
  };
}

/** Deactivate a reusable authorization (opt-out before trial ends). */
export async function deactivatePaystackAuthorization(
  authorizationCode: string,
): Promise<{ ok: boolean; message: string }> {
  const secret = paystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const res = await fetch(
    `${PAYSTACK_API}/customer/deactivate_authorization`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ authorization_code: authorizationCode }),
      cache: "no-store",
    },
  );
  const json = (await res.json()) as { status?: boolean; message?: string };
  return {
    ok: Boolean(res.ok && json.status),
    message: json.message || (res.ok ? "ok" : "deactivate failed"),
  };
}

export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = paystackSecretKey();
  if (!secret || !signatureHeader) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(hash);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
