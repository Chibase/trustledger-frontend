function tokens(chunk: string) {
  return chunk.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function parseMarkdownTable(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\|.+\|$/.test(line));
  if (lines.length < 2) return null;
  const cells = (line: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
  const headers = cells(lines[0]!);
  if (!headers.length || headers.every((h) => /^[-: ]+$/.test(h))) return null;
  const rows = lines
    .slice(1)
    .filter((line) => !cells(line).every((c) => /^[-: ]+$/.test(c)))
    .map(cells);
  if (!rows.length) return null;
  return { headers, rows };
}

export function SepRichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-tl-ink">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        const table = parseMarkdownTable(trimmed);
        if (table) {
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-tl-trust text-white">
                    {table.headers.map((header) => (
                      <th
                        key={header}
                        className="px-2 py-2 text-xs font-semibold uppercase tracking-wide"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-tl-line align-top even:bg-tl-paper"
                    >
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-2">
                          {tokens(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const heading = trimmed.match(/^\*\*(\d+(?:\.\d+)*[^*]*)\*\*\s*([\s\S]*)$/);
        if (heading && heading[1] && heading[1].length < 80) {
          const rest = heading[2]?.trim() || "";
          if (rest.length > 90) {
            return (
              <p key={i} className="whitespace-pre-wrap">
                <strong>{heading[1].replace(/\s+$/, "")}</strong>
                {rest ? <> {tokens(rest)}</> : null}
              </p>
            );
          }
          return (
            <h4
              key={i}
              className="font-display text-sm font-semibold text-tl-trust-ink"
            >
              {heading[1].replace(/\s+$/, "").replace(/\.$/, "")}
              {rest ? (
                <span className="font-normal text-tl-ink"> {tokens(rest)}</span>
              ) : null}
            </h4>
          );
        }
        const lines = block.split("\n");
        const isBullets = lines.every((line) => /^[•\-]\s/.test(line.trim()));
        if (isBullets) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((line, j) => (
                <li key={j}>{tokens(line.replace(/^[•\-]\s/, ""))}</li>
              ))}
            </ul>
          );
        }
        const isNumbered = lines.every((line) => /^\d+\.\s/.test(line.trim()));
        if (isNumbered) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines.map((line, j) => (
                <li key={j}>{tokens(line.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {tokens(block)}
          </p>
        );
      })}
    </div>
  );
}
