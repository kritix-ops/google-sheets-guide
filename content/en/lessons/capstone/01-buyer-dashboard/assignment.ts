import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type {
  AssignmentSpec,
  Rule,
  SeedScriptFile,
} from "@/lib/grading/types";

// ---------------------------------------------------------------------------
// Synthesis capstone: build a buyer dashboard end-to-end.
//
// Unlike the diagnostic capstone in Track 4 lesson 11 (broken-sheet clinic),
// this capstone is a build: the learner assembles a dashboard from five
// pieces that span Tracks 1-5.
//
// Layout (Dashboard tab):
//   Column A: Date    Column B: Buyer    Column C: Vertical
//   Column D: Platform Column E: Country Column F: Spend  Column G: Revenue
//   Column J (aggregation):
//     J1 = the QUERY that joins the two raw-platform pulls into a per-buyer,
//          per-vertical, per-day cube (Track 1, lessons 12-13)
//   Column L (IMPORTRANGE pulls from raw platform feeds — Track 4 lesson 3, 8):
//     L1 = IMPORTRANGE(taboola_url, "Taboola_Raw!A1:G500")
//     L2 = IMPORTRANGE(outbrain_url, "Outbrain_Raw!A1:G500")
//   Column N (scorecard tiles — Track 2 lessons 9-11):
//     N1 = this-week Spend  (SUMIFS-based)
//     N2 = this-week Revenue
//     N3 = this-week ROI
//   Column P (Apps Script footer):
//     P1 = AI weekly summary cell with =AI() grounded on the aggregated week
// Buyer_Pivot tab (separate sheet):
//   Pivot anchored at A1, source Dashboard!A1:G61, Buyer on rows, Vertical
//   on columns, SUM(Spend) and a CUSTOM ROI calculated field as values.
// _AILog tab (audit-trail sentinel — Track 5 lesson 6):
//   Header row + at least one logged AI run.
// ---------------------------------------------------------------------------

const ROWS = CAMPAIGNS_LARGE.slice(1);
const ROW_COUNT = ROWS.length;
const DATA_RANGE_END = `G${ROW_COUNT + 1}`;

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContains(actual: string | null, needle: string): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return normalized.includes(needle.toUpperCase());
}

function rawFormulaContainsCi(
  formula: string | null,
  needle: string,
): boolean {
  if (formula == null) return false;
  return formula.toLowerCase().includes(needle.toLowerCase());
}

// Rule 1: IMPORTRANGE pulling Taboola raw feed at L1. We accept any URL
// containing /spreadsheets/d/ because the learner could be pointing at any
// source workbook; the lesson cares that the IMPORTRANGE pattern is used,
// not that a specific id is hardcoded.
const importrangeTaboola: Rule = {
  id: "l1-importrange-taboola",
  label: "L1 pulls Taboola raw daily data via IMPORTRANGE",
  labelHe: "התא L1 מושך נתוני Taboola גולמיים דרך IMPORTRANGE",
  answer:
    '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/TABOOLA_RAW_ID/edit", "Taboola_Raw!A1:G500")',
  async run(sheet) {
    const formula = await sheet.cellFormula("L1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "L1 is empty. Pull the Taboola raw feed with `=IMPORTRANGE(\"https://docs.google.com/spreadsheets/d/TABOOLA_RAW_ID/edit\", \"Taboola_Raw!A1:G500\")`. Two source workbooks feed this dashboard; this is the first.",
        detailHe:
          "L1 ריק. מושכים את ה-feed של Taboola עם `=IMPORTRANGE(\"https://docs.google.com/spreadsheets/d/TABOOLA_RAW_ID/edit\", \"Taboola_Raw!A1:G500\")`. שני workbooks מקור מזינים את ה-dashboard, זה הראשון.",
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `L1 contains \`${formula}\`. Use \`IMPORTRANGE\` — the dashboard reads from a separate raw-feed workbook, which is the case IMPORTRANGE exists for. Track 4 lesson 3 covers the pattern.`,
        detailHe: `L1 מכיל \`${formula}\`. משתמשים ב-\`IMPORTRANGE\` — ה-dashboard קורא מ-workbook נפרד של ה-feed הגולמי, וזה בדיוק המקרה ש-IMPORTRANGE קיים בשבילו. Track 4 שיעור 3 מכסה את הדפוס.`,
      };
    }
    if (!rawFormulaContainsCi(formula, "Taboola")) {
      return {
        passed: false,
        detail: `L1 contains \`${formula}\` but doesn't mention "Taboola" in the range argument. The second argument is \`"Taboola_Raw!A1:G500"\` — the tab name in the upstream source workbook tells anyone reading the formula which platform feeds this cell.`,
        detailHe: `L1 מכיל \`${formula}\` אבל לא מזכיר "Taboola" בארגומנט הטווח. הארגומנט השני הוא \`"Taboola_Raw!A1:G500"\` — שם ה-tab ב-workbook המקור אומר לכל מי שקורא את הנוסחה איזה platform מזין את התא.`,
      };
    }
    if (!/\/spreadsheets\/d\//i.test(formula)) {
      return {
        passed: false,
        detail: `L1 contains \`${formula}\` but the first argument doesn't look like a Sheets URL. IMPORTRANGE takes a full URL or a bare spreadsheet id; the lesson uses the full URL form so the source is greppable: \`"https://docs.google.com/spreadsheets/d/TABOOLA_RAW_ID/edit"\`.`,
        detailHe: `L1 מכיל \`${formula}\` אבל הארגומנט הראשון לא נראה כמו URL של Sheets. IMPORTRANGE מקבל URL מלא או id של spreadsheet; השיעור משתמש ב-URL מלא כך שהמקור ניתן ל-grep: \`"https://docs.google.com/spreadsheets/d/TABOOLA_RAW_ID/edit"\`.`,
      };
    }
    return { passed: true };
  },
};

