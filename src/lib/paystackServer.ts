import { createHmac, timingSafeEqual } from "crypto";
import { siteBaseUrl } from "@/lib/hubspot";
import {
  formatZarFromCents,
  getPaystackPlan,
  type PaystackPlanId,
} from "@/lib/paystackPlans";

const PAYSTACK_API = "https://api.paystack.co";

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

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    customer?: { email?: string; customer_code?: string };
    metadata?: Record<string, unknown>;
  };
};

export async function initializePaystackTransaction(input: {
  email: string;
  planId: PaystackPlanId;
  name?: string;
  organization?: string;
  callbackPath?: string;
}): Promise<{
  authorizationUrl: string;
  reference: string;
  amountCents: number;
  planLabel: string;
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

  const reference = `tl_${plan.id}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const callback =
    input.callbackPath ||
    `/pay/success?reference=${encodeURIComponent(reference)}`;

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: plan.amountCents,
      currency: plan.currency,
      reference,
      callback_url: `${siteBaseUrl()}${callback.startsWith("/") ? callback : `/${callback}`}`,
      metadata: {
        plan: plan.id,
        plan_label: plan.label,
        name: input.name || "",
        organization: input.organization || "",
        product: "TrustLedger",
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.label },
          {
            display_name: "Amount",
            variable_name: "amount_display",
            value: formatZarFromCents(plan.amountCents),
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
    amountCents: plan.amountCents,
    planLabel: plan.label,
  };
}

export async function verifyPaystackTransaction(reference: string): Promise<{
  ok: boolean;
  status: string;
  reference: string;
  amountCents: number;
  currency: string;
  email: string | null;
  paidAt: string | null;
  planId: string | null;
  planLabel: string | null;
  name: string | null;
  organization: string | null;
  raw: PaystackVerifyResponse["data"];
}> {
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
    name: typeof meta.name === "string" ? meta.name : null,
    organization: typeof meta.organization === "string" ? meta.organization : null,
    raw: data,
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
