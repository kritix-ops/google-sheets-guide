# Pedagogy gap audit — 2026-05-11

## Summary

Scanned 160 lesson files (80 EN + 80 HE) across five tracks. Found **4 clear gaps** and **3 borderline cases** across **6 logical lessons**.

The lessons are in better shape than expected. The high-risk tracks (modeling, apps-script, ai-in-sheets) almost all show the menu paths or keyboard shortcuts they reference. Most candidate gaps from a first read turn out to be addressed somewhere in the lesson body (in a "Setting it up" or "How it works in practice" beat). The bar held: most lessons go from concept to mechanic.

The actual gaps cluster in **Track 5 (ai-in-sheets)**. The Gemini side panel is referenced in three lessons (1, 4, 5) but is never opened. The TimesFM "Forecast" action in scale lesson 5 is named without its actual UI path. Plus one apps-script lesson (15) references a UI surface ("Project settings → Script properties") that exists but isn't fully explained.

Track breakdown:
- formulas: 0 gaps in 0 lessons
- modeling: 0 clear gaps, 1 borderline in 1 lesson
- apps-script: 0 clear gaps, 1 borderline in 1 lesson
- scale: 1 gap in 1 lesson
- ai-in-sheets: 3 gaps + 1 borderline in 4 lessons

---

## Clear gaps

### `ai-in-sheets/01-how-gemini-sees-sheets` (HE + EN)

**Gap 1: The Gemini side panel is referenced but never opened**

- **What's mentioned**: "When you call `=AI()` or **open the side panel**, Gemini's context window pulls a snapshot of..." and later: "A pinned summary cell sits at A1 of every dashboard... Gemini reads it as the first thing in the snapshot and anchors on it, which makes **side-panel prompts** much more grounded."
- **What's missing**: The actual mechanic to open the side panel. Current Sheets exposes it via the **"Ask Gemini" button at the top right** of the spreadsheet, plus keyboard shortcuts `Ctrl+Alt+G` (formula generation) and `Ctrl+Alt+N` (summarization) on Windows / `Cmd+Ctrl+G` and `Cmd+Ctrl+N` on Mac. None of these appear in the lesson.
- **Where in the lesson**: EN line 11, HE line 11 — section "## What Gemini reads automatically". The "side panel" reference is the first time the panel is mentioned anywhere in Track 5, and Track 5 lesson 1 is the foundation for the rest of the track.
- **Proposed fix (EN)**: Add a short paragraph after the bullet list explaining how to open the panel: "To open the side panel: click the **Ask Gemini** button at the top right of the spreadsheet (next to the share button), or use the keyboard shortcut `Ctrl+Alt+G` (Windows) / `Cmd+Ctrl+G` (Mac). The panel docks on the right and stays open while you work."
- **Proposed fix (HE)**: "כדי לפתוח את ה-side panel: לוחצים על הכפתור **Ask Gemini** בפינה הימנית-עליונה של ה-spreadsheet (ליד כפתור ה-share), או בקיצור המקלדת `Ctrl+Alt+G` (Windows) / `Cmd+Ctrl+G` (Mac). הפאנל מתעגן בצד ימין ונשאר פתוח תוך כדי עבודה."
- **Where to insert**: After the bullet list ending with "...visible on the active sheet." (EN line 18, HE line 18), before "The key word is *active sheet*..." (EN line 20, HE line 20).
- **Verification source**: https://support.google.com/docs/answer/14218565?hl=en

---

### `ai-in-sheets/04-build-and-edit` (HE + EN)

**Gap 2: The whole lesson is about the Gemini side panel but never shows how to open it**

