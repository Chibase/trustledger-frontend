/**
 * OD-3 — provision Customer + Plan Owner User on Frappe via API keys.
 * Callable from Ops route and Paystack verify/webhook (no browser cookie).
 */

import type { PlanId } from "@/config/plans";
import { ensureTrustLedgerCustomFields } from "@/lib/frappeCustomFields";
import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import {
  buildCustomerDraft,
  buildOwnerUserDraft,
  type FrappeCustomerDraft,
  type FrappeOwnerUserDraft,
} from "@/lib/frappeSoT";
import { PLAN_OWNER_DESK_TIER } from "@/types/deskTier";
import { toFrappeDatetime } from "@/lib/productCloud";

export function isFrappeAutoProvisionEnabled(): boolean {
  return (
    process.env.FRAPPE_AUTO_PROVISION === "1" ||
    process.env.FRAPPE_AUTO_PROVISION === "true"
  );
}

export type ProvisionOwnerInput = {
  organization: string;
  ownerEmail: string;
  ownerName: string;
  planId: PlanId;
  orgId?: string;
  status?: FrappeCustomerDraft["entitlement_status"];
  ensureFields?: boolean;
  sendWelcomeEmail?: boolean;
  /** OD-4 billing fields */
  billAt?: string | null;
  authorizationCode?: string | null;
  planAmountCents?: number | null;
  /**
   * Complimentary VIP: full plan, entitlement active, no Paystack auth/bill_at.
   * Isolated from day-14 charge-due (cron requires authorization_code).
   */
  complimentaryVip?: boolean;
  /** ISO date (YYYY-MM-DD) for operator reminder — stored on Customer comment. */
  complimentaryUntil?: string | null;
};

/** Prefix org name so VIP pilots never mix with paying Customers in Desk lists. */
export function vipPilotOrganizationName(organization: string, ownerName: string): string {
  const base =
    organization.trim() || `${ownerName.trim() || "Guest"}'s TrustLedger`;
  if (/^VIP Pilot\b/i.test(base)) return base;
  return `VIP Pilot — ${base}`;
}

export type ProvisionOwnerCloudResult = {
  ok: boolean;
  skipped?: boolean;
  customerName?: string;
  userEmail?: string;
  customer?: FrappeCustomerDraft;
  user?: FrappeOwnerUserDraft;
  error?: string;
  detail?: string;
};

function authHeaders(key: string, secret: string): HeadersInit {
  return {
    Authorization: `token ${cleanSecret(key)}:${cleanSecret(secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function findCustomerByOwnerEmail(
  base: string,
  headers: HeadersInit,
  ownerEmail: string,
): Promise<string | null> {
  const filters = encodeURIComponent(
    JSON.stringify([["custom_owner_email", "=", ownerEmail]]),
  );
  const res = await fetch(
    `${base}/api/resource/Customer?filters=${filters}&fields=${encodeURIComponent(JSON.stringify(["name"]))}&limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string }> };
  return json.data?.[0]?.name || null;
}

async function userExists(
  base: string,
  headers: HeadersInit,
  email: string,
): Promise<boolean> {
  const res = await fetch(
    `${base}/api/resource/User/${encodeURIComponent(email)}`,
    { headers, cache: "no-store" },
  );
  return res.ok;
}

/**
 * Idempotent Customer + Owner User create.
 * Skips if Customer already exists for owner email (and User exists).
 */
