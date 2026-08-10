/**
 * Send a segment intro with real first-name personalization.
 *
 * Frappe Newsletter renders Jinja once for the whole blast (no per-recipient
 * first_name). This script loads an Email Template + Email Group, substitutes
 * each member's custom_first_name, and sends via Communication.
 *
 * Usage:
 *   npx tsx scripts/send-personalized-segment-email.mts \
 *     --template "TL Intro Construction" \
 *     --group "TL Segment Construction" \
 *     --sender-name "TrustLedger Construction" \
 *     --dry-run
 *
 *   npx tsx scripts/send-personalized-segment-email.mts \
 *     --template "TL Intro Construction" \
 *     --group "TL Segment Construction" \
 *     --sender-name "TrustLedger Construction" \
 *     --only admin@chibaseconsulting.co.za
 *
 * Requires .env.local: FRAPPE_BASE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
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

function arg(name: string, fallback = ""): string {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

loadEnvLocal();

const base = (process.env.FRAPPE_BASE_URL || "").replace(/\/$/, "");
const key = process.env.FRAPPE_API_KEY || "";
const secret = process.env.FRAPPE_API_SECRET || "";
if (!base || !key || !secret) {
  console.error("Missing FRAPPE_BASE_URL / FRAPPE_API_KEY / FRAPPE_API_SECRET");
  process.exit(1);
}

const templateName = arg("template");
const group = arg("group");
const senderName = arg("sender-name", "TrustLedger");
const senderEmail = arg("sender-email", "sales@trustledger.co.za");
const only = arg("only").toLowerCase();
const dryRun = hasFlag("dry-run");

if (!templateName || !group) {
  console.error(
    "Required: --template \"TL Intro …\" --group \"TL Segment …\" [--dry-run] [--only email]",
  );
  process.exit(1);
}

async function api(method: string, path: string, data?: unknown) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `token ${key}:${secret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

function personalize(html: string, firstName: string): string {
  const safe = firstName.trim();
  return html.replace(
    /\{\%\s*if\s+tl_first_name\s*\%\}\s*\{\{\s*tl_first_name\s*\}\}\s*\{\%\s*endif\s*\%\}/g,
    safe ? ` ${safe}` : "",
  );
}

async function listMembers(emailGroup: string) {
  const fields = encodeURIComponent(
    JSON.stringify(["name", "email", "custom_first_name", "unsubscribed"]),
  );
  const filters = encodeURIComponent(
    JSON.stringify([
      ["email_group", "=", emailGroup],
      ["unsubscribed", "=", 0],
    ]),
  );
  const { status, json } = await api(
    "GET",
    `/api/resource/Email%20Group%20Member?fields=${fields}&filters=${filters}&limit_page_length=500`,
  );
  if (status !== 200) throw new Error(`members ${status} ${JSON.stringify(json)}`);
  return ((json as { data?: Array<Record<string, string | number>> }).data ||
    []) as Array<{
    email: string;
    custom_first_name?: string;
  }>;
}

const tplEnc = encodeURIComponent(templateName);
const tplRes = await api("GET", `/api/resource/Email%20Template/${tplEnc}`);
if (tplRes.status !== 200) {
  console.error("Email Template not found", templateName, tplRes.json);
  process.exit(1);
}
const tpl = (tplRes.json as { data: Record<string, string> }).data;
const html = tpl.response_html || tpl.response || "";
const subject = tpl.subject || templateName;
if (!html.includes("tl_first_name") && !html.includes("Hello")) {
  console.warn("Warning: template may not include the tl_first_name greeting block");
}

let members = await listMembers(group);
if (only) members = members.filter((m) => m.email.toLowerCase() === only);
if (!members.length) {
  console.error("No recipients");
  process.exit(1);
}

console.log(
  dryRun ? "DRY RUN" : "SENDING",
  members.length,
  "via",
  `${senderName} <${senderEmail}>`,
);

let ok = 0;
let fail = 0;
for (const member of members) {
  const first = (member.custom_first_name || "").trim();
  const body = personalize(html, first);
  const greeting = body.match(/Hello[^,<]*,/)?.[0] || "Hello,";
  console.log(`- ${member.email} → ${greeting}${first ? "" : " (no first name)"}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const send = await api("POST", "/api/method/frappe.core.doctype.communication.email.make", {
    recipients: member.email,
    subject,
    content: body,
    send_email: 1,
    sender: `${senderName} <${senderEmail}>`,
    communication_medium: "Email",
    send_me_a_copy: 0,
  });
  if (send.status >= 200 && send.status < 300) ok += 1;
  else {
    fail += 1;
    console.error("  fail", send.status, JSON.stringify(send.json).slice(0, 220));
  }
}

console.log({ ok, fail, dryRun });
process.exit(fail ? 1 : 0);
