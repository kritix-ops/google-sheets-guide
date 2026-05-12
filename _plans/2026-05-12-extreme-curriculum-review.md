# Extreme curriculum review — 2026-05-12

**Owner:** Yoav (info@flexelent.com)
**Status:** Findings document. No edits made to lessons. Awaits user direction on fix plan.
**Sources:** Nine parallel audit agents (per-track correctness + pedagogy bar, registry integrity, cross-reference integrity, Hebrew parity, May 2026 currency, academic + competitor benchmarking) plus an LLM Council synthesis pass.

---

## Executive summary

The course is **structurally in better shape than this report's volume suggests**. 80 lessons, 5 tracks, full Hebrew parity, 73-function registry, locked elevated pedagogy bar. The Hebrew side is in cleaner shape than the English side. Nothing is fundamentally broken.

That said, **the course currently teaches a small number of factually wrong things**, and that is the only finding category that matters this week. Wrong claims about XLOOKUP, QUERY, the Apps Script Workspace runtime, and `=AI()` refresh behavior will be spotted by any working pro in five minutes and will burn trust in the rest of the curriculum. Everything else in this report — pedagogy bar refinements, missing functions, May 2026 features, recommended new lessons — is meaningful but not urgent.

**The council pressure-tested the audit and ruled that roughly half the "P0 coverage gaps" are inflated.** A 9-agent audit fleet against a locked bar will always produce 30+ findings; that's a function of how many agents ran, not how broken the course is. The buyer's-job filter — *"does a Taboola/Outbrain/MediaGo media buyer hit this in a real week, and does the lesson save them half a day?"* — is the test that survives. Under that filter, IMPORTRANGE depth, QUERY, ARRAYFORMULA, regex on UTM strings, pivots, conditional formatting, and current Gemini behavior are load-bearing. Monte Carlo, Goal Seek, scorecard charts, and `SHEET()/SHEETS()` are not.

**Three things every advisor missed and every reviewer flagged:**

1. **Bilingual cost.** Every fix doubles. The Hebrew mirror is part of the work, not a postscript. Priority order must weight by HE-mirror cost.
2. **The audit fleet may be miscalibrated.** Nine agents briefed without "the bar excludes academic completeness" produced 30+ findings; brief them better and the next pass produces 10-15 real ones.
3. **Zero data on real-learner behavior.** This entire report optimizes a curriculum nobody has been observed completing. One real adtech buyer walking through Track 1 will overrule almost everything below.

**Top-line recommendation, ordered:**

| Phase | Scope | Bilingual cost | Why now |
|---|---|---|---|
| **1.** Fix P0 factual errors in EN | ~12 items, search-and-replace with citations | EN only this phase; HE mirror queued | Trust hole; everything downstream assumes the course is honest |
| **2.** Mirror P0 fixes to HE | Same 12 items in Hebrew | 2× the EN time | Locked rule 14 (structural parity) |
| **3.** Registry corrections | Add TEXT, fix dead entries, add ~6 missing functions used in lessons | 2× (EN registry strings + HE strings) | Cheap, mechanical, closes rule-6 violations |
| **4.** One observed buyer walkthrough of Track 1 | Real adtech buyer, recorded session | 0× — data gathering | The data point that overrules every recommendation below |
| **5.** Recalibrate audit fleet | Update the agent briefs with the buyer's-job filter | 0× — process work | Next pass produces real findings, not inflated ones |
| **6.** Targeted edits surfaced by walkthrough + recalibrated audit | Whatever survives | 2× | The only edits worth doing |
| **7.** v1.1 work | Capstone, Sheets Canvas lesson, May 2026 currency updates, registry expansion | 2× per lesson | After the foundation is true and observed |

**Cut entirely from the recommendation list:** Monte Carlo lesson, dedicated scorecard-chart lesson, dedicated Goal-Seek lesson (fold into existing modeling lesson if at all), the licensing/standards-body framing, the "30+ findings sweep as marketing" framing. None of these survive the buyer's-job filter.

The rest of this document is the underlying evidence: every finding with file:line citation and a recommended fix. Use it as the source of truth for Phase 1-3, then triage it against the Phase 4 walkthrough.

---

## LLM Council verdict (verbatim)

This came back to challenge the audit findings before they were locked. Five advisors independently, then anonymized peer review, then chairman synthesis. The chairman's full output:

> ### Where the council agrees
>
> 1. **P0 factual errors are real, urgent, and non-negotiable.** XLOOKUP case-sensitivity, QUERY uppercase, 30-min runtime, `=AI()` auto-refresh, broken QuickCheck props — every advisor treated these as the top of the queue. Contrarian called them "five-minute trust killers." First Principles called them "poison." Executor put them in hour one. No debate.
>
> 2. **"30+ findings" is partly inflated.** Three of five advisors flagged that the audit conflates factual lies with curricular taste. Nine agents will always find thirty things. The P0 label was applied too generously.
>
> 3. **The buyer's-job filter is the right test, not academic completeness.** Four of five rejected "business school teaches it" as the bar. Under the right filter, IMPORTRANGE depth, QUERY, regex on UTM strings, pivots, and current Gemini are load-bearing. Monte Carlo, scorecard chart, and SHEET()/SHEETS() are not.
>
> 4. **Goal Seek is at most one worked example inside a modeling lesson, not its own slot.**
>
> 5. **Monte Carlo cuts.** Unanimous.
>
> 6. **The capstone gap is real but defer it.**
>
> ### Where the council clashes
>
> **Is this defensive cleanup or a launch moment?** The Expansionist wanted to reframe findings as a public changelog and chase B2B licensing to Taboola/Outbrain. Every other advisor and every peer reviewer rejected this — five reviewers independently named Expansionist as the weakest voice. You cannot license, market, or productize a curriculum that contains live factual lies. Park the expansion thinking for v1.1.
>
> **Should "missing lessons" get added at all?** Contrarian: "is 80 already too many?" Executor: ship Goal Seek + Scorecard + Regression + Canvas. First Principles filter resolves toward Contrarian: add almost nothing, deepen what's there.
>
> ### Blind spots the council caught
>
> **Biggest miss (4/5 peer reviewers): bilingual cost.** Every P0 fix is two fixes. None of the advisors priced this in.
>
> **Second miss: audit fleet miscalibration.** Nine agents producing 30+ P0 findings against a locked bar suggests the agents weren't briefed on what the bar *excludes*.
>
> **Third miss: zero data on real-learner behavior.** Five advisors debated priority without one data point on completion, retention, or whether a real buyer has finished Track 1 end-to-end.
>
> ### The recommendation
>
> Fix the credibility hole. Cut the inflated gaps. Stop adding lessons. Get one real buyer through Track 1 before you touch v1.1.
>
> ### The one thing to do first
>
> Today, before anything else: do the P0 factual-error sweep in English only, with sources cited inline in each commit, and a tracking doc listing every HE mirror change owed. The five factual lies in the live course are the only thing that matters in the next 24 hours.

