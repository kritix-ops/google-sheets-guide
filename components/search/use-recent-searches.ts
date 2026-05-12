"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "gsg.search.recent.v1";
const MAX_ENTRIES = 8;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function writeRecent(values: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Quota errors etc. are not actionable here; the recent list is a
    // convenience, not durable state.
  }
}

// Same-tab subscribers. The `storage` event only fires in *other* tabs, so
// we notify our own subscribers manually after `push`/`clear`.
const sameTabListeners = new Set<() => void>();

function notifySameTab(): void {
  cachedSnapshot = null;
  sameTabListeners.forEach((cb) => cb());
}

const EMPTY: string[] = [];

// `useSyncExternalStore` requires `getSnapshot` to return a stable reference
// when nothing has changed (an unstable reference loops the render). We
// memoize the parsed array and invalidate it when the value changes (either
// from a cross-tab `storage` event or from same-tab `push`/`clear`).
let cachedSnapshot: string[] | null = null;

function getSnapshot(): string[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = readRecent();
  }
  return cachedSnapshot;
}

function invalidateSnapshot(): void {
  cachedSnapshot = null;
}

// Backed by localStorage. Returns the most-recent-first list plus
// `push` (idempotent, dedups, caps length) and `clear`.
export function useRecentSearches(): {
  values: string[];
  push: (q: string) => void;
  clear: () => void;
} {
  const values = useSyncExternalStore(
    (cb) => {
      function onStorage(e: StorageEvent) {
        if (e.key === STORAGE_KEY) {
          invalidateSnapshot();
          cb();
        }
      }
      window.addEventListener("storage", onStorage);
      sameTabListeners.add(cb);
      return () => {
        window.removeEventListener("storage", onStorage);
        sameTabListeners.delete(cb);
      };
    },
    getSnapshot,
    () => EMPTY,
  );

  const push = useCallback((rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;
    const prev = readRecent();
    const next = [q, ...prev.filter((v) => v !== q)].slice(0, MAX_ENTRIES);
    writeRecent(next);
    notifySameTab();
  }, []);

  const clear = useCallback(() => {
    writeRecent([]);
    notifySameTab();
  }, []);

  return { values, push, clear };
}
