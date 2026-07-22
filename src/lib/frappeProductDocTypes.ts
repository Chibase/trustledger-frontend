/**
 * Step 2 — Product DocTypes on Frappe (TL Project / Incident / Evidence).
 * Idempotent ensure via DocType resource when missing.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";

export const PRODUCT_DOCTYPE_NAMES = [
  "TL Project",
  "TL Incident",
  "TL Evidence",
] as const;

export type ProductDocTypeName = (typeof PRODUCT_DOCTYPE_NAMES)[number];

type FieldDef = {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: 0 | 1;
  default?: string;
};

function fieldsFor(name: ProductDocTypeName): FieldDef[] {
  if (name === "TL Project") {
    return [
      { fieldname: "project_code", label: "Project code", fieldtype: "Data", reqd: 1 },
      { fieldname: "project_title", label: "Title", fieldtype: "Data", reqd: 1 },
      {
        fieldname: "customer",
        label: "Customer",
        fieldtype: "Link",
        options: "Customer",
        reqd: 1,
      },
      { fieldname: "client_funder", label: "Client / funder", fieldtype: "Data" },
      { fieldname: "budget_total", label: "Budget total", fieldtype: "Currency" },
      { fieldname: "budget_spent", label: "Budget spent", fieldtype: "Currency" },
      { fieldname: "ward", label: "Ward", fieldtype: "Data" },
      { fieldname: "municipality", label: "Municipality", fieldtype: "Data" },
      {
        fieldname: "status",
        label: "Status",
        fieldtype: "Select",
        options: "Draft\nApproved\nActive\nOnHold\nCompleted\nClosed",
        default: "Draft",
      },
      { fieldname: "contractor_name", label: "Contractor", fieldtype: "Data" },
      { fieldname: "start_date", label: "Start date", fieldtype: "Date" },
      { fieldname: "target_end_date", label: "Target end", fieldtype: "Date" },
      { fieldname: "public_summary", label: "Public summary", fieldtype: "Small Text" },
      { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
    ];
  }
  if (name === "TL Incident") {
    return [
      { fieldname: "incident_code", label: "Incident code", fieldtype: "Data", reqd: 1 },
      { fieldname: "title", label: "Title", fieldtype: "Data", reqd: 1 },
      { fieldname: "description", label: "Description", fieldtype: "Text Editor" },
      {
        fieldname: "customer",
        label: "Customer",
        fieldtype: "Link",
        options: "Customer",
        reqd: 1,
      },
      {
        fieldname: "project",
        label: "Project",
        fieldtype: "Link",
        options: "TL Project",
      },
      { fieldname: "ward", label: "Ward", fieldtype: "Data" },
      { fieldname: "geographic_area", label: "Geographic area", fieldtype: "Data" },
      {
        fieldname: "status",
        label: "Status",
        fieldtype: "Select",
        options: "Open\nInvestigating\nEscalated\nClosed",
        default: "Open",
      },
      {
        fieldname: "priority",
        label: "Priority",
        fieldtype: "Select",
        options: "P4-Low\nP3-Medium\nP2-High\nP1-Critical",
        default: "P3-Medium",
      },
      { fieldname: "reporter_name", label: "Reporter name", fieldtype: "Data" },
      { fieldname: "project_name", label: "Project name", fieldtype: "Data" },
      { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
    ];
  }
  return [
    { fieldname: "evidence_code", label: "Evidence code", fieldtype: "Data", reqd: 1 },
    {
      fieldname: "incident",
      label: "Incident",
      fieldtype: "Link",
      options: "TL Incident",
      reqd: 1,
    },
    {
      fieldname: "customer",
      label: "Customer",
      fieldtype: "Link",
      options: "Customer",
      reqd: 1,
    },
    { fieldname: "file_name", label: "File name", fieldtype: "Data", reqd: 1 },
    {
      fieldname: "classification",
      label: "Classification",
      fieldtype: "Select",
      options: "General\nConfidential\nRestricted",
      default: "General",
    },
    { fieldname: "uploaded_by", label: "Uploaded by", fieldtype: "Data" },
    { fieldname: "uploaded_at", label: "Uploaded at", fieldtype: "Datetime" },
    { fieldname: "is_primary", label: "Primary", fieldtype: "Check", default: "0" },
    { fieldname: "file", label: "File", fieldtype: "Attach" },
    { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
  ];
}

function docTypePayload(name: ProductDocTypeName) {
  const fields = fieldsFor(name).map((f, idx) => ({
    ...f,
    idx,
  }));
  const autonameField =
    name === "TL Project"
      ? "project_code"
      : name === "TL Incident"
        ? "incident_code"
        : "evidence_code";
  return {
    name,
    module: "Custom",
    custom: 1,
    istable: 0,
    editable_grid: 1,
    track_changes: 1,
    autoname: `field:${autonameField}`,
    naming_rule: "By fieldname",
    fields,
    permissions: [
      {
        role: "System Manager",
        read: 1,
        write: 1,
        create: 1,
        delete: 1,
        export: 1,
        share: 1,
        print: 1,
        email: 1,
      },
      {
        role: "Customer",
        read: 1,
        write: 1,
        create: 1,
        delete: 0,
        export: 0,
        share: 0,
        print: 1,
        email: 0,
      },
    ],
  };
}

export type DocTypeEnsureStatus = "created" | "exists" | "error" | "skipped";

export type DocTypeEnsureResult = {
  ok: boolean;
  dryRun: boolean;
  results: Array<{
    name: string;
    status: DocTypeEnsureStatus;
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

async function docTypeExists(
  base: string,
  headers: HeadersInit,
  name: string,
): Promise<boolean> {
  const res = await fetch(
    `${base}/api/resource/DocType/${encodeURIComponent(name)}`,
    { headers, cache: "no-store" },
  );
  return res.ok;
}

/** Idempotently create TL Project / Incident / Evidence DocTypes. */
export async function ensureProductDocTypes(options?: {
  dryRun?: boolean;
}): Promise<DocTypeEnsureResult> {
  const dryRun = options?.dryRun !== false;
  const pair = frappeKeyPair();
  const base = frappeBase();

  if (!pair || !base) {
    return {
      ok: false,
      dryRun,
      results: [],
      missing: [...PRODUCT_DOCTYPE_NAMES],
      message: "FRAPPE_API_KEY / SECRET / BASE_URL missing",
    };
  }

  const headers = authHeaders(pair.key, pair.secret);
  const results: DocTypeEnsureResult["results"] = [];
  const missing: string[] = [];

  for (const name of PRODUCT_DOCTYPE_NAMES) {
    try {
      const exists = await docTypeExists(base, headers, name);
      if (exists) {
        results.push({ name, status: "exists" });
        continue;
      }
      missing.push(name);
      if (dryRun) {
        results.push({
          name,
          status: "skipped",
          detail: "Would create (dry-run)",
        });
        continue;
      }
      const res = await fetch(`${base}/api/resource/DocType`, {
        method: "POST",
        headers,
        body: JSON.stringify(docTypePayload(name)),
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        results.push({
          name,
          status: "error",
          detail: text.slice(0, 280),
        });
        continue;
      }
      results.push({ name, status: "created" });
    } catch (err) {
      results.push({
        name,
        status: "error",
        detail: err instanceof Error ? err.message : "request failed",
      });
      if (!missing.includes(name)) missing.push(name);
    }
  }

  const errors = results.filter((r) => r.status === "error");
  const created = results.filter((r) => r.status === "created").length;
  const ok = errors.length === 0;

  return {
    ok,
    dryRun,
    results,
    missing: dryRun
      ? missing
      : results.filter((r) => r.status === "error").map((r) => r.name),
    message: dryRun
      ? missing.length
        ? `Dry-run: ${missing.length} DocType(s) missing — set dryRun:false to create.`
        : "Dry-run: all product DocTypes already exist."
      : ok
        ? created
          ? `Created ${created} DocType(s); others already present.`
          : "All product DocTypes already exist."
        : `Finished with ${errors.length} error(s) — check API key System Manager rights.`,
  };
}