const importrangeOutbrain: Rule = {
  id: "l2-importrange-outbrain",
  label: "L2 pulls Outbrain raw daily data via IMPORTRANGE",
  labelHe: "התא L2 מושך נתוני Outbrain גולמיים דרך IMPORTRANGE",
  answer:
    '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/OUTBRAIN_RAW_ID/edit", "Outbrain_Raw!A1:G500")',
  async run(sheet) {
    const formula = await sheet.cellFormula("L2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "L2 is empty. Pull the Outbrain raw feed with a second `IMPORTRANGE` call. The dashboard joins the two platform feeds — both have to be present before the aggregation in J1 has anything to operate on.",
        detailHe:
          "L2 ריק. מושכים את ה-feed של Outbrain עם קריאת `IMPORTRANGE` שנייה. ה-dashboard מאחד את שני ה-feeds — שניהם צריכים להיות נוכחים לפני שלאגרגציה ב-J1 יש על מה לעבוד.",
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `L2 contains \`${formula}\`. Use \`IMPORTRANGE\` here too — the second feed is the same pattern as the first, pointed at the Outbrain source workbook.`,
        detailHe: `L2 מכיל \`${formula}\`. משתמשים ב-\`IMPORTRANGE\` גם כאן — ה-feed השני הוא אותו דפוס כמו הראשון, מופנה ל-workbook המקור של Outbrain.`,
      };
    }
    if (!rawFormulaContainsCi(formula, "Outbrain")) {
      return {
        passed: false,
        detail: `L2 contains \`${formula}\` but doesn't mention "Outbrain". The range argument should be \`"Outbrain_Raw!A1:G500"\` so the source platform is named in the formula.`,
        detailHe: `L2 מכיל \`${formula}\` אבל לא מזכיר "Outbrain". ארגומנט הטווח צריך להיות \`"Outbrain_Raw!A1:G500"\` כך ש-platform המקור נקרא בנוסחה.`,
      };
    }
    return { passed: true };
  },
};

