"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sheets-guide-theme";

type Theme = "dark" | "light";

// The active theme lives in `document.documentElement.classList`. React doesn't
// know when we mutate it from `toggle()`, so we run an in-module notifier set
// that `toggle()` fires after each DOM mutation. Cross-tab updates come in via
// the `storage` event.
const themeListeners = new Set<() => void>();

function notifyThemeChange(): void {
  themeListeners.forEach((cb) => cb());
}

function subscribeTheme(cb: () => void): () => void {
  themeListeners.add(cb);
  function onStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) cb();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getThemeServerSnapshot(): Theme {
  return "dark";
}

// `useSyncExternalStore` returns `false` during SSR (via the server snapshot)
// and flips to `true` after hydration. Components that branch on mount-state
// use this to avoid the hydration mismatch warning when the visual differs
// between SSR and the client (icon choice here).
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const mounted = useMounted();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors (incognito, etc.)
    }
    notifyThemeChange();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="text-muted-foreground hover:text-foreground"
    >
      {mounted && theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
