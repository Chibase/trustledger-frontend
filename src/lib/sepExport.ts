/**
 * Client-side SEP export — Markdown and Word-compatible HTML.
 * Print / PDF uses the document view + browser print (cover page in CSS).
 */

import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_SECTOR_LABELS,
  SEP_SOURCE_LABELS,
} from "@/types/engagementPlan";

function safeName(plan: EngagementPlan): string {
  return plan.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || plan.id;
}

export function planToMarkdown(plan: EngagementPlan): string {
  const issued = new Date(plan.updatedAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const lines = [
    `# ${plan.title}`,
    "",
    `TrustLedger · Stakeholder Engagement Plan`,
    "",
    `- Sector: ${SEP_SECTOR_LABELS[plan.sectorId]}`,
    `- Source: ${SEP_SOURCE_LABELS[plan.sourceKind]}`,
    `- Issued: ${issued}`,
    `- Plan ID: ${plan.id}`,
    plan.projectNameHint ? `- Assignment: ${plan.projectNameHint}` : null,
    plan.clientFunderHint ? `- Client: ${plan.clientFunderHint}` : null,
    plan.placeHint ? `- Place: ${plan.placeHint}` : null,
    plan.timelineHint ? `- Timeline: ${plan.timelineHint}` : null,
    "",
  ].filter((row) => row !== null) as string[];

  for (const section of plan.documentSections) {
    lines.push(`## ${section.heading}`, "", section.body, "");
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

export function planToWordHtml(plan: EngagementPlan): string {
  const md = planToMarkdown(plan);
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const htmlBody = escaped
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("- ")) return `<p>• ${line.slice(2)}</p>`;
      if (!line.trim()) return "";
      const bold = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      return `<p>${bold}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8" />
<title>${plan.title.replace(/</g, "")}</title>
<style>
  body { font-family: Calibri, sans-serif; color: #12202a; max-width: 40rem; }
  h1, h2, h3 { color: #085f4d; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;
}

function download(filename: string, mime: string, content: string) {
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
