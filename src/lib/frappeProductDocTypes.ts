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

/** 24e-cloud — lifecycle stamps on TL Incident. Blank Cloud times stay blank. */
export const INCIDENT_PROCESS_STAGE_FIELDS: FieldDef[] = [
  { fieldname: "reported_at", label: "Reported at", fieldtype: "Datetime" },
  {
    fieldname: "resource_deployed_at",
    label: "Resource deployed at",
    fieldtype: "Datetime",
  },
  { fieldname: "investigated_at", label: "Investigated at", fieldtype: "Datetime" },
  { fieldname: "resolved_at", label: "Resolved at", fieldtype: "Datetime" },
  { fieldname: "verified_at", label: "Verified at", fieldtype: "Datetime" },
  { fieldname: "closed_at", label: "Closed at", fieldtype: "Datetime" },
];

export const INCIDENT_PROCESS_STAGE_FIELDNAMES = INCIDENT_PROCESS_STAGE_FIELDS.map(
  (row) => row.fieldname,
) as readonly string[];

/** MEL-1 — JSON blob of expected vs actual rows on TL Project. */
export const PROJECT_MEL_FIELDS: FieldDef[] = [
  {
    fieldname: "mel_json",
    label: "MEL indicators (JSON)",
    fieldtype: "Long Text",
  },
];

/** MEL-1 — expected vs actual on TL Commitment. */
export const COMMITMENT_MEL_FIELDS: FieldDef[] = [
  { fieldname: "expected_value", label: "Expected value", fieldtype: "Float" },
  { fieldname: "actual_value", label: "Actual value", fieldtype: "Float" },
  { fieldname: "mel_unit", label: "MEL unit", fieldtype: "Data" },
];

/** MEL-2 — operational root-cause tag on TL Incident. */
export const INCIDENT_ROOT_CAUSE_FIELDS: FieldDef[] = [
  { fieldname: "root_cause", label: "Root cause", fieldtype: "Data" },
  {
    fieldname: "root_cause_note",
    label: "Root cause note",
    fieldtype: "Small Text",
  },
];

export const INCIDENT_ROOT_CAUSE_FIELDNAMES = INCIDENT_ROOT_CAUSE_FIELDS.map(
  (row) => row.fieldname,
) as readonly string[];

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
      ...PROJECT_MEL_FIELDS,
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
      ...INCIDENT_PROCESS_STAGE_FIELDS,
      ...INCIDENT_ROOT_CAUSE_FIELDS,
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

/**
 * DocType meta is often 403 for non–System Manager API users even when the
 * DocType exists. Treat 404 as missing; 200/403 (and resource list) as present.
 */
export async function frappeDocTypeExists(
  base: string,
  headers: HeadersInit,
  name: string,
): Promise<boolean> {
  const meta = await fetch(
    `${base}/api/resource/DocType/${encodeURIComponent(name)}`,
    { headers, cache: "no-store" },
  );
  if (meta.ok) return true;
  if (meta.status === 404) return false;

  const list = await fetch(
    `${base}/api/method/frappe.client.get_list?doctype=DocType&fields=${encodeURIComponent(JSON.stringify(["name"]))}&filters=${encodeURIComponent(JSON.stringify([["name", "=", name]]))}&limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (list.ok) {
    const json = (await list.json()) as { message?: unknown[] };
    if (Array.isArray(json.message) && json.message.length > 0) return true;
  }

  // Last resort: listing the resource — DoesNotExistError ⇒ missing DocType
  const resource = await fetch(
    `${base}/api/resource/${encodeURIComponent(name)}?limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (resource.ok) return true;
  if (resource.status === 404) {
    const text = await resource.text().catch(() => "");
    if (/DoesNotExistError|not found/i.test(text)) return false;
  }
  // Permission / other errors ⇒ assume exists so we do not re-POST
  return resource.status !== 404;
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
      const exists = await frappeDocTypeExists(base, headers, name);
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

  const stages = await ensureIncidentStageFields({
    dryRun,
    headers,
    base,
  });
  results.push(...stages.results);
  missing.push(...stages.missing);

  const rootCause = await ensureIncidentRootCauseFields({
    dryRun,
    headers,
    base,
  });
  results.push(...rootCause.results);
  missing.push(...rootCause.missing);

  const mel = await ensureCustomFieldsOnDocType({
    dryRun,
    headers,
    base,
    dt: "TL Project",
    fields: PROJECT_MEL_FIELDS,
    insertAfter: "tl_org_id",
  });
  results.push(...mel.results);
  missing.push(...mel.missing);

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
        ? `Dry-run: ${missing.length} DocType/field(s) missing — set dryRun:false to create.`
        : "Dry-run: all product DocTypes, incident stage, MEL, and root-cause fields already exist."
      : ok
        ? created
          ? `Created ${created} DocType/field(s); others already present.`
          : "All product DocTypes, incident stage, MEL, and root-cause fields already exist."
        : `Finished with ${errors.length} error(s) — check API key System Manager rights.`,
  };
}

