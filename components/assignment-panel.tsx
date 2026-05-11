"use client";

import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InlineMarkdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "sheets-guide-attempt-";

type AttemptState = {
  attemptId: number;
  sheetId: string;
  sheetUrl: string;
  sidebarScriptId?: string | null;
  sidebarError?: string | null;
};

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

export function AssignmentPanel({ assignmentId }: { assignmentId: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState<"idle" | "starting" | "grading">("idle");
  const locale = useLocale();
  const t = useTranslations("assignmentPanel");

  useEffect(() => {
    setHydrated(true);
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + assignmentId);
      if (stored) setAttempt(JSON.parse(stored) as AttemptState);
    } catch {
      // ignore parse errors
    }
  }, [assignmentId]);

  async function start() {
    if (attempt && !confirm(t("confirmFreshStart"))) {
      return;
    }
    setBusy("starting");
    // Open the destination tab synchronously inside the user gesture so the
    // browser doesn't classify it as a popup. We redirect it once the fetch
    // resolves below. If the user blocks popups entirely, we still surface a
    // fallback link in the UI.
    // No `noopener` — it makes window.open return null, which would strand
    // the user on about:blank. The new tab navigates to Google Sheets
    // (cross-origin) immediately after, so the window reference is severed
    // by the navigation itself.
    const newTab = window.open("about:blank", "_blank");
    try {
      const r = await fetch(
        `/api/assignments/${assignmentId}/start?locale=${encodeURIComponent(locale)}`,
        { method: "POST" },
      );
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as AttemptState;
      setAttempt(data);
      setGrade(null);
      try {
        localStorage.setItem(STORAGE_PREFIX + assignmentId, JSON.stringify(data));
      } catch {
        // ignore storage errors
      }
      if (newTab && !newTab.closed) {
        newTab.location.href = data.sheetUrl;
      }
      // If the popup was blocked, the user clicks "Open your sheet" in the
      // panel below — we don't navigate the current tab away from the lesson.
      if (data.sidebarError) {
        toast.warning(t("sidebarFailed", { error: data.sidebarError }));
      } else {
        toast.success(t("sheetProvisioned"));
      }
    } catch (err) {
      if (newTab && !newTab.closed) newTab.close();
      toast.error(
        t("couldNotStart", {
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      setBusy("idle");
    }
  }

  async function gradeNow() {
    if (!attempt) return;
    setBusy("grading");
    try {
      const r = await fetch(`/api/assignments/${assignmentId}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.attemptId }),
      });
      if (!r.ok) throw new Error(await r.text());
      const result = (await r.json()) as GradeResult;
      setGrade(result);
      if (result.passed) {
        toast.success(t("passedScore", { score: result.score }));
      } else {
        toast.warning(t("scoreSeeFeedback", { score: result.score }));
      }
    } catch (err) {
      toast.error(
        t("couldNotGrade", {
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-md border bg-card p-6 shadow-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("heading")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>

        <div className="mt-4 space-y-2">
          <Button
            type="button"
            onClick={start}
            disabled={busy !== "idle"}
            className="w-full justify-start"
          >
            {busy === "starting" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : attempt ? (
              <RefreshCw className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
            {attempt ? t("startFresh") : t("startAssignment")}
          </Button>

          {hydrated && attempt ? (
            <>
              <a
                href={attempt.sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ExternalLink className="size-4 text-muted-foreground" />
                {t("openSheet")}
              </a>

              <Button
                type="button"
                variant="secondary"
                onClick={gradeNow}
                disabled={busy !== "idle"}
                className="w-full justify-start"
              >
                {busy === "grading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {t("gradeMyWork")}
              </Button>
            </>
          ) : null}
        </div>
      </section>

      {busy === "grading" ? (
        <section className="rounded-md border bg-card p-6 shadow-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("readingSheet")}
          </h3>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </section>
      ) : grade ? (
        <FeedbackCard grade={grade} locale={locale} />
      ) : null}
    </div>
  );
}

function FeedbackCard({
  grade,
  locale,
}: {
  grade: GradeResult;
  locale: string;
}) {
  const t = useTranslations("assignmentPanel");
  const isHe = locale === "he";
  return (
    <section
      className={cn(
        "rounded-md border bg-card p-6 shadow-1",
        grade.passed ? "border-success/30" : "border-warning/40",
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("feedback")}
          </h3>
          <p
            className={cn(
              "mt-1 flex items-center gap-2 text-base font-semibold",
              grade.passed ? "text-success" : "text-warning",
            )}
          >
            {grade.passed ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <XCircle className="size-5" />
            )}
            {grade.passed ? t("passed") : t("notYet")}
          </p>
        </div>
        <div className="text-end">
          <div className="font-mono text-2xl font-semibold tabular-nums">
            {grade.score}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / 100
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("gradedBy", { by: grade.gradedBy })}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground">
        {isHe && grade.feedback.summaryHe
          ? grade.feedback.summaryHe
          : grade.feedback.summary}
      </p>

      <ul className="mt-4 space-y-2">
        {grade.feedback.checks.map((c) => {
          const name = isHe && c.nameHe ? c.nameHe : c.name;
          const detail = isHe && c.detailHe ? c.detailHe : c.detail;
          return (
            <li
              key={c.ruleId}
              className="flex items-start gap-2 rounded-sm border bg-surface-elevated p-2"
            >
              {c.passed ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-warning" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{name}</p>
                {detail ? (
                  <div className="mt-1 text-muted-foreground [&>p]:m-0">
                    <InlineMarkdown>{detail}</InlineMarkdown>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
