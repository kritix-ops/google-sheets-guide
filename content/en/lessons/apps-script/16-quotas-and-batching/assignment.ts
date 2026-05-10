import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. The lesson converts F2:F61 (60 spend values in USD)
// into J2:J61 (the same values in ILS) at a hardcoded rate. The starter
// stub does it per-cell; the learner refactors to batch.
const USD_TO_ILS_RATE = 3.7;

// Row 2 of CAMPAIGNS_LARGE = first data row.
const F2_SPEND = typeof CAMPAIGNS_LARGE[1][5] === "number"
  ? (CAMPAIGNS_LARGE[1][5] as number)
  : 0;
// Row 61 of the sheet = row 60 of the dataset (1 header + 60 data rows).
const F61_SPEND = typeof CAMPAIGNS_LARGE[60][5] === "number"
  ? (CAMPAIGNS_LARGE[60][5] as number)
  : 0;
const J2_EXPECTED = F2_SPEND * USD_TO_ILS_RATE;
const J61_EXPECTED = F61_SPEND * USD_TO_ILS_RATE;

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

const STARTER_LESSON_GS = `/**
 * Refactor this function to use batch reads/writes.
 * Right now it makes 60 round-trips to read F2:F61 and 60 more to write
 * J2:J61. On a 60-row sheet it's slow; on a 10,000-row sheet it times
 * out at the 6-minute execution limit.
 *
 * Replace the per-cell loop with:
 *   1. ONE getValues() call on F2:F61.
 *   2. A JS-side map that multiplies each value by 3.7.
 *   3. ONE setValues() call on J2:J61.
 *
 * The output shape for setValues is a 2D array. Even a single-column write
 * needs the shape [[x], [y], [z], ...], not [x, y, z].
 */
function refactorMe() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Campaigns");
  // BAD: 60 round-trips to read, 60 to write.
  for (let row = 2; row <= 61; row++) {
    const spend = sheet.getRange(row, 6).getValue();
    sheet.getRange(row, 10).setValue(spend * 3.7);
  }
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1. Source uses the plural getValues/setValues AND the per-cell
// pattern is gone. The lesson is teaching the refactor; if the learner
// kept the per-cell loop it doesn't matter whether they also added a
// batch call as a no-op.
const refactoredToBatch: Rule = {
  id: "script-refactored-to-batch",
  label: "`refactorMe` uses `getValues()` + `setValues()` and no per-cell loop",
  labelHe: "`refactorMe` משתמשת ב-`getValues()` + `setValues()` ובלי לולאה תא-תא",
  answer:
    'const spend = sheet.getRange("F2:F61").getValues();\nconst ils = spend.map(row => [row[0] * 3.7]);\nsheet.getRange("J2:J61").setValues(ils);',
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
    if (!lesson.functions.includes("refactorMe")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function refactorMe()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function refactorMe()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const src = lesson.source;
    if (!/\.getValues\s*\(/.test(src)) {
      return {
        passed: false,
        detail:
          "`refactorMe` doesn't call `getValues()` (plural). The whole batch refactor pivots on reading the range once. Replace the per-row `getValue` calls with one `sheet.getRange(\"F2:F61\").getValues()`.",
        detailHe:
          "`refactorMe` לא קוראת ל-`getValues()` (ברבים). כל הרפקטור של ה-batch סובב סביב קריאת ה-range פעם אחת. מחליפים את קריאות `getValue` השורתיות באחת `sheet.getRange(\"F2:F61\").getValues()`.",
      };
    }
    if (!/\.setValues\s*\(/.test(src)) {
      return {
        passed: false,
        detail:
          "`refactorMe` doesn't call `setValues()` (plural). The other half of the refactor is one batched write to the whole output column. Build a 2D array like `[[x], [y], ...]` and call `sheet.getRange(\"J2:J61\").setValues(arr)`.",
        detailHe:
          "`refactorMe` לא קוראת ל-`setValues()` (ברבים). החצי השני של הרפקטור הוא כתיבה אחת מאוגדת לעמודת הפלט. בונים מערך דו-ממדי כמו `[[x], [y], ...]` וקוראים ל-`sheet.getRange(\"J2:J61\").setValues(arr)`.",
      };
    }
    // The point of the lesson is replacing the per-cell loop. If the
    // learner kept a `for` loop that still calls .getValue or .setValue
    // (singular) inside it, the batch call they added is a no-op and the
    // round-trip count is unchanged.
    const hasPerCellRead = /for\s*\([\s\S]{0,200}?\)\s*\{[\s\S]*?\.getValue\s*\(/.test(src);
    const hasPerCellWrite = /for\s*\([\s\S]{0,200}?\)\s*\{[\s\S]*?\.setValue\s*\(/.test(src);
    if (hasPerCellRead || hasPerCellWrite) {
      return {
        passed: false,
        detail:
          "`refactorMe` still has a `for` loop that calls `getValue` or `setValue` (singular) on each iteration. The whole lesson is to replace that pattern with one `getValues` + one `setValues`. Delete the loop.",
        detailHe:
          "ל-`refactorMe` עדיין יש לולאת `for` שקוראת ל-`getValue` או `setValue` (יחיד) בכל איטרציה. כל השיעור הוא להחליף את הדפוס הזה ב-`getValues` אחד + `setValues` אחד. מוחקים את הלולאה.",
      };
    }
    return { passed: true };
  },
};

// Rule 2. J2 holds F2 * 3.7. Proves the batch fired at all.
const j2ShowsConverted: Rule = {
  id: "j2-shows-converted-spend",
  label: "J2 equals F2 × 3.7 (the first row's USD spend converted to ILS)",
  labelHe: "J2 שווה ל-F2 × 3.7 (ה-spend ב-USD של השורה הראשונה מומר ל-ILS)",
  answer: J2_EXPECTED.toFixed(2),
  async run(sheet) {
    const value = await sheet.cellValue("J2");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J2 is empty. After saving your `refactorMe`, click Run in the Apps Script editor. The batched write should fill J2 through J61 in one round-trip. If only J2 is empty, your range probably starts at J3 (off-by-one in the A1 notation).",
        detailHe:
          "J2 ריק. אחרי ששומרים את `refactorMe`, לוחצים Run בעורך Apps Script. הכתיבה המאוגדת אמורה למלא את J2 עד J61 ב-round-trip אחד. אם רק J2 ריק, הטווח שלכם כנראה מתחיל ב-J3 (off-by-one ב-A1 notation).",
      };
    }
    if (!approxEqual(value, J2_EXPECTED, 0.05)) {
      return {
        passed: false,
        detail: `J2 holds \`${value}\` but should be ≈ \`${J2_EXPECTED.toFixed(2)}\` (F2's \`${F2_SPEND}\` × \`3.7\`). The map step is either wrong or reading the wrong column. Each row of \`getValues()\` is a 1-element array; reach for \`row[0] * 3.7\`, not \`row * 3.7\`.`,
        detailHe: `J2 מכיל \`${value}\` אבל צריך להיות ≈ \`${J2_EXPECTED.toFixed(2)}\` (F2 \`${F2_SPEND}\` × \`3.7\`). שלב ה-map או שגוי או שקורא את העמודה הלא נכונה. כל שורה של \`getValues()\` היא array של אלמנט אחד; מושיטים יד ל-\`row[0] * 3.7\`, לא ל-\`row * 3.7\`.`,
      };
    }
    return { passed: true };
  },
};

// Rule 3. J61 holds F61 * 3.7. Proves the batch fired on all 60 rows
// rather than only the first one. This is the key safeguard against the
// learner declaring a batch call but only mapping a single row.
const j61ShowsConverted: Rule = {
  id: "j61-shows-converted-spend",
  label: "J61 equals F61 × 3.7 (the batch fired all 60 rows, not just the first)",
  labelHe:
    "J61 שווה ל-F61 × 3.7 (ה-batch ירה על כל 60 השורות, לא רק על הראשונה)",
  answer: J61_EXPECTED.toFixed(2),
  async run(sheet) {
    const value = await sheet.cellValue("J61");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J61 is empty. The batch write only covered some of the rows. Common cause: the range argument to `setValues` is shorter than the array you passed (`sheet.getRange(\"J2:J10\").setValues(arr60)` throws; `sheet.getRange(\"J2:J10\").setValues(arr9)` writes only the first 9). Make sure the `getRange` end row is 61.",
        detailHe:
          "J61 ריק. הכתיבה ה-batched כיסתה רק חלק מהשורות. סיבה נפוצה: הארגומנט של ה-range ל-`setValues` קצר מהמערך שהעברתם (`sheet.getRange(\"J2:J10\").setValues(arr60)` זורק; `sheet.getRange(\"J2:J10\").setValues(arr9)` כותב רק את 9 הראשונים). מוודאים ששורת הסיום של `getRange` היא 61.",
      };
    }
    if (!approxEqual(value, J61_EXPECTED, 0.05)) {
      return {
        passed: false,
        detail: `J61 holds \`${value}\` but should be ≈ \`${J61_EXPECTED.toFixed(2)}\` (F61's \`${F61_SPEND}\` × \`3.7\`). The batch fired but didn't compute the right value for the last row; likely the map step is reading the wrong column index.`,
        detailHe: `J61 מכיל \`${value}\` אבל צריך להיות ≈ \`${J61_EXPECTED.toFixed(2)}\` (F61 \`${F61_SPEND}\` × \`3.7\`). ה-batch ירה אבל לא חישב את הערך הנכון לשורה האחרונה, סביר להניח ששלב ה-map קורא את ה-index הלא נכון של העמודה.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-16-quotas-and-batching",
  lessonSlug: "apps-script/16-quotas-and-batching",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [...dataToCells(CAMPAIGNS_LARGE)],
  },
  seedScript,
  rules: [refactoredToBatch, j2ShowsConverted, j61ShowsConverted],
};

export const TEST_CONSTANTS = {
  USD_TO_ILS_RATE,
  F2_SPEND,
  F61_SPEND,
  J2_EXPECTED,
  J61_EXPECTED,
} as const;
