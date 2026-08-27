/**
 * Tender-style SEP PDF: cover block, running header/footer, page numbers, tables.
 * No product-architecture boxes.
 */

import PDFDocument from "pdfkit";
import { SEP_ISSUER_LINE, sepCoverFields } from "@/lib/sepDocument";
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
  if (!Array.isArray(row.documentSections) || row.documentSections.length > 48) {
    return false;
  }
  return true;
}

export function buildSepPdf(plan: EngagementPlan): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      bufferPages: true,
      info: {
        Title: clip(plan.projectNameHint || plan.title, 180),
        Subject: "Stakeholder Engagement Plan",
        Author: "Chibase Consulting",
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

    doc.on("pageAdded", () => {
      if (onCover) return;
      doc.y = doc.page.margins.top + HEADER_H;
    });

    function bottomLimit() {
      return doc.page.height - doc.page.margins.bottom - (onCover ? 0 : FOOTER_H);
    }

    function ensureSpace(needed: number) {
      if (doc.y + needed > bottomLimit()) doc.addPage();
    }

    function rule() {
      doc
        .strokeColor(LINE)
        .lineWidth(0.8)
        .moveTo(left, doc.y)
        .lineTo(left + contentWidth, doc.y)
        .stroke();
    }

    function bodyText(text: string, size = 10) {
      const blocks = (text || "").split(/\n{2,}/);
      for (const raw of blocks) {
        const block = raw.trim();
        if (!block) continue;
        const isSub = /^\*\*\d+\.\d+[^*]*\*\*/.test(block.split("\n")[0] || "");
        const lines = block.split("\n");
        const isList = lines.every((line) => /^[•\-]\s/.test(line.trim()));
        if (isSub) {
          const heading = plain(block.replace(/\*\*/g, ""));
          ensureSpace(28);
          doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .fillColor(TRUST_INK)
            .text(heading, { width: contentWidth });
          doc.moveDown(0.25);
          continue;
        }
        if (isList) {
          for (const line of lines) {
            const item = plain(line.replace(/^[•\-]\s/, ""));
            const h = doc.heightOfString(item, {
              width: contentWidth - 14,
              lineGap: 2,
            });
            ensureSpace(h + 6);
            doc
              .font("Helvetica")
              .fontSize(size)
              .fillColor(INK)
              .text(`•  ${item}`, { width: contentWidth, lineGap: 2 });
          }
          doc.moveDown(0.3);
          continue;
        }
        const h = doc.heightOfString(plain(block), {
          width: contentWidth,
          lineGap: 2.5,
        });
        ensureSpace(h + 8);
        doc
          .font("Helvetica")
          .fontSize(size)
          .fillColor(INK)
          .text(plain(block), { width: contentWidth, lineGap: 2.5, align: "justify" });
        doc.moveDown(0.4);
      }
    }

    function drawTable(table: SepDocumentTable) {
      const cols = table.headers.length;
      const widths = table.headers.map((_, i) => {
        if (cols === 5) {
          return contentWidth * [0.24, 0.2, 0.18, 0.2, 0.18][i];
        }
        if (cols === 4) {
          return contentWidth * [0.22, 0.34, 0.2, 0.24][i];
        }
        return contentWidth / cols;
      });
      const pad = 5;

      function heights(cells: string[]): number {
        let h = 16;
        cells.forEach((cell, i) => {
          const cellH = doc.heightOfString(clip(cell, 400), {
            width: widths[i] - pad * 2,
          });
          h = Math.max(h, cellH + pad * 2);
        });
        return Math.min(Math.max(h, 18), 90);
      }

      if (table.caption) {
        ensureSpace(20);
        doc
          .font("Helvetica-Oblique")
          .fontSize(8)
          .fillColor(MUTED)
          .text(table.caption, { width: contentWidth });
        doc.moveDown(0.2);
      }

      const headerH = heights(table.headers);
      ensureSpace(headerH + 8);
      let x = left;
      const hy = doc.y;
      doc.save();
      doc.rect(left, hy, contentWidth, headerH).fill(TRUST);
      doc.restore();
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#ffffff");
      table.headers.forEach((header, i) => {
        doc.text(header, x + pad, hy + pad, {
          width: widths[i] - pad * 2,
        });
        x += widths[i];
      });
      doc.y = hy + headerH;

      table.rows.forEach((row, rowIndex) => {
        const cells = table.headers.map((_, i) => row[i] || "");
        const rh = heights(cells);
        if (doc.y + rh > bottomLimit()) {
          doc.addPage();
          let hx = left;
          const ny = doc.y;
          doc.save();
          doc.rect(left, ny, contentWidth, headerH).fill(TRUST);
          doc.restore();
          doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#ffffff");
          table.headers.forEach((header, i) => {
            doc.text(header, hx + pad, ny + pad, {
              width: widths[i] - pad * 2,
            });
            hx += widths[i];
          });
          doc.y = ny + headerH;
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
        x = left;
        doc.font("Helvetica").fontSize(7.5).fillColor(INK);
        cells.forEach((cell, i) => {
          doc.text(clip(cell, 400), x + pad, y + pad, {
            width: widths[i] - pad * 2,
          });
          x += widths[i];
        });
        doc.y = y + rh;
      });
      doc.moveDown(0.7);
    }

    // Cover
    doc.rect(0, 0, pageWidth, 8).fill(TRUST);
    doc.moveDown(2);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(TRUST)
      .text("CHIBASE CONSULTING", {
        width: contentWidth,
        characterSpacing: 1.6,
      });
    doc.moveDown(0.15);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text("TRUSTLEDGER", { width: contentWidth, characterSpacing: 1.6 });
    doc.moveDown(1.1);
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(INK)
      .text("Stakeholder Engagement Plan", { width: contentWidth });
    doc.moveDown(0.25);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(TRUST_INK)
      .text(plain(plan.projectNameHint || plan.title), { width: contentWidth });
    doc.moveDown(0.8);
    rule();
    doc.moveDown(0.6);

    for (const [label, value] of sepCoverFields(plan)) {
      ensureSpace(22);
      const y = doc.y;
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(label, left, y, {
        width: contentWidth * 0.32,
      });
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
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
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        `${SEP_ISSUER_LINE} Not legal advice. Not a substitute for statutory processes named in the briefing.`,
        { width: contentWidth },
      );

    onCover = false;
    doc.addPage();
    doc.y = doc.page.margins.top + HEADER_H;

    for (const section of plan.documentSections) {
      ensureSpace(40);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(INK)
        .text(plain(section.heading), { width: contentWidth });
      doc.moveDown(0.35);
      bodyText(section.body || "");
      for (const table of section.tables || []) {
        drawTable(table);
      }
      doc.moveDown(0.35);
    }

    const range = doc.bufferedPageRange();
    const project = clip(plan.projectNameHint || "Stakeholder Engagement Plan", 70);
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(i);
      const isCover = i === 0;
      if (!isCover) {
        doc.save();
        doc.rect(0, 0, pageWidth, 32).fill(HEADER);
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(TRUST_INK)
          .text("Stakeholder Engagement Plan", PAGE_MARGIN, 12, {
            width: contentWidth * 0.55,
          });
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(MUTED)
          .text(project, PAGE_MARGIN + contentWidth * 0.55, 12, {
            width: contentWidth * 0.45,
            align: "right",
          });
        doc.restore();
      }
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          `Chibase Consulting    Page ${i + 1} of ${range.count}`,
          PAGE_MARGIN,
          doc.page.height - 36,
          { width: contentWidth, align: "left" },
        );
    }

    doc.end();
  });
}
