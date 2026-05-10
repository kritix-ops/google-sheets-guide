"use client";

import { CheckCircle2, Lightbulb, Eye, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { MiniGrid, type MiniGridProps } from "./mini-grid";
import {
  type CellPrimitive,
  type SheetData,
  a1ToCoords,
} from "./use-sheet-engine";

export type TryItProps = {
  task: React.ReactNode;
  data: SheetData;
  inputCell: string;
  initialFormula?: string;
  expectedFormula?: string;
  expectedValue?: CellPrimitive;
  hint?: React.ReactNode;
  answer?: React.ReactNode;
  highlight?: string[];
  showFormulasFor?: string[];
  className?: string;
};

function normalizeFormula(formula: string): string {
  return formula
    .replace(/^\s*=\s*/, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function TryIt({
  task,
  data,
  inputCell,
  initialFormula = "",
  expectedFormula,
  expectedValue,
  hint,
  answer,
  highlight,
  showFormulasFor,
  className,
}: TryItProps) {
  const [formula, setFormula] = useState(initialFormula);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const liveData = useMemo<SheetData>(() => {
    const { col, row } = a1ToCoords(inputCell);
    const next = data.map((r) => [...r]);
    while (next.length <= row) next.push([]);
    while (next[row]!.length <= col) next[row]!.push("");
    next[row]![col] = formula;
    return next;
  }, [data, formula, inputCell]);

  const isCorrect = useMemo(() => {
    if (!formula.trim() || formula.trim() === "=") return false;
    if (expectedFormula) {
      return normalizeFormula(formula) === normalizeFormula(expectedFormula);
    }
    return false;
  }, [formula, expectedFormula]);

  const reset = () => {
    setFormula(initialFormula);
    setShowHint(false);
    setShowAnswer(false);
  };

  const applyAnswer = () => {
    if (expectedFormula) setFormula(expectedFormula);
  };

  const gridProps: MiniGridProps = {
    data: liveData,
    highlight: highlight ?? [inputCell],
    highlightTone: isCorrect ? "success" : "primary",
    showFormulasFor,
  };

  return (
    <div
      className={cn(
        "not-prose my-6 rounded-lg border bg-card p-5 shadow-1",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Try it
        </p>
        <button
          type="button"
          onClick={reset}
          aria-label="Reset"
          className="grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <p className="mb-4 text-base leading-relaxed text-foreground">{task}</p>

      <div className="mb-4 flex items-center gap-3">
        <label
          htmlFor={`tryit-${inputCell}`}
          className="font-mono text-sm text-muted-foreground"
        >
          {inputCell} =
        </label>
        <div className="relative flex-1">
          <input
            id={`tryit-${inputCell}`}
            type="text"
            value={formula.replace(/^=/, "")}
            onChange={(e) => setFormula(`=${e.target.value}`)}
            placeholder={initialFormula.replace(/^=/, "")}
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 pe-9 font-mono text-sm text-foreground transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isCorrect
                ? "border-[var(--success)]"
                : "border-input hover:border-foreground/30",
            )}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
          {isCorrect && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--success)]"
              aria-label="Correct"
            >
              <CheckCircle2 className="size-5" />
            </motion.span>
          )}
        </div>
      </div>

      <MiniGrid {...gridProps} />

      {(hint || expectedFormula) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hint && (
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              aria-expanded={showHint}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                showHint
                  ? "border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] text-foreground"
                  : "border-border bg-card text-foreground/80 hover:border-foreground/30 hover:text-foreground",
              )}
            >
              <Lightbulb className="size-3.5" />
              {showHint ? "Hide hint" : "Hint"}
            </button>
          )}
          {expectedFormula && (
            <button
              type="button"
              onClick={() => setShowAnswer((v) => !v)}
              aria-expanded={showAnswer}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                showAnswer
                  ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-foreground"
                  : "border-border bg-card text-foreground/80 hover:border-foreground/30 hover:text-foreground",
              )}
            >
              <Eye className="size-3.5" />
              {showAnswer ? "Hide answer" : "Show full answer"}
            </button>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {showHint && hint && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="rounded-md border-s-2 border-[var(--warning)] bg-muted/30 px-4 py-3 text-sm text-foreground/90">
              <p>
                <span className="font-medium text-foreground">Hint. </span>
                {hint}
              </p>
            </div>
          </motion.div>
        )}
        {showAnswer && expectedFormula && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="rounded-md border-s-2 border-[var(--primary)] bg-muted/30 px-4 py-3 text-sm text-foreground/90">
              <p className="mb-2 font-medium text-foreground">Full answer</p>
              <div className="mb-3 flex items-center gap-2">
                <code className="rounded-sm bg-surface-elevated px-2 py-1 font-mono text-[13px] text-[var(--primary)]">
                  {expectedFormula}
                </code>
                {!isCorrect && (
                  <button
                    type="button"
                    onClick={applyAnswer}
                    className="rounded-md border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80 hover:border-foreground/30 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Apply
                  </button>
                )}
              </div>
              {answer && <p className="text-foreground/90">{answer}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
