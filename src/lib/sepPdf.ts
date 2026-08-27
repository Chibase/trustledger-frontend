/**
 * Tender-style SEP PDF: cover block, running header/footer, page numbers, tables.
 * Markdown tables in section bodies are parsed and drawn as real tables.
 * Pages are created only while there is remaining text — no trailing blanks.
 */

import PDFDocument from "pdfkit";
import { sepCoverFields, sepPreparedBy } from "@/lib/sepDocument";
import type { EngagementPlan, SepDocumentTable } from "@/types/engagementPlan";

const PAGE_MARGIN = 54;
const INK = "#12202a";
const MUTED = "#5b6b76";
const TRUST = "#0e7c66";
const TRUST_INK = "#085f4d";
const LINE = "#d7dee4";
const HEADER = "#f3f5f7";
const HEADER_H = 36;
const FOOTER_H = 28;

function clip(value: string, max: number): string {
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

function plain(value: string): string {
  return clip(value, 12_000).replace(/\*\*/g, "");
}

export function isSepPlanPayload(value: unknown): value is EngagementPlan {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length > 80) return false;
  if (typeof row.title !== "string" || row.title.length > 240) return false;
  if (!Array.isArray(row.documentSections) || row.documentSections.length > 64) {
    return false;
  }
  return true;
}

function isTableLine(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

function parseMarkdownTable(lines: string[]): SepDocumentTable | null {
  const body = lines.filter((line) => isTableLine(line));
  if (body.length < 2) return null;
  const cells = (line: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
  const headers = cells(body[0]!);
  if (!headers.length || headers.every((h) => /^[-: ]+$/.test(h))) return null;
  const rows = body.slice(1).filter((line) => !cells(line).every((c) => /^[-: ]+$/.test(c))).map(cells);
  if (!rows.length) return null;
  return { headers, rows };
}

type BodyBlock =
  | { kind: "prose"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "heading"; text: string }
  | { kind: "table"; table: SepDocumentTable }
  | { kind: "caption"; text: string };

function blocksFromBody(text: string): BodyBlock[] {
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: BodyBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i]!.trim()) {
      i += 1;
      continue;
    }
    if (/^\*[^*].*\*$/.test(lines[i]!.trim()) && /table\s+\d/i.test(lines[i]!)) {
      blocks.push({ kind: "caption", text: lines[i]!.trim().replace(/^\*|\*$/g, "") });
      i += 1;
      continue;
    }
    if (isTableLine(lines[i]!)) {
      const chunk: string[] = [];
      while (i < lines.length && (isTableLine(lines[i]!) || !lines[i]!.trim())) {
        if (isTableLine(lines[i]!)) chunk.push(lines[i]!);
        i += 1;
      }
      const table = parseMarkdownTable(chunk);
      if (table) blocks.push({ kind: "table", table });
      else blocks.push({ kind: "prose", text: chunk.join(" ") });
      continue;
    }
    const first = lines[i]!.trim();
    const numbered = first.match(/^\*\*(\d+(?:\.\d+)*[^*]{0,80})\*\*\s*(.*)$/);
    if (numbered) {
      blocks.push({ kind: "heading", text: plain(numbered[1] || "") });
      if (numbered[2]?.trim()) {
        blocks.push({ kind: "prose", text: numbered[2].trim() });
      }
      i += 1;
      continue;
    }
    if (/^(\d+\.\s|[•\-]\s)/.test(first)) {
      const items: string[] = [];
      while (i < lines.length && /^(\d+\.\s|[•\-]\s)/.test(lines[i]!.trim())) {
        items.push(plain(lines[i]!.trim().replace(/^(\d+\.\s|[•\-]\s)/, "")));
        i += 1;
      }
      blocks.push({ kind: "list", items });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !isTableLine(lines[i]!) &&
      !/^\*\*\d+(\.\d+)*/.test(lines[i]!.trim()) &&
      !/^(\d+\.\s|[•\-]\s)/.test(lines[i]!.trim())
    ) {
      para.push(lines[i]!.trim());
      i += 1;
    }
    if (para.length) blocks.push({ kind: "prose", text: para.join(" ") });
    else i += 1;
  }
  return blocks;
}