// Rule 2: aggregation QUERY at J1. Per-buyer, per-vertical, per-day cube.
const aggregationQuery: Rule = {
  id: "j1-aggregation-query",
  label:
    "J1 aggregates the raw feed into a per-buyer, per-vertical, per-day cube with QUERY",
  labelHe:
    "התא J1 מאגד את ה-feed הגולמי לקובייה של buyer x vertical x day עם QUERY",
  answer:
    "=QUERY(A1:G" + (ROW_COUNT + 1) +
    ', "SELECT A, B, C, SUM(F), SUM(G) WHERE A IS NOT NULL GROUP BY A, B, C LABEL SUM(F) \'Spend\', SUM(G) \'Revenue\'", 1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Write a `QUERY` that GROUPs by Date, Buyer, and Vertical and SUMs Spend and Revenue. Track 1 lesson 13 covers the SELECT/GROUP BY shape.",
        detailHe:
          "J1 ריק. כותבים `QUERY` שמקבץ לפי Date, Buyer ו-Vertical ומסכם Spend ו-Revenue. Track 1 שיעור 13 מכסה את הצורה של SELECT/GROUP BY.",
      };
    }
    if (!formulaContains(formula, "QUERY")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use the \`QUERY\` function. The aggregation has to happen in one formula so the dashboard recalculates atomically; a chain of SUMIFS would scatter the logic across many cells and break under refresh.`,
        detailHe: `J1 מכיל \`${formula}\`. משתמשים בפונקציה \`QUERY\`. האגרגציה צריכה לקרות בנוסחה אחת כדי שה-dashboard יחושב מחדש אטומית; שרשרת של SUMIFS תפזר את הלוגיקה על תאים רבים ותישבר תחת refresh.`,
      };
    }
    const hasGroupBy = rawFormulaContainsCi(formula, "GROUP BY");
    if (!hasGroupBy) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\` but no \`GROUP BY\` clause. The per-buyer-per-vertical cube needs aggregation; without GROUP BY the QUERY returns rows, not a cube.`,
        detailHe: `J1 מכיל \`${formula}\` אבל בלי clause של \`GROUP BY\`. הקובייה לפי buyer x vertical צריכה אגרגציה; בלי GROUP BY ה-QUERY מחזיר שורות, לא קובייה.`,
      };
    }
    const hasSumSpend =
      rawFormulaContainsCi(formula, "SUM(F)") ||
      rawFormulaContainsCi(formula, "SUM(SPEND)");
    const hasSumRevenue =
      rawFormulaContainsCi(formula, "SUM(G)") ||
      rawFormulaContainsCi(formula, "SUM(REVENUE)");
    if (!hasSumSpend || !hasSumRevenue) {
      const missing: string[] = [];
      if (!hasSumSpend) missing.push("SUM(F) for Spend");
      if (!hasSumRevenue) missing.push("SUM(G) for Revenue");
      return {
        passed: false,
        detail: `J1 contains \`${formula}\` but the SELECT is missing: ${missing.join(", ")}. The cube needs both Spend and Revenue summed per group; otherwise the scorecard tiles below have nothing to read.`,
        detailHe: `J1 מכיל \`${formula}\` אבל ב-SELECT חסרים: ${missing.join(", ")}. הקובייה צריכה גם Spend וגם Revenue מסוכמים לכל קבוצה; אחרת ל-scorecard tiles למטה אין מה לקרוא.`,
      };
    }
    return { passed: true };
  },
};

