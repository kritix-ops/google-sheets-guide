"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ExternalLink,
  Loader2,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { InlineMarkdown } from "@/components/markdown";
import type { TaskSummary } from "@/lib/content/registry";
import { cn } from "@/lib/utils";

type CheckOutcome = {
  ruleId: string;
  name: string;
  nameHe?: string;
  passed: boolean;
  weight: number;
  detail?: string;
  detailHe?: string;
};

type GradeResult = {
  score: number;
  passed: boolean;
  gradedBy: "rules" | "claude" | "both";
  feedback: { summary: string; summaryHe?: string; checks: CheckOutcome[] };
};

type TaskState = "idle" | "passed" | "not-yet";

type Props = {
  assignmentId: string;
  attemptId: number;
  tasks: TaskSummary[];
  lessonHref: string;
  lessonTitle: string;
  trackLabel: string;
  lessonOrder: number;
  localeToggle?: React.ReactNode;
};

export function SidebarCompanion({
  assignmentId,
  attemptId,
  tasks,
  lessonHref,
  lessonTitle,
  trackLabel,
  lessonOrder,
  localeToggle,
}: Props) {
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const passedCount = useMemo(
    () => grade?.feedback.checks.filter((c) => c.passed).length ?? 0,
    [grade],
  );
  const progress = (passedCount / tasks.length) * 100;

  async function check() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/sidebar/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assignmentId, attemptId }),
        credentials: "omit",
      });
      if (!r.ok) throw new Error(await r.text());
      const result = (await r.json()) as GradeResult;
      setGrade(result);
      setLastChecked(new Date());
      // Auto-expand failed tasks so the user sees what to fix.
      const failedIds = result.feedback.checks
        .filter((c) => !c.passed)
        .map((c) => c.ruleId);
      setExpanded((prev) => {
        const next = { ...prev };
        for (const id of failedIds) next[id] = true;
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function checkFor(ruleId: string): CheckOutcome | null {
    return grade?.feedback.checks.find((c) => c.ruleId === ruleId) ?? null;
  }

  function stateFor(ruleId: string): TaskState {
    const c = checkFor(ruleId);
    if (c == null) return "idle";
    return c.passed ? "passed" : "not-yet";
  }

  function toggleTask(ruleId: string) {
    setExpanded((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  }

  function toggleAnswer(ruleId: string) {
    setRevealed((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  }

  return (
    <div className="sc-root">
      <header className="sc-header">
        <p className="sc-eyebrow">
          <span>{trackLabel}</span>
          <span className="sc-eyebrow-dot">·</span>
          <span>{lessonOrder.toString().padStart(2, "0")}</span>
        </p>
        <div className="sc-title-row">
          <h1 className="sc-title">{lessonTitle}</h1>
          <div className="sc-header-actions">
            {localeToggle}
            <a
              href={lessonHref}
              target="_blank"
              rel="noreferrer"
              className="sc-lesson-icon-btn"
              aria-label={t("openLesson")}
              title={t("openLesson")}
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </header>

      <ProgressBar
        passed={passedCount}
        total={tasks.length}
        progress={progress}
        score={grade?.score ?? null}
      />

      <ol className="sc-tasks">
        {tasks.map((task, i) => (
          <TaskCard
            key={task.ruleId}
            index={i + 1}
            task={task}
            locale={locale}
            state={stateFor(task.ruleId)}
            outcome={checkFor(task.ruleId)}
            isExpanded={expanded[task.ruleId] ?? false}
            isRevealed={revealed[task.ruleId] ?? false}
            onToggle={() => toggleTask(task.ruleId)}
            onToggleAnswer={() => toggleAnswer(task.ruleId)}
          />
        ))}
      </ol>

      <div className="sc-footer">
        {error ? <pre className="sc-error">{error}</pre> : null}
        {lastChecked && !busy ? (
          <p className="sc-last-checked">
            {t("checkedAgo", { ago: timeAgo(lastChecked, t) })}
          </p>
        ) : null}
        <button
          type="button"
          onClick={check}
          disabled={busy}
          className={cn("sc-primary-btn", grade?.passed && "is-passed")}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : grade ? (
            <RefreshCw className="size-4" />
          ) : (
            <Check className="size-4" />
          )}
          {busy
            ? t("checking")
            : grade
              ? t("checkAgain")
              : t("checkMyWork")}
        </button>
      </div>
    </div>
  );
}

function ProgressBar({
  passed,
  total,
  progress,
  score,
}: {
  passed: number;
  total: number;
  progress: number;
  score: number | null;
}) {
  const t = useTranslations("sidebar");
  return (
    <div className="sc-progress">
      <div className="sc-progress-row">
        <span className="sc-progress-count">
          <span className="sc-progress-passed">{passed}</span>
          <span className="sc-progress-sep"> / </span>
          <span className="sc-progress-total">{total}</span>
          <span className="sc-progress-label"> {t("tasks")}</span>
        </span>
        {score != null ? (
          <span
            className={cn(
              "sc-progress-score",
              score === 100 && "is-perfect",
              score < 100 && score > 0 && "is-partial",
              score === 0 && "is-empty",
            )}
          >
            {score}
            <span className="sc-progress-score-suffix">/100</span>
          </span>
        ) : null}
      </div>
      <div className="sc-progress-track" role="progressbar" aria-valuenow={passed} aria-valuemax={total}>
        <div
          className="sc-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function TaskCard({
  index,
  task,
  locale,
  state,
  outcome,
  isExpanded,
  isRevealed,
  onToggle,
  onToggleAnswer,
}: {
  index: number;
  task: TaskSummary;
  locale: string;
  state: TaskState;
  outcome: CheckOutcome | null;
  isExpanded: boolean;
  isRevealed: boolean;
  onToggle: () => void;
  onToggleAnswer: () => void;
}) {
  const t = useTranslations("sidebar");
  const isHe = locale === "he";
  const label = isHe && task.labelHe ? task.labelHe : task.label;
  const detail = isHe && outcome?.detailHe ? outcome.detailHe : outcome?.detail;
  const hasBody =
    (detail != null && state === "not-yet") || task.answer != null;

  return (
    <li className={cn("sc-task", `is-${state}`)}>
      <button
        type="button"
        className="sc-task-head"
        onClick={hasBody ? onToggle : undefined}
        aria-expanded={isExpanded}
        disabled={!hasBody}
      >
        <span className="sc-task-num" aria-hidden>
          {state === "passed" ? (
            <Check className="size-3.5" strokeWidth={3} />
          ) : state === "not-yet" ? (
            <CircleAlert className="size-3.5" />
          ) : (
            index
          )}
        </span>
        <span className="sc-task-label">
          <InlineMarkdown>{label}</InlineMarkdown>
        </span>
        {hasBody ? (
          <span className="sc-task-chevron" aria-hidden>
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </span>
        ) : null}
      </button>

      {hasBody && isExpanded ? (
        <div className="sc-task-body">
          {detail && state === "not-yet" ? (
            <div className="sc-task-hint">
              <Lightbulb className="size-3.5 sc-task-hint-icon" />
              <div className="sc-task-hint-text">
                <InlineMarkdown>{detail}</InlineMarkdown>
              </div>
            </div>
          ) : null}

          {task.answer ? (
            <div className="sc-task-answer-wrap">
              <button
                type="button"
                className="sc-link-btn"
                onClick={onToggleAnswer}
                aria-expanded={isRevealed}
              >
                {isRevealed ? t("hideAnswer") : t("showAnswer")}
                {isRevealed ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </button>
              {isRevealed ? (
                <pre className="sc-task-answer">{task.answer}</pre>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function timeAgo(
  d: Date,
  t: ReturnType<typeof useTranslations<"sidebar">>,
): string {
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 5) return t("justNow");
  if (seconds < 60) return t("secondsAgo", { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  return t("hoursAgo", { n: hours });
}
