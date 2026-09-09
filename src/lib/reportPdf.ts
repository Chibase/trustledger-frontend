import PDFDocument from "pdfkit";
import {
  parseReportMarkdown,
  stripReportMarkdown,
  type ReportInlineToken,
} from "@/lib/reportMarkdown";
import type { ClientReportPdfPayload } from "@/types/reportPresentation";

const PAGE_MARGIN = 54;
const INK = "#12202a";
const MUTED = "#5b6b76";
const TRUST = "#0e7c66";
const TRUST_INK = "#085f4d";
const SURFACE = "#f3f5f7";
const LINE = "#d7dee4";
const HEADER_H = 34;
const FOOTER_H = 28;

function clip(value: string, max: number): string {
  return (value || "").replace(/\u0000/g, "").trim().slice(0, max);
}

function inlineText(parts: ReportInlineToken[]): string {
  return parts.map((part) => part.text).join("");
}

function isChartBar(value: unknown): value is { label: string; value: number } {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.label === "string" &&
    row.label.length <= 120 &&
    typeof row.value === "number" &&
    Number.isFinite(row.value)
  );
}

export function isClientReportPdfPayload(
  value: unknown,
): value is ClientReportPdfPayload {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (
    typeof row.title !== "string" ||
    typeof row.projectName !== "string" ||
    typeof row.periodLabel !== "string" ||
    typeof row.kindLabel !== "string" ||
    typeof row.audienceLabel !== "string" ||
    typeof row.narrativeMarkdown !== "string" ||
    typeof row.lens !== "string" ||
    typeof row.trustIndex !== "number"
  ) {
    return false;
  }
  if (!["charts", "details", "charts_details"].includes(String(row.format))) {
    return false;
  }
  if (!Array.isArray(row.chartGroups) || !Array.isArray(row.riskRows)) {
    return false;
  }
  return row.chartGroups.every((group) => {
    if (!group || typeof group !== "object") return false;
    const chart = group as Record<string, unknown>;
    return (
      typeof chart.caption === "string" &&
      (chart.orientation === "horizontal" || chart.orientation === "vertical") &&
      Array.isArray(chart.bars) &&
      chart.bars.every(isChartBar)
    );
  });
}