export function buildSepPdf(plan: EngagementPlan): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const preparedBy = sepPreparedBy(plan);
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: clip(plan.projectNameHint || plan.title, 180),
        Subject: "Stakeholder Engagement Plan",
        Author: plan.implementingEntityHint?.trim() || "Implementing organisation",
        Creator: "TrustLedger",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth =
      pageWidth - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;
    let onCover = true;
    let manualPage = false;

    doc.on("pageAdded", () => {
      if (!manualPage) pagesMade += 1;
      if (manualPage) {
        doc.y = doc.page.margins.top + HEADER_H;
      }
    });

    let pagesMade = 1;

    function bottomLimit() {
      return doc.page.height - doc.page.margins.bottom - (onCover ? 0 : FOOTER_H);
    }

    function addContentPage() {
      manualPage = true;
      doc.addPage();
      pagesMade += 1;
      manualPage = false;
      doc.y = doc.page.margins.top + HEADER_H;
    }

    function ensureSpace(needed: number) {
      const room = bottomLimit() - doc.y;
      const maxBlock = Math.min(needed, 36);
      if (room < maxBlock) addContentPage();
    }

    function rule() {
      doc
        .strokeColor(LINE)
        .lineWidth(0.8)
        .moveTo(left, doc.y)
        .lineTo(left + contentWidth, doc.y)
        .stroke();
    }

    function writeBlock(
      text: string,
      opts: { font: string; size: number; color: string; lineGap: number; align?: "left" | "justify" },
    ) {
      const value = text.trim();
      if (!value) return;
      doc.font(opts.font).fontSize(opts.size).fillColor(opts.color);
      const measured = doc.heightOfString(value, {
        width: contentWidth,
        lineGap: opts.lineGap,
      });
      const room = bottomLimit() - doc.y - 2;
      if (room < 18 || (measured > room && room < 80)) {
        addContentPage();
        doc.font(opts.font).fontSize(opts.size).fillColor(opts.color);
      }
      doc.text(value, {
        width: contentWidth,
        lineGap: opts.lineGap,
        align: opts.align || "left",
      });
    }

    function bodyText(text: string, extraTables: SepDocumentTable[] = []) {
      const blocks = blocksFromBody(text);
      for (const table of extraTables) {
        blocks.push({ kind: "table", table });
      }
      for (const block of blocks) {
        if (block.kind === "heading") {
          ensureSpace(28);
          writeBlock(block.text, {
            font: "Times-Bold",
            size: 11,
            color: TRUST_INK,
            lineGap: 1.5,
          });
          doc.moveDown(0.28);
          continue;
        }
        if (block.kind === "caption") {
          ensureSpace(18);
          writeBlock(block.text, {
            font: "Times-Italic",
            size: 9,
            color: MUTED,
            lineGap: 1.2,
          });
          doc.moveDown(0.15);
          continue;
        }
        if (block.kind === "list") {
          for (const item of block.items) {
            writeBlock(`•  ${item}`, {
              font: "Times-Roman",
              size: 10,
              color: INK,
              lineGap: 2,
            });
          }
          doc.moveDown(0.28);
          continue;
        }
        if (block.kind === "table") {
          drawTable(block.table);
          continue;
        }
        writeBlock(plain(block.text), {
          font: "Times-Roman",
          size: 10,
          color: INK,
          lineGap: 2.5,
          align: "justify",
        });
        doc.moveDown(0.35);
      }
    }

    function drawTable(table: SepDocumentTable) {
      const cols = table.headers.length;
      if (!cols || !table.rows.length) return;
      const widths = table.headers.map((_, i) => {
        if (cols === 7) return contentWidth * [0.16, 0.16, 0.12, 0.14, 0.16, 0.14, 0.12][i]!;
        if (cols === 6) return contentWidth * [0.16, 0.2, 0.16, 0.16, 0.16, 0.16][i]!;
        if (cols === 5) return contentWidth * [0.24, 0.2, 0.18, 0.2, 0.18][i]!;
        if (cols === 4) return contentWidth * [0.22, 0.34, 0.2, 0.24][i]!;
        if (cols === 3) return contentWidth * [0.28, 0.44, 0.28][i]!;
        if (cols === 2) return contentWidth * [0.34, 0.66][i]!;
        return contentWidth / cols;
      });
      const pad = 5;

      function heights(cells: string[]): number {
        let h = 16;
        cells.forEach((cell, i) => {
          const cellH = doc.heightOfString(clip(cell, 400), {
            width: widths[i]! - pad * 2,
          });
          h = Math.max(h, cellH + pad * 2);
        });
        return Math.min(Math.max(h, 18), 72);
      }

      if (table.caption) {
        ensureSpace(18);
        doc
          .font("Times-Italic")
          .fontSize(9)
          .fillColor(MUTED)
          .text(table.caption, { width: contentWidth });
        doc.moveDown(0.15);
      }

      const headerH = heights(table.headers);

      function paintHeader() {
        ensureSpace(headerH + 8);
        let x = left;
        const hy = doc.y;
        doc.save();
        doc.rect(left, hy, contentWidth, headerH).fill(TRUST);
        doc.restore();
        doc.font("Times-Bold").fontSize(8).fillColor("#ffffff");
        table.headers.forEach((header, i) => {
          doc.text(header, x + pad, hy + pad, {
            width: widths[i]! - pad * 2,
            height: headerH - pad * 2,
            ellipsis: true,
          });
          x += widths[i]!;
        });
        doc.y = hy + headerH;
      }

      paintHeader();

      table.rows.forEach((row, rowIndex) => {
        const cells = table.headers.map((_, i) => row[i] || "");
        const rh = heights(cells);
        if (doc.y + rh > bottomLimit()) {
          addContentPage();
          paintHeader();
        }
        const y = doc.y;
        if (rowIndex % 2 === 0) {
          doc.save();
          doc.rect(left, y, contentWidth, rh).fill(HEADER);
          doc.restore();
        }
        doc
          .strokeColor(LINE)
          .lineWidth(0.4)
          .rect(left, y, contentWidth, rh)
          .stroke();
        let x = left;
        doc.font("Times-Roman").fontSize(8).fillColor(INK);
        cells.forEach((cell, i) => {
          doc.text(clip(cell, 400), x + pad, y + pad, {
            width: widths[i]! - pad * 2,
            height: rh - pad * 2,
            ellipsis: true,
          });
          x += widths[i]!;
        });
        doc.y = y + rh;
      });
      doc.moveDown(0.55);
    }

    // Cover
    doc.rect(0, 0, pageWidth, 8).fill(TRUST);
    doc.moveDown(2);
    doc
      .font("Times-Roman")
      .fontSize(9)
      .fillColor(TRUST)
      .text("TRUSTLEDGER  ·  SOCIAL ENGAGEMENT & PARTICIPATION", {
        width: contentWidth,
        characterSpacing: 1.2,
      });
    doc.moveDown(1.2);
    doc
      .font("Times-Bold")
      .fontSize(18)
      .fillColor(INK)
      .text("Stakeholder Engagement Plan", { width: contentWidth });
    doc.moveDown(0.25);
    doc
      .font("Times-Roman")
      .fontSize(12)
      .fillColor(TRUST_INK)
      .text(plain(plan.projectNameHint || plan.title), { width: contentWidth });
    doc.moveDown(0.8);
    rule();
    doc.moveDown(0.6);

    for (const [label, value] of sepCoverFields(plan)) {
      ensureSpace(22);
      const y = doc.y;
      doc.font("Times-Roman").fontSize(9).fillColor(MUTED).text(label, left, y, {
        width: contentWidth * 0.32,
      });
      doc
        .font("Times-Bold")
        .fontSize(10)
        .fillColor(INK)
        .text(plain(value), left + contentWidth * 0.34, y, {
          width: contentWidth * 0.66,
        });
      doc.y = Math.max(doc.y, y + 16);
    }

    doc.moveDown(1);
    rule();
    doc.moveDown(0.5);
    doc
      .font("Times-Italic")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        `${preparedBy} Not legal advice. Not a substitute for statutory processes named in the briefing.`,
        { width: contentWidth },
      );

    onCover = false;
    addContentPage();

    try {
      for (const section of plan.documentSections) {
        const body = section.body || "";
        const tables = section.tables || [];
        if (!body.trim() && !tables.length) continue;
        ensureSpace(36);
        doc
          .font("Times-Bold")
          .fontSize(13)
          .fillColor(INK)
          .text(plain(section.heading), { width: contentWidth });
        doc.moveDown(0.3);
        bodyText(body, tables);
        doc.moveDown(0.25);
      }

      const range = doc.bufferedPageRange();
      const project = clip(plan.projectNameHint || "Stakeholder Engagement Plan", 70);
      const issuer = clip(
        plan.implementingEntityHint?.trim() || "Stakeholder Engagement Plan",
        48,
      );
      const count = range.count;
      for (let i = 0; i < count; i += 1) {
        doc.switchToPage(i);
        const isCover = i === 0;
        if (!isCover) {
          doc.save();
          doc.rect(0, 0, pageWidth, 32).fill(HEADER);
          doc
            .font("Times-Roman")
            .fontSize(8)
            .fillColor(TRUST_INK)
            .text("Stakeholder Engagement Plan", PAGE_MARGIN, 12, {
              width: contentWidth * 0.55,
              height: 12,
              ellipsis: true,
            });
          doc
            .font("Times-Roman")
            .fontSize(8)
            .fillColor(MUTED)
            .text(project, PAGE_MARGIN + contentWidth * 0.55, 12, {
              width: contentWidth * 0.45,
              align: "right",
              height: 12,
              ellipsis: true,
            });
          doc.restore();
        }
        doc
          .font("Times-Roman")
          .fontSize(8)
          .fillColor(MUTED)
          .text(
            `${issuer}    Page ${i + 1} of ${count}`,
            PAGE_MARGIN,
            doc.page.height - 36,
            { width: contentWidth, align: "left", height: 12, ellipsis: true },
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