---

## P0 — Factual errors (fix before anything else)

These are the lies in the course. Every one is citable. Every one will be spotted by a working pro on first encounter. Order within this section is by impact (trust damage), not file location.

### F1. XLOOKUP "case-sensitive on text" — wrong

- **File:** `content/en/lessons/formulas/02-coming-from-excel/lesson.mdx`, lines 263-272.
- **Claim:** A `<Compare>` block shows `XLOOKUP("yoav cohen",...)` returning `#N/A` and labels XLOOKUP as case-sensitive on text.
- **Reality:** XLOOKUP in Google Sheets is **case-insensitive by default**. Source: https://support.google.com/docs/answer/12405947
- **Why it's poison:** Teaches a wrong reflex on the curriculum's central lookup function. Lesson 1.22 (line 156) then correctly says XLOOKUP is type-strict, creating an internal contradiction.
- **Fix:** Replace the compare with a real XLOOKUP trap — text-vs-numeric type mismatch, or trailing-whitespace match failure. Mirror to HE.

### F2. QUERY "column letters must be uppercase" — wrong

- **File:** `content/en/lessons/formulas/12-query-fundamentals/lesson.mdx`, lines 100-108 and 172.
- **Claim:** "QUERY's column identifiers are case-sensitive and must be uppercase. The whole query errors with a parse error."
- **Reality:** Lowercase column letters (`select b`) work in Google Sheets QUERY. The Pro pitfall doubles down on the false constraint.
- **Source:** https://developers.google.com/chart/interactive/docs/querylanguage (no case requirement) and Google's QUERY docs.
- **Fix:** Rewrite the pitfall to a real QUERY trap: the `Col1` quirk when no header row is declared, or the date-literal quoting rule. Mirror to HE.

### F3. SUMIFS "silently wrong on size mismatch" — wrong

- **File:** `content/en/lessons/formulas/06-aggregation/lesson.mdx`, lines 178-187 and 242.
- **Claim:** SUMIFS with mismatched-size ranges can "return the wrong number with no error if the size mismatch lines up accidentally."
- **Reality:** SUMIFS returns `#VALUE!` reliably when criteria-range sizes don't match the sum range. Pros do not silently get wrong totals from this; they get an error and fix it.
- **Fix:** Replace the false fear with a real SUMIFS trap: blank-vs-empty-string criteria mismatch, or the "criteria must be a quoted string for operators" gotcha (`">5"` not `>5`).

### F4. Apps Script "30-minute Workspace runtime" — wrong

- **Files:** Four locations.
  - `content/en/lessons/apps-script/01-editor-and-project/lesson.mdx:35`
  - `content/en/lessons/apps-script/02-execution-model/lesson.mdx:105-108` (and 109)
  - `content/en/lessons/apps-script/16-quotas-and-batching/lesson.mdx:162-164`
  - `content/en/lessons/scale/09-slow-apps-script/lesson.mdx:119-122` (table)
- **Claim:** "6-minute execution budget on consumer accounts and 30 minutes on Workspace."
- **Reality (verified 2026-05-12):** Script runtime is **6 minutes per execution for both consumer and Workspace accounts**. The historical 30-min Workspace tier was deprecated. Source: https://developers.google.com/apps-script/guides/services/quotas
- **Why it's load-bearing:** The "split into chunks and re-trigger" recipe in lesson 16 is built on this number. A pro who designs a nightly job around 30 minutes will hit a quota wall in production.
- **Fix:** Update all four locations to 6 min for both account types. The chunk-and-re-trigger recipe is *more* important than the lesson currently says, not less.

### F5. `=AI()` "auto-refreshes on sheet reload" — wrong

- **Files:**
  - `content/en/lessons/ai-in-sheets/01-how-gemini-sees-sheets/lesson.mdx`, line 123, Compare block lines 127-133.
  - `content/en/lessons/ai-in-sheets/02-ai-function/lesson.mdx:222`.
  - `content/en/lessons/ai-in-sheets/06-when-not-to-use/lesson.mdx:19-22` (the `$14,387.22 Monday → $14,401.50 Friday` example).
- **Claim:** Sheet reload or teammate refresh causes `=AI()` cells to recompute, producing silent drift.
- **Reality:** `=AI()` output is **static** until the user clicks **Refresh and insert** explicitly. Source: https://support.google.com/docs/answer/15820999 plus the support thread https://support.google.com/docs/thread/337047200.
- **Why it matters:** The whole "calibrated trust" frame in lesson 5.6 rests on understanding *who* causes drift (a person clicking Refresh) vs. *what* causes it (the sheet refreshing). The current framing misnames the dragon.
- **Fix:** Rework the drift framing in all three lessons. The risk is "someone re-runs the cell deliberately, gets a different answer, and ships it." Introduce **Refresh and insert** as the regeneration trigger by name. Mirror to HE.

### F6. "July 15 2026 promo window" — unsourced

- **Files:**
  - `content/en/lessons/ai-in-sheets/01-how-gemini-sees-sheets/lesson.mdx:147`
  - `content/en/lessons/ai-in-sheets/03-fill-with-gemini/lesson.mdx:167`
- **Claim:** "Through July 15 2026 there's a promotional window with higher per-user quotas."
- **Reality:** No source verifies this date. Likely hallucinated and propagated across lessons. Per CLAUDE.md rule 1, citation required or claim removed.
- **Fix:** Either source it from a current Workspace Updates post or remove. Default action: remove and reword as "promotional access windows exist on some plans; verify with your admin."

### F7. Connected Sheets edition gating — wrong

