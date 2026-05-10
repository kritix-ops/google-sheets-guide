import { defineRouting } from "next-intl/routing";

export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES = new Set<Locale>(["he"]);
export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});
