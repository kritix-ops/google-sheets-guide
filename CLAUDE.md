@AGENTS.md

# Pedagogy bar: novice to pro

This is a novice-to-pro course for working professionals. The learner will eventually handle complex spreadsheets at work: many sheets, hundreds of formulas, large datasets, intricate cross-references, real consequences when something breaks. Every lesson must meet that bar.

**Foundational rules for every lesson, body and assignment:**

1. **Examples must resemble real workbooks.** A 5×2 toy is fine for the first interactive demo of a concept. The second use of that concept should look like something a pro actually opens at work: a roster, a sales record, an order log, a customer table, an error report. Vary the data shape across lessons so the learner sees range.
2. **Show the gotchas pros hit.** Lookup tables that walk off the bottom when filled. Volatile functions (`TODAY`, `NOW`, `OFFSET`, `INDIRECT`, `RAND`) slowing recalc on big sheets. `INDIRECT` breaking when rows are inserted. `ARRAYFORMULA` exploding when new rows arrive. Cross-sheet references silently breaking on rename. Name them in the lesson body, not as a footnote.
3. **Connect each function to 2-3 concrete real-world use cases.** Don't just teach the syntax; show *when this function is the right tool* and *when it isn't*. The "Used in the wild" section should answer the question "why would I reach for this?"
4. **Assignments must be demanding.** Multi-step tasks that resemble real work, not single-formula syntax recall. Combine the lesson's function with concepts from earlier lessons. Force the learner to think about which formula to reach for, not just how to type it.
5. **End each lesson with a "Pro pitfalls" or "Used in the wild" beat** that ties what was taught back to complex-spreadsheet reality. One short paragraph or a small table of "looks innocent, costs you a day."

If a lesson reads like it would teach a 12-year-old to use a calculator, it's not at the bar. Rewrite it.

## Elevated bar (locked 2026-05-11)

The five rules above are the floor. The bar that follows is the actual ceiling we're holding the curriculum to: extremely thorough, extremely interactive, extremely easy to grok, while still going extremely deep. The tension is the point. Layer it. A first-timer should feel onboarded by the first scroll, a working pro should still learn something new by the last paragraph.

