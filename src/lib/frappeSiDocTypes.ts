/**
 * SI-Cloud — TL Stakeholder / Engagement / Commitment DocTypes on Frappe.
 * Idempotent ensure via DocType resource when missing.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import type {
  DocTypeEnsureResult,
  DocTypeEnsureStatus,
} from "@/lib/frappeProductDocTypes";

export const SI_DOCTYPE_NAMES = [
  "TL Stakeholder",
  "TL Engagement",
  "TL Commitment",
] as const;

export type SiDocTypeName = (typeof SI_DOCTYPE_NAMES)[number];

type FieldDef = {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: 0 | 1;
  default?: string;
};

const KIND_OPTIONS =
  "individual\norganisation\ncommunity_group\ntraditional_authority\ngovernment\nngo\ncontractor\nfunder\nmedia\nunion\nfaith_based\nacademic\nother";

function fieldsFor(name: SiDocTypeName): FieldDef[] {
  if (name === "TL Stakeholder") {
    return [
      {
        fieldname: "stakeholder_code",
        label: "Stakeholder code",
        fieldtype: "Data",
        reqd: 1,
      },
      {
        fieldname: "stakeholder_name",
        label: "Name",
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
        fieldname: "kind",
        label: "Kind",
        fieldtype: "Select",
        options: KIND_OPTIONS,
        default: "individual",
      },
      {
        fieldname: "status",
        label: "Status",
        fieldtype: "Select",
        options: "active\ninactive\nprospect",
        default: "active",
      },
      { fieldname: "organisation", label: "Organisation", fieldtype: "Data" },
      { fieldname: "place_id", label: "Place id", fieldtype: "Data" },
      { fieldname: "country_code", label: "Country code", fieldtype: "Data" },
      {
        fieldname: "influence",
        label: "Influence",
        fieldtype: "Select",
        options: "high\nmedium\nlow\nunknown",
        default: "unknown",
      },
      { fieldname: "interests", label: "Interests (JSON)", fieldtype: "Small Text" },
      { fieldname: "tags", label: "Tags (JSON)", fieldtype: "Small Text" },
      { fieldname: "email", label: "Email", fieldtype: "Data" },
      { fieldname: "phone", label: "Phone", fieldtype: "Data" },
      {
        fieldname: "alternative_contact",
        label: "Alternative contact",
        fieldtype: "Data",
      },
      { fieldname: "summary", label: "Summary", fieldtype: "Small Text" },
      {
        fieldname: "engagement_role",
        label: "Engagement role",
        fieldtype: "Data",
      },
      {
        fieldname: "preferred_channel",
        label: "Preferred channel",
        fieldtype: "Select",
        options: "meeting\nphone\nemail\nwhatsapp\nletter",
      },
      {
        fieldname: "related_stakeholder_ids",
        label: "Related stakeholders (JSON)",
        fieldtype: "Small Text",
      },
      {
        fieldname: "project_ids",
        label: "Project ids (JSON)",
        fieldtype: "Small Text",
      },
      {
        fieldname: "last_engaged_on",
        label: "Last engaged on",
        fieldtype: "Date",
      },
      { fieldname: "next_action", label: "Next action", fieldtype: "Small Text" },
      { fieldname: "owner_user_id", label: "Owner user id", fieldtype: "Data" },
      { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
    ];
  }

  if (name === "TL Engagement") {
    return [
      {
        fieldname: "engagement_code",
        label: "Engagement code",
        fieldtype: "Data",
        reqd: 1,
      },
      { fieldname: "title", label: "Title", fieldtype: "Data", reqd: 1 },
      {
        fieldname: "customer",
        label: "Customer",
        fieldtype: "Link",
        options: "Customer",
        reqd: 1,
      },
      {
        fieldname: "kind",
        label: "Kind",
        fieldtype: "Select",
        options: "meeting\nconsultation\nwalkabout\nbriefing\nother",
        default: "meeting",
      },
      {
        fieldname: "status",
        label: "Status",
        fieldtype: "Select",
        options: "draft\nheld\nfollow_up\nclosed",
        default: "held",
      },
      { fieldname: "held_on", label: "Held on", fieldtype: "Date" },
      { fieldname: "ward", label: "Ward", fieldtype: "Data" },
      { fieldname: "place_label", label: "Place label", fieldtype: "Data" },
      { fieldname: "project_id", label: "Project id", fieldtype: "Data" },
      { fieldname: "summary", label: "Summary", fieldtype: "Text Editor" },
      {
        fieldname: "attendees_label",
        label: "Attendees",
        fieldtype: "Small Text",
      },
      {
        fieldname: "action_items",
        label: "Action items (JSON)",
        fieldtype: "Text",
      },
      {
        fieldname: "stakeholder_ids",
        label: "Stakeholder ids (JSON)",
        fieldtype: "Small Text",
      },
      { fieldname: "capture_id", label: "Capture id", fieldtype: "Data" },
      {
        fieldname: "source",
        label: "Source",
        fieldtype: "Select",
        options: "seed\nminutes\nattendance\nsocial_intel\npasted_report",
        default: "minutes",
      },
      { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
    ];
  }

  return [
    {
      fieldname: "commitment_code",
      label: "Commitment code",
      fieldtype: "Data",
      reqd: 1,
    },
    { fieldname: "title", label: "Title", fieldtype: "Data", reqd: 1 },
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
      options: "open\nin_progress\toverdue\nfulfilled\nbroken\ncancelled",
      default: "open",
    },
    { fieldname: "owner_label", label: "Owner", fieldtype: "Data" },
    { fieldname: "due_on", label: "Due on", fieldtype: "Date" },
    { fieldname: "project_id", label: "Project id", fieldtype: "Data" },
    { fieldname: "engagement_id", label: "Engagement id", fieldtype: "Data" },
    {
      fieldname: "stakeholder_ids",
      label: "Stakeholder ids (JSON)",
      fieldtype: "Small Text",
    },
    {
      fieldname: "source_action_item",
      label: "Source action item",
      fieldtype: "Small Text",
    },
    {
      fieldname: "evidence_note",
      label: "Evidence note",
      fieldtype: "Small Text",
    },
    { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
  ];
}

function autonameField(name: SiDocTypeName): string {
  if (name === "TL Stakeholder") return "stakeholder_code";
  if (name === "TL Engagement") return "engagement_code";
  return "commitment_code";
}

function docTypePayload(name: SiDocTypeName) {
  const fields = fieldsFor(name).map((f, idx) => ({ ...f, idx }));
  return {
    name,
    module: "Custom",
    custom: 1,
    istable: 0,
    editable_grid: 1,
    track_changes: 1,
    autoname: `field:${autonameField(name)}`,
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

/** Idempotently create TL Stakeholder / Engagement / Commitment DocTypes. */
export async function ensureSiDocTypes(options?: {
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
      missing: [...SI_DOCTYPE_NAMES],
      message: "FRAPPE_API_KEY / SECRET / BASE_URL missing",
    };
  }

  const headers = authHeaders(pair.key, pair.secret);
  const results: DocTypeEnsureResult["results"] = [];
  const missing: string[] = [];

  for (const name of SI_DOCTYPE_NAMES) {
    try {
      const exists = await docTypeExists(base, headers, name);
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
        ? `Dry-run: ${missing.length} SI DocType(s) missing — set dryRun:false to create.`
        : "Dry-run: all SI DocTypes already exist."
      : ok
        ? created
          ? `Created ${created} SI DocType(s); others already present.`
          : "All SI DocTypes already exist."
        : `Finished with ${errors.length} error(s) — check API key System Manager rights.`,
  };
}
