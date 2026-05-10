"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type StepFrame = {
  caption: React.ReactNode;
  body: React.ReactNode;
};

export type StepThroughProps = {
  frames: StepFrame[];
  className?: string;
};

export function StepThrough({ frames, className }: StepThroughProps) {
  const [index, setIndex] = useState(0);
  const total = frames.length;
  const frame = frames[index];

  if (!frame || total === 0) return null;

  return (
    <div
      className={cn(
        "not-prose my-6 overflow-hidden rounded-lg border bg-card shadow-1",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Step {index + 1} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIndex(0)}
            disabled={index === 0}
            aria-label="Restart"
            className="grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous step"
            className="grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={index === total - 1}
            aria-label="Next step"
            className="grid size-7 place-items-center rounded-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            <div>{frame.body}</div>
            <p className="text-sm text-foreground/80">{frame.caption}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex h-1 w-full bg-muted/30" aria-hidden="true">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