- **File:** `content/en/lessons/scale/04-connected-sheets-bigquery/lesson.mdx:7`.
- **Claim:** "Connected Sheets requires Business Plus and above."
- **Reality:** Connected Sheets → BigQuery is supported on Enterprise Standard / Enterprise Plus / Enterprise Essentials / Enterprise Essentials Plus / Education Standard / Education Plus. Business Plus is **not** on the supported list. Source: https://knowledge.workspace.google.com/admin/drive/use-connected-sheets-in-your-organization
- **Fix:** Update the edition list. Note that gating changes; cite the Google admin page as the live source of truth.

### F8. RANDARRAY missing from volatile-functions list

- **File:** `content/en/lessons/scale/02-why-its-slow/lesson.mdx:14-15`.
- **Claim:** "Six functions in Sheets are volatile: TODAY, NOW, RAND, RANDBETWEEN, OFFSET, INDIRECT."
- **Reality:** RANDARRAY is also volatile. The list should be seven.
- **Fix:** Add RANDARRAY. Mention it in the Pro pitfalls beat.

### F9. Cell-limit framing stale

- **File:** `content/en/lessons/scale/01-cell-limit/lesson.mdx:4`.
- **Claim:** "Google Sheets caps a workbook at 10,000,000 cells."
- **Reality:** Two updates needed.
  1. The cap is **10M cells OR 18,278 columns** — the column ceiling is missed entirely and hits wide-pivot workbooks first.
  2. As of **April 22, 2026**, a beta doubles the cap to 20M cells for opted-in domains. Plus 30-60% performance gains across opening, filtering, conditional formatting. Source: https://workspaceupdates.googleblog.com/2026/04/faster-performance-and-doubled-cell-limits-in-Google-Sheets.html
- **Fix:** Reframe as "10M cells / 18,278 columns universal; 20M cells available in beta; performance baseline improved April 2026." Examples about "slow on 1M rows" need a hedging line.

### F10. AVG() used as if it were a Sheets function

