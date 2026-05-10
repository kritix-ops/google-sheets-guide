"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import {
  type SheetData,
  coordsToA1,
  useSheetEngine,
} from "./use-sheet-engine";

type CellRole = "header" | "rowLabel" | "data";

export type MiniGridProps = {
  data: SheetData;
  caption?: string;
  highlight?: string[];
  highlightTone?: "primary" | "success" | "warning";
  showFormulasFor?: string[];
  showColLabels?: boolean;
  showRowLabels?: boolean;
  className?: string;
};

const TONE: Record<NonNullable<MiniGridProps["highlightTone"]>, string> = {
  primary: "ring-2 ring-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
  success: "ring-2 ring-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)]",
  warning: "ring-2 ring-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
};

function formatValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
  }
  return String(value);
}

export function MiniGrid({
  data,
  caption,
  highlight = [],
  highlightTone = "primary",
  showFormulasFor = [],
  showColLabels = true,
  showRowLabels = true,
  className,
}: MiniGridProps) {
  const engine = useSheetEngine(data);
  const cols = Math.max(0, ...data.map((r) => r.length));
  const rows = data.length;
  const highlightSet = new Set(highlight);
  const formulaSet = new Set(showFormulasFor);

  return (
    <figure className={cn("not-prose my-4 w-fit", className)}>
      <div className="overflow-hidden rounded-md border bg-card shadow-1">
        <table className="border-collapse text-sm tabular-nums">
          {showColLabels && (
            <thead>
              <tr>
                {showRowLabels && (
                  <th className="size-7 bg-muted/40" aria-hidden="true" />
                )}
                {Array.from({ length: cols }).map((_, c) => (
                  <th
                    key={c}
                    className="h-7 min-w-12 border-b border-r bg-muted/40 px-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {String.fromCharCode(65 + c)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {showRowLabels && (
                  <th
                    scope="row"
                    className="h-7 w-7 border-r border-b bg-muted/40 px-2 text-center text-[11px] font-medium text-muted-foreground"
                  >
                    {r + 1}
                  </th>
                )}
                {Array.from({ length: cols }).map((_, c) => {
                  const a1 = coordsToA1(c, r);
                  const cell = engine.getCell(a1);
                  const isHeaderRow = r === 0;
                  const role: CellRole = isHeaderRow ? "header" : "data";
                  const isHighlight = highlightSet.has(a1);
                  const showFormula = formulaSet.has(a1) && cell.formula;
                  return (
                    <td
                      key={c}
                      className={cn(
                        "relative h-7 min-w-16 border-b border-e px-2 text-start",
                        role === "header"
                          ? "bg-muted/20 font-medium text-foreground"
                          : "bg-card text-foreground",
                        isHighlight && TONE[highlightTone],
                      )}
                      title={cell.formula ? cell.formula : undefined}
                      data-cell={a1}
                    >
                      <motion.span
                        key={`${a1}-${engine.generation}`}
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="block whitespace-nowrap"
                      >
                        {showFormula ? (
                          <code className="font-mono text-[12px] text-[var(--primary)]">
                            {cell.formula}
                          </code>
                        ) : (
                          formatValue(cell.value)
                        )}
                      </motion.span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
