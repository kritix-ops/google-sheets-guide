# Search everywhere, 2026-05-11

## Goals

A single fast, beautiful search surface that finds anything in the
system: curriculum content (every lesson title, heading, and paragraph
in both languages), admin content (users, audit log, drafts), and
quick actions (jump to audit log, add user, create draft).

## Constraints (locked 2026-05-11)

- **Index depth**: titles + headings + full prose, both EN and HE.
- **UX surface**: Cmd/Ctrl+K palette only; a thin "Search... ⌘K" entry
  point in the top bar opens the same modal on click.
- **Match smartness**: fuzzy + prefix + field-weighted via MiniSearch.
  No AI fallback in v1.
- **Innovation knobs (all four)**:
  - Recent searches persisted to localStorage.
  - Per-result progress badges (Completed/In progress/Not started).
  - Live snippet highlight of matched substrings.
  - Section-level deep links into lessons.
  - Quick actions surfaced above content matches.

## Requirements

- Open the palette from anywhere in the app via ⌘K (macOS), Ctrl+K
  (Linux/Windows), or by clicking the top-bar search affordance.
- First keystroke shows results within one frame after the index is
  warm; first ⌘K of a session loads the index lazily and renders
  results within ~300ms on a midrange laptop.
- Results group cleanly by category (Lessons, Headings, Admin Users,
  Admin Audit, Admin Drafts, Actions). Group headers are obvious;
  empty groups disappear.
- Lessons that the current user has completed/started show a status
  badge inside the result row, sourced from the existing `attempts`
  table.
- Clicking (or pressing Enter on) a heading result deep-links to the
  exact heading via URL fragment.
- Admin content matches only show when the user has the role to read
  them (editor sees drafts; admin sees everything; viewer sees only
  lessons + their own progress).
- The palette is fully keyboard-driven: ↑↓ to move, ⏎ to open, ⌘+1..n
  optional but ↑↓ wraps groups so plain arrows is enough.
- Hebrew text in queries finds Hebrew lesson content; English finds
  English. Cross-language fallback is a stretch goal, not v1.
- Robust against missing search index (e.g., dev without build step).
  Show a friendly "search index unavailable" message; don't crash.

## Architecture

### Lesson index (static, build-time)

A Node build script reads every `content/{en,he}/lessons/**/lesson.mdx`,
strips MDX imports / JSX components / fenced code blocks, then walks
the remaining markdown to extract:

- One **lesson entry** per (lesson, lang): track, slug, order, title,
  full prose, href to `/[locale]/lesson/[id]`.
- One **heading entry** per `##` / `###` in the lesson: same metadata
  plus the heading text and its slug ID; href includes the URL
  fragment.

Output: `public/search-index/lessons-en.json`,
`public/search-index/lessons-he.json`. Files are ~300KB to 1MB each
(gzipped: maybe 100-250KB). Served directly from `/public`, fetched
lazily on first palette open and kept in memory.

A `build:search` npm script runs the indexer; `vercel-build` runs it
before `next build`. For local dev, run it explicitly (`npm run
build:search`) or let the API route generate it on demand.

### Heading IDs (in MDX render)

Lesson headings currently have no IDs. The indexer slugifies each
heading; the renderer must produce the same IDs so anchor links work.
Use `github-slugger` (the canonical, deterministic slugger) in **both**
the indexer and `mdx-components.tsx`. Reset the slugger per lesson so
identical headings across lessons don't collide.

### Admin live index (server-side)

`POST /api/admin-search` (server route, role-gated):

- Reads JSON body `{ q: string }`.
- `requireRole("editor")` minimum; if `admin`, search expands.
- Runs three small SQL queries:
  - `allowedUsers` LIKE `%q%` on email or note (admin only).
  - `lessonDrafts` LIKE `%q%` on content (editor sees own drafts,
    admin sees all).
  - `adminAudit` LIKE `%q%` on target or actorEmail (admin only).
- Returns `{ users: [...], drafts: [...], audit: [...] }`. Limit each
  to 10 rows.
- Result shape mirrors the client `SearchResult` discriminated union
  so the palette renders them through the same component pipeline.

### Quick actions (in-memory)

A static `quickActions` table in `lib/search/quick-actions.ts`:
- Label, icon name (from lucide-react), href, minRole.
- Filtered by `roleAtLeast(user.role, minRole)` server-side at palette
  open time, then matched against the query client-side via the same
  fuzzy match.
- Examples: "Add user" (admin), "Open audit log" (admin), "Edit
  content" (editor), "Sign out".

### UX (the palette)

Single client component `SearchPalette` mounted once in the
`<TopBar>` so it's available globally:

- Open: click trigger / ⌘K / Ctrl+K. Trap focus. Block body scroll.
- Empty query state: recent searches as chips + a small "Try…" hint.
- Typing state: debounced 80ms to coalesce keystrokes.
- Results layout: scrollable list grouped by category; the active row
  has a left accent and ↩ hint on the right.
- Each row: leading icon (lucide), title with highlighted matches,
  breadcrumb under it (track / lesson / lang), trailing chip
  (progress badge or role badge).
