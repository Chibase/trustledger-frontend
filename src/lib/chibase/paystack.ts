/**
 * Chibase Consulting Paystack checkout (ADR-048).
 * Same Paystack keys as TrustLedger; metadata.catalogue = "chibase".
 * Never provisions a TrustLedger workspace or Plan Owner.
 */

import { siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import { notifyOpsAlert } from "@/lib/opsAlert";
import {
  formatChibasePackagePrice,
  getChibasePackage,
  type ChibasePackageId,
} from "@/lib/chibase/packages";
import { paystackSecretKey, type VerifiedPaystackTransaction } from "@/lib/paystackServer";
import { chibaseCheckoutCallback, chibasePublicHref } from "@/lib/security/hosts";

const PAYSTACK_API = "https://api.paystack.co";

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export function isChibasePaystackTransaction(
  verified: Pick<VerifiedPaystackTransaction, "catalogue" | "reference">,
): boolean {
  return verified.catalogue === "chibase" || verified.reference.startsWith("cb_");
}

export async function initializeChibasePaystackTransaction(input: {
  email: string;
  packageId: ChibasePackageId;
  name?: string;
  organization?: string;
  request: Request;
}): Promise<{
  authorizationUrl: string;
  reference: string;
  amountCents: number;
  packageLabel: string;
}> {
  const secret = paystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const pkg = getChibasePackage(input.packageId);
  if (!pkg || !pkg.selfServe || !pkg.amountCents) {
    throw new Error("This package is request-only until a list price is set.");
  }

  const reference = `cb_pay_${pkg.id}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const { origin, successPath } = chibaseCheckoutCallback(input.request);
  const callback = `${successPath}?reference=${encodeURIComponent(reference)}`;

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: pkg.amountCents,
      currency: pkg.currency,
      reference,
      callback_url: `${origin}${callback.startsWith("/") ? callback : `/${callback}`}`,
      metadata: {
        catalogue: "chibase",
        package: pkg.id,
        package_label: pkg.label,
        package_amount_cents: pkg.amountCents,
        name: input.name || "",
        organization: input.organization || "",
        product: "Chibase Consulting",
        checkout_mode: "pay_now",
        billing_status: "paid",
        custom_fields: [
          {
            display_name: "Catalogue",
            variable_name: "catalogue",
            value: "Chibase Consulting",
          },
          {
            display_name: "Package",
            variable_name: "package",
            value: pkg.label,
          },
          {
            display_name: "Amount",
            variable_name: "amount_display",
            value: formatChibasePackagePrice(pkg),
          },
        ],
      },
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackInitResponse;
  if (!res.ok || !json.status || !json.data?.authorization_url) {
    throw new Error(json.message || "Could not start checkout");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference,
    amountCents: pkg.amountCents,
    packageLabel: pkg.label,
  };
}

export async function recordChibasePackagePayment(
  verified: VerifiedPaystackTransaction,
): Promise<{ logged: boolean; detail?: string; packageLabel: string }> {
  const pkg = getChibasePackage(verified.packageId);
  const packageLabel =
    pkg?.label ||
    (typeof verified.planLabel === "string" && verified.planLabel) ||
    verified.packageId ||
    "Consulting package";
  const amountLabel = formatChibasePackagePrice({
    amountCents: verified.amountCents,
  });
  const email = (verified.email || "").trim().toLowerCase();

  if (!email) {
    return { logged: false, detail: "Missing email", packageLabel };
  }

  if (!leadCaptureConfigured()) {
    return { logged: false, detail: "CRM lead capture not configured", packageLabel };
  }

  const message = [
    "Chibase Consulting package payment (separate from TrustLedger software plans).",
    "Do not provision a TrustLedger Plan Owner from this payment.",
    `Package: ${packageLabel}.`,
    `Amount: ${amountLabel} ${verified.currency}.`,
    `Reference: ${verified.reference}.`,
    verified.organization ? `Organization: ${verified.organization}.` : null,
    verified.paidAt ? `Paid at: ${verified.paidAt}.` : null,
    `Captured: ${new Date().toISOString()}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await submitProductLead({
    email,
    name: (verified.name || "").trim() || email.split("@")[0],
    company: verified.organization || undefined,
    message,
    pageUri: chibasePublicHref("/packages/success"),
    pageName: "Chibase Consulting package payment",
    sourceTag: "chibase_package",
    crmSource: "Chibase Consulting",
    jobTitle: `Chibase package · ${packageLabel} · ${amountLabel} · ref ${verified.reference}`,
    userQuote: `Paid ${amountLabel} for ${packageLabel} (ref ${verified.reference})`,
  });

  if (result.ok) {
    void notifyOpsAlert({
      kind: "chibase_package",
      title: "Chibase Consulting package payment",
      summary: `${email} · ${packageLabel} · ${amountLabel} · ref ${verified.reference}`,
      href: `${siteBaseUrl()}/ops/finance`,
    });
  }

  return {
    logged: result.ok,
    detail: result.ok ? undefined : result.detail || result.backend,
    packageLabel,
  };
}