- **What's mentioned**: "The Gemini **side panel** takes natural-language prompts and produces structural changes to your sheet..." (EN line 5). Then references throughout: "The side panel handles two distinct verbs", "After you submit a build prompt, **the side panel shows a side-by-side diff**", "The side panel can't see other tabs."
- **What's missing**: The lesson never shows how to open the side panel. This is the more severe instance because the entire lesson is about using a feature the learner is never told how to invoke. The assignment hand-waves this ("In a real build session, the prompt comes first and Gemini fills the scorecard"), but the body should ground the learner first.
- **Where in the lesson**: EN line 5 / HE line 5 (introduction). The lesson title itself is "Building and editing sheets with Gemini" and the side panel is named in the opening sentence.
- **Proposed fix (EN)**: Add a "## Opening the side panel" section after the introduction: "Click the **Ask Gemini** button at the top right of the sheet (it sits next to the share button, marked with the Gemini sparkle icon). The side panel docks on the right. Type your prompt at the bottom; Gemini's proposal appears above it. Keyboard shortcut: `Ctrl+Alt+G` on Windows, `Cmd+Ctrl+G` on Mac."
- **Proposed fix (HE)**: "## פתיחת ה-side panel\n\nלוחצים על כפתור **Ask Gemini** בפינה הימנית-עליונה של הגיליון (יושב ליד כפתור ה-share, עם אייקון הניצוץ של Gemini). ה-side panel מתעגן בצד ימין. מקלידים את ה-prompt בתחתית; ההצעה של Gemini מופיעה מעליה. קיצור מקלדת: `Ctrl+Alt+G` ב-Windows, `Cmd+Ctrl+G` ב-Mac."
- **Where to insert**: As a new H2 section between "# Building and editing sheets with Gemini" (after the intro paragraphs ending at EN line 7 / HE line 7) and "## Build vs edit" (EN line 9 / HE line 9).
- **Verification source**: https://support.google.com/docs/answer/14218565?hl=en

---

### `ai-in-sheets/05-ai-analysis` (HE + EN)

**Gap 3: `=AI()` syntax with second-arg range is used without explaining where the function comes from or its quotas**

- **What's mentioned**: The lesson uses `=AI("Identify the date with the highest spend spike...", Daily!A2:F31)` style examples (EN lines 28–31).
- **What's missing**: This is the second AI() reference in Track 5 (after lesson 2), and the second-argument range syntax `, Daily!A2:F31` differs from lesson 2's `& F2 & " "` concatenation pattern without explanation. The lesson assumes the learner knows `=AI(prompt, range)` accepts a range as a second arg, but Track 5 lesson 2's syntax section only shows `=AI(prompt, reference)` where reference is "a single cell, a range, or omitted." The range-as-grounding-context behavior isn't separately taught and the learner may not realize this is the same `=AI()` function in a different invocation mode.
- **Where in the lesson**: EN lines 28–31 / HE lines 28–31, section "## Specific prompts that work".
- **Proposed fix (EN)**: Before the code block, add: "These prompts use the **second-argument range form** of `=AI()` introduced in lesson 2. The range after the comma is the grounding context: Gemini reads those cells and answers about them. This is faster and more accurate than building the prompt with `&` concatenation when you need Gemini to look at a whole block of data."
- **Proposed fix (HE)**: "ה-prompts האלה משתמשים ב**צורת ה-argument השני כטווח** של `=AI()` שהוצגה בשיעור 2. הטווח אחרי הפסיק הוא ה-grounding context: Gemini קורא את התאים האלה ועונה עליהם. זה מהיר ומדויק יותר מבניית prompt עם concatenation של `&` כשצריך ש-Gemini יסתכל על בלוק שלם של נתונים."
- **Where to insert**: After the "## Specific prompts that work" heading (EN line 25 / HE corresponding), before the code block (EN line 27 / HE corresponding).
- **Verification source**: lesson 2 of the same track, https://workspace.google.com/resources/spreadsheet-ai/

Note: this is more of a continuity/teaching gap than a UI-mechanic gap, but flagging it because the learner is expected to use a syntax that wasn't explicitly named.

---

### `scale/05-timesfm-forecasting` (HE + EN)

**Gap 4: The "Forecast" action is referenced but the actual UI path isn't shown**

