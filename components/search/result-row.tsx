"use client";

import {
  ArrowRight,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Highlight } from "./highlight";

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string | null;
  breadcrumbs?: string[];
  badge?: { label: string; tone: "success" | "warning" | "muted" | "accent" } | null;
  query: string;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
};

export function ResultRow({
  icon: Icon,
  title,
  subtitle,
  breadcrumbs,
  badge,
  query,
  active,
  onMouseEnter,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-active={active ? "" : undefined}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground",
          active && "border-foreground/20 text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          <Highlight text={title} query={query} />
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            <Highlight text={subtitle} query={query} />
          </span>
        ) : null}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <span className="mt-1 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 ? <ArrowRight className="h-2.5 w-2.5" /> : null}
                <span className="truncate">{b}</span>
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badge ? (
          <span
            className={cn(
              "rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              badge.tone === "success" &&
                "bg-success/15 text-success",
              badge.tone === "warning" &&
                "bg-warning/15 text-warning",
              badge.tone === "muted" &&
                "bg-muted text-muted-foreground",
              badge.tone === "accent" &&
                "bg-primary/15 text-primary",
            )}
          >
            {badge.label}
          </span>
        ) : null}
        <CornerDownLeft
          className={cn(
            "h-3 w-3",
            active
              ? "text-foreground/70 opacity-100"
              : "text-muted-foreground/60 opacity-0 group-hover:opacity-100",
          )}
        />
      </span>
    </button>
  );
}
