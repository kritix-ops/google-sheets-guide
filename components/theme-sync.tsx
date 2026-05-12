"use client";

import { useLocale } from "next-intl";
import { useLayoutEffect } from "react";

import type { Locale } from "@/lib/i18n/routing";
import {
  LEGACY_THEME_STORAGE_KEY,
  THEME_STORAGE_PREFIX,
  type Theme,
} from "@/lib/i18n/theme-defaults";

// The first-paint script in the layout handles full document loads. This
// component handles client-side navigations between locales — e.g. when the
// user clicks the EN/HE toggle and Next.js does a soft navigation. The
// layout re-renders with the new locale prop, this effect fires before
// paint, and we apply the new locale's stored preference (or default).

type Props = {
  themeDefaults: Record<Locale, Theme>;
};

function readLocaleTheme(locale: Locale, fallback: Theme): Theme {
  try {
    const localeValue = localStorage.getItem(
      `${THEME_STORAGE_PREFIX}${locale}`,
    );
    if (localeValue === "light" || localeValue === "dark") return localeValue;
    const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacy === "light" || legacy === "dark") return legacy;
  } catch {
    // localStorage may be blocked (incognito, etc.) — fall through.
  }
  return fallback;
}

export function ThemeSync({ themeDefaults }: Props) {
  const locale = useLocale() as Locale;

  useLayoutEffect(() => {
    const theme = readLocaleTheme(locale, themeDefaults[locale] ?? "dark");
    const root = document.documentElement;
    const wantDark = theme === "dark";
    const hasDark = root.classList.contains("dark");
    if (wantDark && !hasDark) root.classList.add("dark");
    else if (!wantDark && hasDark) root.classList.remove("dark");
  }, [locale, themeDefaults]);

  return null;
}
