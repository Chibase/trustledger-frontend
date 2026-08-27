/**
 * Client-side SEP export — Markdown, Word-compatible HTML, branded PDF.
 */

import type { EngagementPlan, SepDocumentTable } from "@/types/engagementPlan";
import { sepCoverBlurb, sepCoverFields, sepPreparedBy } from "@/lib/sepDocument";

function safeName(plan: EngagementPlan): string {
  return (
    (plan.projectNameHint || plan.title).replace(/[^\w\- ]+/g, "").trim().slice(0, 80) ||
    plan.id
  );
}

function tableMarkdown(table: SepDocumentTable): string {
  if (!table.headers.length) return "";
  const rows = table.rows.map((row) => `| ${row.map((c) => c.replace(/\|/g, "/")).join(" | ")} |`);
  return [
    table.caption ? `\n*${table.caption}*\n` : "",
    `| ${table.headers.join(" | ")} |`,
    `| ${table.headers.map(() => "---").join(" | ")} |`,
    ...rows,
    "",
  ].join("\n");
}

export function planToMarkdown(plan: EngagementPlan): string {
  const lines = [
    `# Stakeholder Engagement Plan`,
    "",
    `**${plan.projectNameHint || plan.title}**`,
    "",
    sepCoverBlurb(plan),
    "",
    ...sepCoverFields(plan).map(([k, v]) => `- ${k}: ${v}`),
    "",
  ];

  for (const section of plan.documentSections) {
    lines.push(`## ${section.heading}`, "", section.body, "");
    for (const table of section.tables || []) {
      lines.push(tableMarkdown(table));
    }
  }

  lines.push(
    "---",
    "",
    `${sepPreparedBy(plan)} Not legal advice. Not a substitute for statutory processes named in the briefing.`,
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

function tableHtml(table: SepDocumentTable): string {
  const head = table.headers
    .map((h) => `<th>${esc(h)}</th>`)
    .join("");
  const body = table.rows
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table border="1" cellpadding="6" cellspacing="0" width="100%">
<tr>${head}</tr>
${body}
</table>`;
}

export function planToWordHtml(plan: EngagementPlan): string {
  const meta = sepCoverFields(plan);
  const sections = plan.documentSections
    .map((section) => {
      const tables = (section.tables || []).map(tableHtml).join("\n");
      return `<h2>${esc(section.heading)}</h2>
<p>${rich(section.body)}</p>
${tables}`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8" />
<title>${esc(plan.projectNameHint || plan.title)}</title>
<style>
  body { font-family: Calibri, sans-serif; color: #12202a; max-width: 48rem; }
  h1, h2 { color: #085f4d; }
  table { border-collapse: collapse; font-size: 10pt; margin: 12px 0; }
  th { text-align: left; background: #0e7c66; color: #ffffff; }
</style>
</head>
<body>
<p style="letter-spacing:0.12em;text-transform:uppercase;font-size:11px;color:#0e7c66;">TrustLedger  ·  Social Engagement &amp; Participation</p>
<h1>Stakeholder Engagement Plan</h1>
<p style="font-size:14pt;color:#085f4d;"><strong>${esc(plan.projectNameHint || plan.title)}</strong></p>
<p>${esc(sepCoverBlurb(plan))}</p>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
${meta.map(([k, v]) => `<tr><td width="34%"><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`).join("")}
</table>
${sections}
<p style="font-size:10pt;color:#5b6b76;">${esc(sepPreparedBy(plan))} Not legal advice. Not a substitute for statutory processes named in the briefing.</p>
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

function mdTableToHtml(markdown: string): string {
  const tables: string[] = [];
  const withPlaceholders = markdown.replace(
    /(?:^|\n)(\| [^\n]+\|\n\| [-| ]+\|\n(?:\| [^\n]+\|\n?)+)/g,
    (block) => {
      const lines = block.trim().split("\n").filter(Boolean);
      if (lines.length < 2) return block;
      const cells = (line: string) =>
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
      const headers = cells(lines[0]!);
      const rows = lines.slice(2).map((line) => cells(line));
      tables.push(
        `<table border="1" cellpadding="6" cellspacing="0" width="100%"><tr>${headers
          .map((h) => `<th>${esc(h)}</th>`)
          .join("")}</tr>${rows
          .map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
          .join("")}</table>`,
      );
      return `\n@@TABLE${tables.length - 1}@@\n`;
    },
  );
  return rich(withPlaceholders).replace(/@@TABLE(\d+)@@/g, (_, index) => tables[Number(index)] || "");
}

/**
 * Markdown for the 25-section analysis SEP (Phase G).
 */
export function sepDocumentToMarkdown(doc: {
  title: string;
  version: string;
  generatedAt: string;
  documentSections: Array<{
    sectionTitle: string;
    body: string;
    tables?: SepDocumentTable[];
  }>;
  implementingOrganisation?: string;
}): string {
  const prepared = sepPreparedBy({
    implementingEntityHint: doc.implementingOrganisation,
  });
  const lines = [
    `# ${doc.title}`,
    "",
    `Version ${doc.version} · Drafted ${new Date(doc.generatedAt).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    "",
    prepared,
    "",
  ];
  for (const section of doc.documentSections) {
    lines.push(`## ${section.sectionTitle}`, "", section.body, "");
    for (const table of section.tables || []) {
      lines.push(tableMarkdown(table));
    }
  }
  lines.push(
    "---",
    "",
    `${prepared} Not legal advice. Not a substitute for statutory processes named in the briefing.`,
    "",
  );
  return lines.join("\n");
}

export function sepDocumentToWordHtml(doc: {
  title: string;
  version: string;
  generatedAt: string;
  documentSections: Array<{
    sectionTitle: string;
    body: string;
    tables?: SepDocumentTable[];
  }>;
  implementingOrganisation?: string;
}): string {
  const prepared = sepPreparedBy({
    implementingEntityHint: doc.implementingOrganisation,
  });
  const sections = doc.documentSections
    .map((section) => {
      const tables = (section.tables || []).map(tableHtml).join("\n");
      return `<h2>${esc(section.sectionTitle)}</h2>
${mdTableToHtml(section.body)}
${tables}`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8" />
<title>${esc(doc.title)}</title>
<style>
  body { font-family: Calibri, sans-serif; color: #12202a; max-width: 48rem; }
  h1, h2 { color: #085f4d; }
  table { border-collapse: collapse; font-size: 10pt; margin: 12px 0; }
  th { text-align: left; background: #0e7c66; color: #ffffff; }
</style>
</head>
<body>
<p style="letter-spacing:0.12em;text-transform:uppercase;font-size:11px;color:#0e7c66;">TrustLedger  ·  Social Engagement &amp; Participation</p>
<h1>${esc(doc.title)}</h1>
<p>Version ${esc(doc.version)}</p>
${sections}
<p style="font-size:10pt;color:#5b6b76;">${esc(prepared)} Not legal advice. Not a substitute for statutory processes named in the briefing.</p>
</body>
</html>`;
}

/**
 * Adapt a rendered analysis SEP onto the desk export shape so PDF/Markdown
 * cover fields still work. Does not replace Gemini's nine-section client draft.
 */
export function engagementPlanFromSepDocument(
  doc: {
    id: string;
    title: string;
    generatedAt: string;
    documentSections: Array<{
      sectionId: string;
      sectionTitle: string;
      body: string;
      tables?: SepDocumentTable[];
    }>;
  },
  meta: {
    projectName: string;
    place: string;
    client: string;
    timeline: string;
    tenderRef: string;
    sectorId: import("@/types/engagementPlan").SepSectorId;
    programmeKind?: import("@/types/engagementPlan").SepProgrammeKind;
    implementingEntity?: string;
  },
): EngagementPlan {
  return {
    id: doc.id.slice(0, 80),
    title: doc.title.slice(0, 240),
    status: "suggested",
    sourceKind: "tender",
    sectorId: meta.sectorId,
    programmeKind: meta.programmeKind,
    projectId: null,
    projectNameHint: meta.projectName,
    placeHint: meta.place,
    clientFunderHint: meta.client,
    timelineHint: meta.timeline,
    tenderRefHint: meta.tenderRef,
    implementingEntityHint: meta.implementingEntity,
    createdAt: doc.generatedAt,
    updatedAt: doc.generatedAt,
    sourceExcerpt: "",
    purposeStatement: doc.title,
    phases: [],
    stakeholderClasses: [],
    activities: [],
    commitments: [],
    instruments: [],
    grievancePath: "",
    assumptions: [],
    documentSections: doc.documentSections.map((row) => ({
      id: row.sectionId,
      heading: row.sectionTitle,
      body: row.body,
      ...(row.tables?.length ? { tables: row.tables } : {}),
    })),
    documentDrafter: "template",
  };
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
