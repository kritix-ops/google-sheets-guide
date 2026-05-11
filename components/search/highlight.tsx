"use client";

import { Fragment, useMemo } from "react";

import { cn } from "@/lib/utils";

type Props = {
  text: string;
  query: string;
  className?: string;
};

// Split `text` into a sequence of "match / no-match" runs, then render
// matches inside <mark>. We do this with substring math, never via
// innerHTML, so we cannot accidentally inject HTML the user could
// observe. Matching is case-insensitive on the longest tokens of the
// query (>=2 chars), which lines up with MiniSearch's tokenizer well
// enough for users to see why a result matched.
export function Highlight({ text, query, className }: Props) {
  const segments = useMemo(() => splitSegments(text, query), [text, query]);
  if (segments.length === 0) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={cn(className)}>
      {segments.map((seg, i) =>
        seg.match ? (
          <mark
            key={i}
            className="rounded-sm bg-primary/15 px-0.5 text-foreground"
          >
            {seg.value}
          </mark>
        ) : (
          <Fragment key={i}>{seg.value}</Fragment>
        ),
      )}
    </span>
  );
}

type Segment = { match: boolean; value: string };

function splitSegments(text: string, query: string): Segment[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const tokens = Array.from(
    new Set(
      trimmed
        .split(/\s+/)
        .map((t) => t.toLowerCase())
        .filter((t) => t.length >= 2),
    ),
  ).sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return [];

  const out: Segment[] = [];
  let i = 0;
  const lower = text.toLowerCase();
  while (i < text.length) {
    let matched = false;
    for (const token of tokens) {
      if (lower.startsWith(token, i)) {
        out.push({ match: true, value: text.slice(i, i + token.length) });
        i += token.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Accumulate a run of non-match chars until we hit a match or end.
      let j = i + 1;
      while (j < text.length) {
        let isMatchAtJ = false;
        for (const token of tokens) {
          if (lower.startsWith(token, j)) {
            isMatchAtJ = true;
            break;
          }
        }
        if (isMatchAtJ) break;
        j++;
      }
      out.push({ match: false, value: text.slice(i, j) });
      i = j;
    }
  }
  return out;
}
