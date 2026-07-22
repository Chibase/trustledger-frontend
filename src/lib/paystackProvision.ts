import { isPlanId, type PlanId } from "@/config/plans";
import { siteBaseUrl } from "@/lib/hubspot";
import {
  recordPaystackPayment,
  recordTrialCardAuthorize,
} from "@/lib/paymentIntel";
import type { VerifiedPaystackTransaction } from "@/lib/paystackServer";
import { getPaystackPlan } from "@/lib/paystackPlans";
import {
  computeBillAt,
  hashTrialPassword,
  signTrialActivationToken,
  tempPasswordForReference,
} from "@/lib/trialProvision";
import {
  sendTrialWelcomeEmail,
  transactionalEmailConfigured,
} from "@/lib/transactionalEmail";
import {
  isFrappeAutoProvisionEnabled,
  provisionOwnerOnCloud,
} from "@/lib/provisionOwnerCloud";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";

export type TrialProvisionResult = {
  flow: "trial_authorize" | "pay_now";
  email: string;
  name: string;
  planId: PlanId | null;
  planLabel: string | null;
  organization: string | null;
  reference: string;
  amountCents: number;
  currency: string;
  billAt: string | null;
  tempPassword: string | null;
  activationToken: string | null;
  emailSent: boolean;
  emailDetail?: string;
  logged: boolean;
  /** OD-3 — Frappe Customer+User auto-provision outcome */
  cloudProvision?: {
    ok: boolean;
    skipped?: boolean;
    customerName?: string;
    error?: string;
  };
};

/**
 * After Paystack verify success: log CRM, optionally mint trial credentials.
 * Webhook should pass mintCredentials:false; success-page verify mints once.
 */
export async function provisionAfterPaystackVerify(
  verified: VerifiedPaystackTransaction,
  options: { mintCredentials?: boolean } = {},
): Promise<TrialProvisionResult | null> {
  if (!verified.ok || !verified.email) return null;

  const mintCredentials = options.mintCredentials !== false;

  const email = verified.email.trim().toLowerCase();
  const name =
    (verified.name || "").trim() || email.split("@")[0] || "TrustLedger user";
  const planId =
    verified.planId && isPlanId(verified.planId) ? verified.planId : null;
  const plan = planId ? getPaystackPlan(planId) : null;
  const planLabel = verified.planLabel || plan?.label || planId;
  const planAmountCents =
    verified.planAmountCents || plan?.amountCents || verified.amountCents;
  const organization = verified.organization;

  if (verified.checkoutMode === "pay_now") {
    const logged = await recordPaystackPayment({
      email,
      name,
      organization,
      planId,
      planLabel,
      amountCents: verified.amountCents,
      currency: verified.currency,
      reference: verified.reference,
      paidAt: verified.paidAt,
    });

    let cloudProvision: TrialProvisionResult["cloudProvision"];
    if (
      isFrappeAutoProvisionEnabled() &&
      isFrappeOwnerIssuanceEnabled() &&
      planId
    ) {
      const cloud = await provisionOwnerOnCloud({
        organization: organization || `${name}'s TrustLedger`,
        ownerEmail: email,
        ownerName: name,
        planId,
        status: "active",
        sendWelcomeEmail: true,
      });
      cloudProvision = {
        ok: cloud.ok,
        skipped: cloud.skipped,
        customerName: cloud.customerName,
        error: cloud.error,
      };
    }

    return {
      flow: "pay_now",
      email,
      name,
      planId,
      planLabel,
      organization,
      reference: verified.reference,
      amountCents: verified.amountCents,
      currency: verified.currency,
      billAt: null,
      tempPassword: null,
      activationToken: null,
      emailSent: false,
      logged: logged.logged,
      cloudProvision,
    };
  }

  const startedAt = new Date();
  const billAt =
    verified.billAt || computeBillAt(startedAt).toISOString();

  const logged = await recordTrialCardAuthorize({
    email,
    name,
    organization,
    planId,
    planLabel,
    verifyAmountCents: verified.amountCents,
    planAmountCents,
    currency: verified.currency,
    reference: verified.reference,
    billAt,
    customerCode: verified.customerCode,
    authorizationCode: verified.authorizationCode,
    authorizationLast4: verified.authorizationLast4,
    authorizationBank: verified.authorizationBank,
    authorizationReusable: verified.authorizationReusable,
    paidAt: verified.paidAt,
  });

  if (!mintCredentials || !planId) {
    let cloudProvision: TrialProvisionResult["cloudProvision"];
    if (
      isFrappeAutoProvisionEnabled() &&
      isFrappeOwnerIssuanceEnabled() &&
      planId
    ) {
      const cloud = await provisionOwnerOnCloud({
        organization: organization || `${name}'s TrustLedger`,
        ownerEmail: email,
        ownerName: name,
        planId,
        status: "trial",
        sendWelcomeEmail: false,
      });
      cloudProvision = {
        ok: cloud.ok,
        skipped: cloud.skipped,
        customerName: cloud.customerName,
        error: cloud.error,
      };
    }

    return {
      flow: "trial_authorize",
      email,
      name,
      planId,
      planLabel,
      organization,
      reference: verified.reference,
      amountCents: verified.amountCents,
      currency: verified.currency,
      billAt,
      tempPassword: null,
      activationToken: null,
      emailSent: false,
      emailDetail: mintCredentials
        ? "Missing plan id — credentials not issued"
        : "Credentials minted on success-page verify",
      logged: logged.logged,
      cloudProvision,
    };
  }

  const tempPassword = tempPasswordForReference(verified.reference);
  const passHash = hashTrialPassword(tempPassword);
  const activationToken = signTrialActivationToken({
    email,
    name,
    planId,
    organization: organization || undefined,
    startedAt: startedAt.toISOString(),
    billAt,
    reference: verified.reference,
    passHash,
    authorizationCode: verified.authorizationCode || undefined,
  });

  let emailSent = false;
  let emailDetail: string | undefined;
  const base = siteBaseUrl();
  const mail = await sendTrialWelcomeEmail({
    to: email,
    name,
    tempPassword,
    planLabel: planLabel || planId,
    trialEndsAt: new Date(billAt).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    loginUrl: `${base}/login/trial`,
    workspaceUrl: `${base}/pay/activate?token=${encodeURIComponent(activationToken)}`,
  });
  emailSent = mail.sent;
  emailDetail = mail.detail;
  if (!mail.sent && !transactionalEmailConfigured()) {
    emailDetail =
      "Email provider not configured — credentials shown on success page only";
  }

  let cloudProvision: TrialProvisionResult["cloudProvision"];
  if (isFrappeAutoProvisionEnabled() && isFrappeOwnerIssuanceEnabled()) {
    const cloud = await provisionOwnerOnCloud({
      organization: organization || `${name}'s TrustLedger`,
      ownerEmail: email,
      ownerName: name,
      planId,
      status: "trial",
      sendWelcomeEmail: false,
    });
    cloudProvision = {
      ok: cloud.ok,
      skipped: cloud.skipped,
      customerName: cloud.customerName,
      error: cloud.error,
    };
  }

  return {
    flow: "trial_authorize",
    email,
    name,
    planId,
    planLabel,
    organization,
    reference: verified.reference,
    amountCents: verified.amountCents,
    currency: verified.currency,
    billAt,
    tempPassword,
    activationToken,
    emailSent,
    emailDetail,
    logged: logged.logged,
    cloudProvision,
  };
}
