# Hebrew translation glossary — Sheets Guide

This file is binding. Every Hebrew lesson in `content/he/` follows it. Update it here, never invent terms per lesson.

---

## Voice and register

- **Spelling:** ktiv maleh (full spelling). תוכנה not תכנה. שירות not שרות. Follow Academy of the Hebrew Language guidelines.
- **Register:** business-casual. Like an experienced Israeli media buyer explaining a thing to a peer. Not textbook, not formal/legal.
- **Gender-neutral phrasing** wherever it reads naturally. Prefer `יש ללחוץ` over `אתה צריך ללחוץ`, `ניתן לבחור` over `אתה יכול לבחור`. When unavoidable, default to plural masculine (Israeli tech default). Never use slash forms like `משתמשים/ות`.
- **No literal translations of English idioms.** "Walks off the bottom" → `יוצא מהטווח`, not a calque. "Source of broken formulas" → `סיבה שכיחה לשבירת נוסחאות`. "Stack of grids" → don't translate, rephrase entirely (`אוסף של גיליונות, וכל גיליון הוא רשת של תאים`).
- **Test every metaphor.** If you wrote a Hebrew metaphor that an Israeli wouldn't recognize, the English idiom leaked through. Replace it with a literal explanation, not another metaphor.
- **Sentence rhythm:** vary length. Hebrew tech writing benefits from short, declarative sentences after a longer setup. Don't ladder three-item lists in every paragraph.
- **No em dashes, no smart quotes.** Use a comma, a period, or split the sentence.

---

## What stays in Latin (mandatory)

These tokens NEVER get translated, transliterated, or translated-and-back. They appear in Hebrew prose exactly as a learner would see them in Google Sheets and in this team's actual workbooks.

**Function names:** `VLOOKUP`, `HLOOKUP`, `XLOOKUP`, `INDEX`, `MATCH`, `IF`, `IFS`, `SWITCH`, `IFERROR`, `IFNA`, `SUM`, `SUMIF`, `SUMIFS`, `AVERAGE`, `COUNTIF`, `COUNTIFS`, `ARRAYFORMULA`, `QUERY`, `FILTER`, `SORT`, `UNIQUE`, `SPLIT`, `JOIN`, `TEXTJOIN`, `FLATTEN`, `REGEXMATCH`, `REGEXEXTRACT`, `REGEXREPLACE`, `LAMBDA`, `MAP`, `REDUCE`, `SCAN`, `BYROW`, `BYCOL`, `MAKEARRAY`, `LET`, `IMPORTRANGE`, `IMPORTHTML`, `IMPORTDATA`, `IMPORTXML`, `INDIRECT`, `OFFSET`, `SEQUENCE`, `RANDARRAY`, `SPARKLINE`, `TODAY`, `NOW`, `EOMONTH`, `NETWORKDAYS`, `DATEDIF`, `LEFT`, `RIGHT`, `MID`, `FIND`, `SUBSTITUTE`, every other Sheets function name.

**Formulas:** `=$E$5`, `=F2-E2`, `=F2*$J$1`, `=ARRAYFORMULA(...)`, `=QUERY(...)`. Always Latin, always in code formatting (backticks in MDX, `<code>` in HTML). Never reorder under RTL.

**Cell addresses and ranges:** `B5`, `E2:E13`, `J1`, `H2:H100`, `B:B`. Always Latin.

**Dataset names — buyers, verticals, platforms:** Yoav Cohen, Dina Dayan, Maya Bar, Eitan Kohen, Roni Levi, Ben Nahum, Gal Vered, Shira Hadad — the synthesized Israeli buyer roster, each with a 2-letter prefix. Vertical names like `"Car Deals PR"`, `"Cruises PR"`, `"Hearing Aids PR"`, `"Online MBA PR"` come from the team's offer-naming sheet; each vertical has a 4-letter prefix (`card`, `crui`, `hear`, `onmb`). Platforms: Taboola, Outbrain, MediaGo, Poppin, Facebook, TikTok, Google. The `" PR"` suffix on every vertical is team convention per CLAUDE.md and never gets translated.

