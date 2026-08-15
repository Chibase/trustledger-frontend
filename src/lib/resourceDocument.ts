import PDFDocument from "pdfkit";
import type { ResourcePack } from "@/data/resources";

const PAGE_MARGIN = 56;
const INK = "#12202a";
const MUTED = "#5b6b76";

function isProductPitch(text: string): boolean {
  return /trustledger/i.test(text);
}

/** Server-side PDF for free resource packs — no product CTA in the file. */
export function buildResourcePackPdf(pack: ResourcePack): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      info: {
        Title: pack.title,
        Subject: pack.tagline,
        Creator: "SRM toolkit",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    function ensureSpace(needed: number) {
      const bottom = doc.page.height - doc.page.margins.bottom;
      if (doc.y + needed > bottom) {
        doc.addPage();
      }
    }

    doc.font("Times-Bold").fontSize(18).fillColor(INK).text(pack.title, {
      width: contentWidth,
    });
    doc.moveDown(0.35);
    doc
      .font("Times-Roman")
      .fontSize(11)
      .fillColor(MUTED)
      .text(`${pack.tagline}. ${pack.description}`, { width: contentWidth });
    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .text(`Audience: ${pack.audience}  ·  ${pack.version}`, {
        width: contentWidth,
      });
    doc.moveDown(0.25);
    doc
      .strokeColor("#d7dee4")
      .lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + contentWidth, doc.y)
      .stroke();
    doc.moveDown(0.8);

    for (const section of pack.sections) {
      const items = section.items.filter((item) => !isProductPitch(item));
      const introHeight = section.intro
        ? doc.heightOfString(section.intro, {
            width: contentWidth,
            lineGap: 2,
          })
        : 0;
      ensureSpace(36 + introHeight);

      doc.font("Times-Bold").fontSize(13).fillColor(INK).text(section.title, {
        width: contentWidth,
      });
      doc.moveDown(0.25);
      if (section.intro && !isProductPitch(section.intro)) {
        doc
          .font("Times-Italic")
          .fontSize(10)
          .fillColor(MUTED)
          .text(section.intro, { width: contentWidth });
        doc.moveDown(0.3);
      }

      doc.font("Times-Roman").fontSize(10.5).fillColor(INK);
      for (const item of items) {
        const line = `[ ]  ${item}`;
        const h = doc.heightOfString(line, {
          width: contentWidth,
          lineGap: 2,
        });
        ensureSpace(h + 6);
        doc.text(line, { width: contentWidth, lineGap: 2 });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.55);
    }

    ensureSpace(48);
    doc
      .strokeColor("#d7dee4")
      .lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + contentWidth, doc.y)
      .stroke();
    doc.moveDown(0.5);
    doc
      .font("Times-Roman")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        "This pack is free for practical use. Adapt it to your programme. Not legal advice.",
        { width: contentWidth },
      );

    doc.end();
  });
}
