export type ReportInlineToken = {
  text: string;
  strong?: boolean;
};

export type ReportBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; parts: ReportInlineToken[] }
  | { kind: "list"; ordered: boolean; items: ReportInlineToken[][] }
  | { kind: "rule" };

const CLIENT_COPY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bThis pack is prepared\b/g, "This report is prepared"],
  [/\bField and desk actions\b/g, "Actions completed"],
  [/\bthe desk recorded\b/gi, "the team recorded"],
  [/\bon the desk\b/gi, "in scope"],
  [/\bresponsible desk\b/gi, "responsible team"],
  [/\bCapture records\b/g, "supporting records"],
  [/\bmeeting \/ capture records\b/gi, "meeting and supporting records"],
  [/\bmeeting\/capture record(s)?\b/gi, "supporting record$1"],
  [/\bCapture hub\b/g, "records workspace"],
  [/\bCapture category packs\b/gi, "supporting records"],
  [/\bcase desks retain interim sign-in notes\b/gi, "the case record retains interim sign-in notes"],
  [/\bPeriod GRM pack\b/g, "GRM summary"],
  [/\bIssue log pack\b/g, "Issue log summary"],
  [/\bGRM pack\b/g, "GRM summary"],
  [/\bCaptured ESG period notes\b/g, "ESG period notes"],
  [/\bCaptured H&S pack figures\b/g, "H&S figures"],
];

export function sanitizeReportClientCopy(markdown: string): string {
  let text = markdown || "";
  for (const [pattern, replacement] of CLIENT_COPY_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

export function stripReportMarkdown(text: string): string {
  return (text || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([*_`[\]])/g, "$1")
    .trim();
}

function inlineTextValue(text: string): string {
  return (text || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([*_`[\]])/g, "$1");
}

function parseInline(text: string): ReportInlineToken[] {
  const source = text || "";
  if (!source) return [];
  const tokens: ReportInlineToken[] = [];
  const pattern = /(\*\*|__)(.+?)\1/g;
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) {
      tokens.push({ text: inlineTextValue(source.slice(last, index)) });
    }
    tokens.push({ text: inlineTextValue(match[2] || ""), strong: true });
    last = index + match[0].length;
  }
  if (last < source.length) {
    tokens.push({ text: inlineTextValue(source.slice(last)) });
  }
  return tokens.filter((token) => token.text.trim().length > 0);
}

function isRule(line: string): boolean {
  return /^-{3,}\s*$/.test(line.trim());
}

function headingMatch(line: string): RegExpMatchArray | null {
  return line.trim().match(/^(#{1,6})\s+(.+)$/);
}

function listMatch(line: string): RegExpMatchArray | null {
  return line.trim().match(/^([-*]|\d+\.)\s+(.+)$/);
}

export function parseReportMarkdown(markdown: string): ReportBlock[] {
  const lines = sanitizeReportClientCopy(markdown).replace(/\r\n/g, "\n").split("\n");
  const blocks: ReportBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const raw = lines[index] || "";
    const line = raw.trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = headingMatch(line);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1]?.length || 1,
        text: stripReportMarkdown(heading[2] || ""),
      });
      index += 1;
      continue;
    }

    if (isRule(line)) {
      blocks.push({ kind: "rule" });
      index += 1;
      continue;
    }

    const list = listMatch(line);
    if (list) {
      const ordered = /^\d+\./.test(list[1] || "");
      const items: ReportInlineToken[][] = [];
      while (index < lines.length) {
        const next = listMatch(lines[index] || "");
        if (!next) break;
        items.push(parseInline(next[2] || ""));
        index += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const next = (lines[index] || "").trim();
      if (!next || headingMatch(next) || listMatch(next) || isRule(next)) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push({
      kind: "paragraph",
      parts: parseInline(paragraph.join(" ").replace(/\s+/g, " ").trim()),
    });
  }

  return blocks.filter((block) =>
    block.kind === "rule"
      ? true
      : block.kind === "heading"
        ? block.text.length > 0
        : block.kind === "paragraph"
          ? block.parts.length > 0
          : block.items.length > 0,
  );
}