- Result of zero matches: friendly empty state with the query echoed
  and the most recently visited lesson as a fallback.

### Recent searches

`useRecentSearches` hook backed by `localStorage` key
`gsg.search.recent.v1`. Caps at 8; oldest evicted. Pushed when the
user hits Enter on a query or clicks a result.

### Highlight rendering

`<Highlight text={...} match={query} />` splits the text on
case-insensitive matches of the query terms and wraps matches in a
`<mark>` styled as a subtle background, never `innerHTML`. Safe by
construction.

## Files and shape

### New (foundations)

- `lib/search/slugify.ts` — re-exports a fresh-instance helper around
  github-slugger; both indexer and renderer call it.
- `lib/search/types.ts` — shared discriminated-union types
  (`SearchEntry`, `SearchResult`, `SearchKind`).
- `lib/search/extract-lesson.ts` — server-only utility: MDX string →
  prose + headings, returns indexer-ready entries.
- `lib/search/admin-query.ts` — server-only: takes `q`, queries DB
  with role checks, returns typed admin results.
- `lib/search/quick-actions.ts` — static action registry.
- `scripts/build-search-index.ts` — entry script writing both
  language JSON files.

### New (UI)

- `components/search/search-palette.tsx` — root modal, keyboard
  handling, focus trap.
- `components/search/search-trigger.tsx` — top-bar entry button.
- `components/search/use-search.ts` — client hook: lazy-load index,
  run MiniSearch, debounce, merge admin/quick-action results.
- `components/search/use-recent-searches.ts` — localStorage hook.
- `components/search/highlight.tsx` — `<Highlight>` component.
- `components/search/result-row.tsx` — one row in the result list.

### New (API)

- `app/api/admin-search/route.ts` — POST endpoint, role-gated.

### Modified

- `mdx-components.tsx` — auto-IDs on h2/h3/h4 via a per-render
  slugger.
- `components/top-bar.tsx` — mount `<SearchTrigger />` and (only when
  authed) wire it to open `<SearchPalette />`.
- `package.json` — add `build:search` script, prepend to
  `vercel-build`.
- `messages/{en,he}.json` — palette strings (placeholder, empty
  state, group headings, etc.).

## Security plan (per CLAUDE.md rule 13)

- **Lesson index**: published content; public by definition.
- **Admin route**: server-side `requireRole("editor")` on every
  request. Role determines which queries fire. The client never sees
  rows it isn't authorized for, because the server filters them out.
- **Inputs**: `q` is sanitized server-side; max 200 chars; bound
  parameters in SQL via Drizzle prevent injection.
- **CSRF**: same-site cookies cover the GET-like POST. We accept JSON
  body; no form-submission attacker surface.
- **XSS in highlight**: never inject HTML; split text and wrap in
  React `<mark>` nodes.
- **Recent searches**: localStorage only, no exfil. Cleared on sign-
  out via a small effect that also clears on storage event.
- **Audit search exposure**: the `admin_audit.beforeJson` /
  `afterJson` can contain emails, role names, commit SHAs. Surfacing
  these to admins is intended (admins already see this in
  `/admin/audit`). Surface in the palette via the same row format.

## Cost plan (per CLAUDE.md rule 8)

| Item | Cost | Notes |
|---|---|---|
| MiniSearch npm dep | $0 | ~16KB minzipped, MIT |
| github-slugger npm dep | $0 | tiny, ISC |
| Build-time index gen | ~1-2s added to `vercel-build` | Negligible |
| Index payload | 200-500KB gzipped per lang | Loaded lazily on first ⌘K |
| Runtime DB hits for admin search | ~3 small queries per keystroke | Debounced to ~12/sec worst case; well under Turso limits |
| AI calls | $0 | No AI in v1 (locked in alignment) |

No paid services touched. Verified MiniSearch + github-slugger live on
their GitHub repos 2026-05-11.

## Phasing

Single milestone; the feature only works once all phases land.

1. **Foundations**: slugify, types, heading IDs in mdx-components,
   lesson-extractor, build script wired into package.json. Generate
   real EN+HE index files committed-as-gitignored under
   `public/search-index/`.
2. **Palette UI shell**: trigger button, modal, keyboard, focus trap,
   recent searches, empty-state design. Wired into top bar.
3. **Lesson search**: lazy-load index, MiniSearch, render lesson +
   heading results with highlight + progress badges + deep links.
4. **Admin live search**: API route, server query, render in palette.
5. **Quick actions**: registry + role filter + fuzzy match.
6. **QA pass**: keyboard nav across groups, empty states, RTL, focus
   restoration, network failure, missing index, large query, special
   characters, role gating.

## Out of scope (v1)

- AI/semantic search fallback (deferred per alignment).
- Cross-language fallback ("HE query returns EN if no HE hit").
- Indexing dataset values, component prop strings, or assignment
  files (only MDX prose is indexed).
- Real-time index refresh on publish — index regenerates on next
  build, like every other static asset.
- Server-side rendering of the palette (it's authenticated UI; client
  is fine).

## Approval

Approved 2026-05-11 by user (all four innovation knobs + full prose
index + ⌘K palette + fuzzy/prefix/weighted).
