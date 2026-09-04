/**
 * TE-7 — TL Trust Observation / Participation / Community Context on Frappe.
 * Idempotent ensure via DocType resource when missing.
 * Dimension status stays computed (not a DocType).
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

export const TRUST_DOCTYPE_NAMES = [
  "TL Trust Observation",
  "TL Trust Participation",
  "TL Trust Community Context",
] as const;

export type TrustDocTypeName = (typeof TRUST_DOCTYPE_NAMES)[number];

type FieldDef = {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: 0 | 1;
  default?: string;
};

const DIMENSION_OPTIONS =
  "project\nimplementing_entity\nprocess\npeople\nfairness\nconcerns_acted_upon";

const SIGNAL_OPTIONS = "positive\nneutral\nnegative\nunknown";

const SOURCE_OPTIONS =
  "incident\nengagement\ncommitment\nevidence\nstakeholder\nderived";

const ATTITUDE_OPTIONS = "high\nmedium\nlow\nunknown";

const TRANSLATION_OPTIONS =
  "untranslated\nworking_language\npartial\ncommunity_checked\nunknown";

function fieldsFor(name: TrustDocTypeName): FieldDef[] {
  if (name === "TL Trust Observation") {
    return [
      {
        fieldname: "observation_code",
        label: "Observation code",
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
      { fieldname: "observed_at", label: "Observed at", fieldtype: "Datetime" },
      {
        fieldname: "dimension",
        label: "Dimension",
        fieldtype: "Select",
        options: DIMENSION_OPTIONS,
        reqd: 1,
      },
      {
        fieldname: "signal",
        label: "Signal",
        fieldtype: "Select",
        options: SIGNAL_OPTIONS,
        default: "unknown",
      },
      {
        fieldname: "signal_score",
        label: "Signal score",
        fieldtype: "Int",
      },
      {
        fieldname: "source",
        label: "Source",
        fieldtype: "Select",
        options: SOURCE_OPTIONS,
        default: "derived",
      },
      { fieldname: "source_id", label: "Source id", fieldtype: "Data" },
      { fieldname: "project_id", label: "Project id", fieldtype: "Data" },
      {
        fieldname: "community_place_id",
        label: "Community place id",
        fieldtype: "Data",
      },
      { fieldname: "stakeholder_id", label: "Stakeholder id", fieldtype: "Data" },
      {
        fieldname: "evidence_ids",
        label: "Evidence ids (JSON)",
        fieldtype: "Small Text",
      },
      { fieldname: "note", label: "Note", fieldtype: "Small Text" },
      {
        fieldname: "narrative_language",
        label: "Narrative language",
        fieldtype: "Data",
      },
      {
        fieldname: "translation_status",
        label: "Translation status",
        fieldtype: "Select",
        options: TRANSLATION_OPTIONS,
      },
      { fieldname: "oral_source", label: "Oral source", fieldtype: "Check" },
      { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
    ];
  }

  if (name === "TL Trust Participation") {
    return [
      {
        fieldname: "participation_code",
        label: "Participation code",
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
      { fieldname: "observed_at", label: "Observed at", fieldtype: "Datetime" },
      {
        fieldname: "source",
        label: "Source",
        fieldtype: "Select",
        options: SOURCE_OPTIONS,
        default: "engagement",
      },
      { fieldname: "source_id", label: "Source id", fieldtype: "Data" },
      { fieldname: "project_id", label: "Project id", fieldtype: "Data" },
      { fieldname: "stakeholder_id", label: "Stakeholder id", fieldtype: "Data" },
      {
        fieldname: "willingness_to_participate",
        label: "Willingness to participate",
        fieldtype: "Select",
        options: ATTITUDE_OPTIONS,
        default: "unknown",
      },
      {
        fieldname: "willingness_to_contribute",
        label: "Willingness to contribute",
        fieldtype: "Select",
        options: ATTITUDE_OPTIONS,
        default: "unknown",
      },
      {
        fieldname: "trust_driven",
        label: "Trust driven",
        fieldtype: "Select",
        options: "yes\nno\nunknown",
        default: "unknown",
      },
      { fieldname: "note", label: "Note", fieldtype: "Small Text" },
      {
        fieldname: "motivation",
        label: "Motivation",
        fieldtype: "Select",
        options: "trust\nobligation\nlivelihood\nmixed\nunknown",
      },
      {
        fieldname: "presence_mode",
        label: "Presence mode",
        fieldtype: "Select",
        options: "in_person\nproxy\nhousehold_rep\nunknown",
      },
      {
        fieldname: "attendance_does_not_equal_consent",
        label: "Attendance does not equal consent",
        fieldtype: "Check",
      },
      {
        fieldname: "response_pattern",
        label: "Response pattern",
        fieldtype: "Select",
        options: "vocal\nquiet_presence\nwalkout\nmixed\nunknown",
      },
      { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
    ];
  }

  return [
    {
      fieldname: "community_code",
      label: "Community code",
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
    { fieldname: "updated_at", label: "Updated at", fieldtype: "Datetime" },
    { fieldname: "project_id", label: "Project id", fieldtype: "Data" },
    { fieldname: "place_id", label: "Place id", fieldtype: "Data" },
    { fieldname: "place_label", label: "Place label", fieldtype: "Data" },
    { fieldname: "community_ref", label: "Community ref", fieldtype: "Data" },
    { fieldname: "notes", label: "Notes", fieldtype: "Small Text" },
    { fieldname: "barriers", label: "Barriers", fieldtype: "Small Text" },
    {
      fieldname: "sensitivity_notes",
      label: "Sensitivity notes",
      fieldtype: "Small Text",
    },
    { fieldname: "ward", label: "Ward", fieldtype: "Data" },
    { fieldname: "municipality", label: "Municipality", fieldtype: "Data" },
    {
      fieldname: "history_notes",
      label: "History notes",
      fieldtype: "Small Text",
    },
    {
      fieldname: "power_structure_notes",
      label: "Power structure notes",
      fieldtype: "Small Text",
    },
    {
      fieldname: "barrier_tags",
      label: "Barrier tags (JSON)",
      fieldtype: "Small Text",
    },
    {
      fieldname: "working_language",
      label: "Working language",
      fieldtype: "Data",
    },
    {
      fieldname: "narrative_language",
      label: "Narrative language",
      fieldtype: "Data",
    },
    {
      fieldname: "translation_status",
      label: "Translation status",
      fieldtype: "Select",
      options: TRANSLATION_OPTIONS,
    },
    { fieldname: "oral_source", label: "Oral source", fieldtype: "Check" },
    { fieldname: "tl_org_id", label: "TrustLedger org id", fieldtype: "Data" },
  ];
}

function autonameField(name: TrustDocTypeName): string {
  if (name === "TL Trust Observation") return "observation_code";
  if (name === "TL Trust Participation") return "participation_code";
  return "community_code";
}

export function trustDocTypePayload(name: TrustDocTypeName) {
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

/** Idempotently create TE-7 trust DocTypes. */
export async function ensureTrustDocTypes(options?: {
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
      missing: [...TRUST_DOCTYPE_NAMES],
      message: "FRAPPE_API_KEY / SECRET / BASE_URL missing",
    };
  }

  const headers = authHeaders(pair.key, pair.secret);
  const results: DocTypeEnsureResult["results"] = [];
  const missing: string[] = [];

  for (const name of TRUST_DOCTYPE_NAMES) {
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
        body: JSON.stringify(trustDocTypePayload(name)),
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
        ? `Dry-run: ${missing.length} trust DocType(s) missing — set dryRun:false to create.`
        : "Dry-run: all trust DocTypes already exist."
      : ok
        ? created
          ? `Created ${created} trust DocType(s); others already present.`
          : "All trust DocTypes already exist."
        : `Finished with ${errors.length} error(s) — check API key System Manager rights.`,
  };
}
