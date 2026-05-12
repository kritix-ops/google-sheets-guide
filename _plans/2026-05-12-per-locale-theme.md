# Per-locale theme defaults — 2026-05-12

## Goal

Each locale has its own default theme (light or dark). Each locale also has
its own stored user preference. Switching locale mid-session re-applies the
new locale's stored choice, or its default if the user has not toggled
there yet.

## Approved choices (user, 2026-05-12)

- Behavior: per-locale default + per-locale memory (no shared override).
- Defaults: `en: "dark"`, `he: "dark"` (current behavior preserved; the
  config exists so the user can flip per locale later without code
  changes).

## Design

- `lib/i18n/theme-defaults.ts` holds the `Record<Locale, "light" | "dark">`
  map and a tiny helper. Single source of truth for the defaults.
- Per-locale storage key: `sheets-guide-theme:<locale>`. Each locale has
  its own slot.
- Legacy migration: if `sheets-guide-theme` (the old single-key value)
  exists and the new per-locale key does not, fall back to the legacy
  value on read. We do not delete the legacy key; it just stops being
  authoritative once a locale-keyed value is written.
- Server-rendered first-paint script in `app/[locale]/layout.tsx` knows
  the locale at render time and applies the correct theme before paint.
  No FOUC.
- Client-side locale changes (soft navigation between `/en/...` and
  `/he/...`) trigger a `useLayoutEffect` inside a small `ThemeSync`
  client component that re-reads storage and re-applies before paint.
- `ThemeToggle` reads the active locale via `useLocale()` from next-intl,
  reads/writes the locale-keyed storage key, and continues to notify the
  external store so other components react.

## Files

- NEW `lib/i18n/theme-defaults.ts`
- NEW `components/theme-sync.tsx`
- MODIFY `app/[locale]/layout.tsx` (script template + render ThemeSync)
- MODIFY `components/theme-toggle.tsx` (locale-keyed storage)

## Out of scope

- "System" theme preference. The product currently has light + dark only;
  matches `prefers-color-scheme` could be a later flag but is not in this
  task.
- Per-user persistence across devices (would require a DB column). Local
  storage is sufficient for the requested behavior.
