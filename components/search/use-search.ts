"use client";

import MiniSearch, { type SearchResult } from "minisearch";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AdminSearchResponse,
  LessonIndexEntry,
  QuickAction,
} from "@/lib/search/types";

const ADMIN_DEBOUNCE_MS = 120;

type IndexState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; ms: MiniSearch<LessonIndexEntry>; entries: LessonIndexEntry[] }
  | { kind: "error"; message: string };

export type LessonHit = LessonIndexEntry & { score: number };

export function useSearch(opts: {
  locale: "en" | "he";
  enabled: boolean; // typically: palette open
  query: string;
  // The list of available actions; pre-filtered by role server-side.
  quickActions: QuickAction[];
  // Whether to hit the admin search endpoint.
  adminEnabled: boolean;
}) {
  const [index, setIndex] = useState<IndexState>({ kind: "idle" });
  const [adminResults, setAdminResults] = useState<AdminSearchResponse>({
    users: [],
    drafts: [],
    audit: [],
  });
  const [adminError, setAdminError] = useState<string | null>(null);
  const lastFiredQuery = useRef<string>("");

  // Lazy-load the index on first enable. We never refetch within a
  // session: the index is build-time output, never changes between
  // route navigations.
  useEffect(() => {
    if (!opts.enabled || index.kind !== "idle") return;
    let cancelled = false;
    // State-machine pattern: the "loading" phase must commit before the
    // async fetch resolves so the UI can render a skeleton. This is the
    // legitimate effect use of setState, not a derived-state shortcut.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex({ kind: "loading" });
    void (async () => {
      try {
        const res = await fetch(`/search-index/lessons-${opts.locale}.json`, {
          cache: "force-cache",
        });
        if (!res.ok) {
          if (!cancelled)
            setIndex({
              kind: "error",
              message: `HTTP ${res.status}`,
            });
          return;
        }
        const entries = (await res.json()) as LessonIndexEntry[];
        const ms = new MiniSearch<LessonIndexEntry>({
          idField: "id",
          fields: ["title", "heading", "body", "trackLabel"],
          storeFields: [
            "id",
            "kind",
            "lang",
            "track",
            "trackLabel",
            "slug",
            "order",
            "assignmentId",
            "title",
            "heading",
            "headingId",
            "body",
            "href",
          ],
          searchOptions: {
            boost: { title: 6, heading: 4, trackLabel: 2 },
            prefix: true,
            fuzzy: 0.18,
            combineWith: "AND",
          },
        });
        ms.addAll(entries);
        if (!cancelled) setIndex({ kind: "ready", ms, entries });
      } catch (err) {
        if (!cancelled)
          setIndex({ kind: "error", message: (err as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opts.enabled, opts.locale, index.kind]);

  // Run admin search whenever the query changes, with a small debounce
  // so we don't fan out a request per keystroke.
  useEffect(() => {
    if (!opts.adminEnabled || !opts.enabled) {
      // Effect-driven cleanup when adminEnabled flips off or the palette
      // closes; the empty state needs to commit immediately so stale rows
      // don't briefly render before the next query.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdminResults({ users: [], drafts: [], audit: [] });
      setAdminError(null);
      return;
    }
    const q = opts.query.trim();
    lastFiredQuery.current = q;
    if (q.length < 2) {
      setAdminResults({ users: [], drafts: [], audit: [] });
      setAdminError(null);
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setAdminError(`HTTP ${res.status}`);
          return;
        }
        const json = (await res.json()) as AdminSearchResponse;
        // Stale response guard: only commit if the query that fired
        // this is still the latest one.
        if (lastFiredQuery.current === q) {
          setAdminResults(json);
          setAdminError(null);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setAdminError((err as Error).message);
      }
    }, ADMIN_DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [opts.adminEnabled, opts.enabled, opts.query]);

  const lessonHits = useCallback((): LessonHit[] => {
    if (index.kind !== "ready") return [];
    const q = opts.query.trim();
    if (!q) return [];
    const raw: SearchResult[] = index.ms.search(q);
    return raw.slice(0, 30).map((r) => ({
      ...(r as unknown as LessonIndexEntry),
      score: r.score,
    }));
  }, [index, opts.query]);

  const actionHits = useCallback((): QuickAction[] => {
    const q = opts.query.trim().toLowerCase();
    if (!q) return opts.quickActions; // empty query: show all
    return opts.quickActions.filter((a) => {
      const label = a.label.toLowerCase();
      const hint = a.hint.toLowerCase();
      return label.includes(q) || hint.includes(q);
    });
  }, [opts.quickActions, opts.query]);

  return {
    indexState: index.kind,
    indexError: index.kind === "error" ? index.message : null,
    lessonHits,
    actionHits,
    adminResults,
    adminError,
  };
}
