"use client";

import { cn } from "@/lib/utils";

export type CompareProps = {
  children: React.ReactNode;
  className?: string;
};

export type ComparePanelProps = {
  label: string;
  tone?: "neutral" | "positive" | "negative";
  children: React.ReactNode;
  className?: string;
};

const PANEL_TONE: Record<NonNullable<ComparePanelProps["tone"]>, string> = {
  neutral: "border-border",
  positive: "border-[color-mix(in_srgb,var(--success)_40%,var(--border))]",
  negative: "border-[color-mix(in_srgb,var(--destructive)_35%,var(--border))]",
};

const LABEL_TONE: Record<NonNullable<ComparePanelProps["tone"]>, string> = {
  neutral: "text-muted-foreground",
  positive: "text-[var(--success)]",
  negative: "text-[var(--destructive)]",
};

export function ComparePanel({
  label,
  tone = "neutral",
  children,
  className,
}: ComparePanelProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card p-4 shadow-1",
        // Bound long pre/code/table content to the panel and scroll horizontally
        // instead of bursting out (RTL would otherwise overlap the sibling panel).
        "[&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre",
        "[&_code]:break-words",
        "[&_table]:max-w-full [&_table]:overflow-x-auto",
        PANEL_TONE[tone],
        className,
      )}
    >
      <p
        className={cn(
          "mb-3 text-xs font-semibold uppercase tracking-wider",
          LABEL_TONE[tone],
        )}
      >
        {label}
      </p>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Compare({ children, className }: CompareProps) {
  return (
    <div
      className={cn(
        // [&>*]:min-w-0 ensures grid children cannot grow past their track
        // when they contain long unbreakable content (formulas without spaces).
        "not-prose my-6 grid gap-4 md:grid-cols-2 [&>*]:min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
