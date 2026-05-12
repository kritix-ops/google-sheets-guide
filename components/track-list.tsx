"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  LessonStatusIcon,
  ProgressBar,
  ProgressCount,
} from "@/components/progress-ui";
import { Link, usePathname } from "@/lib/i18n/navigation";
import {
  getLocalizedLessonTitle,
  type LessonInfo,
  type Track,
} from "@/lib/content/registry";
import type { Locale } from "@/lib/i18n/routing";
import { type ProgressMap, summarizeTrack } from "@/lib/progress-utils";
import { cn } from "@/lib/utils";

// Shared with the sidebar so expanding a track on the homepage also expands it
// in the nav, and vice versa.
const STORAGE_KEY = "sheets-guide-sidebar-expanded";

function loadStored(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStored(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable: silently skip
  }
}

export type TrackListItem = {
  track: Track;
  label: string;
  tagline: string;
  lessons: LessonInfo[];
};

export function TrackList({
  tracks,
  progress = {},
}: {
  tracks: TrackListItem[];
  progress?: ProgressMap;
}) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const tHome = useTranslations("home");
  const tTracks = useTranslations("tracks");
  const tProgress = useTranslations("progress");

  // `expanded` only holds explicit user toggles, persisted to localStorage.
  // The "auto-open the active track" behavior is derived at render time
  // (see `isOpen` below) instead of synced into state — that keeps the
  // effect-free render free of cascading setState and means we don't have
  // to special-case the active-track toggle (user can still collapse it).
  // Lazy initializer is SSR-safe via the `typeof window` guard inside
  // `loadStored`.
  const [expanded, setExpanded] = useState<Record<string, boolean | undefined>>(
    () => loadStored(),
  );

  const activeTrack = tracks.find((t) =>
    t.lessons.some((l) => pathname === `/lesson/${l.assignmentId}`),
  )?.track;

  function toggle(track: Track) {
    setExpanded((prev) => {
      // If a track is auto-open because it contains the active lesson but
      // the user hasn't toggled it, `prev[track]` is undefined. The
      // effective open-state in that case is `true`, so the toggle should
      // collapse it to `false` rather than re-opening to `true`.
      const effective =
        prev[track] !== undefined ? prev[track] : track === activeTrack;
      const next = { ...prev, [track]: !effective };
      saveStored(next as Record<string, boolean>);
      return next;
    });
  }

  return (
    <section className="mt-12 space-y-3">
      {tracks.map((t) => {
        const explicit = expanded[t.track];
        const isOpen =
          explicit !== undefined ? explicit : t.track === activeTrack;
        const panelId = `home-track-panel-${t.track}`;
        const summary = summarizeTrack(t.lessons, progress);
        const hasLessons = t.lessons.length > 0;
        const isComplete = hasLessons && summary.passed === summary.total;
        return (
          <div
            key={t.track}
            className="overflow-hidden rounded-md border bg-card"
          >
            <button
              type="button"
              onClick={() => toggle(t.track)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {tTracks(`${t.track}.label`)}
                  </h2>
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      <CheckCircle2 className="size-3" strokeWidth={2.5} />
                      {tProgress("trackComplete")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tTracks(`${t.track}.tagline`)}
                </p>
                {hasLessons ? (
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar summary={summary} tone="mixed" className="flex-1" />
                    <ProgressCount summary={summary} />
                  </div>
                ) : null}
              </div>
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen ? (
              <div id={panelId} className="border-t px-5 py-4">
                {t.lessons.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">
                    {tHome("lessonsInProgress")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {t.lessons.map((l) => {
                      const title =
                        getLocalizedLessonTitle(l.assignmentId, locale) ??
                        l.title;
                      const lp = progress[l.assignmentId];
                      const status = lp?.status ?? "not-started";
                      const isPassed = status === "passed";
                      return (
                        <li key={l.assignmentId}>
                          <Link
                            href={`/lesson/${l.assignmentId}`}
                            className={cn(
                              "flex items-center gap-3 rounded-md border bg-background p-4 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                              isPassed && "border-success/30",
                            )}
                          >
                            <LessonStatusIcon status={status} size="sm" />
                            <span className="font-mono text-sm tabular-nums text-muted-foreground">
                              {String(l.order).padStart(2, "0")}
                            </span>
                            <span
                              className={cn(
                                "flex-1 font-medium text-start",
                                isPassed ? "text-foreground" : "text-foreground",
                              )}
                            >
                              {title}
                            </span>
                            {isPassed && typeof lp?.bestScore === "number" ? (
                              <span className="hidden font-mono text-xs tabular-nums text-success sm:inline">
                                {tProgress("score", { score: lp.bestScore })}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