// Rule 3: Buyer_Pivot tab has a pivot anchored at A1 with at least one
// calculated field (ROI). The pivot reads from the Dashboard sheet.
const pivotExists: Rule = {
  id: "buyer-pivot-with-calculated-field",
  label:
    "Buyer_Pivot!A1 anchors a pivot with at least one CUSTOM calculated field (ROI)",
  labelHe:
    "Buyer_Pivot!A1 מעגן pivot עם לפחות שדה calculated מסוג CUSTOM (ROI)",
  answer:
    "Insert → Pivot table → New sheet 'Buyer_Pivot'. Rows: Buyer. Columns: Vertical. Values: SUM Spend, SUM Revenue, and a Calculated field formula `=('Revenue' - 'Spend') / 'Spend'` for ROI.",
  async run(sheet) {
    const titles = await sheet.sheetTitles();
    if (!titles.includes("Buyer_Pivot")) {
      return {
        passed: false,
        detail:
          "No `Buyer_Pivot` tab found. Insert → Pivot table → New sheet, name it `Buyer_Pivot`, anchor it at A1.",
        detailHe:
          "לא נמצא tab בשם `Buyer_Pivot`. Insert → Pivot table → New sheet, נותנים לו את השם `Buyer_Pivot`, מעגנים ב-A1.",
      };
    }
    const pt = await sheet.cellPivotTable("Buyer_Pivot!A1");
    if (pt == null) {
      return {
        passed: false,
        detail:
          "`Buyer_Pivot!A1` exists but is not the anchor of a pivot table. Re-create the pivot with A1 as its top-left.",
        detailHe:
          "`Buyer_Pivot!A1` קיים אבל הוא לא העוגן של pivot table. בונים מחדש את ה-pivot כאשר A1 הוא הפינה השמאלית-עליונה שלו.",
      };
    }
    // Buyer is column B in the source = 0-indexed column 1.
    const hasBuyerOnRows = pt.rows.some((g) => g.sourceColumn === 1);
    if (!hasBuyerOnRows) {
      const cols = pt.rows.map((g) => g.sourceColumn).join(", ") || "none";
      return {
        passed: false,
        detail: `The pivot's Rows reference source column(s) ${cols}. Buyer (column B, offset 1) should be on Rows so each buyer gets one line in the dashboard view.`,
        detailHe: `שורות ה-pivot מצביעות על column(s) ${cols}. Buyer (עמודה B, offset 1) צריך להיות ב-Rows כך שכל buyer מקבל שורה אחת ב-view של ה-dashboard.`,
      };
    }
    const hasCalculated = pt.values.some(
      (v) => v.summarize === "CUSTOM" && v.formula != null,
    );
    if (!hasCalculated) {
      return {
        passed: false,
        detail:
          "The pivot has no CUSTOM calculated field. Add one for ROI: Pivot editor → Values → Add → Calculated field, formula `=('Revenue' - 'Spend') / 'Spend'`. ROI can't be averaged by buyer correctly; it has to be derived from the summed totals, which is exactly what calculated fields do.",
        detailHe:
          "ל-pivot אין שדה calculated מסוג CUSTOM. מוסיפים אחד ל-ROI: Pivot editor → Values → Add → Calculated field, נוסחה `=('Revenue' - 'Spend') / 'Spend'`. אי אפשר לחשב ROI נכון כממוצע לפי buyer; חייבים לגזור אותו מהסיכומים, וזה בדיוק מה ש-calculated fields עושים.",
      };
    }
    return { passed: true };
  },
};

// Rule 4: ROI column on Buyer_Pivot has a color-scale (gradient) conditional
// format. The exact column letter depends on how the pivot lays out, so we
// look for ANY gradient rule on the Buyer_Pivot sheet.
const roiColorScale: Rule = {
  id: "roi-color-scale",
  label:
    "Buyer_Pivot has a color-scale (gradient) conditional format on the ROI column",
  labelHe:
    "ל-Buyer_Pivot יש כלל conditional formatting מסוג gradient על עמודת ROI",
  answer:
    "Format → Conditional formatting → Color scale → applied to the ROI column on Buyer_Pivot, mid-point 1.0.",
  async run(sheet) {
    const rules = await sheet.conditionalFormats("Buyer_Pivot");
    const gradientRules = rules.filter((r) => r.variant === "gradient");
    if (gradientRules.length === 0) {
      return {
        passed: false,
        detail:
          "No gradient (color-scale) conditional format on `Buyer_Pivot`. Apply one to the ROI column: Format → Conditional formatting → Color scale. Set the mid-point to 1.0 — that's breakeven; values above it are profitable, below are not.",
        detailHe:
          "אין conditional formatting מסוג gradient (color scale) ב-`Buyer_Pivot`. מחילים אחד על עמודת ROI: Format → Conditional formatting → Color scale. מגדירים את ה-mid-point ל-1.0 — זה ה-breakeven, ערכים מעליו רווחיים, מתחת לא.",
      };
    }
    return { passed: true };
  },
};

