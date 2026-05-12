"use client";

import { Moon, Sun } from "lucide-react";
import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import { THEME_STORAGE_PREFIX } from "@/lib/i18n/theme-defaults";

type Theme = "dark" | "light";

// The active theme lives in `document.documentElement.classList`. React doesn't
// know when we mutate it from `toggle()`, so we run an in-module notifier set
// that `toggle()` fires after each DOM mutation. Cross-tab updates come in via
// the `storage` event — we listen for any key with our prefix so a toggle in
// one locale tab still notifies a tab on a different locale (matters when the
// user is browsing the same locale across two tabs).
const themeListeners = new Set<() => void>();

function notifyThemeChange(): void {
  themeListeners.forEach((cb) => cb());
}

function subscribeTheme(cb: () => void): () => void {
  themeListeners.add(cb);
  function onStorage(e: StorageEvent) {
    if (e.key && e.key.startsWith(THEME_STORAGE_PREFIX)) cb();
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
  const locale = useLocale() as Locale;
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
      localStorage.setItem(`${THEME_STORAGE_PREFIX}${locale}`, next);
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
