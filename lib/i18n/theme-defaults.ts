import { LOCALES, type Locale } from "./routing";

// Per-locale default theme. Each locale gets one choice. Flip a value in
// the THEME_DEFAULTS map to ship a different default for that locale on a
// user's first visit; existing users keep whatever they last toggled to,
// because their preference is stored in localStorage under
// `sheets-guide-theme:<locale>`.

export type Theme = "light" | "dark";

export const THEME_DEFAULTS: Record<Locale, Theme> = {
  en: "dark",
  he: "dark",
};

export const THEME_STORAGE_PREFIX = "sheets-guide-theme:";
export const LEGACY_THEME_STORAGE_KEY = "sheets-guide-theme";

export function themeStorageKey(locale: Locale): string {
  return `${THEME_STORAGE_PREFIX}${locale}`;
}

export function defaultThemeFor(locale: string): Theme {
  if ((LOCALES as readonly string[]).includes(locale)) {
    return THEME_DEFAULTS[locale as Locale];
  }
  return "dark";
}
