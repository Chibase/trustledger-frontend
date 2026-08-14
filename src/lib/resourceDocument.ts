import type { ResourcePack } from "@/data/resources";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Branded print-ready HTML for free resource packs (Save as PDF from the browser). */
export function buildResourcePackHtml(pack: ResourcePack): string {
  const sections = pack.sections
    .map((section) => {
      const items = section.items
        .map(
          (item) =>
            `<li style="margin:0 0 8px;padding-left:4px;">☐ ${escapeHtml(item)}</li>`,
        )
        .join("");
      const intro = section.intro
        ? `<p style="margin:0 0 10px;color:#5b6b76;font-size:14px;">${escapeHtml(section.intro)}</p>`
        : "";
      return `
      <section style="margin:28px 0 0;page-break-inside:avoid;">
        <h2 style="margin:0 0 8px;font-family:Georgia,'Source Serif 4',serif;font-size:18px;color:#12202a;">${escapeHtml(section.title)}</h2>
        ${intro}
        <ul style="margin:0;padding-left:1.1rem;color:#12202a;font-size:14px;line-height:1.45;">${items}</ul>
      </section>`;
    })
    .join("");

  const bridge = pack.trustLedgerBridge
    .map((line) => `<li style="margin:0 0 6px;">${escapeHtml(line)}</li>`)
    .join("");

  const next = pack.nextSteps
    .map(
      (step) =>
        `<li style="margin:0 0 6px;"><strong>${escapeHtml(step.label)}</strong> — trustledger.co.za or app path ${escapeHtml(step.href)}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pack.title)} · TrustLedger</title>
  <style>
    @media print {
      body { background: #fff !important; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f5f7;color:#12202a;font-family:'Source Sans 3',Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:720px;margin:0 auto;padding:28px 20px 48px;">
    <header style="background:#12202a;color:#fff;padding:22px 24px;border-radius:8px;">
      <p style="margin:0;font-family:Georgia,'Source Serif 4',serif;font-size:22px;font-weight:700;">TrustLedger</p>
      <p style="margin:6px 0 0;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#d7dee4;">Free resource · ${escapeHtml(pack.version)}</p>
      <h1 style="margin:14px 0 0;font-family:Georgia,'Source Serif 4',serif;font-size:26px;line-height:1.2;">${escapeHtml(pack.title)}</h1>
      <p style="margin:10px 0 0;font-size:15px;color:#d7dee4;line-height:1.5;">${escapeHtml(pack.tagline)}. ${escapeHtml(pack.description)}</p>
    </header>

    <p class="no-print" style="margin:16px 0 0;font-size:13px;color:#5b6b76;">
      Tip: use your browser’s <strong>Print → Save as PDF</strong> for an offline copy.
    </p>

    <p style="margin:18px 0 0;font-size:13px;color:#5b6b76;">
      Audience: ${escapeHtml(pack.audience)}
    </p>

    ${sections}

    <section style="margin:32px 0 0;padding:18px 20px;border:1px solid #d7dee4;border-radius:8px;background:#fff;">
      <h2 style="margin:0 0 8px;font-family:Georgia,'Source Serif 4',serif;font-size:18px;color:#0e7c66;">With TrustLedger</h2>
      <p style="margin:0 0 10px;font-size:14px;color:#5b6b76;">Turnaround lanes — stabilize, then operationalise, then govern.</p>
      <ul style="margin:0;padding-left:1.1rem;font-size:14px;line-height:1.45;">${bridge}</ul>
    </section>

    <section style="margin:24px 0 0;padding:18px 20px;border-left:3px solid #0e7c66;background:#fff;">
      <h2 style="margin:0 0 8px;font-size:16px;color:#12202a;">Next steps</h2>
      <ul style="margin:0;padding-left:1.1rem;font-size:14px;line-height:1.45;">${next}</ul>
    </section>

    <footer style="margin:36px 0 0;padding-top:16px;border-top:1px solid #d7dee4;font-size:12px;color:#5b6b76;">
      <p style="margin:0;">© TrustLedger · Resolution you can audit. This pack is free for practical use with attribution. Not legal advice.</p>
      <p style="margin:8px 0 0;">Chibase Consulting operates TrustLedger (footer / legal). Product name in use: TrustLedger only.</p>
    </footer>
  </div>
</body>
</html>`;
}
