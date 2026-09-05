/**
 * SI-SEP — TL Engagement Plan DocType on Frappe.
 * Idempotent ensure via DocType resource when missing.
 * Plan JSON + execution overlay live on one DocType (ADR-053 / ADR-055).
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import {
  frappeDocTypeExists,
  type DocTypeEnsureResult,
  type DocTypeEnsureStatus,
} from "@/lib/frappeProductDocTypes";

export const SEP_DOCTYPE_NAME = "TL Engagement Plan" as const;

export const SEP_DOCTYPE_NAMES = [SEP_DOCTYPE_NAME] as const;

export type SepDocTypeName = (typeof SEP_DOCTYPE_NAMES)[number];

type FieldDef = {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: 0 | 1;
  default?: string;
};

const STATUS_OPTIONS = "draft\nsuggested\nsaved\napplied";

const SOURCE_OPTIONS = "rfp\ntender\nbriefing\npaste\nmanual";

const SECTOR_OPTIONS =
  "infrastructure\nhousing\nmining\nenergy\nwater\neducation\nhealth\nagriculture\nmunicipal\nconservation\nlogistics\ngeneric";

const PROGRAMME_OPTIONS = "standard\nrelocation";

function fieldsFor(): FieldDef[] {
  return [
    {
      fieldname: "plan_code",
      label: "Plan code",
      fieldtype: "Data",
      reqd: 1,
    },
    {
      fieldname: "title",
      label: "Title",
      fieldtype: "Data",
      reqd: 1,
    },
    {
      fieldname: "customer",
      label: "Customer",
      fieldtype: "Link",
      options: "Customer",
      reqd: 1,
    },
    {
      fieldname: "status",
      label: "Status",
      fieldtype: "Select",
      options: STATUS_OPTIONS,
      default: "draft",
    },
    {
      fieldname: "source_kind",
      label: "Source kind",
      fieldtype: "Select",
      options: SOURCE_OPTIONS,
    },
    {
      fieldname: "sector_id",
      label: "Sector",
      fieldtype: "Select",
      options: SECTOR_OPTIONS,
    },
    {
      fieldname: "programme_kind",
      label: "Programme kind",
      fieldtype: "Select",
      options: PROGRAMME_OPTIONS,
    },
    { fieldname: "project_id", label: "Project id", fieldtype: "Data" },
    { fieldname: "place_hint", label: "Place hint", fieldtype: "Data" },
    {
      fieldname: "client_funder_hint",
      label: "Client / funder hint",
      fieldtype: "Small Text",
    },
    {
      fieldname: "created_at",
      label: "Created at",
      fieldtype: "Datetime",
    },
    {
      fieldname: "updated_at",
      label: "Updated at",
      fieldtype: "Datetime",
    },
    {
      fieldname: "payload",
      label: "Plan payload (JSON)",
      fieldtype: "Long Text",
    },
    {
      fieldname: "execution_json",
      label: "Execution overlay (JSON)",
      fieldtype: "Long Text",
    },
    { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
  ];
}

export function sepDocTypePayload(name: SepDocTypeName = SEP_DOCTYPE_NAME) {
  const fields = fieldsFor().map((f, idx) => ({ ...f, idx }));
  return {
    name,
    module: "Custom",
    custom: 1,
    istable: 0,
    editable_grid: 1,
    track_changes: 1,
    autoname: "field:plan_code",
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

function authHeaders(key: string, secret: string): HeadersInit {
  return {
    Authorization: `token ${cleanSecret(key)}:${cleanSecret(secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Idempotently create TL Engagement Plan. */
export async function ensureSepDocTypes(options?: {
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
      missing: [...SEP_DOCTYPE_NAMES],
      message: "FRAPPE_API_KEY / SECRET / BASE_URL missing",
    };
  }

  const headers = authHeaders(pair.key, pair.secret);
  const results: DocTypeEnsureResult["results"] = [];
  const missing: string[] = [];

  for (const name of SEP_DOCTYPE_NAMES) {
    try {
      const exists = await frappeDocTypeExists(base, headers, name);
      if (exists) {
        results.push({ name, status: "exists" as DocTypeEnsureStatus });
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
        body: JSON.stringify(sepDocTypePayload(name)),
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
        ? `Dry-run: ${missing.length} SEP DocType(s) missing — set dryRun:false to create.`
        : "Dry-run: all SEP DocTypes already exist."
      : ok
        ? created
          ? `Created ${created} SEP DocType(s); others already present.`
          : "All SEP DocTypes already exist."
        : `Finished with ${errors.length} error(s) — check API key System Manager rights.`,
  };
}