// Rule 5: three SUMIFS-based scorecard tiles at N1, N2, N3. We accept SUMIFS
// (or SUMIF) — the lesson teaches SUMIFS but a learner who reaches for
// SUMIF for a single-condition scorecard isn't wrong.
const scorecardSpend: Rule = {
  id: "n1-scorecard-spend",
  label: "N1 is a SUMIFS-based this-week Spend scorecard",
  labelHe: "התא N1 הוא scorecard של this-week Spend מבוסס SUMIFS",
  answer: `=SUMIFS(F2:${DATA_RANGE_END}, A2:A${ROW_COUNT + 1}, ">="&TODAY()-7)`,
  async run(sheet) {
    const formula = await sheet.cellFormula("N1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "N1 is empty. The first scorecard tile is this-week Spend. Write a `SUMIFS` that sums column F where the Date in column A is within the last 7 days. Track 2 lessons 9-11 cover the scorecard pattern.",
        detailHe:
          "N1 ריק. אריח ה-scorecard הראשון הוא Spend השבוע. כותבים `SUMIFS` שמסכם את עמודה F כש-Date בעמודה A הוא ב-7 הימים האחרונים. Track 2 שיעורים 9-11 מכסים את דפוס ה-scorecard.",
      };
    }
    if (
      !formulaContains(formula, "SUMIFS") &&
      !formulaContains(formula, "SUMIF")
    ) {
      return {
        passed: false,
        detail: `N1 contains \`${formula}\`. Use \`SUMIFS\` (or \`SUMIF\` if a single condition is enough). A raw \`SUM\` won't filter by date, and the tile has to show this-week, not all-time.`,
        detailHe: `N1 מכיל \`${formula}\`. משתמשים ב-\`SUMIFS\` (או \`SUMIF\` אם תנאי אחד מספיק). \`SUM\` גולמי לא יסנן לפי תאריך, וה-tile צריך להראות את השבוע, לא את כל הזמן.`,
      };
    }
    if (!formulaContains(formula, "F2:")) {
      return {
        passed: false,
        detail: `N1 contains \`${formula}\` but doesn't reference the Spend range \`F2:${DATA_RANGE_END}\`. The first argument to SUMIFS is the range to sum; column F is Spend.`,
        detailHe: `N1 מכיל \`${formula}\` אבל לא מפנה לטווח ה-Spend \`F2:${DATA_RANGE_END}\`. הארגומנט הראשון ל-SUMIFS הוא הטווח שמסכמים; עמודה F היא Spend.`,
      };
    }
    return { passed: true };
  },
};

const scorecardRevenue: Rule = {
  id: "n2-scorecard-revenue",
  label: "N2 is a SUMIFS-based this-week Revenue scorecard",
  labelHe: "התא N2 הוא scorecard של this-week Revenue מבוסס SUMIFS",
  answer: `=SUMIFS(G2:G${ROW_COUNT + 1}, A2:A${ROW_COUNT + 1}, ">="&TODAY()-7)`,
  async run(sheet) {
    const formula = await sheet.cellFormula("N2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "N2 is empty. The second scorecard tile is this-week Revenue. Same shape as N1 but on column G.",
        detailHe:
          "N2 ריק. אריח ה-scorecard השני הוא Revenue השבוע. אותה צורה כמו N1 אבל על עמודה G.",
      };
    }
    if (
      !formulaContains(formula, "SUMIFS") &&
      !formulaContains(formula, "SUMIF")
    ) {
      return {
        passed: false,
        detail: `N2 contains \`${formula}\`. Use \`SUMIFS\` (or \`SUMIF\`) — same reason as N1.`,
        detailHe: `N2 מכיל \`${formula}\`. משתמשים ב-\`SUMIFS\` (או \`SUMIF\`) — אותה סיבה כמו N1.`,
      };
    }
    if (!formulaContains(formula, "G2:")) {
      return {
        passed: false,
        detail: `N2 contains \`${formula}\` but doesn't reference the Revenue range \`G2:G${ROW_COUNT + 1}\`. Column G is Revenue.`,
        detailHe: `N2 מכיל \`${formula}\` אבל לא מפנה לטווח ה-Revenue \`G2:G${ROW_COUNT + 1}\`. עמודה G היא Revenue.`,
      };
    }
    return { passed: true };
  },
};

