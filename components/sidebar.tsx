"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, usePathname } from "@/lib/i18n/navigation";
import {
  getLocalizedLessonTitle,
  type LessonInfo,
  type Track,
} from "@/lib/content/registry";
import type { Locale } from "@/lib/i18n/routing";
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

export function Sidebar({ tracks }: { tracks: SidebarTrack[] }) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const tNav = useTranslations("nav");
  const tTracks = useTranslations("tracks");

  // Default: all collapsed. After mount, hydrate from localStorage and
  // force-open the track that contains the currently active lesson.
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
    <aside className="hidden w-64 shrink-0 border-e bg-sidebar lg:block">
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <nav className="px-4 py-6">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tNav("curriculum")}
          </p>
          <div className="space-y-1">
            {tracks.map((t) => {
              const isOpen = !!expanded[t.track];
              const panelId = `track-panel-${t.track}`;
              return (
                <div key={t.track}>
                  <button
                    type="button"
                    onClick={() => toggle(t.track)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-start hover:bg-sidebar-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {tTracks(`${t.track}.label`)}
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
                            return (
                              <li key={l.assignmentId}>
                                <Link
                                  href={href}
                                  className={cn(
                                    "flex items-baseline gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                                    active
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                    {String(l.order).padStart(2, "0")}
                                  </span>
                                  <span className="flex-1 truncate text-start">
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
