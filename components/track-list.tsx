"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link, usePathname } from "@/lib/i18n/navigation";
import {
  getLocalizedLessonTitle,
  type LessonInfo,
  type Track,
} from "@/lib/content/registry";
import type { Locale } from "@/lib/i18n/routing";
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

export function TrackList({ tracks }: { tracks: TrackListItem[] }) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const tHome = useTranslations("home");
  const tTracks = useTranslations("tracks");

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = loadStored();
    const next = { ...stored };
    const activeTrack = tracks.find((t) =>
      t.lessons.some((l) => pathname === `/lesson/${l.assignmentId}`),
    );
    if (activeTrack) {
      next[activeTrack.track] = true;
    }
    setExpanded(next);
  }, [pathname, tracks]);

  function toggle(track: Track) {
    setExpanded((prev) => {
      const next = { ...prev, [track]: !prev[track] };
      saveStored(next);
      return next;
    });
  }

  return (
    <section className="mt-12 space-y-3">
      {tracks.map((t) => {
        const isOpen = !!expanded[t.track];
        const panelId = `home-track-panel-${t.track}`;
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
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                  {tTracks(`${t.track}.label`)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tTracks(`${t.track}.tagline`)}
                </p>
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
                      return (
                        <li key={l.assignmentId}>
                          <Link
                            href={`/lesson/${l.assignmentId}`}
                            className="flex items-baseline gap-4 rounded-md border bg-background p-4 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            <span className="font-mono text-sm tabular-nums text-muted-foreground">
                              {String(l.order).padStart(2, "0")}
                            </span>
                            <span className="flex-1 font-medium text-start">
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
    </section>
  );
}
