/**
 * Client-side SEP export — Markdown, Word-compatible HTML, branded PDF.
 * Print layout still uses the document view + browser print (cover in CSS).
 */

import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_PROGRAMME_LABELS,
  SEP_PURPOSE_LABELS,
  SEP_SECTOR_LABELS,
  SEP_SOURCE_LABELS,
} from "@/types/engagementPlan";
import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
} from "@/lib/sepMatrix";

function safeName(plan: EngagementPlan): string {
  return plan.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || plan.id;
}

function issuedLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function stakeholderMarkdown(plan: EngagementPlan): string {
  if (!plan.stakeholderClasses.length) return "";
  const rows = plan.stakeholderClasses.map((row) => {
    return `| ${row.label} | ${row.influence} | ${interestForClass(row)} | ${SEP_QUADRANT_LABELS[quadrantForClass(row)]} | ${SEP_PURPOSE_LABELS[row.purpose]} |`;
  });
  return [
    "",
    "| Class | Influence | Interest | Quadrant | Purpose |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

export function planToMarkdown(plan: EngagementPlan): string {
  const lines = [
    `# ${plan.title}`,
    "",
    `TrustLedger · Stakeholder Engagement Plan`,
    "",
    plan.programmeKind === "relocation"
      ? `- Programme: ${SEP_PROGRAMME_LABELS.relocation}`
      : null,
    `- Sector: ${SEP_SECTOR_LABELS[plan.sectorId]}`,
    `- Source: ${SEP_SOURCE_LABELS[plan.sourceKind]}`,
    `- Issued: ${issuedLabel(plan.updatedAt)}`,
    `- Plan ID: ${plan.id}`,
    plan.projectNameHint ? `- Assignment: ${plan.projectNameHint}` : null,
    plan.clientFunderHint ? `- Client: ${plan.clientFunderHint}` : null,
    plan.placeHint ? `- Place: ${plan.placeHint}` : null,
    plan.timelineHint ? `- Timeline: ${plan.timelineHint}` : null,
    "",
  ].filter((row) => row !== null) as string[];

  for (const section of plan.documentSections) {
    lines.push(`## ${section.heading}`, "", section.body, "");
    if (section.id === "stakeholders") {
      lines.push(stakeholderMarkdown(plan));
    }
    if (section.protocol) {
      lines.push(
        `### TrustLedger SRM execution protocol`,
        "",
        section.protocol,
        "",
      );
    }
  }

  lines.push(
    "---",
    "",
    "Prepared on the TrustLedger SRM desk. Suggestion only until a human applies rows after approval. Not legal advice.",
    "",
  );
  return lines.join("\n");
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function rich(value: string): string {
  return esc(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export function planToWordHtml(plan: EngagementPlan): string {
  const meta = [
    plan.programmeKind === "relocation"
      ? ["Programme", SEP_PROGRAMME_LABELS.relocation]
      : null,
    ["Sector", SEP_SECTOR_LABELS[plan.sectorId]],
    ["Source", SEP_SOURCE_LABELS[plan.sourceKind]],
    ["Assignment", plan.projectNameHint],
    ["Client", plan.clientFunderHint],
    ["Place", plan.placeHint],
    ["Timeline", plan.timelineHint],
    ["Issued", issuedLabel(plan.updatedAt)],
    ["Plan ID", plan.id],
  ].filter((row): row is [string, string] => Boolean(row && row[1]));

  const classRows = plan.stakeholderClasses
    .map(
      (row) =>
        `<tr><td>${esc(row.label)}</td><td>${esc(row.influence)}</td><td>${esc(interestForClass(row))}</td><td>${esc(SEP_QUADRANT_LABELS[quadrantForClass(row)])}</td><td>${esc(SEP_PURPOSE_LABELS[row.purpose])}</td></tr>`,
    )
    .join("");

  const sections = plan.documentSections
    .map((section) => {
      const table =
        section.id === "stakeholders" && classRows
          ? `<table border="1" cellpadding="6" cellspacing="0" width="100%">
<tr><th>Class</th><th>Influence</th><th>Interest</th><th>Quadrant</th><th>Purpose</th></tr>
${classRows}
</table>`
          : "";
      const protocol = section.protocol
        ? `<div style="border:1px dashed #0e7c66;background:#f3f5f7;padding:12px;margin:12px 0;">
<p style="color:#0e7c66;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;"><strong>TrustLedger SRM execution protocol</strong></p>
<p>${rich(section.protocol)}</p>
</div>`
        : "";
      return `<h2>${esc(section.heading)}</h2>
<p>${rich(section.body)}</p>
${table}
${protocol}`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8" />
<title>${esc(plan.title)}</title>
<style>
  body { font-family: Calibri, sans-serif; color: #12202a; max-width: 44rem; }
  h1, h2, h3 { color: #085f4d; }
  table { border-collapse: collapse; font-size: 11pt; margin: 12px 0; }
  th { text-align: left; color: #085f4d; }
</style>
</head>
<body>
<p style="color:#0e7c66;letter-spacing:0.12em;text-transform:uppercase;font-size:11px;">TrustLedger SRM</p>
<p><strong>Stakeholder Engagement Plan</strong></p>
<h1>${esc(plan.title)}</h1>
<p>${
    plan.programmeKind === "relocation"
      ? "Operating plan for census, entitlements, host consultation, the physical move, livelihood restoration, and one grievance path. Suggestion until a human applies rows. Not legal advice."
      : "Working stakeholder engagement plan executed on the TrustLedger desk after award. Suggestion until a human applies rows. Not legal advice."
  }</p>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
${meta.map(([k, v]) => `<tr><td><strong>${esc(k)}</strong></td><td>${esc(String(v))}</td></tr>`).join("")}
</table>
${sections}
<p style="font-size:10pt;color:#5b6b76;">Prepared on the TrustLedger SRM desk. Not legal advice. Humans apply rows to the live desk.</p>
</body>
</html>`;
}

function download(filename: string, mime: string, content: BlobPart) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSepMarkdown(plan: EngagementPlan) {
  download(`${safeName(plan)}.md`, "text/markdown;charset=utf-8", planToMarkdown(plan));
}

export function downloadSepWord(plan: EngagementPlan) {
  download(
    `${safeName(plan)}.doc`,
    "application/msword;charset=utf-8",
    planToWordHtml(plan),
  );
}

export async function downloadSepPdf(plan: EngagementPlan): Promise<void> {
  const res = await fetch("/api/app/engagement-plan/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    let message = "Could not build the PDF.";
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  download(`${safeName(plan)}.pdf`, "application/pdf", blob);
}
