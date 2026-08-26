function tokens(chunk: string) {
  return chunk.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function SepRichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-tl-ink">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => /^[•\-]\s/.test(line.trim()));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((line, j) => (
                <li key={j}>{tokens(line.replace(/^[•\-]\s/, ""))}</li>
              ))}
            </ul>
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
