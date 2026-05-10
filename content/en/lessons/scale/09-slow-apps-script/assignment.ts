import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. The slow function aggregates the Spend column; the
// grader recomputes the target from the dataset so the rule stays correct
// if CAMPAIGNS_LARGE shifts.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

const STARTER_LESSON_GS = `/**
 * Slow on purpose. Find the slow part using console.time / console.timeEnd,
 * then refactor the read into a single batched getValues call.
 *
 * The 60-row read below makes 60 round-trips to the spreadsheet service.
 * Each getRange().getValue() is its own server call. Wrap a console.time
 * label around the read block, run the function from the editor, and check
 * the Executions panel (View > Executions in the new editor). Then refactor
 * to a single getValues() call and watch the label shrink from seconds to
 * milliseconds.
 */
function slowAggregate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");
  let total = 0;
  // Per-cell loop: 60 reads, each a round-trip.
  for (let row = 2; row <= 61; row++) {
    total += sheet.getRange(row, 6).getValue();
  }
  sheet.getRange("J1").setValue(total);
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: the function exists, the source uses batch getValues(), and the
// old per-cell getValue() loop is gone. The naive check for "getValue("
// would also match the new "getValues(" string, so guard against that by
// looking for the singular getValue( with no `s` immediately after.
const usesBatchGetValues: Rule = {
  id: "script-uses-batch-getvalues",
  label:
    "Lesson.gs refactors `slowAggregate` to read with a single `getValues()` batch",
  labelHe:
    "הקובץ Lesson.gs משכתב את `slowAggregate` כך שהקריאה נעשית ב-batch אחד של `getValues()`",
  answer:
    'function slowAggregate() {\n  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");\n  console.time("read");\n  const values = sheet.getRange("F2:F61").getValues();\n  console.timeEnd("read");\n  let total = 0;\n  for (let row = 0; row < values.length; row++) {\n    total += values[row][0];\n  }\n  sheet.getRange("J1").setValue(total);\n}',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found. Open the sheet and choose Extensions → Apps Script to launch the editor, then re-run grading.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר. פותחים את ה-spreadsheet ובוחרים Extensions → Apps Script כדי להפעיל את העורך, ואז מריצים grading שוב.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail:
          "The starter file `Lesson.gs` is missing from the bound project. If you renamed it, rename it back to `Lesson` (no extension in the Apps Script file picker).",
        detailHe:
          "קובץ ה-starter `Lesson.gs` חסר בפרויקט המקושר. אם שיניתם לו שם, מחזירים אותו ל-`Lesson` (בלי סיומת בבורר הקבצים של Apps Script).",
      };
    }
    if (!lesson.functions.includes("slowAggregate")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function slowAggregate(...)\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}. Don't rename the entry point. Keep the name, refactor the body.`,
        detailHe: `ל-Lesson.gs חסר \`function slowAggregate(...)\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}. אל תשנו את שם נקודת הכניסה. שומרים על השם, ומשכתבים את הגוף.`,
      };
    }
    const source = lesson.source;
    if (!/\bgetValues\s*\(/.test(source)) {
      return {
        passed: false,
        detail:
          "The source doesn't call `getValues()` (plural). Replace the per-cell read with one batch call: `const values = sheet.getRange(\"F2:F61\").getValues();`. A single `getValues()` is one round-trip; the old 60-iteration loop was 60.",
        detailHe:
          "המקור לא קורא ל-`getValues()` (ברבים). מחליפים את הקריאה תא-תא בקריאת batch אחת: `const values = sheet.getRange(\"F2:F61\").getValues();`. קריאת `getValues()` בודדת היא round-trip אחד, הלולאה הישנה של 60 איטרציות הייתה 60.",
      };
    }
    // Look for the SINGULAR getValue( pattern: getValue followed by an opening
    // paren, but NOT getValues. The negative-lookahead pattern catches the
    // bad per-cell call without flagging the new getValues batch call.
    const singularGetValue = /\bgetValue\s*\(/.test(source);
    if (singularGetValue) {
      return {
        passed: false,
        detail:
          "The source still calls `getValue()` (singular). Every `getValue()` inside a loop is a server round-trip. Replace the loop body's `sheet.getRange(row, 6).getValue()` with iteration over the `values` array you just read in one batch.",
        detailHe:
          "המקור עדיין קורא ל-`getValue()` (ביחיד). כל קריאה ל-`getValue()` בתוך לולאה היא round-trip לשרת. מחליפים את `sheet.getRange(row, 6).getValue()` בלולאה ב-iteration על מערך ה-`values` שכבר נקרא ב-batch אחד.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: the refactor includes console.time and console.timeEnd around the
// read. The pair is what teaches "measure the improvement"; a refactor
// without the timing labels passes Rule 1 but skips the lesson's point.
const usesConsoleTime: Rule = {
  id: "script-uses-console-time",
  label:
    "`slowAggregate` is wrapped with `console.time` and `console.timeEnd` to measure the read",
  labelHe:
    "`slowAggregate` עטופה ב-`console.time` וב-`console.timeEnd` כדי למדוד את הקריאה",
  answer:
    'console.time("read");\nconst values = sheet.getRange("F2:F61").getValues();\nconsole.timeEnd("read");',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found. Open Extensions → Apps Script and re-run grading.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר. פותחים Extensions → Apps Script ומריצים grading שוב.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail:
          "The starter file `Lesson.gs` is missing. If you renamed it, rename it back to `Lesson`.",
        detailHe:
          "קובץ ה-starter `Lesson.gs` חסר. אם שיניתם לו שם, מחזירים אותו ל-`Lesson`.",
      };
    }
    const source = lesson.source;
    const hasTime = /\bconsole\.time\s*\(/.test(source);
    const hasTimeEnd = /\bconsole\.timeEnd\s*\(/.test(source);
    if (!hasTime && !hasTimeEnd) {
      return {
        passed: false,
        detail:
          "The source has no `console.time` / `console.timeEnd` pair. Wrap the batch read with `console.time(\"read\");` and `console.timeEnd(\"read\");` so the Executions panel shows the duration. Without the pair, you can't compare before-and-after.",
        detailHe:
          "המקור לא כולל זוג של `console.time` / `console.timeEnd`. עוטפים את ה-batch read ב-`console.time(\"read\");` וב-`console.timeEnd(\"read\");` כדי שה-Executions panel יציג את משך הזמן. בלי הזוג, אי אפשר להשוות לפני ואחרי.",
      };
    }
    if (!hasTime) {
      return {
        passed: false,
        detail:
          "The source calls `console.timeEnd(...)` but no matching `console.time(...)`. The label has to start somewhere; an unmatched `timeEnd` logs a warning and no duration.",
        detailHe:
          "המקור קורא ל-`console.timeEnd(...)` בלי `console.time(...)` תואם. התווית חייבת להתחיל באיזשהו מקום, `timeEnd` לא תואם מדפיס אזהרה בלי משך זמן.",
      };
    }
    if (!hasTimeEnd) {
      return {
        passed: false,
        detail:
          "The source calls `console.time(...)` but never `console.timeEnd(...)`. The pair has to close to produce a duration. An open `console.time` is a silent leak: nothing logs.",
        detailHe:
          "המקור קורא ל-`console.time(...)` אבל אף פעם לא ל-`console.timeEnd(...)`. הזוג חייב להיסגר כדי שתצא מדידה. `console.time` פתוח הוא דליפה שקטה, כלום לא יודפס.",
      };
    }
    return { passed: true };
  },
};

// Rule 3: J1 holds the total spend after the function ran. Computes the
// expected total from CAMPAIGNS_LARGE so the rule stays in sync with the
// dataset.
const j1HoldsTotal: Rule = {
  id: "j1-shows-total",
  label: "J1 holds the total Spend after `slowAggregate` runs",
  labelHe: "התא J1 מחזיק את ה-Spend הכולל אחרי ש-`slowAggregate` רצה",
  answer: TOTAL_SPEND.toFixed(2),
  async run(sheet) {
    const value = await sheet.cellValue("J1");
    if (value == null || value === "") {
      return {
        passed: false,
        detail: `J1 is empty. Run \`slowAggregate\` from the Apps Script editor (Run > slowAggregate) at least once. The function writes the total to J1 with \`sheet.getRange("J1").setValue(total)\`. The expected total is ≈ \`${TOTAL_SPEND.toFixed(2)}\`.`,
        detailHe: `J1 ריק. מריצים את \`slowAggregate\` מעורך Apps Script (Run > slowAggregate) לפחות פעם אחת. ה-function כותבת את הסכום ל-J1 עם \`sheet.getRange("J1").setValue(total)\`. הסכום הצפוי הוא ≈ \`${TOTAL_SPEND.toFixed(2)}\`.`,
      };
    }
    if (!approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (the sum of F2:F61). If the number is far off, the refactor is summing the wrong column or skipping rows.`,
        detailHe: `J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סכום F2:F61). אם המספר רחוק, השכתוב מסכם את העמודה הלא נכונה או מדלג על שורות.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-09-slow-apps-script",
  lessonSlug: "scale/09-slow-apps-script",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // I1 sits next to the output cell J1 as a label gutter. The function
      // writes the total into J1; leave J1 itself unseeded so the grader
      // can tell a run-of-the-function value from a leftover seed.
      { a1: "I1", value: "Spend total (batched)" },
    ],
  },
  seedScript,
  rules: [usesBatchGetValues, usesConsoleTime, j1HoldsTotal],
};
