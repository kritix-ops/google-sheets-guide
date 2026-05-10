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
        "flex min-w-0 flex-1 flex-col rounded-lg border bg-card p-4 shadow-1",
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
        "not-prose my-6 grid gap-4 md:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
