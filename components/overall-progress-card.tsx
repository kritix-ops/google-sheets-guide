"use client";

import { useTranslations } from "next-intl";

import { ProgressBar } from "@/components/progress-ui";
import type { TrackSummary } from "@/lib/progress-utils";

// Hero progress card shown at the top of the homepage. Empty state nudges
// brand-new users toward the curriculum below.
export function OverallProgressCard({ summary }: { summary: TrackSummary }) {
  const t = useTranslations("progress");
  const isEmpty = summary.passed === 0 && summary.inProgress === 0;

  return (
    <section
      aria-labelledby="overall-progress-heading"
      className="mt-10 rounded-md border bg-card p-6 shadow-1"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="overall-progress-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {t("overallHeading")}
        </h2>
        <div className="text-end font-mono text-2xl font-semibold tabular-nums">
          {summary.percent}
          <span className="text-sm font-normal text-muted-foreground">%</span>
        </div>
      </div>

      <p className="mt-1 text-sm text-foreground">
        {isEmpty
          ? t("overallEmpty")
          : t("overallSummary", {
              passed: summary.passed,
              total: summary.total,
            })}
      </p>

      <ProgressBar
        summary={summary}
        tone="mixed"
        height="medium"
        className="mt-4"
      />
    </section>
  );
}
