import { siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import { notifyOpsAlert } from "@/lib/opsAlert";
import { formatZarFromCents } from "@/lib/paystackPlans";
import { buildOpsOverview, type OpsActivityRow } from "@/lib/opsIntel";

export type PaymentEvent = {
  name: string;
  person: string;
  email: string | null;
  organization: string | null;
  planLabel: string;
  amountLabel: string;
  reference: string | null;
  status: string;
  modified: string | null;
};

function parsePaymentFields(row: OpsActivityRow): {
  planLabel: string;
  amountLabel: string;
  reference: string | null;
} {
  const title = row.job_title || "";
  const plan =
    title.match(/Payment\s*·\s*([^·]+)/i)?.[1]?.trim() ||
    row.source ||
    "Plan";
  const amount =
    title.match(/·\s*(R[\d\s,.]+)/i)?.[1]?.trim() || "—";
  const reference =
    title.match(/ref\s*([A-Za-z0-9_-]+)/i)?.[1] || null;
  return { planLabel: plan, amountLabel: amount, reference };
}

export async function recordPaystackPayment(input: {
  email: string;
  name?: string | null;
  organization?: string | null;
  planId?: string | null;
  planLabel?: string | null;
  amountCents: number;
  currency: string;
  reference: string;
  paidAt?: string | null;
}): Promise<{ logged: boolean; detail?: string }> {
  if (!leadCaptureConfigured()) {
    return { logged: false, detail: "CRM lead capture not configured" };
  }

  const planLabel = input.planLabel || input.planId || "Plan";
  const amountLabel = formatZarFromCents(input.amountCents);
  const message = [
    "TrustLedger Paystack payment (Vercel checkout).",
    `Status: Paid.`,
    `Plan: ${planLabel}.`,
    `Amount: ${amountLabel} ${input.currency}.`,
    `Reference: ${input.reference}.`,
    input.organization ? `Organization: ${input.organization}.` : null,
    input.paidAt ? `Paid at: ${input.paidAt}.` : null,
    `Captured: ${new Date().toISOString()}.`,
    "Action: update CRM Customer manually and provision Plan Owner when lockdown allows.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await submitProductLead({
    email: input.email,
    name: input.name || input.email.split("@")[0],
    company: input.organization || undefined,
    message,
    pageUri: `${siteBaseUrl()}/pay/success`,
    pageName: "TrustLedger Paystack payment",
    sourceTag: "paystack_payment",
    crmSource: "Paystack Payment",
    jobTitle: `Payment · ${planLabel} · ${amountLabel} · ref ${input.reference}`,
    userQuote: `Paid ${amountLabel} for ${planLabel} (ref ${input.reference})`,
  });

  if (result.ok) {
    void notifyOpsAlert({
      kind: "paystack_payment",
      title: "TrustLedger Paystack payment",
      summary: `${input.email} · ${planLabel} · ${amountLabel} · ref ${input.reference}`,
      href: `${siteBaseUrl()}/ops/finance`,
    });
  }

  return {
    logged: result.ok,
    detail: result.ok ? undefined : result.detail || result.backend,
  };
}

/** Card verified for 14-day trial — charge scheduled at billAt unless opted out. */
export async function recordTrialCardAuthorize(input: {
  email: string;
  name?: string | null;
  organization?: string | null;
  planId?: string | null;
  planLabel?: string | null;
  verifyAmountCents: number;
  planAmountCents: number;
  currency: string;
  reference: string;
  billAt: string;
  customerCode?: string | null;
  authorizationCode?: string | null;
  authorizationLast4?: string | null;
  authorizationBank?: string | null;
  authorizationReusable?: boolean;
  paidAt?: string | null;
}): Promise<{ logged: boolean; detail?: string }> {
  if (!leadCaptureConfigured()) {
    return { logged: false, detail: "CRM lead capture not configured" };
  }

  const planLabel = input.planLabel || input.planId || "Plan";
  const verifyLabel = formatZarFromCents(input.verifyAmountCents);
  const planPrice = formatZarFromCents(input.planAmountCents);
  const message = [
    "TrustLedger trial subscribe — card verified (Vercel / Paystack).",
    `Status: Trial active · billing scheduled.`,
    `Plan: ${planLabel}.`,
    `Verification charge: ${verifyLabel} ${input.currency}.`,
    `Scheduled plan charge: ${planPrice}/mo at ${input.billAt} (unless opted out).`,
    `Reference: ${input.reference}.`,
    input.customerCode ? `Paystack customer: ${input.customerCode}.` : null,
    input.authorizationCode
      ? `Authorization: ${input.authorizationCode} (reusable=${Boolean(input.authorizationReusable)}).`
      : "Authorization: missing — cannot auto-charge at trial end.",
    input.authorizationLast4
      ? `Card/bank: ****${input.authorizationLast4}${input.authorizationBank ? ` · ${input.authorizationBank}` : ""}.`
      : null,
    input.organization ? `Organization: ${input.organization}.` : null,
    input.paidAt ? `Verified at: ${input.paidAt}.` : null,
    "Temp login credentials emailed / shown on success page (change on first sign-in).",
    `Captured: ${new Date().toISOString()}.`,
    "Action: trial workspace is live in browser; Plan Owner Frappe login when lockdown allows. Charge via Ops charge-due if still scheduled on bill date.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await submitProductLead({
    email: input.email,
    name: input.name || input.email.split("@")[0],
    company: input.organization || undefined,
    message,
    pageUri: `${siteBaseUrl()}/pay/success`,
    pageName: "TrustLedger trial card authorize",
    sourceTag: "trial_authorize",
    crmSource: "Trial Authorize",
    jobTitle: `Trial · ${planLabel} · bill ${input.billAt.slice(0, 10)} · ref ${input.reference}`,
    userQuote: `Trial card on file for ${planLabel}; charge ${planPrice} on ${input.billAt.slice(0, 10)} (ref ${input.reference})`,
  });

  if (result.ok) {
    void notifyOpsAlert({
      kind: "trial_authorize",
      title: "TrustLedger trial card verified",
      summary: `${input.email} · ${planLabel} · bill ${input.billAt.slice(0, 10)} · ref ${input.reference}`,
      href: `${siteBaseUrl()}/ops/finance`,
    });
  }

  return {
    logged: result.ok,
    detail: result.ok ? undefined : result.detail || result.backend,
  };
}