6. **Every Sheets function gets a canonical introduction before its first use, full stop.** Use the `<FunctionRef name="X" />` MDX component. The component reads `content/functions/registry.ts` and renders: a one-sentence plain-language summary, the exact official syntax, a full parameter table with name + type + required-or-default + meaning + accepted enumerated values, the return value, and a link to Google's docs. If the function is missing from the registry, add it there (verified against the official Google docs page). Lessons never re-type a function spec inline; they reference the registry. Prose around the `<FunctionRef>` block adds the lesson's specific angle (when to reach for it, why this dataset, how it plugs into the team's workflow).
7. **Layered teaching: zero-to-hero in every lesson.** Open with one paragraph that frames the concept for someone who has never seen it. Build to a working-pro angle by the end. The early paragraphs assume nothing; the later ones reference earlier lessons by number and tie into adtech workflow patterns.
8. **At least three worked examples per function, in escalating complexity.** Example 1: a tiny self-contained illustration on toy data, so the syntax sinks in. Example 2: the same function on the real adtech dataset (`CAMPAIGNS`, `CAMPAIGNS_LARGE`, `VERTICALS_LOOKUP`, etc.). Example 3: the function combined with at least one concept from a prior lesson, so the learner sees how it composes in real workbooks. Each example is interactive when the engine supports it; otherwise it's a worked trace in prose.
9. **Step-by-step formula traces.** When a formula has more than one step (nested calls, multi-clause `QUERY`, `ARRAYFORMULA` over computed columns), walk through how Sheets evaluates it. Use the `<StepThrough>` component when the trace has 4+ steps, plain prose for shorter ones. Show what each intermediate value is, where the engine substitutes ranges with values, and which step the gotcha lives at.
10. **Interactive density: at least one interactive component per major heading.** Major heading = an `##` section that introduces a concept. The component is one of: `<TryIt>` (graded, the most powerful), `<RefDemo>` (live formula recalculation as the learner edits), `<MiniGrid>` (highlight cells while reading), `<StepThrough>` (scrub through formula evaluation), `<QuickCheck>` (multiple choice, validates understanding), `<Compare>` (side-by-side wrong-vs-right). Static prose without any interactive component below an `##` heading is a smell: either there's no concept being taught, or the lesson is being lazy.
11. **Common-mistakes callout per function.** A short "Easy traps" subsection or a `<Compare>` block showing the broken version next to the working version, with one-sentence explanations of why each broken version is wrong. At least two traps per function the lesson introduces. These are the moments where pros lose half a day; surface them.
12. **Visual reinforcement.** When teaching cell-reference behavior, show the actual cells via `<MiniGrid>` with the relevant cells highlighted. When teaching array spilling, show the source range AND the spilled output side by side. When teaching lookups, color-code the search column and the result column. Words alone do not suffice for spatial concepts; spreadsheets are spatial.
13. **Cross-references are explicit.** When a lesson uses a concept introduced earlier, say "covered in lesson 1.4" or "see Track 3 lesson 2." When a lesson teases a concept covered later, link forward the same way. The learner should never feel lost about whether they're missing something.
14. **UI/UX rules.** Sections short enough to read in one breath (4-6 sentences max per paragraph). Tables for any list of >3 parallel items (params, modes, errors). Code in monospace inline (`` ` `` around inline code) and as fenced blocks for multi-line. The Hebrew version preserves the same MDX structure as the English version (same component count, same heading hierarchy, same example order) so the bilingual side-by-side editor stays parallel.
15. **A learner who finishes a lesson can answer four questions without checking the docs:** What does this function do in plain language? What are its parameters and what do they accept? What are its two most common real-world uses? What are its two most common ways to break? If the lesson doesn't equip them to answer all four, the lesson isn't done.

### Standard lesson section structure

Every `##` section that teaches a new function should follow this template. The order isn't dogmatic but the *presence* of each element is.

1. **Two-paragraph framing.** What is this function for? When would I reach for it? Plain language; no syntax yet.
2. **`<FunctionRef name="X" />`** for the canonical card.
3. **Worked example 1 (toy data).** A `<RefDemo>` or `<TryIt>` on a 4-8 row toy table. Smallest possible illustration of the syntax.
4. **Worked example 2 (real adtech data).** Same function on `CAMPAIGNS` (or the relevant dataset). Lesson connects the syntax to the team's actual workflow.
5. **Optional `<StepThrough>` trace** when the evaluation has 4+ steps.
6. **Combined example.** Function composed with at least one prior-lesson concept. `<TryIt>` with a multi-step task.
7. **Easy traps.** `<Compare>` or a short bulleted list. At least two traps with their fixes.
8. **`<QuickCheck>` validation.** One multiple-choice question that tests the trickiest concept from the section.

The "Used in the wild" beat at the end of the lesson then ties all the section's functions together into a real adtech workflow pattern.

# Domain context: who the learner is

The learner is a working professional in **adtech / performance marketing**, specifically in a team that runs search and native ads on platforms like:

- **Native:** Taboola, Outbrain, Mediago, Poppin
- **Social:** Facebook, TikTok
- **Search:** Google

Day-to-day work involves spreadsheets full of campaign data: profit, revenue, spend, ROI, CPC, EPC. Each campaign row carries the **media buyer** (the person who launched it) and the **vertical** (the topical category of the ad — e.g., "Used Cars PR", "Car Deals PR", "Prefabricated Homes PR", "Lingerie PR", "Mortgage Refinance PR"). **Vertical names always end with " PR"** by team convention.

Their workflow involves many sheets pulling from each other:

- One sheet with the canonical list of vertical names
- Per-platform sheets pulling raw data from each ad network
- Aggregator sheets joining everything together via `IMPORTRANGE`
- Dashboards built on top of the aggregators

**`IMPORTRANGE` is the single biggest source of broken formulas in this team's work.** Permission revocations, source workbook renames, range expansions that drift, refresh-rate quirks, and #REF! cascades when one upstream sheet breaks — they hit all of it constantly.

**Implications for lesson examples:**

- **Default to adtech datasets where it fits.** Use realistic columns (Date, Buyer, Vertical, Platform, Spend, Revenue, Profit, ROI, CPC, EPC) and realistic vertical names ending in PR. Use realistic platform names from the list above.
- **Weave `IMPORTRANGE` awareness into early lessons,** even before the dedicated `IMPORTRANGE` lesson in Track 1 lesson 27 and Track 4 lessons 3/8. When teaching lookups (lesson 4), name the case where the lookup table lives in another workbook via `IMPORTRANGE` and what breaks. When teaching dates (lesson 8), mention that imported dates sometimes arrive as text strings. The learner should leave each lesson knowing how the concept survives in a multi-sheet, IMPORTRANGE-laden workbook.
- **Reusable adtech datasets live in `content/datasets/`** so lessons can share data and the learner sees consistency across lessons.

# Curriculum source material

Reference material for authoring and revising lessons. The list is curated, not exhaustive: official authoritative pages first, then the small set of community resources that consistently surface real-world techniques. Verified live as of 2026-05-10. If a URL stops working, fall back to a search rather than guessing a replacement.

## Official Google: where the truth lives

- **Sheets function list** (every function, organized by category) — https://support.google.com/docs/table/25273?hl=en
- **Add formulas & functions** (formula model, references, errors) — https://support.google.com/docs/answer/46977?hl=en
- **Sheets Editors Help (root)** — https://support.google.com/docs
- **Google Sheets training and help** (Workspace Learning Center index) — https://support.google.com/a/users/answer/9282959?hl=en
- **Cheat sheet** (printable visual quick reference) — https://support.google.com/a/users/answer/9300022?hl=en
- **All Workspace cheat sheets index** — https://support.google.com/a/users/answer/13967034?hl=en

## Function deep references

- **LAMBDA** — https://support.google.com/docs/answer/12508718?hl=en
- **MAP** — https://support.google.com/docs/answer/12568985?hl=en
- **REDUCE** — https://support.google.com/docs/answer/12568597?hl=en
- **SCAN** — https://support.google.com/docs/answer/12569094?hl=en
- **BYROW** — https://support.google.com/docs/answer/12570930?hl=en
- **BYCOL** — https://support.google.com/docs/answer/12571032?hl=en
- **MAKEARRAY** — https://support.google.com/docs/answer/12569202?hl=en
- **LET** — https://support.google.com/docs/answer/13190740?hl=en
- **QUERY** — https://support.google.com/docs/answer/3093343?hl=en
- **Google Visualization API Query Language** (the dialect QUERY uses; SQL-like, with quirks) — https://developers.google.com/chart/interactive/docs/querylanguage
- **REGEXMATCH** — https://support.google.com/docs/answer/3098292?hl=en
- **REGEXEXTRACT** — https://support.google.com/docs/answer/3098244?hl=en
- **REGEXREPLACE** — https://support.google.com/docs/answer/3098245?hl=en
- **RE2 syntax reference** (the regex engine Google uses; no lookarounds, no backrefs) — https://github.com/google/re2/wiki/Syntax
- **IMPORT functions overview** — https://support.google.com/docs/answer/12188454?hl=en
- **IMPORTRANGE** — https://support.google.com/docs/answer/3093340?hl=en
- **IMPORTHTML** — https://support.google.com/docs/answer/3093339?hl=en
- **IMPORTDATA** — https://support.google.com/docs/answer/3093335?hl=en
- **IMPORTXML** — https://support.google.com/docs/answer/3093342?hl=en
- **Named functions** (user-defined reusable formulas) — https://support.google.com/docs/answer/12504534?hl=en
- **Pivot tables (customize)** — https://support.google.com/docs/answer/7572895?hl=en
- **Conditional formatting rules** — https://support.google.com/docs/answer/78413?hl=en

## Apps Script

- **Spreadsheet service overview** — https://developers.google.com/apps-script/reference/spreadsheet/
- **Class SpreadsheetApp** — https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
- **Extend Sheets with Apps Script** (custom functions, sidebars, dialogs) — https://developers.google.com/apps-script/guides/sheets
- **Simple triggers** (`onOpen`, `onEdit`, `onSelectionChange`) — https://developers.google.com/apps-script/guides/triggers
- **Installable triggers** (time-driven, edit-driven with auth) — https://developers.google.com/apps-script/guides/triggers/installable
- **Apps Script release notes** (changelog) — https://developers.google.com/apps-script/release-notes
- **Connected Sheets via Apps Script** — https://developers.google.com/apps-script/guides/sheets/connected-sheets

## Connected Sheets + BigQuery

- **Get started with BigQuery in Sheets** — https://support.google.com/docs/answer/9702507?hl=en
- **Analyze & refresh BigQuery data via Connected Sheets** — https://support.google.com/docs/answer/9703214?hl=en
- **Connected Sheets developer guide** — https://developers.google.com/workspace/sheets/api/guides/connected-sheets
- **Connected Sheets in BigQuery docs** — https://docs.cloud.google.com/bigquery/docs/connected-sheets
- **Forecasting with BigQuery ML + TimesFM** (no SQL required, 2026 feature) — https://workspaceupdates.googleblog.com/2026/02/forecast-data-in-connected-sheets-BigQueryML-TimesFM.html

## Gemini / AI features in Sheets (2025–2026)

- **Gemini in Google Sheets** (product overview, current capabilities) — https://workspace.google.com/resources/spreadsheet-ai/
- **Build and edit complex spreadsheets with Gemini** (April 2026 launch) — https://workspaceupdates.googleblog.com/2026/04/build-and-edit-complex-spreadsheets-with-Gemini-in-Google-Sheets.html
- **Fill with Gemini** (AI-assisted data entry, 9× faster on 100-cell tasks) — https://workspaceupdates.googleblog.com/2026/04/effortlessly-automate-data-entry-in-Google-Sheets-using-Fill-with-Gemini.html
- **Collaborate with Gemini in Sheets** (Workspace Experiments) — https://support.google.com/docs/answer/14218565?hl=en
- **State-of-the-art Sheets benchmark post** (70.48% on SpreadsheetBench) — https://blog.google/products-and-platforms/products/workspace/gemini-google-sheets-state-of-the-art/
- **Workspace updates: Gemini Docs/Sheets/Slides/Drive (March 2026)** — https://blog.google/products-and-platforms/products/workspace/gemini-workspace-updates-march-2026/

## Best community resources

- **Ben Collins blog** (deep, careful, frequently updated) — https://www.benlcollins.com/blog/
- **The Collins School of Data** (paid courses; "Modern Google Sheets" launched Q4 2025) — https://courses.benlcollins.com/
- **Ben Collins YouTube** — https://www.youtube.com/@benlcollins
- **Ben Collins QUERY deep dive** (the best single piece on QUERY anywhere) — https://www.benlcollins.com/spreadsheets/google-sheets-query-sql/
- **Ben Collins REGEX guide** — https://www.benlcollins.com/spreadsheets/google-sheets-regex-formulas/
- **Spreadsheet Class — full Google Sheets cheat sheet** — https://www.spreadsheetclass.com/complete-google-sheets-cheat-sheet/
- **Top 15 Google Sheets blogs (Feedspot, 2026)** (use as a discovery index) — https://bloggers.feedspot.com/google_sheets_blogs/
- **Google Sheets Editors Community** (official Q&A) — https://support.google.com/docs/community
- **Stack Overflow `google-sheets` tag** — https://stackoverflow.com/questions/tagged/google-sheets
- **r/googlesheets** (active, helpful community) — https://www.reddit.com/r/googlesheets/

## Courses & longer-form training

- **Google Skills: Sheets course template** — https://www.skills.google/course_templates/196
- **Coursera: Google Sheets** (free audit) — https://www.coursera.org/learn/google-sheets
- **Spreadsheets for Beginners using Google Sheets (Coursera, 2-hour project)** — https://www.coursera.org/projects/spreadsheets-beginner-google-sheets
- **Class Central — Google Sheets index (500+ courses)** — https://www.classcentral.com/subject/google-sheets
- **Google Sheets Full Course (4+ hours, YouTube)** — https://www.youtube.com/watch?v=sjbnrQgorm8

## How to use this list when authoring

1. **Start from the official function page** for any formula the lesson teaches. Copy the canonical syntax exactly.
2. **Cross-check Ben Collins** for the function's real-world quirks. He documents the failure modes Google's docs paper over.
3. **Check the Workspace Updates blog** for any 2025–2026 change that affects what we're teaching (Gemini in particular invalidates a lot of pre-2025 content).
4. **For Apps Script lessons**, the developer reference is authoritative. The Apps Script community guides on Medium are sometimes outdated.
5. **For curriculum gaps**, see `_plans/2026-05-09-sheets-tutor.md` (the curriculum-audit addendum).
