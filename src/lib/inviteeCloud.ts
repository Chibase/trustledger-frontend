/**
 * SEC-5 — Cloud User seats for invitees (not the Plan Owner login).
 * Stamp Customer User Permission + desk/role; password is set on accept.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import {
  findCustomerNameForOwnerEmail,
  setCloudUserPassword,
} from "@/lib/cloudUserPassword";
import { buildInviteeUserDraft } from "@/lib/frappeSoT";
import { ensureCustomerUserPermission } from "@/lib/userPermissionCloud";
import type { DeskTier } from "@/types/deskTier";
import { INVITEABLE_ROLES, type InviteableRole } from "@/types/org";

function authHeaders(): HeadersInit | null {
  const pair = frappeKeyPair();
  if (!pair) return null;
  return {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function inviteeSeatGuard(input: {
  email: string;
  ownerEmail: string;
  password: string;
}): string | null {
  const email = input.email.trim().toLowerCase();
  const owner = input.ownerEmail.trim().toLowerCase();
  if (!email.includes("@")) return "Invitee email is required.";
  if (email === owner) {
    return "The Plan Owner already has a Cloud login. Invite a colleague instead.";
  }
  if (input.password.trim().length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export type LiveSeatKind = "owner" | "invitee" | "unbound";

/**
 * Owner vs invitee vs unbound for `/login/live`.
 * Matching an invitee Customer stamp must never promote the login to Plan Owner.
 */
export function decideLiveSeatKind(input: {
  sessionPlanOwner: boolean;
  ownerCustomerName?: string | null;
  inviteeCustomerName?: string | null;
}): LiveSeatKind {
  if (input.sessionPlanOwner || Boolean(input.ownerCustomerName?.trim())) {
    return "owner";
  }
  if (input.inviteeCustomerName?.trim()) return "invitee";
  return "unbound";
}

export function isInviteableAppRole(value: string): value is InviteableRole {
  return (INVITEABLE_ROLES as readonly string[]).includes(value);
}

export type ProvisionInviteeInput = {
  email: string;
  fullName: string;
  ownerEmail: string;
  customerName: string;
  deskTier: DeskTier;
  appRole: InviteableRole;
  password: string;
};

export type ProvisionInviteeResult =
  | { ok: true; email: string; customerName: string; created: boolean }
  | { ok: false; error: string; status?: number };