**Adtech jargon:** ROI, CPC, EPC, CPM, CTR, ROAS, vertical, campaign, media buyer, pixel, conversion, landing page, creative, bid, native, programmatic.

**Sheets-specific UI labels** that the learner sees in the Google Sheets product UI (because the product itself is in English in this team's workspace): `Named ranges`, `Data validation`, `Conditional formatting`, `Pivot table`, `Apps Script`, `Editors`, `Connected Sheets`. If the learner's actual UI is in Hebrew elsewhere, this list flexes — confirm with the learner before changing.

**Common transliterated tech terms** that read more natural in Latin in Israeli adtech speech: `dashboard`, `lookup`, `query` (when the function is meant), `template`, `runtime`, `sandbox`. These can be wrapped with definite article: `ה-dashboard`, `ה-template`.

---

## What gets translated

- All explanatory prose.
- Headings (with the function-name in Latin where it appears).
- Quiz questions, options, and explanations.
- "Used in the wild" and "Pro pitfalls" sections.
- Component captions, hints, and tasks.
- Error messages and feedback details.
- Lesson titles, track labels, taglines.

---

## Term table

Use this exactly. New terms get added here, not invented per lesson.

### Spreadsheet structure

| English | Hebrew | Notes |
|---|---|---|
| spreadsheet (file) | spreadsheet | stays Latin. Israeli tech offices say `spreadsheet`, not חוברת עבודה. Use with definite article: `ה-spreadsheet` |
| workbook | spreadsheet | Israelis don't really distinguish workbook from spreadsheet — collapse to one term |
| sheet (tab) | גיליון | the individual tab inside a spreadsheet |
| cell | תא | |
| row | שורה | |
| column | עמודה | |
| range | טווח | |
| named range | named range / טווח בעל שם | hybrid reads natural; the UI label in Hebrew Sheets is the latter |
| header / header row | כותרת / שורת כותרת | |
| grid | רשת | only when literally describing the row/column layout of one sheet — never as a metaphor for the whole spreadsheet |
| address | כתובת | "address of the cell" → `הכתובת של התא` |

### Formulas and references

| English | Hebrew | Notes |
|---|---|---|
| formula | נוסחה | the formula text itself stays in Latin |
| reference | reference / הפניה | both work; lean on `reference` in code-adjacent prose |
| absolute reference | reference מוחלט | hybrid reads natural |
| relative reference | reference יחסי | |
| mixed reference | reference מעורב | |
| pin / lock (a reference) | לנעול | not "ל-pin" |
| copy down (fill) | למלא למטה | not "להעתיק למטה" |
| spill / spill range | spill / טווח spill | leave `spill` Latin; the concept doesn't have a settled Hebrew term |
| array formula | array formula / נוסחת מערך | both readable |
| volatile function | פונקציה תנודתית | established technical term |
| recalculation | חישוב מחדש | |

### Data and analysis

| English | Hebrew | Notes |
|---|---|---|
| lookup | lookup | leave Latin |
| lookup table | טבלת lookup | hybrid |
| pivot table | Pivot table | leave Latin since it's the Sheets UI term too |
| filter | filter / לסנן (verb) | use Latin for the function, Hebrew for the verb |
| sort | למיין (verb) / sort | |
| aggregation | אגרגציה | "צבירה" feels academic |
| dashboard | dashboard | |
| data model / model | מודל נתונים | |
| join (data) | join | |

### Things that go wrong

| English | Hebrew | Notes |
|---|---|---|
| error | שגיאה | |
| broken formula | נוסחה שבורה | |
| circular reference | reference מעגלי / circular reference | both work |
| #REF! | `#REF!` | Latin, in code |
| #N/A | `#N/A` | Latin, in code |
| recalc lag / slow recalc | חישוב איטי | |
| edge case | edge case | leave Latin |

### Adtech metrics and roles

(Most of these stay Latin per the section above. This row exists to mark them.)

| English | Hebrew rendering | Notes |
|---|---|---|
| ROI | ROI | always Latin |
| CPC | CPC | always Latin |
| EPC | EPC | always Latin |
| ROAS | ROAS | always Latin |
| profit | רווח | translate freely |
| revenue | revenue | leave Latin in technical contexts; `revenue` is what Israeli media buyers say. `הכנסה` is fine in pure prose if it reads more natural. |
| spend | spend | leave Latin. Israeli media buyers say `spend`, not `הוצאה`. |
| media buyer | media buyer | **Latin, not transliterated.** Israelis say "media buyer" in English mid-Hebrew sentence. With definite article: `ה-media buyer`. Plural: `media buyers`. |
| vertical | vertical | **Latin, not transliterated.** With definite article: `ה-vertical`. Plural: `verticals`. |
| campaign | קמפיין | this one IS naturalized in Hebrew; use `קמפיין` (with prefixes: הקמפיין, קמפיינים, של הקמפיין) |
| platform | פלטפורמה | naturalized in Hebrew |

### Pedagogy

| English | Hebrew | Notes |
|---|---|---|
| lesson | שיעור | |
| assignment / exercise | תרגיל | |
| solution | פתרון | |
| hint | רמז | |
| explanation | הסבר | |
| pro pitfalls | מלכודות מקצועיות | section heading |
| used in the wild | נפוץ בשטח | section heading; "from the field" feel |
| now do it for real | עכשיו לעבודה אמיתית | closing CTA |

---

## Sentence openers and pronouns

- **Don't open a sentence with a bare directional adverb** like `למטה`. It feels translated and awkward. Use `בדוגמה שלמטה`, `בטבלה שלמטה`, `בתמונה שלמטה`, depending on what's actually below — even if the English just said "Below,". The skeleton is `ב{noun} שלמטה` or `ב{noun} שלמעלה`.
- **`למטה` as a direction** (e.g. `גוררים למטה`, `מעתיקים למטה`, `אם תעתיקו אותה למטה לאורך שורות`) is fine. The rule above is only about sentence-opening usage.
- **`אתם` / `אתן` / `אתה`** — avoid. Prefer impersonal phrasing (`יש ל...`, `מקלידים את...`, `כותבים את...`) per the gender-neutral guideline above.

## Bidi rules (mechanical, every translator must follow)

1. **Inline code (`<code>` / backticks) auto-flips to LTR** via `globals.css`. Don't fight it. `=$E$5` inside Hebrew prose is just `\`=$E$5\`` and the browser handles direction.
2. **Numbers inside Hebrew prose render LTR by default.** No special handling needed for prices, percentages, row counts.
3. **English words inline in Hebrew prose** (function names spoken-of without code formatting, English vertical names, platform names) — the bidi algorithm handles them. Wrap in `<bdi>` or `dir="ltr"` only if the surrounding punctuation reorders weirdly.
4. **Tables (Markdown `|` tables) work in RTL automatically.** Cell content keeps its own direction; column order does NOT flip — first column is still first column visually (but in RTL that's the right edge).
5. **Cell addresses in prose** (e.g., "the formula in B5") — code-formatted: `התא ב-\`B5\``. Don't write the address bare; format it.

---

## Examples from a translated paragraph

EN:
> When you write `=E2` somewhere, you're storing a *reference* to the cell, not a copy of its value. If `E2` (the spend on the first campaign) changes, your formula updates.

HE (correct):
> כשכותבים `=E2` באיזשהו תא, מה שמאוחסן הוא ה-reference לתא, לא העתק של הערך. אם `E2` (ה-spend של הקמפיין הראשון) משתנה, הנוסחה שלך מתעדכנת.

HE (wrong — overtranslated):
> כאשר כותבים `=E2` באיזשהו תא, מאוחסנת הפנייה אל התא, לא העתק של ערכו. אם `E2` (ההוצאה על הקמפיין הראשון) משתנה, הנוסחה שלך מתעדכנת.

The first reads like an Israeli media buyer wrote it. The second reads like a translation of a textbook.

---

## Adding new terms

When a lesson introduces a term not on this list:
1. Decide: does Israeli adtech actually have a settled Hebrew term, or is the Latin in common use? (Asking a real Israeli media buyer beats guessing.)
2. Write the term down in this file under the right section.
3. Use it consistently from then on.

Disagreements between this file and a lesson — the file wins. Push the change to the file first.
