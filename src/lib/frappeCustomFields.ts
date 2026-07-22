/**
 * Step 1 — ensure TrustLedger custom fields on Frappe Customer / User.
 * Creates via `Custom Field` resource when missing (idempotent).
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";

export type CustomFieldSpec = {
  dt: "Customer" | "User";
  fieldname: string;
  label: string;
  fieldtype: "Data" | "Int" | "Select" | "Check" | "Link";
  options?: string;
  insert_after?: string;
};

/** Exact fieldnames expected by `POST /api/frappe/provision-owner`. */
export const TRUSTLEDGER_CUSTOM_FIELDS: CustomFieldSpec[] = [
  {
    dt: "Customer",
    fieldname: "custom_plan_code",
    label: "Plan code",
    fieldtype: "Select",
    options: "practitioner\nproject\ninstitutional",
    insert_after: "customer_name",
  },
  {
    dt: "Customer",
    fieldname: "custom_seat_limit",
    label: "Seat limit",
    fieldtype: "Int",
    insert_after: "custom_plan_code",
  },
  {
    dt: "Customer",
    fieldname: "custom_project_limit",
    label: "Project limit",
    fieldtype: "Int",
    insert_after: "custom_seat_limit",
  },
  {
    dt: "Customer",
    fieldname: "custom_entitlement_status",
    label: "Entitlement status",
    fieldtype: "Select",
    options: "trial\nactive\npast_due\ncancelled",
    insert_after: "custom_project_limit",
  },
  {
    dt: "Customer",
    fieldname: "custom_tl_org_id",
    label: "TrustLedger org id",
    fieldtype: "Data",
    insert_after: "custom_entitlement_status",
  },
  {
    dt: "Customer",
    fieldname: "custom_owner_email",
    label: "Owner email",
    fieldtype: "Data",
    insert_after: "custom_tl_org_id",
  },
  {
    dt: "User",
    fieldname: "custom_tl_desk_tier",
    label: "Desk tier",
    fieldtype: "Data",
    insert_after: "email",
  },
  {
    dt: "User",
    fieldname: "custom_tl_plan_owner",
    label: "Plan Owner",
    fieldtype: "Check",
    insert_after: "custom_tl_desk_tier",
  },
  {
    dt: "User",
    fieldname: "custom_tl_customer",
    label: "Customer",
    fieldtype: "Link",
    options: "Customer",
    insert_after: "custom_tl_plan_owner",
  },
];

export type FieldEnsureStatus = "created" | "exists" | "error" | "skipped";

export type FieldEnsureResult = {
  ok: boolean;
  dryRun: boolean;
  results: Array<{
    dt: string;
    fieldname: string;
    status: FieldEnsureStatus;
    detail?: string;
  }>;
  missing: string[];
  message: string;
};

function authHeaders(key: string, secret: string): HeadersInit {
  return {
    Authorization: `token ${cleanSecret(key)}:${cleanSecret(secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function fieldExists(
  base: string,
  headers: HeadersInit,
  dt: string,
  fieldname: string,
): Promise<boolean> {
  const filters = encodeURIComponent(JSON.stringify([["dt", "=", dt], ["fieldname", "=", fieldname]]));
  const res = await fetch(
    `${base}/api/resource/Custom%20Field?filters=${filters}&fields=${encodeURIComponent(JSON.stringify(["name", "fieldname"]))}&limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { data?: unknown[] };
  return Array.isArray(json.data) && json.data.length > 0;
}

/**
 * Idempotently create TrustLedger custom fields on Desk.
 * dryRun=true only reports missing/exists without writes.
 */
export async function ensureTrustLedgerCustomFields(options?: {
  dryRun?: boolean;
}): Promise<FieldEnsureResult> {
  const dryRun = options?.dryRun !== false;
  const pair = frappeKeyPair();
  const base = frappeBase();

  if (!pair || !base) {
    return {
      ok: false,
      dryRun,
      results: [],
      missing: TRUSTLEDGER_CUSTOM_FIELDS.map((f) => `${f.dt}.${f.fieldname}`),
      message: "FRAPPE_API_KEY / SECRET / BASE_URL missing",
    };
  }

  const headers = authHeaders(pair.key, pair.secret);
  const results: FieldEnsureResult["results"] = [];
  const missing: string[] = [];

  for (const spec of TRUSTLEDGER_CUSTOM_FIELDS) {
    const key = `${spec.dt}.${spec.fieldname}`;
    try {
      const exists = await fieldExists(base, headers, spec.dt, spec.fieldname);
      if (exists) {
        results.push({ dt: spec.dt, fieldname: spec.fieldname, status: "exists" });
        continue;
      }
      missing.push(key);
      if (dryRun) {
        results.push({
          dt: spec.dt,
          fieldname: spec.fieldname,
          status: "skipped",
          detail: "Would create (dry-run)",
        });
        continue;
      }
      const body: Record<string, unknown> = {
        dt: spec.dt,
        fieldname: spec.fieldname,
        label: spec.label,
        fieldtype: spec.fieldtype,
        insert_after: spec.insert_after,
      };
      if (spec.options) body.options = spec.options;

      const res = await fetch(`${base}/api/resource/Custom%20Field`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        results.push({
          dt: spec.dt,
          fieldname: spec.fieldname,
          status: "error",
          detail: text.slice(0, 240),
        });
        continue;
      }
      results.push({ dt: spec.dt, fieldname: spec.fieldname, status: "created" });
    } catch (err) {
      results.push({
        dt: spec.dt,
        fieldname: spec.fieldname,
        status: "error",
        detail: err instanceof Error ? err.message : "request failed",
      });
      if (!missing.includes(key)) missing.push(key);
    }
  }

  const errors = results.filter((r) => r.status === "error");
  const created = results.filter((r) => r.status === "created").length;
  const ok = errors.length === 0;

  return {
    ok,
    dryRun,
    results,
    missing: dryRun ? missing : results.filter((r) => r.status === "error").map((r) => `${r.dt}.${r.fieldname}`),
    message: dryRun
      ? missing.length
        ? `Dry-run: ${missing.length} field(s) missing — set dryRun:false to create.`
        : "Dry-run: all TrustLedger custom fields already exist."
      : ok
        ? created
          ? `Created ${created} field(s); others already present.`
          : "All TrustLedger custom fields already exist."
        : `Finished with ${errors.length} error(s) — check Desk permissions.`,
  };
}