export async function provisionOwnerOnCloud(
  input: ProvisionOwnerInput,
): Promise<ProvisionOwnerCloudResult> {
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const ownerName = input.ownerName.trim();
  const complimentary = Boolean(input.complimentaryVip);
  const organization = complimentary
    ? vipPilotOrganizationName(input.organization, ownerName)
    : input.organization.trim() || `${ownerName}'s TrustLedger`;

  if (!ownerEmail.includes("@") || !ownerName) {
    return { ok: false, error: "ownerEmail and ownerName required" };
  }

  const pair = frappeKeyPair();
  const base = frappeBase();
  if (!pair || !base) {
    return { ok: false, error: "FRAPPE_API_KEY / SECRET / BASE_URL missing" };
  }

  const headers = authHeaders(pair.key, pair.secret);
  const entitlementStatus = complimentary
    ? "active"
    : input.status || "trial";
  const billAt = complimentary ? null : input.billAt || null;
  const authorizationCode = complimentary
    ? null
    : input.authorizationCode || null;
  const planAmountCents = complimentary ? 0 : input.planAmountCents ?? undefined;

  const customer = buildCustomerDraft({
    organization,
    ownerEmail,
    ownerName,
    planId: input.planId,
    orgId: input.orgId,
    status: entitlementStatus,
  });
  const user = buildOwnerUserDraft({
    email: ownerEmail,
    fullName: ownerName,
    customerName: customer.customer_name,
    deskTier: PLAN_OWNER_DESK_TIER[input.planId],
  });

  if (input.ensureFields !== false) {
    const fields = await ensureTrustLedgerCustomFields({ dryRun: false });
    if (!fields.ok) {
      return {
        ok: false,
        error: "Custom fields ensure failed",
        detail: fields.message,
        customer,
        user,
      };
    }
  }

  async function stampVipComment(customerName: string) {
    if (!complimentary) return;
    const until = (input.complimentaryUntil || "").trim();
    const text = [
      "TrustLedger complimentary VIP access",
      `Plan: ${input.planId}`,
      until ? `Access until: ${until}` : "Access until: (operator calendar — typically 8 weeks)",
      "No Paystack authorization — excluded from day-14 charge-due.",
      "Do not mix with paying / self-serve trial Customers.",
    ].join("\n");
    await fetch(`${base}/api/resource/Comment`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        comment_type: "Comment",
        reference_doctype: "Customer",
        reference_name: customerName,
        content: text,
      }),
      cache: "no-store",
    }).catch(() => undefined);
  }

  async function applyComplimentaryFields(customerName: string) {
    await fetch(
      `${base}/api/resource/Customer/${encodeURIComponent(customerName)}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          customer_name: organization,
          custom_plan_code: input.planId,
          custom_entitlement_status: "active",
          custom_bill_at: null,
          custom_authorization_code: "",
          custom_plan_amount_cents: 0,
          custom_owner_email: ownerEmail,
        }),
        cache: "no-store",
      },
    ).catch(() => undefined);
  }

  try {
    const existingCustomer = await findCustomerByOwnerEmail(
      base,
      headers,
      ownerEmail,
    );
    if (existingCustomer) {
      const hasUser = await userExists(base, headers, ownerEmail);
      if (complimentary) {
        await applyComplimentaryFields(existingCustomer);
        await stampVipComment(existingCustomer);
      } else if (input.billAt || input.authorizationCode || input.planAmountCents) {
        // Refresh billing fields when re-provisioning / Paystack retry
        await fetch(
          `${base}/api/resource/Customer/${encodeURIComponent(existingCustomer)}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              custom_bill_at: toFrappeDatetime(input.billAt || null),
              custom_authorization_code: input.authorizationCode || undefined,
              custom_plan_amount_cents: input.planAmountCents ?? undefined,
              custom_entitlement_status: input.status || customer.entitlement_status,
            }),
            cache: "no-store",
          },
        ).catch(() => undefined);
      }
      if (hasUser) {
        return {
          ok: true,
          skipped: true,
          customerName: existingCustomer,
          userEmail: ownerEmail,
          customer,
          user,
        };
      }
      // Customer exists but User missing — create User only
      const userRes = await fetch(`${base}/api/resource/User`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          send_welcome_email: input.sendWelcomeEmail === false ? 0 : 1,
          roles: user.roles.map((role) => ({ role })),
          custom_tl_desk_tier: user.tl_desk_tier,
          custom_tl_plan_owner: user.tl_plan_owner,
          custom_tl_customer: existingCustomer,
        }),
        cache: "no-store",
      });
      const userText = await userRes.text();
      if (!userRes.ok) {
        return {
          ok: false,
          error: `User create failed (${userRes.status}): ${userText.slice(0, 280)}`,
          customerName: existingCustomer,
          customer,
          user,
        };
      }
      return {
        ok: true,
        customerName: existingCustomer,
        userEmail: ownerEmail,
        customer,
        user,
      };
    }

    const customerRes = await fetch(`${base}/api/resource/Customer`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer_name: customer.customer_name,
        customer_type: customer.customer_type,
        territory: customer.territory || "South Africa",
        custom_plan_code: customer.plan_code,
        custom_seat_limit: customer.seat_limit,
        custom_project_limit: customer.project_limit,
        custom_entitlement_status: customer.entitlement_status,
        custom_tl_org_id: customer.tl_org_id,
        custom_owner_email: customer.owner_email,
        custom_bill_at: toFrappeDatetime(billAt),
        custom_authorization_code: authorizationCode || (complimentary ? "" : undefined),
        custom_plan_amount_cents: planAmountCents,
      }),
      cache: "no-store",
    });
    const customerText = await customerRes.text();
    if (!customerRes.ok) {
      return {
        ok: false,
        error: `Customer create failed (${customerRes.status}): ${customerText.slice(0, 280)}`,
        customer,
        user,
      };
    }

    let customerName = customer.customer_name;
    try {
      const parsed = JSON.parse(customerText) as { data?: { name?: string } };
      if (parsed.data?.name) customerName = parsed.data.name;
    } catch {
      /* keep draft name */
    }

    await stampVipComment(customerName);

    const userRes = await fetch(`${base}/api/resource/User`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        send_welcome_email: input.sendWelcomeEmail === false ? 0 : 1,
        roles: user.roles.map((role) => ({ role })),
        custom_tl_desk_tier: user.tl_desk_tier,
        custom_tl_plan_owner: user.tl_plan_owner,
        custom_tl_customer: customerName,
      }),
      cache: "no-store",
    });
    const userText = await userRes.text();
    if (!userRes.ok) {
      return {
        ok: false,
        error: `User create failed (${userRes.status}): ${userText.slice(0, 280)}`,
        customerName,
        customer,
        user,
      };
    }

    return {
      ok: true,
      customerName,
      userEmail: ownerEmail,
      customer,
      user,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Provision failed",
      customer,
      user,
    };
  }
}