- **What's mentioned**: "Click a Connected Sheets table tied to a BigQuery table (or extract). **Open the 'Forecast' action.** Pick the timestamp column..." (EN line 16–18). And: "you point at an extracted time series, **click Forecast**, and Sheets calls TimesFM..." (EN line 5).
- **What's missing**: The actual menu path. Per the February 2026 Workspace Updates blog, the path is **Connected Sheets Preview view → Advanced Analytics → Create a Forecast**. The lesson omits "Advanced Analytics" entirely, and the learner who opens their Connected Sheets extract is going to look for a literal "Forecast" button that isn't where the lesson implies.
- **Where in the lesson**: EN line 16–18 / HE line 16–18, section "## What TimesFM actually is".
- **Proposed fix (EN)**: Rewrite the numbered list as: "1. Open the Connected Sheets table tied to your BigQuery table (or extract). 2. Click **Preview** at the top to enter the Preview view. 3. Click **Advanced Analytics → Create a Forecast**. 4. Pick the timestamp column, the value column, the horizon (1 to 90 days), and the confidence level. 5. Click **Create**. 6. A new tab appears with the predicted values..."
- **Proposed fix (HE)**: "1. פותחים את ה-Connected Sheets table שמחובר ל-BigQuery table (או ל-extract). 2. לוחצים **Preview** בחלק העליון כדי להיכנס ל-Preview view. 3. לוחצים **Advanced Analytics → Create a Forecast**. 4. בוחרים את עמודת ה-timestamp, את עמודת הערך, את ה-horizon (1 עד 90 ימים), ואת ה-confidence level. 5. לוחצים **Create**. 6. טאב חדש מופיע עם הערכים החזויים..."
- **Where to insert**: Replace the existing 5-item numbered list at EN lines 16–20 / HE equivalent.
- **Verification source**: https://workspaceupdates.googleblog.com/2026/02/forecast-data-in-connected-sheets-BigQueryML-TimesFM.html

---

## Borderline cases

### `modeling/13-forms-sheets-pipeline` (HE + EN)

**Borderline 1: "Send to Sheets" linkage is named but its path isn't shown**

- **What's mentioned**: "When you create a Form and pick **'Send to Sheets'**, Sheets creates a new tab named `Form Responses 1`..." (EN line 10). Later: "the form owner needs to flip 'Collect email addresses' to on in the Form settings, not in Sheets" (EN line 89).
- **What's missing**: Where "Send to Sheets" lives (in Forms: **Responses tab → green Sheets icon**). And where "Collect email addresses" lives (in Forms: **Settings → Responses → Collect email addresses**).
- **Why borderline**: The assignment provisions a fresh Form Responses 1 tab automatically. The learner never has to actually create the Form or link it. The mechanics matter for real-world use but the lesson body and assignment together let the learner complete the lesson without performing the linkage. Flagging because a learner who tries to apply this lesson to a real Form will hit this gap immediately.
- **Where in the lesson**: EN line 10, line 89 / HE line equivalent.
- **Verification source**: https://support.google.com/docs/answer/2917686?hl=en (Forms → linking to Sheets)

---

### `apps-script/15-properties-and-cache` (HE + EN)

**Borderline 2: Setting Script Properties via the editor UI is named but not shown**

- **What's mentioned**: "Test it by opening the script editor and running the function once with the stores empty (you should get 3.7), then again after **setting `usdIlsRate` to `"3.85"` in Properties via the Apps Script console** (you should get 3.85..." (EN line 126). And: "Rotating the key is a one-line update via the editor's **Project settings → Script properties**; no code change." (EN line 130).
- **What's missing**: The actual click path to find the Script Properties UI in the modern Apps Script editor. The current path is the **gear icon (Project Settings) in the left rail → "Script Properties" section → "Add script property"**. The lesson names "Project settings → Script properties" but doesn't say where Project settings lives (the gear icon, not under any menu). Document Properties and User Properties cannot be set from a UI at all — they're code-only.
- **Why borderline**: The assignment doesn't strictly require the learner to use the UI (they can run a one-off function that calls `setProperty` programmatically). And the lesson's prose is mostly accurate. Just one extra sentence — "click the gear icon in the left rail to find Project Settings" — would close it. Borderline because the learner can complete the assignment without it, but a real-world script will hit this confusion.
- **Where in the lesson**: EN line 126 (the assignment instruction) and EN line 130 ("Used in the wild") / HE equivalent.
- **Verification source**: https://developers.google.com/apps-script/guides/properties

