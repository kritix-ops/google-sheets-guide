"use client";

import { AnimatePresence, motion } from "motion/react";
import { Play, RotateCcw } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { MiniGrid } from "./mini-grid";
import { type SheetData } from "./use-sheet-engine";

export type RefDemoProps = {
  data: SheetData;
  formula: string;
  formulaCell: string;
  fillTo: string;
  expectedFills: string[];
  caption?: string;
  className?: string;
};

function rangeBetween(start: string, end: string): string[] {
  const startMatch = start.match(/^([A-Z]+)(\d+)$/i);
  const endMatch = end.match(/^([A-Z]+)(\d+)$/i);
  if (!startMatch || !endMatch) return [];
  const sCol = startMatch[1].toUpperCase();
  const sRow = Number(startMatch[2]);
  const eCol = endMatch[1].toUpperCase();
  const eRow = Number(endMatch[2]);
  if (sCol !== eCol) return [];
  return Array.from({ length: eRow - sRow }, (_, i) => `${sCol}${sRow + i + 1}`);
}

export function RefDemo({
  data,
  formula,
  formulaCell,
  fillTo,
  expectedFills,
  caption,
  className,
}: RefDemoProps) {
  const [step, setStep] = useState(0);
  const fillCells = rangeBetween(formulaCell, fillTo);
  const totalSteps = fillCells.length + 1;

  // Reset the scrub position when the demo's identity changes (lesson
  // re-renders us with a new formula/cell/range). Done during render with
  // the prev-vs-current compare pattern to avoid an effect-driven setState.
  const currentKey = `${formula}|${formulaCell}|${fillTo}`;
  const [prevKey, setPrevKey] = useState(currentKey);
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setStep(0);
  }

  const liveData: SheetData = data.map((r) => [...r]);
  const setLiveCell = (a1: string, value: string) => {
    const m = a1.match(/^([A-Z]+)(\d+)$/i);
    if (!m) return;
    const col = m[1].toUpperCase().charCodeAt(0) - 65;
    const row = Number(m[2]) - 1;
    while (liveData.length <= row) liveData.push([]);
    while (liveData[row]!.length <= col) liveData[row]!.push("");
    liveData[row]![col] = value;
  };

  setLiveCell(formulaCell, formula);
  for (let i = 0; i < step && i < fillCells.length; i++) {
    setLiveCell(fillCells[i]!, expectedFills[i] ?? formula);
  }

  const visibleCells = [formulaCell, ...fillCells.slice(0, step)];
  const showingFormulasFor = visibleCells;
  const highlight = step === 0 ? [formulaCell] : visibleCells;

  return (
    <div
      className={cn(
        "not-prose my-6 rounded-lg border bg-card p-5 shadow-1",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reference demo
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStep(0)}
            disabled={step === 0}
            aria-label="Reset"
            className="grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            disabled={step === totalSteps - 1}
            className={cn(
              "flex h-7 items-center gap-1 rounded-sm px-2.5 text-xs font-medium",
              "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            <Play className="size-3" />
            {step === 0 ? "Copy down" : "Next"}
          </button>
        </div>
      </div>
      <MiniGrid
        data={liveData}
        caption={caption}
        highlight={highlight}
        highlightTone="primary"
        showFormulasFor={showingFormulasFor}
      />
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="mt-3 text-sm text-foreground/80"
        >
          {step === 0 ? (
            <>
              Start: <code className="font-mono">{formulaCell}</code> holds{" "}
              <code className="font-mono text-[var(--primary)]">{formula}</code>.
            </>
          ) : (
            <>
              <code className="font-mono">{fillCells[step - 1]}</code> resolves
              to{" "}
              <code className="font-mono text-[var(--primary)]">
                {expectedFills[step - 1] ?? formula}
              </code>
              {step < totalSteps - 1 ? "." : ". The pattern is the same all the way down."}
            </>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
