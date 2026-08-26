/**
 * Branded executive PDF for a saved SEP. Trust tokens only (DESIGN_SYSTEM).
 * Client report — no product architecture, no execution-protocol boxes.
 */

import PDFDocument from "pdfkit";
import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
} from "@/lib/sepMatrix";
import { SEP_ISSUER_LINE, sepCoverBlurb } from "@/lib/sepDocument";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_PROGRAMME_LABELS,
  SEP_PURPOSE_LABELS,
  SEP_SECTOR_LABELS,
} from "@/types/engagementPlan";

const PAGE_MARGIN = 52;
const INK = "#12202a";
const MUTED = "#5b6b76";
const TRUST = "#0e7c66";
const TRUST_INK = "#085f4d";
const LINE = "#d7dee4";

function clip(value: string, max: number): string {
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

function plain(value: string): string {
  return clip(value, 12_000).replace(/\*\*/g, "");
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

export function isSepPlanPayload(value: unknown): value is EngagementPlan {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length > 80) return false;
  if (typeof row.title !== "string" || row.title.length > 240) return false;
  if (!Array.isArray(row.documentSections) || row.documentSections.length > 16) {
    return false;
  }
  return true;
}

export function buildSepPdf(plan: EngagementPlan): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      info: {
        Title: clip(plan.title, 180),
        Subject: "Stakeholder Engagement Plan",
        Author: "Chibase Consulting",
        Creator: "TrustLedger",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    function ensureSpace(needed: number) {
      const bottom = doc.page.height - doc.page.margins.bottom;
      if (doc.y + needed > bottom) doc.addPage();
    }

    function rule() {
      doc
        .strokeColor(LINE)
        .lineWidth(1)
        .moveTo(left, doc.y)
        .lineTo(left + contentWidth, doc.y)
        .stroke();
    }

    function kv(label: string, value: string) {
      if (!value.trim()) return;
      ensureSpace(28);
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(label.toUpperCase(), {
        width: contentWidth,
      });
      doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(plain(value), {
        width: contentWidth,
      });
      doc.moveDown(0.35);
    }

    function bodyText(text: string, size = 10) {
      const blocks = plain(text).split(/\n{2,}/);
      for (const block of blocks) {
        const h = doc.heightOfString(block, {
          width: contentWidth,
          lineGap: 2,
        });
        ensureSpace(h + 8);
        doc
          .font("Helvetica")
          .fontSize(size)
          .fillColor(INK)
          .text(block, { width: contentWidth, lineGap: 2 });
        doc.moveDown(0.35);
      }
    }

    // Cover
    doc.rect(0, 0, doc.page.width, 28).fill(TRUST);
    doc.moveDown(2.2);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(TRUST)
      .text("TRUSTLEDGER", { width: contentWidth, characterSpacing: 1.4 });
    doc.moveDown(0.25);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text("CHIBASE CONSULTING", { width: contentWidth, characterSpacing: 1.2 });
    doc.moveDown(0.35);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(TRUST_INK)
      .text("Stakeholder Engagement Plan", { width: contentWidth });
    doc.moveDown(0.4);
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(INK)
      .text(plain(plan.title), { width: contentWidth });
    doc.moveDown(0.45);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(sepCoverBlurb(plan), { width: contentWidth });
    doc.moveDown(0.8);
    rule();
    doc.moveDown(0.6);

    kv("Prepared by", "Chibase Consulting");
    kv("Prepared for", plan.clientFunderHint || "");
    if (plan.programmeKind === "relocation") {
      kv("Programme", SEP_PROGRAMME_LABELS.relocation);
    }
    kv("Sector", SEP_SECTOR_LABELS[plan.sectorId] || plan.sectorId);
    kv("Assignment", plan.projectNameHint || "");
    kv("Place", plan.placeHint || "");
    kv("Timeline", plan.timelineHint || "");
    kv("Budget (as briefed)", plan.budgetHint || "");
    kv("Issued", issuedLabel(plan.updatedAt));

    doc.moveDown(0.4);
    rule();
    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        SEP_ISSUER_LINE +
          " Not legal advice. Not a substitute for statutory processes named in the briefing.",
        { width: contentWidth },
      );

    doc.addPage();

    for (const section of plan.documentSections) {
      ensureSpace(64);
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(INK)
        .text(plain(section.heading), { width: contentWidth });
      doc.moveDown(0.35);
      bodyText(section.body || "");

      if (section.id === "stakeholders" && plan.stakeholderClasses.length) {
        drawStakeholderTable(doc, plan, left, contentWidth, ensureSpace);
      }

      doc.moveDown(0.6);
    }

    ensureSpace(40);
    rule();
    doc.moveDown(0.4);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        SEP_ISSUER_LINE +
          " Not legal advice. Not a substitute for statutory processes named in the briefing.",
        { width: contentWidth },
      );

    doc.end();
  });
}

function drawStakeholderTable(
  doc: PDFKit.PDFDocument,
  plan: EngagementPlan,
  left: number,
  contentWidth: number,
  ensureSpace: (n: number) => void,
) {
  const cols = [
    { key: "class", w: contentWidth * 0.28, label: "Class" },
    { key: "power", w: contentWidth * 0.14, label: "Influence" },
    { key: "interest", w: contentWidth * 0.14, label: "Interest" },
    { key: "quad", w: contentWidth * 0.22, label: "Quadrant" },
    { key: "purpose", w: contentWidth * 0.22, label: "Purpose" },
  ];
  const rowH = 28;
  ensureSpace(rowH * (plan.stakeholderClasses.length + 1) + 8);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(TRUST_INK);
  let x = left;
  const headerY = doc.y;
  for (const col of cols) {
    doc.text(col.label, x, headerY, { width: col.w });
    x += col.w;
  }
  doc.y = headerY + 14;
  doc
    .strokeColor(LINE)
    .moveTo(left, doc.y)
    .lineTo(left + contentWidth, doc.y)
    .stroke();
  doc.moveDown(0.25);

  doc.font("Helvetica").fontSize(8).fillColor(INK);
  for (const row of plan.stakeholderClasses) {
    ensureSpace(rowH);
    const y = doc.y;
    const cells = [
      clip(row.label, 80),
      row.influence,
      interestForClass(row),
      SEP_QUADRANT_LABELS[quadrantForClass(row)],
      SEP_PURPOSE_LABELS[row.purpose],
    ];
    x = left;
    for (let i = 0; i < cols.length; i += 1) {
      doc.text(cells[i], x, y, { width: cols[i].w });
      x += cols[i].w;
    }
    doc.y = y + 22;
  }
  doc.moveDown(0.5);
}
