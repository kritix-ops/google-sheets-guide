"use client";

import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LessonStatus, TrackSummary } from "@/lib/progress-utils";
import { cn } from "@/lib/utils";

// Small icon shown next to each lesson title to communicate state.
// - passed: filled success check
// - in-progress: hollow ring with an inner dot
// - not-started: faint outline circle
export function LessonStatusIcon({
  status,
  size = "sm",
  className,
}: {
  status: LessonStatus;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const t = useTranslations("progress");
  const dim =
    size === "xs" ? "size-3.5" : size === "md" ? "size-5" : "size-4";

  if (status === "passed") {
    return (
      <span
        aria-label={t("lessonStatusPassed")}
        title={t("lessonStatusPassed")}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-success/15 text-success",
          dim,
          className,
        )}
      >
        <Check className={cn(size === "xs" ? "size-2.5" : "size-3")} strokeWidth={3} />
      </span>
    );
  }

  if (status === "in-progress") {
    return (
      <span
        aria-label={t("lessonStatusInProgress")}
        title={t("lessonStatusInProgress")}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-warning/60 text-warning",
          dim,
          className,
        )}
      >
        <span
          className={cn(
            "rounded-full bg-warning",
            size === "xs" ? "size-1" : "size-1.5",
          )}
        />
      </span>
    );
  }

  return (
    <Circle
      aria-label={t("lessonStatusNotStarted")}
      className={cn("shrink-0 text-muted-foreground/40", dim, className)}
      strokeWidth={1.5}
    />
  );
}

// Horizontal progress bar. `tone` controls the fill color:
// - success: green fill (default — track passed counts)
// - mixed: split fill of passed (success) + in-progress (warning)
export function ProgressBar({
  summary,
  tone = "success",
  className,
  height = "thin",
}: {
  summary: TrackSummary;
  tone?: "success" | "mixed";
  className?: string;
  height?: "thin" | "medium";
}) {
  const t = useTranslations("progress");
  const passedPct = summary.total === 0 ? 0 : (summary.passed / summary.total) * 100;
  const inProgressPct =
    summary.total === 0 ? 0 : (summary.inProgress / summary.total) * 100;
  const h = height === "medium" ? "h-2" : "h-1.5";

  return (
    <span
      role="progressbar"
      aria-valuenow={summary.percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t("ariaProgress", { percent: summary.percent })}
      className={cn(
        "relative block w-full overflow-hidden rounded-full bg-muted",
        h,
        className,
      )}
    >
      <span
        className="absolute inset-y-0 start-0 block bg-success transition-[width] duration-300 ease-out"
        style={{ width: `${passedPct}%` }}
      />
      {tone === "mixed" && inProgressPct > 0 ? (
        <span
          className="absolute inset-y-0 block bg-warning/55"
          style={{
            insetInlineStart: `${passedPct}%`,
            width: `${inProgressPct}%`,
          }}
        />
      ) : null}
    </span>
  );
}

// Inline "n / N" label commonly shown above or after a progress bar.
export function ProgressCount({
  summary,
  className,
}: {
  summary: TrackSummary;
  className?: string;
}) {
  const t = useTranslations("progress");
  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums text-muted-foreground",
        className,
      )}
    >
      {t("trackProgressLabel", { passed: summary.passed, total: summary.total })}
    </span>
  );
}

// Filled badge for the lesson-page header. Hides itself for "not-started"
// so the header stays clean for fresh visitors.
export function LessonStatusBadge({
  status,
  bestScore,
  className,
}: {
  status: LessonStatus;
  bestScore?: number;
  className?: string;
}) {
  const t = useTranslations("progress");
  if (status === "not-started") return null;

  const palette =
    status === "passed"
      ? "border-success/40 bg-success/10 text-success"
      : "border-warning/40 bg-warning/10 text-warning";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        palette,
        className,
      )}
    >
      <LessonStatusIcon status={status} size="xs" />
      <span>
        {status === "passed" ? t("passed") : t("inProgress")}
        {status === "passed" && typeof bestScore === "number"
          ? ` · ${t("score", { score: bestScore })}`
          : null}
      </span>
    </span>
  );
}