- **File:** `content/en/lessons/formulas/25-cross-sheet-indirect/lesson.mdx:100`.
- **Claim:** A "Working" Compare uses `AVG(rng)`.
- **Reality:** `AVG` is not a valid Sheets function (it exists only inside QUERY's `select` clauses). The correct function is `AVERAGE`.
- **Fix:** Replace `AVG` with `AVERAGE` in the Compare. Add to Easy traps: "Don't confuse QUERY's aggregate names (`avg`, `sum`, `count`) with sheet-level functions (`AVERAGE`, `SUM`, `COUNT`)."

### F11. Broken QuickCheck props in two lessons

- **Files:**
  - `content/en/lessons/formulas/26-sparkline/lesson.mdx:158-166`.
  - `content/en/lessons/formulas/27-import-family/lesson.mdx:163-171`.
- **Bug:** Uses `prompt=` and per-option `text=`. The component (`components/lesson/quick-check.tsx`) expects `question=` and `label=`.
- **Reality:** These two QuickChecks render without their question or option text (silent failure depending on prop typing).
- **Fix:** Rename props to `question=` and `label=`. Verify against the component signature.

### F12. Lesson 1.7 QuickCheck self-contradiction

- **File:** `content/en/lessons/formulas/07-text-manipulation/lesson.mdx:96-118` and lines 129-151.
- **Bug 1:** First QuickCheck marks option (a) as incorrect, but the explanation literally says *"Actually this answer is fine for the SPACE case."* The option is correct; the flag is wrong.
- **Bug 2:** Second QuickCheck marks both (b) and (c) as `correct: true`. Two flagged-correct options in one question is undefined behavior.
- **Fix:** Re-evaluate which option is canonically correct; revise the alternatives so only one is `correct: true`. Mirror to HE.

### F13. Lesson 2.17 grader bug — wrong column for "Spend"

- **Files:**
  - `content/en/lessons/modeling/17-comments-and-notes/lesson.mdx:134, 137`
  - `content/en/lessons/modeling/17-comments-and-notes/assignment.ts:12, 56-58, 67, 125`
- **Bug:** Lesson and grader both call `E1` the "Spend header." The lesson uses `CAMPAIGNS_LARGE` (schema `Date | Buyer | Vertical | Platform | Country | Spend | Revenue`), so `E1` is Country; `F1` is Spend.
- **Reality:** A learner who correctly notes "Country" in `E1` gets graded as if they noted the wrong column. The current grader silently rewards the wrong answer.
- **Fix:** Change every `E1` reference to `F1` in lesson body, assignment label, grader detail strings (three locales), and seed-cell instruction L3.

### F14. Lesson 2.13 Form Responses tab reference

- **File:** `content/en/lessons/modeling/13-forms-sheets-pipeline/lesson.mdx:46-49`.
- **Bug:** Compare shows `=FormResponses1!A2`. The actual tab name is `Form Responses 1` (with spaces); the correct reference is `='Form Responses 1'!A2`.
- **Fix:** Single-quote the tab name. A learner copy-pasting the unquoted form hits `#REF!`.

### F15. Lesson 2.9 uses "Bing" — not on the team's platform list

- **File:** `content/en/lessons/modeling/09-charts-choosing/lesson.mdx:97, 108`.
- **Bug:** Spaghetti-chart example uses `Bing`. The team's platforms are Taboola, Outbrain, MediaGo, Poppin, Facebook, TikTok, Google.
- **Fix:** Swap for a canonical platform.

### F16. Vertical-name drift across multiple Track 1 lessons

The CAMPAIGNS dataset is the source of truth, but multiple lessons hand-type vertical names that don't match it:
- `formulas/04-lookups/lesson.mdx:78` references "Used Cars PR" — dataset has **Car Deals PR** at row 1.
- `formulas/05-conditional-logic/lesson.mdx:46, 76` uses "Used Cars PR."
- `formulas/13-query-in-depth/lesson.mdx:56-57` top-revenue list says "Cruises PR (1124.6)" but `formulas/04-lookups/lesson.mdx:134` says the top revenue row is "Solar Panels PR (1124.6)."
- `formulas/22-advanced-lookups/lesson.mdx:32-36` uses "Solar Panels PR" — dataset has **Solar Systems & Panels PR**.
- `formulas/17-tables/lesson.mdx:19` uses platform `"Mediago"` (lowercase g) — dataset (and the rest of the curriculum) uses `"MediaGo"`.

**Fix:** One sweep that re-imports vertical names from `content/datasets/adtech.ts` rather than hand-typing them. This is the same root cause across all five drift sites.

### F17. Lesson 1.24 grader vs answer column mismatch

- **File:** `content/en/lessons/formulas/24-financial/lesson.mdx:100-108`.
- **Bug:** `<TryIt>` `expectedFormula="=B2-A2"` but the data has Spend in column E and Revenue in column F. Hint and answer text say `=F2-E2`.
- **Reality:** The grader rejects the correct answer.
- **Fix:** Align `expectedFormula` with the data shape.

### F18. Cross-references in Track 5 — multiple off-by-N lesson numbers

`content/en/lessons/ai-in-sheets/02-ai-function/lesson.mdx` and 5.5 and 5.6 contain a cluster of broken cross-references (all citable in the registry-audit appendix below). Single representative example: `ai-in-sheets/02-ai-function/lesson.mdx:146` says "Track 1 lesson 11 covers SUMIF, COUNTIF, and friends." Track 1 lesson 11 is `sequence-randarray`; SUMIF/COUNTIF live in lesson 1.6. Six similar off-by-N references in this file alone.

**Fix:** One sweep of the three Track 5 files (5.2, 5.5, 5.6) against the canonical lesson list. Full list in the cross-reference appendix.

### F19. Apps Script `e.user` reliability overstated

- **File:** `content/en/lessons/apps-script/07-simple-triggers/lesson.mdx:33, 153, 205`.
- **Bug:** Lesson treats `e.user.getEmail()` as routinely working in simple `onEdit`. Per Google's events docs, `e.user` is "if available (depending on a complex set of security restrictions)" — in practice it is **typically empty** in a simple `onEdit` unless the edit was made by the script owner.
- **Fix:** Lead with "e.user is usually empty in simple onEdit." Move the email-stamping use case to a use case where it actually works.

### F20. Apps Script "600/min UrlFetchApp throttle" — undocumented

- **Files:**
  - `content/en/lessons/apps-script/02-execution-model/lesson.mdx:125, 238`
  - `content/en/lessons/apps-script/16-quotas-and-batching/lesson.mdx:175, 238`
- **Bug:** Claims `UrlFetchApp` throttles at ~600/min as a documented number. There is **no documented per-minute UrlFetchApp throttle** in Google's quotas page.
- **Fix:** Either source the number from a Google doc or hedge: "Community reports suggest a soft throttle around N/min; treat sustained rates above a few hundred/min as a risk and use `fetchAll` plus sleeps."

### F21. Apps Script lesson 3 vs lesson 4 contradiction on custom-function `getActive()`

- **Files:**
  - `content/en/lessons/apps-script/03-custom-functions/lesson.mdx:220` says custom functions "can read the active spreadsheet via `SpreadsheetApp.getActiveSpreadsheet()` (read-only, current sheet only)."
  - `content/en/lessons/apps-script/04-spreadsheetapp/lesson.mdx:283-284` correctly says `SpreadsheetApp.getActive()` returns `null` inside a custom function.
- **Fix:** Rewrite the lesson-3 bullet to "Custom functions read their caller's data via range arguments passed from the cell (e.g. `=fn(A1:B10)` arrives as a 2D array)."

---

## P1 — Pedagogy bar violations that meaningfully impact the learner

These do not teach wrong information. They miss the locked-2026-05-11 elevated bar in ways a careful learner will notice. Triage by section once Phase 1 (P0) is done.

### Track 1 (Formulas)

- **FunctionRef cards never rendered for functions in heavy use:** AVERAGE, AVERAGEIFS, SUBSTITUTE, LEN, LOWER, PROPER, OR, NOT, MOD, ABS, VALUE, DATEVALUE, OFFSET, HYPERLINK. All are in the registry but the `<FunctionRef />` component is never invoked. Rule 6 violation. Mechanical fix.
- **Lesson 1.4 (Lookups)** has no `<QuickCheck>` on VLOOKUP's `is_sorted=TRUE` default — the actual tricky concept, not the soft "which to use" choice that's currently there.
- **Lesson 1.5 line 158** cross-references "lesson 1.14" for the boolean-arithmetic pattern; that's a Track 1.10 concept revisited in 1.14. Choose one canonical home.
- **Lesson 1.8 lines 122-132** claims DATEDIF lowercase units "fail differently across two adjacent workbooks" — anecdotal FUD; either back the claim or drop it.
- **Lesson 1.10 lines 187-195** uses `XLOOKUP(...)` inside ARRAYFORMULA as if it broadcasts cleanly; lesson 1.18 then steers learners to `MAP` for the same task. Contradiction; pick one canonical pattern and reference it from the other lesson.
- **Lesson 1.14 line 244** uses `ARRAY_CONSTRAIN` which is never introduced and not in the registry. Replace with `QUERY(... limit 5)` or document `ARRAY_CONSTRAIN`.
- **Lesson 1.18 line 161** claims LAMBDAs "cannot reference variables from a surrounding LET unless explicitly passed in" — contradicts lines 70, 86-91, 154 of the same lesson and contradicts lesson 1.20. LAMBDAs in Sheets do close over outer LET names. Remove the false restriction.
- **Lesson 1.21 line 153** "Named function body cannot reference cells directly" — overstrong. Sheets allows it but discourages it. Teach the warning, not a false hard rule.
- **Lesson 1.24** lines 156-158 — QuickCheck rewards picking "less bad" between two negative-NPV channels. Real adtech: both fail the hurdle. Refine.
- **Lessons 1.3 and 1.8** say `TODAY()/NOW()` "recalculate daily" — wrong scope; they recalc on every workbook edit. Line 17 of 1.8 has the correct version; the Pro pitfall contradicts it.

### Track 2 (Modeling)

- **Track 2 uses `<FunctionRef>` rarely (only 2.14, 2.16)** despite frequent formula use across the track. Either build a non-function `<ConceptCard>` analogue for pivot tables / smart chips / validation / chart types, or accept that the canonical-introduction rule applies only to functions and update CLAUDE.md to say so.
- **Three-escalating-examples gap:** Lessons 2.4, 2.5, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.15, 2.16, 2.17, 2.18 mostly jump straight to the adtech dataset without a toy first, or stop at one example.
- **Color scale conditional formatting is absent entirely** from lesson 2.6. Mentioned once at line 11 and never returned to. Color scales are the team's default for ROI heatmaps and weekly-delta dashboards. This is the single largest topical gap in Track 2.
- **Pivot "Show as" options absent** (`% of grand total`, `% of row`, `% of column`, `Running total`). Should live in lesson 2.3.
- **Pivot date-grouping gaps:** day-of-week, hour-of-day, custom number-range grouping, manual grouping — none taught.
- **Scorecard chart absent.** Council says paragraph-not-lesson. Recommend: paragraph inside lesson 2.9 or 2.11.
- **Smart chip types missed:** YouTube video chip, dropdown chip (the 2024 inline-pill rendering of a validation list — directly relevant to lesson 2.4).
- **Lesson 2.13 Forms gaps:** file upload, section logic / branching, quiz mode, response notifications, the protection-bypass caveat for Form writes.
- **Sharing gaps (lesson 2.12):** shared drives vs personal Drive distinction (P0 candidate if the team is on a shared drive), domain-restricted link sharing, watermarks, the precise name of the "Disable download/print/copy" setting.
- **Tables (2024 feature) modeling impact** absent from Track 2 beyond a passing reference in lessons 2.6 and 2.15. Tables interact with pivots, filter views, conditional formatting in distinct ways.
- **Workbook structure (lesson 2.1)** never names "single source of truth" / "raw vs derived" by the industry terms that let pros transfer the discipline to dbt or BigQuery.

### Track 3 (Apps Script)

- **Interactive component density is low.** Track averages ~1 `<QuickCheck>` per lesson when the bar is one interactive component per major heading. Lesson 11 has 8 `##` headings and 3 interactive components total. Apps Script can't run code interactively, granted, but `<Compare>` (wrong-vs-right) and `<QuickCheck>` are valid substitutes the track underuses.
- **Lesson 7 `onChange` is listed in the trigger table but never gets a worked example.**
- **Lesson 10 `GmailApp` features beyond send (threads, labels, drafts) listed in the table but never demonstrated.**
- **Lesson 13 Slack signing-secret mentioned 3× but never shown.** The lesson teaches the learner to verify the secret without teaching how.
- **Lesson 14 Cloud Logging UI never shown.** Lesson tells the learner to "open Cloud Logging" four times without explaining how — the GCP project linkage, the default-vs-standard project choice, the Logs Explorer surface.
- **Lesson 15 `LockService.tryLock` vs `waitLock` distinction missing.** Both deserve a Compare.
- **Lesson 6 recorder UI walkthrough missing** — the lesson dismisses the recorder but doesn't show what it looks like.

### Track 4 (Scale)

- **Diagnostic lessons (4.6, 4.7, 4.8, 4.9) lack interactive components below most `##` headings.** "Lean" doesn't mean "no interactivity." Each should have at least a `<Compare>` or `<QuickCheck>` per concept introduced.
- **Lesson 4.1 missing a `<MiniGrid>`** of the allocated-vs-filled cell distinction. Per rule 12, spatial concepts need visual reinforcement.
- **Lesson 4.5 ("TimesFM") missing UI mechanics fix** — already in the 2026-05-11 pedagogy gap audit but reiterating: Advanced Analytics → Create a Forecast is the actual path.
- **Lesson 4.11 (capstone) is Track-4-only.** Five bugs, all formula/diagnosis; no Apps Script bug, no QUERY bug, no IMPORTRANGE bug — the team's single biggest failure mode missing from the capstone. Replace one bug (J3's `TODAY()` is the weakest candidate) with a broken IMPORTRANGE.
- **Lesson 4.7 "Now do it for real"** seeds three cycle cells but only specifies fixes for two.

