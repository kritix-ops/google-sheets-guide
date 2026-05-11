"use client";

import { useCallback, useEffect, useState } from "react";

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

// Backed by localStorage. Returns the most-recent-first list plus
// `push` (idempotent, dedups, caps length) and `clear`.
export function useRecentSearches(): {
  values: string[];
  push: (q: string) => void;
  clear: () => void;
} {
  const [values, setValues] = useState<string[]>([]);

  // Hydrate once. Storage events sync across tabs.
  useEffect(() => {
    setValues(readRecent());
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setValues(readRecent());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const push = useCallback((rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;
    setValues((prev) => {
      const next = [q, ...prev.filter((v) => v !== q)].slice(0, MAX_ENTRIES);
      writeRecent(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setValues([]);
    writeRecent([]);
  }, []);

  return { values, push, clear };
}