const scorecardRoi: Rule = {
  id: "n3-scorecard-roi",
  label:
    "N3 derives this-week ROI from the Spend and Revenue scorecards (N2/N1 - 1)",
  labelHe:
    "התא N3 גוזר ROI של השבוע מ-scorecards של Spend ו-Revenue (N2/N1 - 1)",
  answer: "=N2/N1 - 1",
  async run(sheet) {
    const formula = await sheet.cellFormula("N3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "N3 is empty. The ROI tile derives from N1 and N2: `=N2/N1 - 1`. ROI computed from aggregated totals — not the average of per-row ROIs, which would over-weight tiny campaigns.",
        detailHe:
          "N3 ריק. אריח ה-ROI נגזר מ-N1 ו-N2: `=N2/N1 - 1`. ROI מחושב מסיכומים מצטברים — לא ממוצע ROI לכל שורה, שייתן משקל יתר לקמפיינים קטנים.",
      };
    }
    if (!formulaContains(formula, "N1") || !formulaContains(formula, "N2")) {
      return {
        passed: false,
        detail: `N3 contains \`${formula}\`. Reference both N1 (Spend) and N2 (Revenue) so the ROI tile recomputes when either changes. The canonical form is \`=N2/N1 - 1\`.`,
        detailHe: `N3 מכיל \`${formula}\`. מפנים גם ל-N1 (Spend) וגם ל-N2 (Revenue) כך שאריח ה-ROI יחושב מחדש כששניהם משתנים. הצורה הקנונית היא \`=N2/N1 - 1\`.`,
      };
    }
    return { passed: true };
  },
};

// Rule 6: the AI summary cell at P1, grounded on the aggregated week.
const aiSummaryCell: Rule = {
  id: "p1-ai-summary",
  label:
    "P1 calls =AI() with a grounding range that covers the aggregated week",
  labelHe:
    "P1 קורא ל-=AI() עם טווח grounding שמכסה את השבוע המאוגד",
  answer:
    '=AI("Summarize the week\'s spend and revenue trend for an exec audience, naming the strongest buyer-vertical combination", A1:G' +
    (ROW_COUNT + 1) +
    ")",
  async run(sheet) {
    const formula = await sheet.cellFormula("P1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'P1 is empty. The weekly AI summary lives in this cell. Write `=AI("Summarize the week\'s spend and revenue trend...", A1:G' +
          (ROW_COUNT + 1) +
          ")`. Track 5 lesson 2 covers the prompt-engineering pattern; the second argument is the grounding range.",
        detailHe:
          'P1 ריק. סיכום ה-AI השבועי גר בתא הזה. כותבים `=AI("Summarize the week\'s spend and revenue trend...", A1:G' +
          (ROW_COUNT + 1) +
          ")`. Track 5 שיעור 2 מכסה את דפוס ה-prompt engineering; הארגומנט השני הוא טווח ה-grounding.",
      };
    }
    if (!formulaContains(formula, "AI(")) {
      return {
        passed: false,
        detail: `P1 contains \`${formula}\`. Use the \`AI\` function so the summary regenerates as the week's numbers change. A typed paragraph defeats the point of an auto-refreshed dashboard.`,
        detailHe: `P1 מכיל \`${formula}\`. משתמשים בפונקציה \`AI\` כך שהסיכום יווצר מחדש כשהמספרים של השבוע משתנים. פסקה שהוקלדה ידנית מבטלת את המטרה של dashboard שמרוענן אוטומטית.`,
      };
    }
    // Look for any A-G range with the right end row, e.g. A1:G61, A2:G61.
    // The point is that the AI() call is grounded; we don't insist on the
    // exact starting row.
    const groundingPattern = new RegExp(
      `A\\d+\\s*:\\s*G${ROW_COUNT + 1}`,
      "i",
    );
    if (!groundingPattern.test(formula)) {
      return {
        passed: false,
        detail: `P1 contains \`${formula}\` but its grounding range doesn't cover the full aggregated week (\`A1:G${ROW_COUNT + 1}\` or \`A2:G${ROW_COUNT + 1}\`). Without a grounding range the model invents numbers; lesson 5.1 covered why the snapshot-only failure mode wastes a week of analysis.`,
        detailHe: `P1 מכיל \`${formula}\` אבל טווח ה-grounding שלו לא מכסה את כל השבוע המאוגד (\`A1:G${ROW_COUNT + 1}\` או \`A2:G${ROW_COUNT + 1}\`). בלי טווח grounding המודל ממציא מספרים; שיעור 5.1 כיסה למה כשל ה-snapshot-only מבזבז שבוע ניתוח.`,
      };
    }
    return { passed: true };
  },
};

