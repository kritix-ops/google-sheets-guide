import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE has the header row plus 60 data rows, so the spend column
// in the seeded sheet lives at F2:F61. Index 5 is the Spend column in the
// dataset (A:Date B:Buyer C:Vertical D:Platform E:Country F:Spend G:Revenue).
const SPEND_COL = 5;
const TOTAL_SPEND = CAMPAIGNS_LARGE.slice(1).reduce<number>((sum, row) => {
  const v = row[SPEND_COL];
  return sum + (typeof v === "number" ? v : 0);
}, 0);
// The runtime will fill J1 with a JS number; lesson 3 used a 0.05 epsilon
// for the same kind of compare. Keep the same tolerance here so a rounding
// step in the learner's code doesn't silently fail the rule.
const TOTAL_SPEND_EPS = 0.05;

function approxEqual(a: unknown, b: number, eps = TOTAL_SPEND_EPS): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

const STARTER_LESSON_GS = `/**
 * Read the Spend column from the Campaigns tab in one round-trip, sum it,
 * and write the total to J1.
 *
 * Run this from the Apps Script editor's Run dropdown (or wire it to a
 * menu item later; see lesson 5). It is NOT a custom function: it writes
 * to the sheet, so it cannot be called from a cell.
 */
function recomputeSpend() {
  // TODO:
  //   1. Get the Campaigns sheet via SpreadsheetApp.
  //   2. Read F2:F61 with getRange(...).getValues() in one round-trip, not 60.
  //   3. Sum the numbers (getValues returns a 2D array, even for one column).
  //   4. Write the total to J1 with setValue(total).
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: the bound project defines `recomputeSpend` and the source shows
// the two anchors of the lesson: a batch read via `getValues` and a write
// via `setValue` / `setValues`. The stub guard rejects a learner who left
// `return null;` in place without writing the body.
const definesRecomputeSpend: Rule = {
  id: "script-defines-recomputespend",
  label:
    "Lesson.gs defines `recomputeSpend()` that batches a getValues read with a setValue write",
  labelHe:
    "הקובץ Lesson.gs מגדיר `recomputeSpend()` שמשלב קריאה ב-getValues עם כתיבה ב-setValue",
  answer:
    "function recomputeSpend() {\n" +
    "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
    "  const values = sheet.getRange(\"F2:F61\").getValues();\n" +
    "  let total = 0;\n" +
    "  for (const row of values) total += row[0];\n" +
    "  sheet.getRange(\"J1\").setValue(total);\n" +
    "}",
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
          "The starter file `Lesson.gs` is missing from the bound project. If you renamed it, rename it back to `Lesson`.",
        detailHe:
          "קובץ ה-starter `Lesson.gs` חסר בפרויקט המקושר. אם שיניתם לו שם, מחזירים אותו ל-`Lesson`.",
      };
    }
    if (!lesson.functions.includes("recomputeSpend")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function recomputeSpend()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function recomputeSpend()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`recomputeSpend` is declared but still returns `null` without doing anything. Replace the stub with a `getRange(\"F2:F61\").getValues()` read, sum the values, and write to `J1` with `setValue`.",
        detailHe:
          "`recomputeSpend` מוכרזת אבל עדיין מחזירה `null` בלי לעשות כלום. מחליפים את ה-stub בקריאה `getRange(\"F2:F61\").getValues()`, מסכמים את הערכים, וכותבים ל-`J1` עם `setValue`.",
      };
    }
    if (!lesson.source.includes("getRange")) {
      return {
        passed: false,
        detail:
          "`recomputeSpend` doesn't call `getRange(...)`. Use `sheet.getRange(\"F2:F61\")` to grab the Spend column in one shot.",
        detailHe:
          "`recomputeSpend` לא קורא ל-`getRange(...)`. משתמשים ב-`sheet.getRange(\"F2:F61\")` כדי לקבל את עמודת ה-spend בקריאה אחת.",
      };
    }
    if (!lesson.source.includes("getValues")) {
      return {
        passed: false,
        detail:
          "`recomputeSpend` calls `getRange` but not `getValues()`. Read all 60 spend cells in one round-trip with `getRange(\"F2:F61\").getValues()`. A loop of `getValue()` is 60 separate round-trips.",
        detailHe:
          "`recomputeSpend` קורא ל-`getRange` אבל לא ל-`getValues()`. קוראים את כל 60 תאי ה-spend ב-round-trip אחד עם `getRange(\"F2:F61\").getValues()`. לולאה של `getValue()` היא 60 round-trips נפרדים.",
      };
    }
    if (!/\bsetValue\s*\(/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`recomputeSpend` doesn't write back to the sheet. Add `sheet.getRange(\"J1\").setValue(total)` to put the sum in J1.",
        detailHe:
          "`recomputeSpend` לא כותב חזרה לגיליון. מוסיפים `sheet.getRange(\"J1\").setValue(total)` כדי להציב את הסכום ב-J1.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: after the learner runs `recomputeSpend` from the editor, J1 holds
// the dataset's total spend. The number comes from the dataset itself so a
// drift in CAMPAIGNS_LARGE shifts both the seed and the expected value
// together. Tolerance follows the lesson 3 pattern.
const j1ShowsTotalSpend: Rule = {
  id: "j1-shows-total-spend",
  label: "J1 holds the total spend after running `recomputeSpend`",
  labelHe: "התא J1 מחזיק את סכום ה-spend הכולל אחרי הרצת `recomputeSpend`",
  answer: TOTAL_SPEND.toFixed(2),
  async run(sheet) {
    const value = await sheet.cellValue("J1");
    if (value == null) {
      return {
        passed: false,
        detail: `J1 is empty. After writing the function body, click Run on \`recomputeSpend\` in the Apps Script editor. That fires the function once and writes the total (\`≈ ${TOTAL_SPEND.toFixed(2)}\`) to J1.`,
        detailHe: `J1 ריק. אחרי שכותבים את גוף ה-function, לוחצים Run על \`recomputeSpend\` בעורך Apps Script. זה מפעיל את ה-function פעם אחת וכותב את הסכום (\`≈ ${TOTAL_SPEND.toFixed(2)}\`) ל-J1.`,
      };
    }
    if (!approxEqual(value, TOTAL_SPEND)) {
      return {
        passed: false,
        detail: `J1 holds \`${value}\` but should be \`≈ ${TOTAL_SPEND.toFixed(2)}\` (the sum of F2:F61). If the value is much smaller, your loop is probably only reading the first row of the 2D array. \`getValues()\` returns rows, so each entry is itself an array like \`[342.18]\` for a one-column range.`,
        detailHe: `J1 מחזיק \`${value}\` אבל צריך להיות \`≈ ${TOTAL_SPEND.toFixed(2)}\` (סכום F2:F61). אם הערך נמוך בהרבה, סביר שהלולאה שלכם קוראת רק את השורה הראשונה ב-array הדו-ממדי. \`getValues()\` מחזיר שורות, כך שכל איבר הוא בעצמו array, למשל \`[342.18]\` לעמודה אחת.`,
      };
    }
    return { passed: true };
  },
};

// Rule 3: guard against the per-cell anti-pattern. Easy heuristic: if the
// source has a loop AND a singular `getValue(` call inside it, the learner
// is reading cell-by-cell. The lesson explicitly wants the batch shape.
const sourceUsesBatchGetValues: Rule = {
  id: "source-uses-batch-getvalues",
  label: "Lesson.gs uses the batch `getValues()`, not a per-cell `getValue()` loop",
  labelHe:
    "הקובץ Lesson.gs משתמש ב-`getValues()` ב-batch ולא בלולאה של `getValue()` תא-תא",
  answer:
    "Use `sheet.getRange(\"F2:F61\").getValues()` once instead of looping `getValue()` per cell.",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      // The "missing project" rule above already explains this; pass here
      // so the learner sees only one failure for that root cause.
      return { passed: true };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return { passed: true };
    }
    // The lesson's whole point is batch reads. If `getValues` is missing,
    // call that out specifically. Singular `getValue()` inside a loop is
    // the textbook performance trap on big sheets.
    if (!lesson.source.includes("getValues")) {
      return {
        passed: false,
        detail:
          "Lesson.gs doesn't call `getValues()` (plural). One `getRange(\"F2:F61\").getValues()` returns all 60 numbers in a single round-trip; a loop of `getValue()` makes 60 separate calls and runs an order of magnitude slower.",
        detailHe:
          "ה-Lesson.gs לא קורא ל-`getValues()` (לשון רבים). `getRange(\"F2:F61\").getValues()` אחד מחזיר את כל 60 המספרים ב-round-trip אחד; לולאה של `getValue()` עושה 60 קריאות נפרדות ורצה בערך פי עשרה לאט יותר.",
      };
    }
    // Detect the singular-getValue-inside-a-loop anti-pattern. The check
    // is intentionally loose: if both tokens are present we flag, even if
    // the loop is doing something else, because the lesson body warns
    // about exactly this shape.
    const hasLoop = /\b(for|while)\s*\(/.test(lesson.source);
    const hasSingularGetValue = /\.getValue\s*\(\s*\)/.test(lesson.source);
    if (hasLoop && hasSingularGetValue) {
      return {
        passed: false,
        detail:
          "Lesson.gs mixes a loop with `getValue()` (singular). That's exactly the per-cell pattern the lesson warns about. Replace the loop with one `getRange(\"F2:F61\").getValues()` call and sum the resulting array in JavaScript.",
        detailHe:
          "ה-Lesson.gs משלב לולאה עם `getValue()` (יחיד). זה בדיוק הדפוס תא-תא שעליו השיעור מזהיר. מחליפים את הלולאה בקריאת `getRange(\"F2:F61\").getValues()` אחת ומסכמים את ה-array שמתקבל ב-JavaScript.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-04-spreadsheetapp",
  lessonSlug: "apps-script/04-spreadsheetapp",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // I1 labels the output cell; J1 is where the learner's function
      // writes the total. Leaving J1 unseeded lets the rule distinguish
      // "function never ran" (J1 empty) from "function ran and produced
      // the wrong number" (J1 has a value, just not the expected one).
      { a1: "I1", value: "Total spend" },
    ],
  },
  seedScript,
  rules: [definesRecomputeSpend, j1ShowsTotalSpend, sourceUsesBatchGetValues],
};
