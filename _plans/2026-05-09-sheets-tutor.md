# Sheets Guide — Project Plan

**Date:** 2026-05-09 (curriculum expanded 2026-05-10)
**Owner:** Yoav (info@flexelent.com)
**Status:** Approved, ready to build v1. Curriculum locked at 80 lessons across 5 tracks.

---

## Goal

Build a robust, friendly local web app that teaches the user (a working professional) Google Sheets from novice level to expert ("monster pro"), with focus on real-world job tasks at scale and the ability to debug broken sheets. The app delivers assignments, the user does the work in real Google Sheets, and the app reads the result back and grades it with a mix of deterministic checks and AI-judged feedback.

Success looks like: the user can open the app, work through a curriculum, get instant high-quality feedback on their actual sheet work, and at the end has the fluency to handle large-scale, real-world Sheets tasks confidently.

---

## Constraints

- **Audience:** the user only, for now ("me first, others later"). No multi-user infrastructure required for v1.
- **Surface:** real Google Sheets only. No in-browser sandbox.
- **Cost ceiling:** local hosting ($0). API costs single-digit dollars per month based on the pricing math below.
- **Stack:** Next.js + TypeScript + Tailwind. Local-first.
- **No code until plan is approved** (CLAUDE.md rule 3). Plan is approved as of 2026-05-09.
- **Designs must not look AI-generated** (CLAUDE.md rule 5). Design system saved at `design-system/sheets-guide/MASTER.md` rejects glassmorphism, generic gradients, and stock SaaS palettes.

---

## Requirements

### Functional

1. **Curriculum:** structured progression covering five areas:
   - Formulas: basics through ARRAYFORMULA / QUERY / FILTER / LAMBDA / REGEX, plus Tables and named functions
   - Data modeling: pivot tables, charts (3 lessons), validation, conditional formatting, named ranges, filter views, smart chips, sharing, form pipelines
   - Apps Script: custom functions, macros, triggers, sidebars, web apps, external APIs, libraries
   - Scale, performance, debugging: million-row sheets, IMPORTRANGE, BigQuery, TimesFM forecasting, diagnosing #REF / #N/A / circular refs / slow recalculation
   - AI in Sheets: Gemini-in-Sheets, `=AI()`, Fill with Gemini, build/edit with Gemini, calibrated trust
2. **Assignment delivery:** for each lesson, the app provisions a fresh Google Sheet (copy of a master template) into the user's Drive and opens it in a new tab.
3. **Grading loop:** user clicks "Grade my work" in the app. App reads the sheet via Sheets API, runs grading, returns feedback inline.
4. **Two-layer grading:**
   - **Deterministic rules:** expected formula in cell B5, expected named range, expected pivot table structure, etc. Per-assignment authored.
   - **AI judgement (Claude):** open-ended cases like Apps Script reviews, "explain your data model," "why is this sheet slow." Used selectively to control cost.
5. **Progress tracking:** local SQLite stores which lessons are done, scores, attempts, and graded feedback history.
6. **Theme toggle:** dark-first, full light mode, persists locally.
7. **Reminder hook:** at appropriate moments, prompt the user about migrating to Option B (Apps Script sidebar). Saved as a project memory.

### Non-functional

- **Local-only.** Runs as `next dev` on `localhost:3000`. No deployment infrastructure.
- **Auth:** Google OAuth, scopes for Sheets + Drive + Apps Script (the last for future migration to Option B).
- **Quotas:** Sheets API quotas are non-issues for one user.
- **Privacy:** OAuth tokens never leave the local machine. No telemetry. SQLite database stays local.
- **Accessibility:** WCAG AA contrast, full keyboard navigation, `prefers-reduced-motion` respected.

---

## Chosen Approach