export function buildClientReportPdf(
  payload: ClientReportPdfPayload,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      bufferPages: true,
      info: {
        Title: clip(payload.title, 180),
        Subject: clip(payload.kindLabel, 180),
        Author: "TrustLedger",
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
    const showCharts =
      payload.format === "charts" || payload.format === "charts_details";
    const showDetails =
      payload.format === "details" || payload.format === "charts_details";
    const narrative = parseReportMarkdown(payload.narrativeMarkdown);

    let onCover = true;

    function bottomLimit() {
      return doc.page.height - doc.page.margins.bottom - (onCover ? 0 : FOOTER_H);
    }

    function addContentPage() {
      doc.addPage();
      doc.y = doc.page.margins.top + HEADER_H;
    }

    function ensureSpace(needed: number) {
      if (doc.y + needed > bottomLimit()) addContentPage();
    }

    function writeLine(
      text: string,
      opts: {
        font: string;
        size: number;
        color: string;
        lineGap?: number;
        align?: "left" | "justify" | "right";
      },
    ) {
      const value = clip(text, 8_000);
      if (!value) return;
      doc.font(opts.font).fontSize(opts.size).fillColor(opts.color);
      const height = doc.heightOfString(value, {
        width: contentWidth,
        lineGap: opts.lineGap ?? 2,
      });
      ensureSpace(Math.max(height + 8, 20));
      doc.text(value, {
        width: contentWidth,
        lineGap: opts.lineGap ?? 2,
        align: opts.align || "left",
      });
    }

    function rule() {
      ensureSpace(12);
      doc
        .strokeColor(LINE)
        .lineWidth(0.8)
        .moveTo(left, doc.y)
        .lineTo(left + contentWidth, doc.y)
        .stroke();
      doc.moveDown(0.45);
    }

    function sectionHeading(label: string) {
      writeLine(label, {
        font: "Times-Bold",
        size: 13,
        color: INK,
        lineGap: 1.5,
      });
      doc.moveDown(0.2);
    }

    function metaRow(label: string, value: string) {
      ensureSpace(22);
      const y = doc.y;
      doc.font("Times-Roman").fontSize(9).fillColor(MUTED).text(label, left, y, {
        width: contentWidth * 0.28,
      });
      doc.font("Times-Bold").fontSize(10).fillColor(INK).text(clip(value, 180), left + contentWidth * 0.3, y, {
        width: contentWidth * 0.7,
      });
      doc.y = Math.max(doc.y, y + 16);
    }

    function metricCard(label: string, value: string, hint?: string) {
      ensureSpace(52);
      const y = doc.y;
      doc.save();
      doc.roundedRect(left, y, contentWidth, 48, 8).fill(SURFACE);
      doc.restore();
      doc.font("Times-Roman").fontSize(9).fillColor(MUTED).text(label, left + 12, y + 10, {
        width: contentWidth - 24,
      });
      doc.font("Times-Bold").fontSize(16).fillColor(INK).text(value, left + 12, y + 22, {
        width: contentWidth - 24,
      });
      if (hint) {
        doc.font("Times-Roman").fontSize(8).fillColor(MUTED).text(hint, left + contentWidth - 150, y + 24, {
          width: 138,
          align: "right",
        });
      }
      doc.y = y + 58;
    }

    function drawChartGroup(group: ClientReportPdfPayload["chartGroups"][number]) {
      sectionHeading(group.caption);
      if (!group.bars.length) {
        writeLine("No chart values are available for this report view.", {
          font: "Times-Roman",
          size: 10,
          color: MUTED,
        });
        return;
      }
      const max = Math.max(...group.bars.map((bar) => bar.value), 1);
      for (const bar of group.bars) {
        ensureSpace(24);
        const y = doc.y;
        const label = clip(stripReportMarkdown(bar.label), 72);
        doc.font("Times-Roman").fontSize(9).fillColor(INK).text(label, left, y, {
          width: contentWidth * 0.4,
        });
        const trackX = left + contentWidth * 0.44;
        const trackW = contentWidth * 0.44;
        doc.save();
        doc.roundedRect(trackX, y + 3, trackW, 10, 4).fill("#e7ecef");
        doc.roundedRect(trackX, y + 3, Math.max((bar.value / max) * trackW, 2), 10, 4).fill(TRUST);
        doc.restore();
        doc.font("Times-Bold").fontSize(9).fillColor(TRUST_INK).text(String(bar.value), trackX + trackW + 8, y, {
          width: contentWidth * 0.12 - 8,
          align: "right",
        });
        doc.y = y + 20;
      }
      doc.moveDown(0.25);
    }

    function riskRegister() {
      if (!payload.riskRows.length) {
        writeLine("No open issues are on file for this scope.", {
          font: "Times-Roman",
          size: 10,
          color: MUTED,
        });
        return;
      }
      for (const row of payload.riskRows) {
        ensureSpace(88);
        const y = doc.y;
        doc.save();
        doc.roundedRect(left, y, contentWidth, 78, 8).strokeColor(LINE).lineWidth(0.8).stroke();
        doc.restore();
        doc.font("Times-Bold").fontSize(11).fillColor(INK).text(
          clip(`${row.id} — ${row.issue}`, 180),
          left + 12,
          y + 10,
          { width: contentWidth - 96 },
        );
        doc.font("Times-Bold").fontSize(9).fillColor(TRUST_INK).text(
          clip(row.impactLevel, 40),
          left + contentWidth - 72,
          y + 12,
          { width: 60, align: "right" },
        );
        const details = [
          `Project impact: ${row.projectImpact}`,
          `Mitigation in progress: ${row.mitigation}`,
          `Mitigation process: ${row.processStage}`,
          `Expected outcome: ${row.expectedOutcome}`,
        ];
        let rowY = y + 28;
        doc.font("Times-Roman").fontSize(9).fillColor(MUTED);
        for (const detail of details) {
          doc.text(clip(stripReportMarkdown(detail), 280), left + 12, rowY, {
            width: contentWidth - 24,
            ellipsis: true,
          });
          rowY += 11;
        }
        if (row.executiveAction) {
          doc.font("Times-Italic").fontSize(8.5).fillColor(INK).text(
            clip(`Executive action: ${row.executiveAction}`, 280),
            left + 12,
            y + 68,
            { width: contentWidth - 24, ellipsis: true },
          );
        }
        doc.y = y + 86;
      }
    }

    function funderSummary() {
      const summary = payload.funderSnapshot;
      if (!summary) return;
      metricCard(
        "Assurance position",
        `Trust ${summary.trustIndex}/100`,
        `${summary.trustLabel} · ${summary.openCount} open · ${summary.closedCount} closed`,
      );
      sectionHeading("Material items");
      if (!summary.materialItems.length) {
        writeLine("No material open items are on file for this period.", {
          font: "Times-Roman",
          size: 10,
          color: MUTED,
        });
      } else {
        for (const item of summary.materialItems) {
          writeLine(`• ${stripReportMarkdown(item.line)}`, {
            font: "Times-Roman",
            size: 10,
            color: INK,
          });
        }
      }
      doc.moveDown(0.15);
      sectionHeading("What we are asking");
      for (const ask of summary.asks) {
        writeLine(`• ${stripReportMarkdown(ask)}`, {
          font: "Times-Roman",
          size: 10,
          color: INK,
        });
      }
    }

    function narrativeBody() {
      sectionHeading("Report narrative");
      for (const block of narrative) {
        if (block.kind === "rule") {
          rule();
          continue;
        }
        if (block.kind === "heading") {
          writeLine(block.text, {
            font: block.level <= 2 ? "Times-Bold" : "Times-Italic",
            size: block.level <= 2 ? 11 : 10,
            color: block.level <= 2 ? TRUST_INK : INK,
            lineGap: 1.5,
          });
          doc.moveDown(0.15);
          continue;
        }
        if (block.kind === "list") {
          block.items.forEach((item, itemIndex) => {
            const prefix = block.ordered ? `${itemIndex + 1}. ` : "• ";
            writeLine(`${prefix}${inlineText(item)}`, {
              font: "Times-Roman",
              size: 10,
              color: INK,
            });
          });
          doc.moveDown(0.1);
          continue;
        }
        writeLine(inlineText(block.parts), {
          font: "Times-Roman",
          size: 10,
          color: INK,
          align: "justify",
          lineGap: 2.5,
        });
        doc.moveDown(0.15);
      }
    }

    doc.rect(0, 0, doc.page.width, 8).fill(TRUST);
    doc.moveDown(2);
    writeLine("TRUSTLEDGER REPORT", {
      font: "Times-Roman",
      size: 9,
      color: TRUST,
    });
    doc.moveDown(0.3);
    writeLine(payload.title, {
      font: "Times-Bold",
      size: 20,
      color: INK,
      lineGap: 1,
    });
    doc.moveDown(0.2);
    writeLine(payload.projectName, {
      font: "Times-Roman",
      size: 12,
      color: TRUST_INK,
    });
    doc.moveDown(0.6);
    rule();
    metaRow("Reporting period", payload.periodLabel);
    metaRow("Report type", payload.kindLabel);
    metaRow("Audience", payload.audienceLabel);
    metaRow(
      "View included",
      payload.format === "charts"
        ? "Charts"
        : payload.format === "details"
          ? "Narrative details"
          : "Charts and narrative details",
    );
    if (payload.trustLabel) {
      metaRow("Trust position", `${payload.trustIndex}/100 (${payload.trustLabel})`);
    }
    doc.moveDown(0.4);
    rule();

    if (payload.lens === "executive") {
      const actions = payload.riskRows.filter((row) => row.executiveAction);
      metricCard("Identified issues", String(payload.riskRows.length));
      metricCard("Need executive action", String(actions.length));
      metricCard(
        payload.trustLabel ? `Trust · ${payload.trustLabel}` : "Portfolio trust",
        String(payload.trustIndex),
      );
    } else if (payload.lens === "funder" && payload.funderSnapshot) {
      metricCard(
        "Delivery position",
        `${payload.funderSnapshot.openCount} open`,
        `${payload.funderSnapshot.closedCount} closed · ${payload.funderSnapshot.highRiskCount} high risk`,
      );
    } else {
      metricCard(
        payload.trustLabel ? `Trust · ${payload.trustLabel}` : "Trust position",
        `${payload.trustIndex}/100`,
        payload.kindLabel,
      );
    }

    onCover = false;
    addContentPage();

    if (showCharts && payload.chartGroups.length) {
      sectionHeading("Charts");
      payload.chartGroups.forEach((group) => drawChartGroup(group));
      doc.moveDown(0.2);
    }

    if (payload.lens === "executive") {
      sectionHeading("Identified issues");
      riskRegister();
    } else if (payload.lens === "funder") {
      funderSummary();
    }

    if (showDetails && narrative.length) {
      doc.moveDown(0.2);
      narrativeBody();
    }

    const range = doc.bufferedPageRange();
    const pageWidth = doc.page.width;
    const count = range.count;
    for (let index = 0; index < count; index += 1) {
      doc.switchToPage(index);
      if (index > 0) {
        doc.save();
        doc.rect(0, 0, pageWidth, 32).fill(SURFACE);
        doc.font("Times-Roman").fontSize(8).fillColor(TRUST_INK).text(
          clip(payload.title, 78),
          PAGE_MARGIN,
          12,
          { width: contentWidth * 0.68, ellipsis: true },
        );
        doc.font("Times-Roman").fontSize(8).fillColor(MUTED).text(
          clip(payload.projectName, 60),
          PAGE_MARGIN + contentWidth * 0.68,
          12,
          { width: contentWidth * 0.32, align: "right", ellipsis: true },
        );
        doc.restore();
      }
      doc.font("Times-Roman").fontSize(8).fillColor(MUTED).text(
        `TrustLedger · Page ${index + 1} of ${count}`,
        PAGE_MARGIN,
        doc.page.height - 36,
        { width: contentWidth, align: "left" },
      );
    }

    doc.end();
  });
}
