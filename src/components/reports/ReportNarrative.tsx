"use client";

import { useMemo } from "react";
import {
  parseReportMarkdown,
  type ReportInlineToken,
} from "@/lib/reportMarkdown";

function InlineText({ parts }: { parts: ReportInlineToken[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.strong ? (
          <strong key={`${part.text}-${index}`} className="font-semibold text-tl-ink">
            {part.text}
          </strong>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function ReportNarrative({
  markdown,
  compact = false,
}: {
  markdown: string;
  compact?: boolean;
}) {
  const blocks = useMemo(() => parseReportMarkdown(markdown), [markdown]);

  if (!blocks.length) return null;

  return (
    <div className={compact ? "space-y-3 text-sm" : "space-y-4 text-base leading-relaxed"}>
      {blocks.map((block, index) => {
        if (block.kind === "rule") {
          return <hr key={`rule-${index}`} className="border-tl-line" />;
        }
        if (block.kind === "heading") {
          if (block.level <= 2) {
            return (
              <h4
                key={`${block.text}-${index}`}
                className={`font-display font-semibold tracking-tight text-tl-ink ${
                  compact ? "pt-2 text-base" : "pt-3 text-xl"
                }`}
              >
                {block.text}
              </h4>
            );
          }
          return (
            <h5
              key={`${block.text}-${index}`}
              className={`font-semibold text-tl-trust-ink ${compact ? "text-sm" : "text-base"}`}
            >
              {block.text}
            </h5>
          );
        }
        if (block.kind === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={`list-${index}`}
              className={`space-y-2 pl-5 text-tl-ink ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`item-${index}-${itemIndex}`}>
                  <InlineText parts={item} />
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={`paragraph-${index}`} className="text-tl-ink-muted">
            <InlineText parts={block.parts} />
          </p>
        );
      })}
    </div>
  );
}