### Track 5 (AI in Sheets)

- **No `<CapabilityRef>` component** equivalent to `<FunctionRef>` for non-function AI capabilities (Fill with Gemini, Build & Edit, the side panel). Build it; use it in 5.1, 5.3, 5.4.
- **Lesson 5.2 missing `<StepThrough>`** for the 4-step sidecar-validator chain at lines 202-214.
- **Lesson 5.3 is the major capability lesson of the track and has only `<MiniGrid>` and `<Compare>`** — no `<TryIt>`, no `<RefDemo>`, no `<StepThrough>`. Sparse versus the rest of the track.
- **Lesson 5.4 missing a `<QuickCheck>`** on the iteration workflow (the most novel pedagogical idea in the lesson).
- **Lesson 5.6 four-step decision tree** at lines 88-96 is prose-only. Render visually.
- **Prompt engineering for spreadsheets is taught implicitly across 5.2/5.4** but never consolidated into a named section. Should be either a new sub-section in 5.2 or a new lesson 5.1.5 — depending on whether the council's "stop adding lessons" verdict holds.
- **Lesson 5.4 Workspace Intelligence claim stale:** lesson says other tabs/sheets are out of scope; the April 2026 launch added cross-Workspace context on eligible plans.
- **SpreadsheetBench 70.48% framing in lesson 5.4 line 5** rhetorically converts a benchmark score to "seven of ten times in your workbook" — misanchor. Separate the benchmark from the practical reliability discussion.

### Registry-wide rule-6 violations

Functions used in lessons that bypass `<FunctionRef>`: SUBSTITUTE (8 lessons), AVERAGE, AVERAGEIFS, LEN, LOWER, PROPER, OR, NOT, MOD, ABS, VALUE, DATEVALUE, OFFSET, HYPERLINK. Single biggest gap: SUBSTITUTE. Mechanical fix per lesson.

---

## P2 — Registry and cross-reference integrity

### Functions used in lessons but missing from the registry