// Rule 7: _AILog tab exists with at least one logged row beneath the header.
// This is the audit-trail sentinel pattern from Track 5 lesson 6.
const aiLogTab: Rule = {
  id: "ailog-tab-exists",
  label: "_AILog tab exists and has at least one logged row beneath the header",
  labelHe:
    "ה-tab _AILog קיים ויש בו לפחות שורה אחת מתחת לשורת הכותרת",
  answer:
    "Add a tab named `_AILog` with header row [timestamp, prompt, model, response] and one seeded log row. The Apps Script refresh appends to this tab on every run.",
  async run(sheet) {
    const titles = await sheet.sheetTitles();
    if (!titles.includes("_AILog")) {
      return {
        passed: false,
        detail:
          "No `_AILog` tab. The audit-trail pattern from Track 5 lesson 6 requires a sidecar tab where every AI() invocation is logged. Add a tab named `_AILog` (the leading underscore conventionally marks it as infrastructure, not user-facing) with a header row.",
        detailHe:
          "אין tab בשם `_AILog`. דפוס ה-audit trail מ-Track 5 שיעור 6 דורש tab צדדי שבו כל קריאה ל-AI() נרשמת. מוסיפים tab בשם `_AILog` (ה-underscore המקדים בדרך כלל מסמן אותו כתשתית, לא ל-end-user) עם שורת כותרת.",
      };
    }
    // Read the first 10 rows; require at least 2 (header + 1 logged row).
    const data = await sheet.rangeValues("_AILog!A1:D10");
    const nonEmptyRows = data.filter((row) =>
      row.some((cell) => cell != null && cell !== ""),
    );
    if (nonEmptyRows.length < 2) {
      return {
        passed: false,
        detail:
          "`_AILog` exists but has only the header (or is empty). Seed at least one logged row: `[timestamp, prompt, model, response]`. The audit trail starts on day one, not after the first incident.",
        detailHe:
          "`_AILog` קיים אבל יש בו רק את הכותרת (או שהוא ריק). מזריעים לפחות שורה אחת: `[timestamp, prompt, model, response]`. ה-audit trail מתחיל ביום הראשון, לא אחרי האירוע הראשון.",
      };
    }
    return { passed: true };
  },
};

// Rule 8: Apps Script refresh function. We grade the source; we cannot
// directly check that a time-driven trigger is registered on a fixture, so
// the rule asserts that `refreshDashboard` exists and uses ScriptApp /
// SpreadsheetApp in a productive way. The lesson body flags the trigger
// registration as a step the learner does in the Apps Script editor.
const STARTER_LESSON_GS = `/**
 * The hourly refresh job for the buyer dashboard.
 *
 * Register a time-driven installable trigger ONCE by running
 * \`setupHourlyRefresh()\` from the Apps Script editor (Track 3 lesson 8
 * covers the registration flow). From then on, the trigger fires every
 * hour. The handler:
 *   1. Reads the IMPORTRANGE cells L1 and L2; if either returns #REF!,
 *      sends an alert email to Maya.
 *   2. Writes a timestamp footer (\`Last refresh: 2026-05-12 14:00\`) into P5
 *      so the dashboard tells you when it last ran.
 *   3. Appends a row to the \`_AILog\` tab for the AI summary cell at P1.
 */
function setupHourlyRefresh() {
  ScriptApp.newTrigger("refreshDashboard")
    .timeBased()
    .everyHours(1)
    .create();
}

function refreshDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dash = ss.getSheetByName("Dashboard");
  var l1 = dash.getRange("L1").getValue();
  var l2 = dash.getRange("L2").getValue();
  if (String(l1).indexOf("#REF") !== -1 || String(l2).indexOf("#REF") !== -1) {
    MailApp.sendEmail(
      "maya@team.example",
      "Dashboard IMPORTRANGE broken",
      "L1 or L2 returned #REF! at " + new Date()
    );
  }
  dash.getRange("P5").setValue("Last refresh: " + new Date());
  ss.getSheetByName("_AILog").appendRow([
    new Date(),
    "weekly summary",
    "gemini-2.5-flash",
    dash.getRange("P1").getValue()
  ]);
}
`;

