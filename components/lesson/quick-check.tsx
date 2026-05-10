"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type QuickCheckOption = {
  id: string;
  label: React.ReactNode;
  correct?: boolean;
  explanation?: React.ReactNode;
};

export type QuickCheckProps = {
  question: React.ReactNode;
  options: QuickCheckOption[];
  className?: string;
};

export function QuickCheck({ question, options, className }: QuickCheckProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const pickedOption = options.find((o) => o.id === picked) ?? null;
  const isCorrect = pickedOption?.correct === true;

  return (
    <div
      className={cn(
        "not-prose my-6 rounded-lg border bg-card p-5 shadow-1",
        className,
      )}
    >
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Quick check
      </p>
      <div className="mb-4 text-base text-foreground">{question}</div>
      <div className="space-y-2">
        {options.map((option) => {
          const selected = option.id === picked;
          const showAsCorrect = picked !== null && option.correct === true;
          const showAsWrong = selected && option.correct !== true;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPicked(option.id)}
              disabled={picked !== null && !selected}
              className={cn(
                "flex w-full items-start gap-3 rounded-md border px-4 py-2.5 text-start text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                picked === null &&
                  "border-border bg-card text-foreground hover:border-[var(--primary)] hover:bg-accent",
                showAsCorrect &&
                  "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-foreground",
                showAsWrong &&
                  "border-[var(--destructive)] bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] text-foreground",
                picked !== null &&
                  !selected &&
                  option.correct !== true &&
                  "border-border bg-card/50 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[11px]",
                  showAsCorrect && "border-[var(--success)] bg-[var(--success)] text-white",
                  showAsWrong && "border-[var(--destructive)] bg-[var(--destructive)] text-white",
                  picked === null && "border-muted-foreground/40",
                )}
                aria-hidden="true"
              >
                {showAsCorrect ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : showAsWrong ? (
                  <X className="size-3" strokeWidth={3} />
                ) : null}
              </span>
              <span className="flex-1">{option.label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {pickedOption?.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "rounded-md border-s-2 bg-muted/30 px-4 py-3 text-sm text-foreground/90",
                isCorrect
                  ? "border-s-[var(--success)]"
                  : "border-s-[var(--destructive)]",
              )}
            >
              {pickedOption.explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