async function readCloudUser(
  base: string,
  headers: HeadersInit,
  email: string,
): Promise<{
  exists: boolean;
  customer?: string;
  planOwner?: boolean;
} | { exists: false }> {
  const res = await fetch(
    `${base}/api/resource/User/${encodeURIComponent(email)}?fields=${encodeURIComponent(
      JSON.stringify([
        "name",
        "email",
        "custom_tl_customer",
        "custom_tl_plan_owner",
      ]),
    )}`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return { exists: false };
  const json = (await res.json()) as {
    data?: {
      custom_tl_customer?: string;
      custom_tl_plan_owner?: number | boolean | string;
    };
  };
  const flag = json.data?.custom_tl_plan_owner;
  return {
    exists: true,
    customer: (json.data?.custom_tl_customer || "").trim() || undefined,
    planOwner: flag === 1 || flag === true || flag === "1",
  };
}

async function stampInviteeUser(
  base: string,
  headers: HeadersInit,
  draft: ReturnType<typeof buildInviteeUserDraft>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(
    `${base}/api/resource/User/${encodeURIComponent(draft.email)}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        first_name: draft.first_name,
        last_name: draft.last_name,
        custom_tl_desk_tier: draft.tl_desk_tier,
        custom_tl_plan_owner: 0,
        custom_tl_customer: draft.customer,
        custom_tl_app_role: draft.tl_app_role,
        send_welcome_email: 0,
      }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      error: `Could not stamp invitee login (${res.status}): ${text.slice(0, 280)}`,
    };
  }
  return { ok: true };
}

async function createInviteeUser(
  base: string,
  headers: HeadersInit,
  draft: ReturnType<typeof buildInviteeUserDraft>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payloadWithRoles = {
    email: draft.email,
    first_name: draft.first_name,
    last_name: draft.last_name,
    send_welcome_email: 0,
    roles: draft.roles.map((role) => ({ role })),
    custom_tl_desk_tier: draft.tl_desk_tier,
    custom_tl_plan_owner: 0,
    custom_tl_customer: draft.customer,
    custom_tl_app_role: draft.tl_app_role,
  };

  let userRes = await fetch(`${base}/api/resource/User`, {
    method: "POST",
    headers,
    body: JSON.stringify(payloadWithRoles),
    cache: "no-store",
  });
  let userText = await userRes.text();

  if (!userRes.ok && userRes.status === 403) {
    userRes = await fetch(`${base}/api/resource/User`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: draft.email,
        first_name: draft.first_name,
        last_name: draft.last_name,
        send_welcome_email: 0,
      }),
      cache: "no-store",
    });
    userText = await userRes.text();
  }

  if (!userRes.ok) {
    return {
      ok: false,
      error: `User create failed (${userRes.status}): ${userText.slice(0, 280)}`,
    };
  }
  return { ok: true };
}

/** Customer document name stamped on this invitee User, if any. */
export async function getInviteeCustomerName(
  email: string,
): Promise<string | null> {
  const base = frappeBase();
  const headers = authHeaders();
  const trimmed = email.trim().toLowerCase();
  if (!base || !headers || !trimmed.includes("@")) return null;
  const user = await readCloudUser(base, headers, trimmed);
  if (!user.exists || user.planOwner) return null;
  return user.customer || null;
}

export async function ownerHasCloudCustomer(
  ownerEmail: string,
): Promise<string | null> {
  return findCustomerNameForOwnerEmail(ownerEmail);
}

/**
 * Idempotent invitee User on the Owner's Customer.
 * Never stamps Plan Owner. Never hijacks a User already bound to another org.
 */
export async function provisionInviteeOnCloud(
  input: ProvisionInviteeInput,
): Promise<ProvisionInviteeResult> {
  const guard = inviteeSeatGuard({
    email: input.email,
    ownerEmail: input.ownerEmail,
    password: input.password,
  });
  if (guard) return { ok: false, error: guard, status: 400 };

  const draft = buildInviteeUserDraft({
    email: input.email,
    fullName: input.fullName,
    customerName: input.customerName,
    deskTier: input.deskTier,
    appRole: input.appRole,
  });

  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Cloud API not configured", status: 503 };
  }

  const existing = await readCloudUser(base, headers, draft.email);
  if (existing.exists) {
    if (existing.planOwner) {
      return {
        ok: false,
        error: "This email is already a Plan Owner Cloud login.",
        status: 409,
      };
    }
    if (existing.customer && existing.customer !== draft.customer) {
      return {
        ok: false,
        error:
          "This email is already a Cloud login on another organisation.",
        status: 409,
      };
    }
  } else {
    const created = await createInviteeUser(base, headers, draft);
    if (!created.ok) {
      return { ok: false, error: created.error, status: 502 };
    }
  }

  const stamped = await stampInviteeUser(base, headers, draft);
  if (!stamped.ok) {
    return { ok: false, error: stamped.error, status: 502 };
  }

  const permission = await ensureCustomerUserPermission(
    draft.email,
    draft.customer,
  );
  if (!permission.ok) {
    return {
      ok: false,
      error: permission.error || "Could not bind organisation permission.",
      status: 502,
    };
  }

  const password = await setCloudUserPassword({
    email: draft.email,
    newPassword: input.password,
  });
  if (!password.ok) {
    return {
      ok: false,
      error: password.error,
      status: password.status || 502,
    };
  }

  return {
    ok: true,
    email: draft.email,
    customerName: draft.customer,
    created: !existing.exists,
  };
}