const definesRefreshDashboard: Rule = {
  id: "script-defines-refreshdashboard",
  label:
    "Lesson.gs defines `refreshDashboard()` that writes a timestamp and appends to _AILog",
  labelHe:
    "הקובץ Lesson.gs מגדיר `refreshDashboard()` שכותב timestamp ומוסיף שורה ל-_AILog",
  answer:
    'function refreshDashboard() {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  var dash = ss.getSheetByName("Dashboard");\n  // ... timestamp + _AILog append + IMPORTRANGE alert\n}',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found. Open Extensions → Apps Script to launch the editor, fill in the starter functions, then re-run grading.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר. פותחים Extensions → Apps Script כדי להריץ את העורך, ממלאים את ה-starter functions, ואז מריצים grading שוב.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail: "`Lesson.gs` is missing from the bound project.",
        detailHe: "`Lesson.gs` חסר מהפרויקט המקושר.",
      };
    }
    if (!lesson.functions.includes("refreshDashboard")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing \`function refreshDashboard()\`. The trigger calls this handler by name; without the function the hourly job fires into the void. Functions Apps Script saw: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסרה \`function refreshDashboard()\`. ה-trigger קורא ל-handler הזה לפי שם; בלי הפונקציה ה-job השעתי יורה לחלל הריק. פונקציות ש-Apps Script ראה: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const src = lesson.source;
    const bodyMatch = src.match(
      /function\s+refreshDashboard\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
    );
    const body = bodyMatch ? bodyMatch[1] : "";
    if (!/setValue|setValues/.test(body)) {
      return {
        passed: false,
        detail:
          "`refreshDashboard` body doesn't call `setValue` (or `setValues`). The handler writes a `Last refresh: ...` timestamp into the dashboard footer so the reader can tell when it last ran. A handler with no side effect doesn't earn an hourly trigger.",
        detailHe:
          "הגוף של `refreshDashboard` לא קורא ל-`setValue` (או `setValues`). ה-handler כותב timestamp `Last refresh: ...` לכותרת התחתונה של ה-dashboard כדי שהקורא יוכל לדעת מתי הוא רץ אחרון. handler בלי side effect לא מצדיק trigger שעתי.",
      };
    }
    if (!/_AILog/.test(body)) {
      return {
        passed: false,
        detail:
          "`refreshDashboard` doesn't touch the `_AILog` tab. Every hourly refresh should append a log row to `_AILog` so the audit trail captures what the AI() summary returned at each refresh. Track 5 lesson 6 is the source pattern.",
        detailHe:
          "`refreshDashboard` לא נוגעת ב-tab `_AILog`. כל refresh שעתי צריך להוסיף שורת log ל-`_AILog` כך ש-audit trail יתעד מה ה-AI() summary החזיר בכל refresh. Track 5 שיעור 6 הוא דפוס המקור.",
      };
    }
    return { passed: true };
  },
};

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Seed: CAMPAIGNS_LARGE goes on the Dashboard tab as the "pre-aggregated"
// dataset so the learner has data to point QUERY / SUMIFS / =AI() at without
// first wiring up real IMPORTRANGE-able source workbooks. The lesson body
// frames the IMPORTRANGE cells (L1, L2) as the wiring you'd add in
// production; the grader checks the formulas in those cells, not the
// resolved values (which would require live source workbooks).
//
// The _AILog tab is seeded with a header + one example row so the learner
// can see the shape immediately.

export const assignment: AssignmentSpec = {
  id: "capstone-01-buyer-dashboard",
  lessonSlug: "capstone/01-buyer-dashboard",
  templateSheetId: null,
  seed: {
    tabTitle: "Dashboard",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Labels in column I orient the learner to the eight build steps.
      { a1: "I1", value: "J1: per-buyer × vertical × day QUERY" },
      { a1: "I2", value: "L1: IMPORTRANGE Taboola_Raw" },
      { a1: "I3", value: "L2: IMPORTRANGE Outbrain_Raw" },
      { a1: "I4", value: "N1: this-week Spend (SUMIFS)" },
      { a1: "I5", value: "N2: this-week Revenue (SUMIFS)" },
      { a1: "I6", value: "N3: this-week ROI (N2/N1 - 1)" },
      { a1: "I7", value: "P1: weekly =AI() summary" },
      { a1: "I8", value: "P5: hourly refresh timestamp (Apps Script writes)" },
    ],
  },
  seedScript,
  rules: [
    importrangeTaboola,
    importrangeOutbrain,
    aggregationQuery,
    pivotExists,
    roiColorScale,
    scorecardSpend,
    scorecardRevenue,
    scorecardRoi,
    aiSummaryCell,
    aiLogTab,
    definesRefreshDashboard,
  ],
};