---

### `ai-in-sheets/04-build-and-edit` (HE + EN)

**Borderline 3: Apply/Discard buttons are referenced without UI hint**

- **What's mentioned**: "Apply commits. Discard goes back to the previous state. Iterating is fine: discard, refine the prompt, try again." (EN line 55).
- **What's missing**: Where the Apply/Discard buttons sit in the proposal review UI. Per current Sheets UI, they appear at the bottom of the side panel's proposal pane.
- **Why borderline**: This is fully a function of Gap 2 above. If the learner is shown how to open the side panel, the Apply/Discard buttons become discoverable. Adding this detail would be over-specification. The fix for Gap 2 covers this naturally.
- **Where in the lesson**: EN line 55 / HE equivalent.
- **Verification source**: https://support.google.com/docs/answer/14218565?hl=en

---

## Files scanned but clean

### formulas/ (Track 1)

All 28 lessons in this track are formula-syntax-based; formula syntax is the mechanic. The few non-formula references are addressed inline:
- `01-grid-model`: Named ranges path `Data > Named ranges` shown (EN line 106 / HE line 106) — exactly the gap the user originally flagged is actually closed.
- `04-lookups`: References IMPORTRANGE-hosted lookup tables in passing; defers to lesson 27.
- `17-tables`: `Format → Convert to table` path shown (EN line 12).
- `27-import-family`: IMPORTRANGE "Allow access" pill explained in detail.

All other formulas-track lessons are clean.

### modeling/ (Track 2)

- `01-workbook-structure`: conceptual, no UI mechanic gaps.
- `02-pivot-tables-basics`: `Insert → Pivot table` shown (EN line 22); `Values → Add → Calculated field` shown (EN line 43).
- `03-pivot-tables-in-depth`: `Data → Slicer` shown (EN line 24); date grouping via right-click → `Create pivot group rule → Group by date` shown (EN line 41).
- `04-data-validation`: `Data → Data validation` shown (EN line 9).
- `05-smart-chips`: `@`-mention pattern explained throughout.
- `06-conditional-formatting`: `Format → Conditional formatting` shown (EN line 10).
- `07-protected-ranges`: `Data → Protect sheets and ranges` shown (EN line 10).
- `08-filter-views`: `Data → Create a filter view` shown (EN line 9).
- `09-charts-choosing`: Anchor / `Move chart to own sheet` mentioned via right-click (EN line 34). Insert path is implicit but the lesson is paired with lesson 10 which goes into Chart editor depth.
- `10-charts-customization`: `Chart editor → Customize → Chart & axis titles` and `Customize → Series` shown explicitly (EN lines 11, 24).
- `11-charts-for-reports`: `Insert → Chart → From Sheets → Link to spreadsheet` and `Download → PNG/PDF/SVG` shown (EN lines 35, 52–56).
- `12-sharing-permissions`: `File → Share` shown (EN line 9); `Editors can change permissions and share` setting under the gear shown (EN line 92).
- `14-data-cleanup-recipes`: pure formula work.
- `15-number-formatting`: `Format → Number → Currency` and `Format → Number → Custom number format` shown (EN lines 64–65).
- `16-sheet-linking`: `Insert → Link` and `Ctrl+K` shown (EN line 13).
- `17-comments-and-notes`: `Insert → Note (Ctrl+Alt+M)` shown (EN line 13).
- `18-performance-hygiene`: conceptual, paired with formula lesson 28.

### apps-script/ (Track 3)