async function customFieldExists(
  base: string,
  headers: HeadersInit,
  dt: string,
  fieldname: string,
): Promise<boolean> {
  const filters = encodeURIComponent(
    JSON.stringify([
      ["dt", "=", dt],
      ["fieldname", "=", fieldname],
    ]),
  );
  const res = await fetch(
    `${base}/api/resource/Custom%20Field?filters=${filters}&fields=${encodeURIComponent(JSON.stringify(["name", "fieldname"]))}&limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { data?: unknown[] };
  return Array.isArray(json.data) && json.data.length > 0;
}

async function nativeDocTypeFieldExists(
  base: string,
  headers: HeadersInit,
  dt: string,
  fieldname: string,
): Promise<boolean> {
  const res = await fetch(
    `${base}/api/resource/DocType/${encodeURIComponent(dt)}`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as {
    data?: { fields?: Array<{ fieldname?: string }> };
  };
  return (json.data?.fields || []).some((row) => row.fieldname === fieldname);
}

/**
 * Idempotent Custom Fields on an existing DocType.
 * Skips when the field is already native on the DocType.
 */
export async function ensureCustomFieldsOnDocType(options: {
  dryRun: boolean;
  headers: HeadersInit;
  base: string;
  dt: string;
  fields: FieldDef[];
  insertAfter: string;
}): Promise<{
  results: DocTypeEnsureResult["results"];
  missing: string[];
}> {
  const { dryRun, headers, base, dt, fields } = options;
  const results: DocTypeEnsureResult["results"] = [];
  const missing: string[] = [];
  const exists = await frappeDocTypeExists(base, headers, dt);
  if (!exists) {
    return { results, missing };
  }

  let insertAfter = options.insertAfter;
  for (const spec of fields) {
    const name = `${dt}.${spec.fieldname}`;
    try {
      const present =
        (await nativeDocTypeFieldExists(base, headers, dt, spec.fieldname)) ||
        (await customFieldExists(base, headers, dt, spec.fieldname));
      if (present) {
        results.push({ name, status: "exists" });
        insertAfter = spec.fieldname;
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
      const res = await fetch(`${base}/api/resource/Custom%20Field`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dt,
          fieldname: spec.fieldname,
          label: spec.label,
          fieldtype: spec.fieldtype,
          insert_after: insertAfter,
          ...(spec.options ? { options: spec.options } : {}),
        }),
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        if (/already exists|DuplicateName|fieldname/i.test(text)) {
          results.push({ name, status: "exists", detail: "Already present" });
          insertAfter = spec.fieldname;
          continue;
        }
        results.push({ name, status: "error", detail: text.slice(0, 280) });
        continue;
      }
      results.push({ name, status: "created" });
      insertAfter = spec.fieldname;
    } catch (err) {
      results.push({
        name,
        status: "error",
        detail: err instanceof Error ? err.message : "request failed",
      });
      if (!missing.includes(name)) missing.push(name);
    }
  }
  return { results, missing };
}

/**
 * Idempotent Custom Fields for 24e-cloud stamps on existing TL Incident.
 */
export async function ensureIncidentStageFields(options: {
  dryRun: boolean;
  headers: HeadersInit;
  base: string;
}): Promise<{
  results: DocTypeEnsureResult["results"];
  missing: string[];
}> {
  return ensureCustomFieldsOnDocType({
    ...options,
    dt: "TL Incident",
    fields: INCIDENT_PROCESS_STAGE_FIELDS,
    insertAfter: "tl_org_id",
  });
}

/** MEL-2 — root_cause / root_cause_note on existing TL Incident. */
export async function ensureIncidentRootCauseFields(options: {
  dryRun: boolean;
  headers: HeadersInit;
  base: string;
}): Promise<{
  results: DocTypeEnsureResult["results"];
  missing: string[];
}> {
  return ensureCustomFieldsOnDocType({
    ...options,
    dt: "TL Incident",
    fields: INCIDENT_ROOT_CAUSE_FIELDS,
    insertAfter: "closed_at",
  });
}