**Architecture: Option C — Local-only Next.js app with read-on-demand grading.**

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (localhost:3000)                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js App (UI)                                   │   │
│  │  - Curriculum tree                                  │   │
│  │  - Lesson body                                      │   │
│  │  - Assignment description                           │   │
│  │  - Grade my work button → API route                 │   │
│  │  - Feedback panel                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js API Routes (server)                        │   │
│  │  - /api/auth/*        Google OAuth                  │   │
│  │  - /api/assignments/[id]/start  copies template    │   │
│  │  - /api/assignments/[id]/grade  reads + grades     │   │
│  │  - /api/lessons/*     curriculum CRUD              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Grading Module (standalone, framework-free)        │   │
│  │  - rules.ts        deterministic checks            │   │
│  │  - judge.ts        Claude-judged checks            │   │
│  │  - normalize.ts    sheet → comparable form         │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────┬──────────────────┬─────────────────┐  │
│  │  Sheets API     │  Drive API       │  Anthropic API  │  │
│  │  (read user's   │  (copy template, │  (Claude        │  │
│  │   sheet state)  │   move to folder)│   grading)      │  │
│  └─────────────────┴──────────────────┴─────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Local SQLite                                        │   │
│  │  - users, lessons, assignments, attempts, grades     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Why this shape:**

- **Grading module is standalone.** It takes a sheet snapshot + assignment spec and returns a grade + feedback. No Next.js coupling. When we migrate to Option B (Apps Script sidebar), the same module is called from the Apps Script bridge with no rework.
- **Curriculum, lessons, and assignments are JSON/MD files in the repo.** Easy to author, easy to diff, no admin UI needed for v1.
- **SQLite over Postgres** because we're local-only and SQLite is zero-config, persistent, and fast enough.
- **No hosted infrastructure** because the user only needs it on one machine.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router) + TypeScript + React Compiler | Best content-heavy + interactive React stack; Server Components reduce client bundle. Plan originally listed v15; bumped to v16 at Phase 0 install (current latest stable). |
| Styling | Tailwind v4 + design tokens (`design-system/sheets-guide/MASTER.md`) | Token-driven, matches the locked design system |
| UI primitives | shadcn/ui (selectively) | Accessible defaults, easy to tweak; compose on top of design tokens |
| Auth | NextAuth (Auth.js v5) with Google provider | Standard, well-documented |
| Google APIs | `googleapis` npm package | Official, supports Sheets + Drive + Apps Script |
| AI | `@anthropic-ai/sdk` with prompt caching | Per CLAUDE.md guidance; caching cuts grading cost ~40% |
| Database | SQLite via Drizzle + better-sqlite3 | Local, zero-config, typed. Drizzle chosen at Phase 0: SQL-shaped query API, no codegen step, lighter than Prisma. |
| Icons | Lucide React | Consistent stroke weight, full coverage |
| Testing | Vitest for grading module unit tests, Playwright for one happy-path E2E | Verify grading logic doesn't regress |

Versions locked at install time. **Per CLAUDE.md rule 9, Context7 must be consulted before writing code against any of these libraries.**

---

## Cost Picture

Verified live from `platform.claude.com/docs/en/docs/about-claude/pricing` on 2026-05-09.

| Model | Input ($/M) | Output ($/M) | Cache read ($/M) | Cache write 5m ($/M) |
|-------|-------------|--------------|------------------|----------------------|
| Claude Opus 4.7 | $5.00 | $25.00 | $0.50 | $6.25 |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $0.30 | $3.75 |
| Claude Haiku 4.5 | $1.00 | $5.00 | $0.10 | $1.25 |

**Default model: Claude Sonnet 4.6.** Strong reasoning at a third of Opus's price. Reserve Opus 4.7 for occasional Apps Script reviews and the hardest debugging lessons. Haiku 4.5 for simple deterministic-leaning checks where the model is mostly confirming.

**Per-grade-call estimate (typical):**
- System prompt + curriculum context (cached): ~4,000 tokens
- User's sheet snapshot + assignment description: ~1,000 tokens
- Output (feedback): ~600 tokens

| Scenario | Per call | Per 20 calls/day | Per month (30 days) |
|----------|----------|-------------------|---------------------|
| No caching, Sonnet 4.6 | ~$0.024 | ~$0.48 | ~$14 |
| With caching, Sonnet 4.6 | ~$0.013 | ~$0.26 | ~$8 |
| Mix: 18 Sonnet + 2 Opus | ~$0.018 | ~$0.36 | ~$11 |

**Realistic monthly budget: $8–$15** for typical use, capped under $25 even on heavy weeks. Hosting is $0 (local only). Google APIs are free at this volume. **Total ongoing cost: well under $20/month.**

Setup costs: $0 beyond a Google Cloud project (free) and an Anthropic API key (free to create, pay-as-you-go).

---

## Curriculum (canonical outline)

Built using outline-by-hand-then-Claude-drafting then user-polish. The five tracks below total 80 lessons. Each lesson has: a written explanation, one or more challenge sheets, expected outcomes, deterministic grading rules, and notes for the AI judge.

### Track 1: Formulas (28 lessons)
1. The grid model: cells, ranges, A1 notation, references, named ranges
2. Coming from Excel: parities and gotchas for working pros (`ARRAYFORMULA` vs spilled arrays, sharing model, `XLOOKUP` parity, no native Power Query)
3. Math, text, date, and logical functions
4. Lookups: VLOOKUP, HLOOKUP, INDEX/MATCH, XLOOKUP — when each one wins
5. Conditional logic: IF, IFS, SWITCH, AND/OR
6. Aggregation: SUM, AVERAGE, COUNT, COUNTIF, SUMIF, SUMIFS
7. Text manipulation: LEFT, RIGHT, MID, FIND, SUBSTITUTE
8. Dates and time: TODAY, NOW, EOMONTH, NETWORKDAYS, date math
9. Error handling: IFERROR, IFNA, ISNA, ISERROR, controlled fallbacks
10. Array formulas: ARRAYFORMULA basics
11. SEQUENCE, RANDARRAY, and dynamic array generators
12. The QUERY function: SQL-in-Sheets fundamentals
13. QUERY in depth: pivot, group by, label, format, the `Col1` quirk
14. FILTER, SORT, UNIQUE
15. SPLIT, JOIN, TEXTJOIN, FLATTEN
16. REGEX functions in depth (REGEXMATCH, REGEXEXTRACT, REGEXREPLACE; RE2 syntax, no lookarounds)
17. Tables (structured ranges, auto-expanding columns, structured references) — the 2024 feature
18. LAMBDA fundamentals
19. MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY — composing functions
20. LET for readability and reuse within a single formula
21. Named functions (custom reusable formulas at workbook scope; sharing strategy)
22. Advanced lookups: dynamic ranges, two-way lookups, `XLOOKUP` with arrays
23. Statistical functions: PERCENTILE, RANK, STDEV, correlation
24. Financial functions: PV, FV, IRR, NPV, PMT
25. Cross-sheet references and INDIRECT (with the volatility warning)
26. SPARKLINE for inline visualizations
27. IMPORT family overview: IMPORTRANGE, IMPORTHTML, IMPORTDATA, IMPORTXML
28. Formula performance: when to refactor, when to switch to QUERY, when to switch to Apps Script

### Track 2: Data modeling and visualization (18 lessons)
1. Structuring a workbook for clarity (single source of truth, raw vs. derived sheets)
2. Pivot tables: rows, columns, values, calculated fields
3. Pivot tables in depth: filtering, slicers, custom date groupings
4. Data validation: lists, conditions, custom formulas
5. Drop-downs and smart chips: people, file, finance, date, place chips
6. Conditional formatting: rule-based and formula-based
7. Protected ranges and sheet-level protection
8. Filter views: per-user filters that don't disturb collaborators
9. Charts: choosing the right chart type (decision tree)
10. Charts: customizing axes, labels, secondary series, sparklines
11. Charts for reports: formatting for export, embedding in Docs/Slides, refresh behavior
12. Sharing and permissions: viewer, commenter, editor, link sharing, expirations, transfer of ownership
13. Forms → Sheets pipeline: linked Forms, response rows, common cleanup patterns
14. Data cleanup recipes: trimming, casing, deduping, splitting columns
15. Notation and number formatting: custom formats, locale gotchas
16. Sheet linking: cross-tab navigation, hyperlinks, `HYPERLINK()`
17. Comments, suggestions, and review workflows
18. Workbook performance hygiene: range scope, full-column refs, dependency graph awareness

### Track 3: Apps Script and automation (17 lessons)
1. The Apps Script editor and project structure
2. The execution model: V8, services, quotas, scopes
3. Custom functions: writing, naming, autocomplete metadata
4. Reading and writing the spreadsheet via SpreadsheetApp
5. Macros and recording (and why recorded macros are usually the wrong starting point)
6. Simple triggers: `onOpen`, `onEdit`, `onSelectionChange`
7. Installable triggers: time-driven, edit-driven, with auth context — and the trigger-auth mismatch problem
8. Sidebars and dialogs (HTML service)
9. Sending email from Sheets (MailApp vs GmailApp)
10. Workspace integrations: Drive, Calendar, Gmail
11. External APIs from Apps Script: UrlFetchApp, OAuth, calling Slack/Linear/GitHub
12. Apps Script libraries and deployments: head vs versioned, sharing across projects
13. Web apps from Apps Script: doGet/doPost, deployment URLs
14. Logging, error handling, and the Stackdriver/Cloud Logging story
15. Working with the Properties Service and CacheService
16. Quotas and best practices (batch reads, `getValues` over per-cell loops)
17. Apps Script + the Sheets advanced service: when the basic service isn't enough

### Track 4: Scale, performance, and debugging (11 lessons)
1. The 10M cell limit and what hits it
2. Why your sheet is slow: volatile functions, full-column refs, recalc cascades
3. IMPORTRANGE patterns and pitfalls (auth, refresh cadence, fan-out)
4. Connected Sheets and BigQuery: setup, extraction, refresh
5. Forecasting in Connected Sheets with BigQuery ML + TimesFM (the 2026 feature, no SQL required)
6. Diagnosing #REF! and #N/A
7. Diagnosing circular references
8. Diagnosing broken IMPORTRANGE
9. Diagnosing slow Apps Script (execution profiles, batch ops)
10. Recovering from breakage: version history, named-version strategy
11. A "broken sheet clinic": user is given a sabotaged real sheet and must fix it

### Track 5: AI in Sheets (6 lessons)
1. How Gemini sees a spreadsheet: what it has access to, how to read its proposals before applying, the cost question
2. The `=AI()` function: syntax, prompting patterns, deterministic vs. creative outputs, when it's reproducible and when it isn't
3. Fill with Gemini: AI-assisted data entry, when it beats `Smart Fill`, when `Smart Fill` is enough
4. Building and editing sheets with Gemini: natural-language prompts for multi-step construction; verifying results; the things Gemini gets confidently wrong
5. AI-assisted analysis: "explain this data", "find the outliers", "draft a chart for this trend"; pairing AI with domain knowledge
6. When NOT to use AI in Sheets: audit-trail-sensitive calculations, anything that needs to be reproducible across runs, PII data with policy implications. Calibrated trust, not blanket avoidance.

### Curriculum totals

| Track | Lessons |
|---|---|
| Track 1 (Formulas) | 28 |
| Track 2 (Data modeling) | 18 |
| Track 3 (Apps Script) | 17 |
| Track 4 (Scale & debugging) | 11 |
| Track 5 (AI in Sheets) | 6 |
| **Total** | **80** |

---

## Alternatives Rejected

### Option A — Hosted web app, read-on-demand (no sidebar)
**Rejected because:** the user only needs it on one machine for now. Hosting adds Vercel setup, a domain, OAuth callback URLs, secrets management, and a future-someone-could-use-it surface that we don't want yet. If the user changes their mind, migration is straightforward.

### Option B — Web app + Apps Script sidebar
**Deferred, not rejected.** This is the eventual target. Skipped now because v1 needs to prove curriculum quality and grading logic first; layering on a second surface (the in-sheet sidebar) adds Apps Script quota management, two-UI sync, and on-edit trigger complexity. Saved to project memory: prompt user when the moment is right (Apps Script lessons, friction with the alt-tab loop, after v1 stable).

### In-browser spreadsheet sandbox (Univer / Handsontable / Luckysheet)
**Rejected because:** half the curriculum (Apps Script, IMPORTRANGE, BigQuery, real-world bug diagnosis) only exists in real Google Sheets. A sandbox can't fake it. The user explicitly chose real Sheets.

### AI tutor that watches your sheet in real time
**Rejected for v1.** Costs more, requires more infrastructure (push triggers or aggressive polling), and is mostly the same value as on-demand grading. Could be revisited with Option B's on-edit triggers.

### GPT or open-source models for grading
**Rejected because:** CLAUDE.md guidance prefers Claude. Sonnet 4.6 is competitive on cost and excellent on reasoning for this kind of work. Reconsider if grading quality disappoints.

### Authoring all curriculum content by hand
**Rejected because:** would block the build for weeks. Outline-by-hand-then-Claude-drafting then user-polish is a valid quality bar and ships in a fraction of the time. We can rewrite weak lessons later.

---

## Build Phases

### Phase 0 — Setup (1–2 sessions)
- Initialize Next.js + TypeScript + Tailwind project at `C:\Projects\Google Sheets Guide`
- Wire Tailwind to the design tokens defined in `design-system/sheets-guide/MASTER.md`
- Set up Google Cloud project, enable Sheets/Drive/Apps Script APIs, create OAuth client
- Set up Anthropic API key
- Create SQLite schema (Prisma or Drizzle)
- Verify Google OAuth round-trip works

### Phase 1 — Grading module (2–3 sessions)
- Build the standalone grading module with deterministic rules + Claude judge
- Unit tests for both layers
- Test fixtures: sample sheet snapshots and expected outcomes
- Prompt caching wired up correctly so cached system prompt is used on every grading call

### Phase 2 — Assignment loop (2 sessions)
- Drive API: copy template sheet into user's Drive
- Sheets API: read sheet state for grading
- API routes: `/api/assignments/[id]/start`, `/api/assignments/[id]/grade`
- One end-to-end Playwright test on the happy path

### Phase 3 — UI shell (2–3 sessions)
- App shell layout (sidebar + main + optional right rail)
- Theme toggle (dark default, light option)
- Lesson list, lesson view, assignment view, feedback view
- Loading and error states per the design system checklist

### Phase 4 — Curriculum v1 (ongoing)
- Author all 80 lessons across the five tracks
- Track 1 lessons 1–10 (foundations) by hand for quality benchmark
- Use Claude to draft the rest, polish manually
- Build deterministic grading rules per lesson as we author
- Recommended authoring order: Track 1 → Track 2 → Track 3 → Track 4 → Track 5. Track 5 last because Gemini features are still moving fast and the curriculum benefits from waiting until late spring/summer 2026 sources stabilize.

### Phase 5 — Polish + QA pass (1 session)
- Run the extreme QA pass per CLAUDE.md rule 6: golden path, edge cases, error paths, every UI flow
- Verify pre-delivery checklist in design system

### Phase 6 — Use it. Iterate.
- The user actually does the curriculum
- Track which lessons feel weak; rewrite them
- Watch for moments to prompt the Option B migration

---

## Open Questions for v1 Scope

These are deliberately deferred. We can answer them when relevant.

1. **How "AI tutor"-shaped should the feedback be?** Pure correction, or conversational ("ask follow-up questions about the lesson")? Plan A: start with pure correction; add conversational follow-up if the user wants it.
2. **Should grading rules be authored as TypeScript files per lesson, or as a JSON DSL?** TypeScript wins for early iteration speed; revisit if curriculum grows past ~50 lessons and authoring rules becomes the bottleneck.
3. **Apps Script lesson grading:** how do we read the user's Apps Script project? The Apps Script API exists and supports it, but adds another OAuth scope. Defer until we reach Track 3 lessons.
4. **Curriculum versioning:** when we revise a lesson, do we invalidate the user's prior attempt? Probably yes, but stash the old grade.
5. **Spaced repetition:** worth adding for formula recall? Maybe, for Track 1. Decide after the curriculum is built.

---

## Files Referenced

- `design-system/sheets-guide/MASTER.md` — locked design system
- `design-system/sheets-guide/pages/` — per-page overrides (created on demand)
- `_plans/2026-05-09-sheets-tutor.md` — this plan
- `CLAUDE.md` — curated source material (official docs, function refs, Apps Script, Gemini, community)
- Memory: `C:\Users\Yoav\.claude\projects\C--Projects-Google-Sheets-Guide\memory\project_architecture_path.md`

---

## Lesson format

**The pedagogy bar:** the system must be a fundamentally different way to learn Sheets than reading Google's docs. Otherwise the user goes to the docs. Every lesson is built around interaction (animations, click-throughs, real formula evaluation, quick checks) with prose as connective tissue between interactive blocks, never as the main event.

**Novice-to-pro standard (locked 2026-05-10):** Every lesson must teach to a working professional who will eventually handle complex spreadsheets at work — many sheets, hundreds of formulas, large datasets, intricate cross-references. Examples should resemble real workbooks (not 5×2 toys), demonstrate the gotchas pros hit (volatile functions, lookup walk-offs, INDIRECT breakage on row insertion, ARRAYFORMULA explosion), and connect each function to 2-3 concrete real-world use cases. Assignments must be demanding enough to build genuine fluency, not just syntax recall. Every lesson ends with a "Pro pitfalls" or "Used in the wild" beat. See `CLAUDE.md` for the full rule set.

**Authoring format:** each lesson is a `lesson.mdx` file (Markdown + React components). Prose is short. Interactive components carry the load.

**Block vocabulary** (the only components a lesson body uses):

| Component | Purpose |
|---|---|
| `<Prose>` | Short text block. Hard cap: 4 sentences. Forces lessons to break up. |
| `<MiniGrid>` | Renders a small spreadsheet grid (HTML/CSS) backed by a `HyperFormula` engine. Cells, formulas, named ranges all live. Optional cell highlighting + arrow overlays. |
| `<RefDemo>` | Animated copy-paste demo: shows how a relative/absolute/mixed reference resolves when copied across cells. Built on `<MiniGrid>` + Motion. |
| `<StepThrough>` | "Next" button advances through frames of a process. Each frame is a mini-grid + caption. |
| `<Compare>` | Side-by-side panels (Excel vs Sheets, Wrong vs Right, Before vs After). Mostly mini-grids. |
| `<QuickCheck>` | One-question multiple choice with instant feedback + explanation. |
| `<TryIt>` | Editable formula input bound to a live `HyperFormula` engine. User types, result updates instantly. Bounded to the lesson's mini-grid context, not a general spreadsheet. |
| `<Assignment>` | The existing "go to real Google Sheets and grade it" block at the lesson end. Unchanged. |

**Ratio target:** prose < 25%, interactive blocks > 75%, of total visual real estate. Every lesson ends with `<Assignment>` (the real-Sheets exercise).

**Tech stack additions** (verified before install via Context7):
- `hyperformula` for the headless formula engine. Embedded inside `<MiniGrid>` and `<TryIt>`.
- `motion` (formerly `framer-motion`) for cell animations and step transitions.
- `@next/mdx` + `@mdx-js/react` for MDX support inside Next.js 16.

**Authoring contract:** lessons are MDX. The MDX file imports the block components from `@/components/lesson` and composes them. The lesson registry (`lib/content/registry.ts`) loads the MDX module and renders it in the lesson page. `assignment.ts` (deterministic grading rules) stays separate from `lesson.mdx`.

**Lesson 1 will be reworked first** under this model as the quality benchmark before any new lessons are authored.

---

## Decision log

**2026-05-10 — Curriculum expanded from 62 → 80 lessons (full expansion adopted).**
A research pass against current 2026 authoritative sources (saved to `CLAUDE.md`) surfaced material gaps in the original four-track outline. The biggest gap was that AI features released in 2025–2026 (Gemini in Sheets, `=AI()`, Fill with Gemini, build/edit-with-Gemini) and BigQuery TimesFM forecasting were entirely absent. The full expansion adds:

- Track 1 (+3): Coming-from-Excel preface, Tables (the 2024 structured-range feature), Named functions
- Track 2 (+6): Charts split 1→3 lessons, plus filter views, smart chips, sharing/permissions, Forms→Sheets pipeline
- Track 3 (+2): External APIs (`UrlFetchApp`), libraries and deployments. Plus a trigger-authorization-mismatch beat folded into the existing triggers lesson.
- Track 4 (+1): TimesFM forecasting in Connected Sheets
- Track 5 (NEW, +6): AI in Sheets — calibrated-trust track covering Gemini, `=AI()`, Fill with Gemini, build/edit, AI-assisted analysis, and when not to use AI.

The expanded outline is the canonical curriculum. The Curriculum section above reflects this.

### Things explicitly out of scope (for now)

- **Workspace Marketplace add-ons.** Useful in the wild, but every add-on is a moving target. One link in further-reading is enough.
- **Embedded analytics tools** (Looker Studio, Coupler.io, etc.). These belong in a "what's next after Sheets" appendix, not in the core curriculum.
- **Multi-user real-time collaboration internals** (presence, cursor sync). End-user-relevant pieces are covered under sharing/permissions and filter views.
- **Sheets API v4 from outside scripts** (REST clients, Python). Adjacent skill, not a Sheets-fluency skill.