Adding these is mechanical and cheap (verify signature against Google's docs, add entry, mirror to HE). Each is referenced in at least one lesson body or `<TryIt>`:

- **TEXT** — referenced in 4 lessons (`ai-in-sheets/02:97,100,124`, `formulas/22:162`, `formulas/13:136`, more). The single largest missing entry. Pros use it constantly for date-to-string conversion.
- **GOOGLEFINANCE** — actively recommended in `ai-in-sheets/06-when-not-to-use/lesson.mdx:75` as the correct tool for currency conversion. Not in registry, not in any lesson. Recommend either add to registry + brief mention in `formulas/25-cross-sheet-indirect` or remove the recommendation.
- **SHEET / SHEETS** — Feb 2026 functions, universally available. Defend against tab-reorder breakage. Add to registry; brief mention in lesson 1.27 or 4.3.
- **EDATE, YEAR, MONTH, DAY, WEEKDAY, WEEKNUM, HOUR, MINUTE, SECOND** — date primitives referenced in lesson 1.8 table without cards.
- **MODE, QUARTILE, SMALL, VAR, VARP, STDEVP, RANK.AVG, PERCENTILE.INC/EXC, FORECAST, TREND, SLOPE** — statistical family referenced in lesson 1.23 without cards.
- **PMT, XNPV, XIRR** — financial family referenced in lesson 1.24 without cards.
- **TRANSPOSE, ARRAY_CONSTRAIN, SORTN** — array-shaping family referenced in lessons 1.10/1.14/1.15.
- **REPLACE, CONCATENATE, CHAR, AVERAGEA, RANDBETWEEN, NA** — used in prose without cards.

### Functions registered but never invoked (dead entries)

ABS, AVERAGE, AVERAGEIFS, LEN, LOWER, MOD, NOT, OR, PROPER, SUBSTITUTE. All are used in lessons but bypass `<FunctionRef>`. Either invoke the cards or accept that the canonical-card rule has gaps. Mechanical fix to invoke them at the right section heading.

### Broken cross-references

Most concentrated in Track 5. Single-pass fix:

- `ai-in-sheets/02-ai-function/lesson.mdx:146` — "Track 1 lesson 11" should be **lesson 1.6** (SUMIF/COUNTIF).
- `ai-in-sheets/02-ai-function/lesson.mdx:152` — "Track 1 lesson 14 covers IFERROR" should be **lesson 1.9**.
- `ai-in-sheets/02-ai-function/lesson.mdx:213` — "REGEXMATCH is in Track 2 lesson 8" should be **Track 1 lesson 16**.
- `ai-in-sheets/02-ai-function/lesson.mdx:97` — "TEXT() (Track 1 lesson 7)" — TEXT is not introduced in 1.7. Either add it there or fix the cross-ref.
- `ai-in-sheets/05-ai-analysis/lesson.mdx:88` — "SORT is in Track 2 lesson 4" should be **Track 1 lesson 14**.
- `ai-in-sheets/05-ai-analysis/lesson.mdx:110` — "INDEX/MATCH (Track 1 lesson 5)" should be **lesson 1.4**; "LARGE (Track 1 lesson 5)" should be **lesson 1.23**.
- `ai-in-sheets/06-when-not-to-use/lesson.mdx:7` — stacked broken refs in one paragraph: `SUM (1.5)` → 1.6, `SUMIFS (1.11)` → 1.6, `REGEXEXTRACT (Track 2 lesson 8)` → 1.16, `GOOGLEFINANCE (1.25)` → not covered anywhere.
- `ai-in-sheets/06-when-not-to-use/lesson.mdx:60, 77` — same kind of off-by-N.
- `modeling/13-forms-sheets-pipeline/lesson.mdx:115` — "Track 1 lesson 9 covers text functions" should be **lessons 1.3 and 1.7**.
- `modeling/02-pivot-tables-basics/lesson.mdx:112` — "lesson 1.6 (SUM, AVERAGE, MEDIAN, COUNTA, MIN, MAX)" — MEDIAN is in 1.23, not 1.6.

### Signature spot-check

25 high-stakes function signatures verified against Google's docs. All correct. Only drift: `registry.ts:2898` NPV uses `cashflow1, cashflow2, ...` where Google uses `value1, value2, ...`. Authored for pedagogical clarity; flag for awareness, not error.

---

## P3 — Hebrew parity

**Verdict: in very good shape.** 100% file existence parity, 100% structural parity (heading counts, component counts, dataset identity), file size ratios uniformly between 1.17× and 1.31× (no outliers). Translation quality on the 15 deep-read lessons is fluent technical Hebrew. Function names stay English, UI labels stay English-in-quotes, vertical names stay English with " PR" suffix.

**Two mechanical typos:**
- `content/he/lessons/modeling/02-pivot-tables-basics/lesson.mdx:11` — `מלסון 2.1` should be `משיעור 2.1` (translator collapsed `מ-` onto English "lesson" instead of using `שיעור`).
- `content/he/lessons/modeling/10-charts-customization/lesson.mdx:136` — `מלסון 2.9` should be `משיעור 2.9`.

**Two phrases worth a native-Hebrew reviewer glance:**
- `content/he/lessons/ai-in-sheets/02-ai-function/lesson.mdx:5` — gender agreement on `מחויב`.
- `content/he/lessons/scale/03-importrange-patterns/lesson.mdx:3` — possible typo `בקרים` (controls) vs `בוקרים` (mornings).

**Convention question for the team:** Hebrew comments inside JS code fences in Apps Script lessons (e.g. `// Spreadsheet (כל הקובץ)`). Mixed-direction caret in some viewers. Pattern is consistent — keep or strip? Document the decision either way.

---

## P4 — May 2026 currency

The course was last expanded 2026-05-10 (the curriculum plan), so most major 2026 features are present. These shipped or stabilized between January and May 12, 2026 and warrant either a lesson update or a deliberate "not now" call.

### Updates to existing lessons (priority order)

1. **Track 4 lesson 1 — 20M cell beta + April 2026 perf gains.** (P0 above, F9.)
2. **Track 4 lesson 5 — TimesFM Advanced Analytics path + parallel anomaly-detection feature** in BigQuery ML. The Advanced Analytics path fix is already in the 2026-05-11 pedagogy gap audit; the anomaly detection mention is new.
3. **Track 3 — Vertex AI advanced service.** Shipped January 12, 2026. Apps Script can now call Gemini directly without `UrlFetchApp`. Update lesson 11 (external APIs) or lesson 17 (advanced services) to reflect this as the modern path for AI-from-Apps-Script. Source: https://developers.google.com/apps-script/release-notes
4. **Track 3 — Rhino EOL.** Rhino runtime fully retired January 31, 2026. Anywhere lessons treat V8 vs Rhino as a live choice should be reframed as "V8 only; Rhino was retired Jan 2026."
5. **Track 3 — `Maps.setAuthentication` deprecation.** Deprecated March 5, 2026; sunset June 2026 (next month). If lesson 10 or 11 references it, switch to `setAuthenticationByKey`.
6. **Track 5 lesson 5.3 — Fill with Gemini entry modes.** Lesson should distinguish the two named entry points: **drag-fill** (column has a completed seed cell) and **prompt-fill** (Fill button above an empty selection). Frame Fill with Gemini as UI sugar over `=AI()`.

### New features the council says are *not* worth a dedicated lesson, but warrant mention

7. **`SHEET()` and `SHEETS()` functions** (Feb 23, 2026). Two-paragraph note inside lesson 1.27 or lesson 4.3 — they defend formulas against tab-reorder rot.
8. **Sheets Canvas** (Cloud Next April 22, 2026). New modality: interactive mini-apps over sheet data. Council says: defer to v1.1, evaluate after the foundation is fixed.
9. **Paste-and-convert text to tables with Gemini** (April 22, 2026 Rapid / May 6 Scheduled). One paragraph in either the Tables lesson or 5.3 (Fill with Gemini).
10. **Workspace Intelligence cross-app context.** The April 2026 Build-and-Edit launch added cross-Workspace context on eligible plans — affects lesson 5.4's "Gemini can't see other tabs" framing.

---

## Recommended new lessons — pressure-tested against the buyer's-job filter

The audit produced a long list. The council cut most of it. Here is what survived, in priority order, with HE-mirror cost in mind:

### Recommended

| Priority | Lesson | Where it fits | Why it survives the filter | Council verdict |
|---|---|---|---|---|
| 1 | **Splitting a workbook / archive-and-link pattern** | Track 4, after lesson 4.1 | Pros hit the 10M cell ceiling and need a recipe to split a live workbook from cold archive without breaking dashboards. IMPORTRANGE-shaped, directly load-bearing. | Survives. |
| 2 | **Cross-track capstone — the buyer-dashboard build** | New, after lesson 5.6 | Single multi-IMPORTRANGE dashboard build pulling QUERY, charts, conditional formatting, Apps Script refresh, and Gemini analysis. Lesson 4.11 stays as the Track 4 diagnostic capstone; this is the synthesis capstone. | Survives. Defer to v1.1. |
| 3 | **Vertex AI from Apps Script** | Add to Track 3 lesson 11 or 17 | Replaces the older "UrlFetchApp to call Gemini" pattern. Audit-trail-friendly alternative to `=AI()`. Cross-link from Track 5 lesson 6. | Survives as an *update* to existing lesson, not a new lesson. |
| 4 | **Prompt engineering for spreadsheets** | New sub-section in Track 5 lesson 5.2 (not a new lesson) | Currently scattered across 5.2, 5.4. Consolidate: label inputs, constrain output space, name the output type, give row count, ask Gemini to show its work. | Survives, but as a sub-section. |

### Cut

| Lesson the audit suggested | Council verdict | Reason |
|---|---|---|
| Goal Seek + what-if analysis | Cut as own lesson | At most one worked example inside a modeling lesson. Real adtech buyers touch this rarely. |
| Sensitivity tables (CPC × CVR grid) | Cut | "Business school teaches it" is not the bar. |
| Monte Carlo simulation | Cut | Unanimous. 0.5% of adtech touches it. |
| Regression / forecasting family deep lesson | Cut as own lesson; add to registry only | Lesson 1.23 covers enough; deeper regression for a media buyer is niche. |
| Dedicated scorecard chart lesson | Cut | "Scorecard is a paragraph, not a lesson." Add as a paragraph in 2.9 or 2.11. |
| `SHEET()` / `SHEETS()` dedicated lesson | Cut | Registry-only, with a sentence in 1.27 or 4.3. |
| Sheets Canvas dedicated lesson | Defer | New modality; nobody's workflow depends on it yet. v1.1 candidate. |
| Print / PDF / scheduled exports | Cut | Boring, low-frequency. One sentence in 2.12 at most. |
| AppSheet adjacency lesson | Cut | Different product; out of scope. |
| `clasp` + Git for Apps Script | Cut | Pro adjacency, but not core to "fluency in Sheets." |
| Color scale conditional formatting | Add to lesson 2.6 as a major section, not as a new lesson | This is the largest topical gap; fix in-place. |

### The licensing / standards-body framing

The Expansionist advisor pitched repackaging the curriculum as a B2B licensable standards-body asset for Taboola/Outbrain/MediaGo onboarding teams. **Every other advisor and every peer reviewer rejected this for now.** The reasoning: you cannot license a curriculum with live factual lies in it. Park the idea; it may have legs after Phase 1-6 ship.

---

## The three things the entire audit fleet missed

Surfaced only in council peer review. These are operational realities the audit fleet failed to brief into its agents.

### M1. Bilingual cost is not a postscript

Every P0 fix is two fixes. Every registry addition is two entries. Every new lesson is two lessons. Hebrew must stay structurally parallel per CLAUDE.md rule 14. **This changes the math for every recommendation in this report.** A "quick 12-item P0 sweep" is 24 edits, plus a Hebrew reviewer pass.

Practical implication: schedule the P0 sweep as **EN first, then HE mirror** as a discrete tracked unit of work. Don't try to do them in parallel by the same author; the EN→HE mirror is where structural-parity drift sneaks in.

### M2. The audit fleet may be miscalibrated

Nine agents producing 30+ "P0 findings" against a locked elevated bar is suspicious. The agents weren't briefed on what the bar **excludes** (academic completeness, business-school topics, chrome features). They optimized for curriculum-shaped completeness, not for the buyer's job.

Practical implication: before the next audit pass, update the agent brief with:
- The buyer's-job filter as the explicit P0 test.
- A list of categories the bar excludes (Monte Carlo, Solver, generic business-school topics).
- A reminder that "competitor X teaches it" is not a P0 trigger.
- A reminder that ALL findings need a cited source URL, not training-data memory.

The next audit pass against a recalibrated brief should produce roughly 10-15 real findings, not 30+. If it still produces 30+, the bar itself is wrong, not the audit.

### M3. Zero data on real-learner behavior

This entire report optimizes a curriculum nobody has been observed completing. There is no completion data, no retention data, no recording of an adtech buyer using Track 1 end-to-end. Five council advisors debated priority without one data point.

Practical implication, the most important in this document:

> **Before any v1.1 work — before the capstone, before Sheets Canvas, before the prompt-engineering consolidation — get one real adtech buyer to walk through Track 1 with screen recording. Watch where they stall, where they skip, where they say "I'd never use this." That single observation will overrule most of this report.**

The audit is grading the textbook. Nobody has graded the user.

---

## Phase-by-phase fix plan

Treat this as the recommended execution sequence. Each phase is small enough to ship as a single unit of work.

### Phase 1 (this week): P0 factual errors, English

Items F1-F21 above. ~21 edits across 17 lesson files. Each fix is search-and-replace with the Google source URL cited in the commit message. One branch, one commit per finding, push by end of week. **Do not touch Hebrew in this phase** — a tracking doc lists every HE mirror change owed.

Estimated cost: 6-10 hours of focused work for the edits + 2 hours for QA + 2 hours for the Google-docs citation lookups. Total: roughly two work days.

### Phase 2 (next week): P0 mirror to Hebrew

Same 21 items, in `content/he/lessons/`. Same component IDs, same structure, only the prose translates. Bilingual reviewer pass at the end to verify structural parity is preserved.

Estimated cost: roughly the same as Phase 1.

### Phase 3 (week after): Registry corrections

Add TEXT, GOOGLEFINANCE, SHEET/SHEETS, EDATE, YEAR, MONTH, DAY, WEEKDAY, MODE, QUARTILE, FORECAST, TREND, SLOPE, PMT, TRANSPOSE, SORTN, REPLACE, AVERAGEA, NA. Invoke dead-entry cards at their canonical lesson sections (SUBSTITUTE in 1.7, AVERAGE in 1.3 or 1.6, etc.). Single sweep of broken cross-references in Track 5.

Estimated cost: 4-6 hours.

### Phase 4 (after Phase 3): Observed Track 1 walkthrough

Recruit one real adtech buyer. Record their screen as they go through Track 1, lessons 1.1-1.10 at minimum. Take notes on:
- Where they stall.
- Where they skip past content.
- Where they say "I already knew that" or "I'd never use this."
- Where the interactive components don't render or behave unexpectedly.
- Whether they finish.

Estimated cost: one buyer's afternoon + 2-3 hours of your review.

### Phase 5: Audit fleet recalibration

Update the agent briefs with M2's filter language. Re-run a targeted audit pass on just the lessons surfaced by Phase 4 as problematic. Compare findings volume vs. this report's volume; if the new run produces meaningfully fewer findings, the recalibration worked.

Estimated cost: 1-2 hours of brief-writing + 1-2 hours of agent runtime.

### Phase 6: Targeted edits

Triage Phase 4 + Phase 5 findings against the buyer's-job filter. Ship only the ones that change what a real buyer can do on Monday.

### Phase 7 (v1.1, after Phase 6 stabilizes): Selected new content

In order, only if Phase 4 confirms there's appetite:
1. Lesson on splitting a workbook / archive-and-link.
2. Cross-track buyer-dashboard capstone.
3. Color scale conditional formatting major section in lesson 2.6.
4. Vertex AI advanced service update in Track 3.
5. Prompt-engineering sub-section in lesson 5.2.
6. Sheets Canvas lesson, if it has stabilized by then.

---

## Open questions for the user

Before Phase 1 starts:

1. **Who reviews the EN P0 fixes before merge?** The Executor advisor's blind angle. Mechanical-pass authors ship new factual errors while fixing old ones unless a second pair of eyes is in the loop. The work needs a reviewer assigned this week.
2. **Who reviews the HE mirror in Phase 2?** A native Hebrew speaker, ideally one who has done at least the Track 1 walkthrough. If that's you, fine. If not, name the reviewer.
3. **Do you want me to start Phase 1 now?** This report is the deliverable you asked for. I have not edited any lesson files. If you want me to proceed to the EN P0 sweep, say so. Otherwise this stays as a planning document for you to triage.
4. **Recalibration brief for the audit fleet — do you want me to draft it?** That's a 1-hour task that pays back on the next audit pass.
5. **Track 1 walkthrough recruitment — do you have a candidate buyer in mind?** If not, the council's strongest blind-angle finding becomes a multi-week recruitment task before Phase 4 can even start.

---

## Appendix: full source list for verification

Every claim in this document is citable. The primary live sources used during the audit, all verified 2026-05-12:

- https://support.google.com/docs/answer/12405947 (XLOOKUP signature and case-handling)
- https://developers.google.com/chart/interactive/docs/querylanguage (QUERY language)
- https://developers.google.com/apps-script/guides/services/quotas (Apps Script runtime, all account types)
- https://support.google.com/docs/answer/15820999 (`=AI()` function docs)
- https://support.google.com/docs/answer/14218565 (Gemini in Sheets / Workspace Experiments)
- https://workspaceupdates.googleblog.com/2026/04/faster-performance-and-doubled-cell-limits-in-Google-Sheets.html (20M cell beta, perf gains)
- https://workspaceupdates.googleblog.com/2026/04/build-and-edit-complex-spreadsheets-with-Gemini-in-Google-Sheets.html (Build & Edit launch)
- https://workspaceupdates.googleblog.com/2026/04/effortlessly-automate-data-entry-in-Google-Sheets-using-Fill-with-Gemini.html (Fill with Gemini launch)
- https://workspaceupdates.googleblog.com/2026/04/paste-and-convert-unformatted-text-into-Google-Sheets-tables-with-Gemini.html (Paste-and-convert launch)
- https://workspaceupdates.googleblog.com/2026/02/two-new-functions-in-google-sheets.html (SHEET / SHEETS launch)
- https://workspaceupdates.googleblog.com/2026/02/forecast-data-in-connected-sheets-BigQueryML-TimesFM.html (TimesFM launch)
- https://workspace.google.com/blog/product-announcements/10-more-announcements-workspace-at-next-2026 (Cloud Next announcements: Sheets Canvas, Workspace Flows)
- https://developers.google.com/apps-script/release-notes (Vertex AI advanced service, Maps deprecation, AddOnsResponseService)
- https://developers.google.com/apps-script/guides/v8-runtime/migration (Rhino EOL January 2026)
- https://knowledge.workspace.google.com/admin/drive/use-connected-sheets-in-your-organization (Connected Sheets edition gating)
- https://support.google.com/docs/answer/37603 (cell limit, 10M / 18,278 columns)
- https://blog.google/products-and-platforms/products/workspace/gemini-google-sheets-state-of-the-art/ (SpreadsheetBench 70.48%)
- https://courses.benlcollins.com/p/modern-google-sheets (Ben Collins's competing curriculum)
- https://www.coursera.org/learn/wharton-introduction-spreadsheets-models (Wharton benchmark)
- https://online.hbs.edu/courses/core (HBS CORe benchmark)
- https://pll.harvard.edu/series/data-analysis-life-sciences (Harvard benchmark)
- https://www.skills.google/course_templates/196 (Skills.Google benchmark)

End of report.