- `01-editor-and-project`: `Extensions → Apps Script` shown (EN line 9); `Project Settings → Show appsscript.json manifest file in editor` shown (EN line 29); `File → See version history` via Project Settings shown (EN line 102).
- `02-execution-model`: conceptual, OAuth scopes covered in code.
- `03-custom-functions`: Run dropdown explained (EN line 71); Execution log noted (EN line 154).
- `04-spreadsheetapp`: Run / paste / Run dropdown explained (EN line 116).
- `05-menus-and-dialogs`: Run dropdown and toolbar menu placement explained (EN lines 23, 122).
- `06-macros`: `Extensions → Macros → Manage macros → Add new macro` shown (EN line 66); `Tools → Macros` shown (EN line 70); `Extensions → Macros → Record macro` shown (EN line 11).
- `07-simple-triggers`: **Executions** view via clock icon in left rail shown (EN line 101).
- `08-installable-triggers`: `Edit → Current project's triggers` and clock icon path shown (EN line 72, line 118).
- `09-sidebars-and-dialogs`: HTML file naming in editor explained (EN line 30).
- `10-workspace-integrations`: OAuth scope prompts described.
- `11-external-apis`: `PropertiesService` access via code shown (worth noting Gap 2 above applies here too in passing, but lesson 15 is the primary teaching surface).
- `12-libraries-and-deployments`: `Deploy → New deployment` and old `Resources → Libraries dialog` shown (EN line 92); the latter is slightly stale (now under the `+` icon in left rail Libraries panel) but the modern path is named in lesson 17 with `Services → +`, so the learner has both surfaces.
- `13-web-apps`: `Deploy → New deployment → Web app` and `Deploy → Manage deployments → New version` shown explicitly (EN lines 64, 87).
- `14-logging-and-errors`: Executions icon (clock with arrow) in left rail shown (EN line 16); severity filter and Cloud Logging explained.
- `16-quotas-and-batching`: conceptual / formula-adjacent.
- `17-advanced-sheets-service`: `Services → + → Google Sheets API → Add` shown (EN line 24).

### scale/ (Track 4)

- `01-cell-limit`: `File > Settings > Spreadsheet stats` shown (EN line 31).
- `02-why-its-slow`: conceptual / formula-adjacent.
- `03-importrange-patterns`: formula-focused.
- `04-connected-sheets-bigquery`: `Data > Data connectors > Connect to BigQuery` shown (EN line 19).
- `06-diagnosing-ref-na`: formula-focused.
- `07-diagnosing-circular`: formula-focused.
- `08-diagnosing-broken-importrange`: "Allow access" pill described (EN line 24, 33).
- `09-slow-apps-script`: conceptual / formula-adjacent.
- `10-recovery-and-versions`: `File > Version history > See version history` shown with shortcut `Ctrl/Cmd + Alt + Shift + H` (EN line 13); `File > Version history > Name current version` shown (EN line 23); restore / copy-back flows fully explained.
- `11-broken-sheet-clinic`: conceptual.

### ai-in-sheets/ (Track 5)

- `02-ai-function`: `=AI()` signature fully taught.
- `03-fill-with-gemini`: **right-click → Fill with Gemini** shown explicitly (EN line 11).
- `06-when-not-to-use`: policy / decision-tree content, no UI mechanic gaps.

---

## Verification notes

All proposed paths were verified against Google's official documentation in 2026:

- **Ask Gemini side panel**: confirmed via https://support.google.com/docs/answer/14218565?hl=en — top-right "Ask Gemini" button, keyboard shortcuts `Ctrl+Alt+G` (formula generation) and `Ctrl+Alt+N` (summarization). The lesson's existing references to "side panel" align with this UI.
- **TimesFM Forecast**: confirmed via https://workspaceupdates.googleblog.com/2026/02/forecast-data-in-connected-sheets-BigQueryML-TimesFM.html — path is **Connected Sheets Preview view → Advanced Analytics → Create a Forecast**. The lesson omits "Advanced Analytics" in the chain.
- **Apps Script Properties UI**: confirmed via https://developers.google.com/apps-script/guides/properties — Script Properties has a UI under Project Settings (gear icon in left rail). Document Properties and User Properties are code-only. The lesson's wording is technically accurate but the gear-icon hint would prevent confusion.
- **Forms → Send to Sheets**: this path is owned by Google Forms, not Sheets. Current path in Forms: **Responses tab → green Sheets icon**. The lesson borders on out-of-scope but a sentence pointing the learner to Forms would close the loop.