/** Customer opted out before trial end — do not charge authorization. */
export async function recordTrialOptOut(input: {
  email: string;
  name?: string | null;
  organization?: string | null;
  planId?: string | null;
  planLabel?: string | null;
  reference?: string | null;
  authorizationCode?: string | null;
  deactivated?: boolean;
}): Promise<{ logged: boolean; detail?: string }> {
  if (!leadCaptureConfigured()) {
    return { logged: false, detail: "CRM lead capture not configured" };
  }

  const planLabel = input.planLabel || input.planId || "Plan";
  const message = [
    "TrustLedger trial billing opt-out.",
    `Status: Cancelled — do not charge at trial end.`,
    `Plan: ${planLabel}.`,
    input.reference ? `Original reference: ${input.reference}.` : null,
    input.authorizationCode
      ? `Authorization: ${input.authorizationCode} · deactivated=${Boolean(input.deactivated)}.`
      : null,
    input.organization ? `Organization: ${input.organization}.` : null,
    `Captured: ${new Date().toISOString()}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await submitProductLead({
    email: input.email,
    name: input.name || input.email.split("@")[0],
    company: input.organization || undefined,
    message,
    pageUri: `${siteBaseUrl()}/app/settings`,
    pageName: "TrustLedger trial opt-out",
    sourceTag: "trial_opt_out",
    crmSource: "Trial Opt-Out",
    jobTitle: `Opt-out · ${planLabel}${input.reference ? ` · ref ${input.reference}` : ""}`,
    userQuote: `Cancelled trial billing for ${planLabel}`,
  });

  if (result.ok) {
    void notifyOpsAlert({
      kind: "trial_opt_out",
      title: "TrustLedger trial billing cancelled",
      summary: `${input.email} · ${planLabel}${input.reference ? ` · ref ${input.reference}` : ""}`,
      href: `${siteBaseUrl()}/ops/finance`,
    });
  }

  return {
    logged: result.ok,
    detail: result.ok ? undefined : result.detail || result.backend,
  };
}

/** Operator-confirmed EFT / invoice payment (quote path). */
export async function recordEftPayment(input: {
  email: string;
  name?: string | null;
  organization?: string | null;
  planId?: string | null;
  planLabel?: string | null;
  amountCents: number;
  currency: string;
  reference: string;
  note?: string | null;
  confirmedBy?: string | null;
  paidAt?: string | null;
}): Promise<{ logged: boolean; detail?: string }> {
  if (!leadCaptureConfigured()) {
    return { logged: false, detail: "CRM lead capture not configured" };
  }

  const planLabel = input.planLabel || input.planId || "Plan";
  const amountLabel = formatZarFromCents(input.amountCents);
  const message = [
    "TrustLedger EFT / invoice payment (operator confirmed).",
    `Status: Paid.`,
    `Plan: ${planLabel}.`,
    `Amount: ${amountLabel} ${input.currency}.`,
    `Reference: ${input.reference}.`,
    input.organization ? `Organization: ${input.organization}.` : null,
    input.confirmedBy ? `Confirmed by: ${input.confirmedBy}.` : null,
    input.note ? `Note: ${input.note}.` : null,
    input.paidAt ? `Paid at: ${input.paidAt}.` : null,
    `Captured: ${new Date().toISOString()}.`,
    "Action: update CRM Customer manually and provision Plan Owner when lockdown allows.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await submitProductLead({
    email: input.email,
    name: input.name || input.email.split("@")[0],
    company: input.organization || undefined,
    message,
    pageUri: `${siteBaseUrl()}/ops/finance`,
    pageName: "TrustLedger EFT payment confirmed",
    sourceTag: "eft_payment",
    crmSource: "EFT Payment",
    jobTitle: `Payment · ${planLabel} · ${amountLabel} · ref ${input.reference}`,
    userQuote: `EFT paid ${amountLabel} for ${planLabel} (ref ${input.reference})`,
  });

  return {
    logged: result.ok,
    detail: result.ok ? undefined : result.detail || result.backend,
  };
}

export async function listRecentPayments(limit = 20): Promise<{
  ok: boolean;
  total: number;
  recent: PaymentEvent[];
  detail?: string;
}> {
  const overview = await buildOpsOverview();
  const rows = overview.intake.recent.filter((r) => {
    const title = (r.job_title || "").toLowerCase();
    const source = (r.source || "").toLowerCase();
    return (
      title.includes("payment") ||
      title.includes("trial") ||
      title.includes("opt-out") ||
      source.includes("paystack") ||
      source.includes("eft") ||
      source.includes("trial")
    );
  });

  return {
    ok: overview.ok,
    total: rows.length,
    detail: overview.detail,
    recent: rows.slice(0, limit).map((row) => {
      const parsed = parsePaymentFields(row);
      return {
        name: row.name,
        person: row.lead_name || row.name,
        email: row.email || null,
        organization: row.organization || null,
        planLabel: parsed.planLabel,
        amountLabel: parsed.amountLabel,
        reference: parsed.reference,
        status: row.status || "New",
        modified: row.modified || null,
      };
    }),
  };
}
