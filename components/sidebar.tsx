"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  LessonStatusIcon,
  ProgressBar,
  ProgressCount,
} from "@/components/progress-ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, usePathname } from "@/lib/i18n/navigation";
import {
  getLocalizedLessonTitle,
  type LessonInfo,
  type Track,
} from "@/lib/content/registry";
import type { Locale } from "@/lib/i18n/routing";
import { type ProgressMap, summarizeTrack } from "@/lib/progress-utils";
import { cn } from "@/lib/utils";

export type SidebarTrack = {
  track: Track;
  label: string;
  tagline: string;
  lessons: LessonInfo[];
};

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
    // localStorage unavailable (private mode quota): silently skip
  }
}

export function Sidebar({
  tracks,
  progress = {},
}: {
  tracks: SidebarTrack[];
  progress?: ProgressMap;
}) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const tNav = useTranslations("nav");
  const tTracks = useTranslations("tracks");

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
    <aside className="hidden w-64 shrink-0 border-e bg-sidebar lg:block">
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <nav className="px-4 py-6">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tNav("curriculum")}
          </p>
          <div className="space-y-1">
            {tracks.map((t) => {
              const explicit = expanded[t.track];
              const isOpen =
                explicit !== undefined ? explicit : t.track === activeTrack;
              const panelId = `track-panel-${t.track}`;
              const summary = summarizeTrack(t.lessons, progress);
              const hasLessons = t.lessons.length > 0;
              return (
                <div key={t.track}>
                  <button
                    type="button"
                    onClick={() => toggle(t.track)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-start hover:bg-sidebar-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {tTracks(`${t.track}.label`)}
                      </span>
                      {hasLessons ? (
                        <span className="mt-1 flex items-center gap-2">
                          <ProgressBar summary={summary} tone="mixed" className="flex-1" />
                          <ProgressCount summary={summary} />
                        </span>
                      ) : null}
                    </span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div id={panelId} className="px-2 pb-2 pt-1">
                      <p className="text-xs text-muted-foreground">
                        {tTracks(`${t.track}.tagline`)}
                      </p>
                      {t.lessons.length === 0 ? (
                        <p className="pt-2 text-xs italic text-muted-foreground">
                          {tNav("comingSoon")}
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-[2px]">
                          {t.lessons.map((l) => {
                            const href = `/lesson/${l.assignmentId}`;
                            const active = pathname === href;
                            const title =
                              getLocalizedLessonTitle(l.assignmentId, locale) ??
                              l.title;
                            const status =
                              progress[l.assignmentId]?.status ?? "not-started";
                            const isPassed = status === "passed";
                            return (
                              <li key={l.assignmentId}>
                                <Link
                                  href={href}
                                  className={cn(
                                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                                    active
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <LessonStatusIcon status={status} size="xs" />
                                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                    {String(l.order).padStart(2, "0")}
                                  </span>
                                  <span
                                    className={cn(
                                      "flex-1 truncate text-start",
                                      isPassed && "text-foreground",
                                    )}
                                  >
                                    {title}
                                  </span>
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
          </div>
        </nav>
      </ScrollArea>
    </aside>
  );
}
