/**
 * One-shot Frappe Cloud bootstrap (local / agent).
 * Loads `.env.local` then ensures custom fields, product + SI DocTypes,
 * CRM lead sources/views, and creates a disposable smoke CRM Lead.
 *
 * Usage: npx tsx scripts/frappe-configure.mts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    throw new Error(".env.local missing — set FRAPPE_BASE_URL + API key/secret first");
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const { ensureTrustLedgerCustomFields } = await import(
  "@/lib/frappeCustomFields"
);
const { ensureProductDocTypes } = await import("@/lib/frappeProductDocTypes");
const { ensureSiDocTypes } = await import("@/lib/frappeSiDocTypes");
const { bootstrapCrmViews } = await import("@/lib/crmSetup");
const { submitFrappeLead, verifyFrappeApiAuth } = await import(
  "@/lib/leadCapture"
);

const auth = await verifyFrappeApiAuth();
console.log("auth", {
  ok: auth.ok,
  user: auth.user,
  base: auth.base,
  keyLength: auth.keyLength,
  secretLength: auth.secretLength,
  mode: auth.mode,
  detail: auth.detail,
});
if (!auth.ok) {
  process.exit(1);
}

const fields = await ensureTrustLedgerCustomFields({ dryRun: false });
console.log("customFields", fields.message, fields.results);

const product = await ensureProductDocTypes({ dryRun: false });
console.log("productDocTypes", product.message, product.results);

const si = await ensureSiDocTypes({ dryRun: false });
console.log("siDocTypes", si.message, si.results);
if (!si.ok) {
  console.error(
    "\nSI DocTypes blocked — grant System Manager to the API key user in Desk, then re-run.\n",
  );
}

const crm = await bootstrapCrmViews();
console.log("crmBootstrap", JSON.stringify(crm, null, 2));

const smokeEmail = `frappe-config-smoke+${Date.now()}@trustledger.co.za`;
const leadRes = await submitFrappeLead({
  email: smokeEmail,
  name: "Frappe config smoke",
  company: "TrustLedger Ops",
  message:
    "Disposable smoke lead from scripts/frappe-configure.mts — safe to delete.",
  pageName: "agent-frappe-configure",
  pageUri: "https://trustledger.co.za/ops",
  sourceTag: "Website Contact",
  crmSource: "Website Contact",
  jobTitle: "Config smoke",
});
const leadText = await leadRes.text();
console.log("leadSmoke", { status: leadRes.status, body: leadText.slice(0, 400) });

const coreOk = auth.ok && fields.ok && product.ok && crm.ok && leadRes.ok;
const ok = coreOk && si.ok;

if (coreOk && !si.ok) {
  console.error(
    "Core CRM/product config OK; SI DocTypes still missing (System Manager required).",
  );
}

process.exit(ok ? 0 : 1);
