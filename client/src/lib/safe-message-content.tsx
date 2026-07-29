import React, { type ReactNode } from "react";

function renderInlineFormatting(value: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < value.length) {
    const opening = value.indexOf("**", cursor);
    if (opening === -1) {
      parts.push(value.slice(cursor));
      break;
    }

    const closing = value.indexOf("**", opening + 2);
    if (closing === -1) {
      parts.push(value.slice(cursor));
      break;
    }

    if (opening > cursor) {
      parts.push(value.slice(cursor, opening));
    }
    parts.push(
      <strong className="font-semibold text-blue-300" key={`strong-${key}`}>
        {value.slice(opening + 2, closing)}
      </strong>,
    );
    key += 1;
    cursor = closing + 2;
  }

  return parts;
}

function parseNumberedItem(line: string): { marker: string; value: string } | null {
  const separator = line.indexOf(". ");
  if (separator <= 0 || separator > 4) {
    return null;
  }

  const marker = line.slice(0, separator);
  for (const character of marker) {
    if (character < "0" || character > "9") {
      return null;
    }
  }

  return { marker, value: line.slice(separator + 2) };
}

export interface SafeMessageContentProps {
  content: string;
}

export function SafeMessageContent({ content }: SafeMessageContentProps) {
  return (
    <div className="space-y-2 text-left">
      {content.split("\n").map((line, index) => {
        if (line.startsWith("# ")) {
          return (
            <h1 className="mb-3 text-lg font-bold text-white" key={index}>
              {renderInlineFormatting(line.slice(2))}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 className="mb-2 text-base font-semibold text-blue-300" key={index}>
              {renderInlineFormatting(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div className="ml-2 text-sm" key={index}>
              <span aria-hidden="true">• </span>
              {renderInlineFormatting(line.slice(2))}
            </div>
          );
        }

        const numberedItem = parseNumberedItem(line);
        if (numberedItem) {
          return (
            <div className="text-sm" key={index}>
              <span className="font-semibold text-blue-300">
                {numberedItem.marker}.
              </span>{" "}
              {renderInlineFormatting(numberedItem.value)}
            </div>
          );
        }
        if (line.length === 0) {
          return <br key={index} />;
        }

        return (
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed" key={index}>
            {renderInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}
