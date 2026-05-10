import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

const STARTER_LESSON_GS = `/**
 * Apply the team's standard formatting to the Spend column:
 *   1. Currency number format ($#,##0.00) on F2:F61.
 *   2. Freeze the header row so it stays visible while scrolling.
 *
 * Registered as a macro in the appsscript manifest (the editor's
 * Tools → Macros → Manage macros UI writes that entry for you).
 * Run it from Tools → Macros → Format spend column or with the
 * keyboard shortcut you assigned.
 */
function formatSpendColumn() {
  // TODO:
  //   1. Get the Campaigns sheet.
  //   2. Apply the currency format $#,##0.00 to the range F2:F61 with
  //      sheet.getRange("F2:F61").setNumberFormat("$#,##0.00").
  //   3. Freeze the header row with sheet.setFrozenRows(1).
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: formatSpendColumn defined and the source shows both the format
// write and the freeze-row call. Both calls are required by the assignment;
// flag whichever is missing with a specific message.
const definesFormatSpendColumn: Rule = {
  id: "script-defines-formatspendcolumn",
  label:
    "Lesson.gs defines `formatSpendColumn()` that sets the currency format and freezes the header",
  labelHe:
    "הקובץ Lesson.gs מגדיר `formatSpendColumn()` שמגדיר number format למטבע ומקפיא את שורת הכותרת",
  answer:
    "function formatSpendColumn() {\n" +
    "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
    "  sheet.getRange(\"F2:F61\").setNumberFormat(\"$#,##0.00\");\n" +
    "  sheet.setFrozenRows(1);\n" +
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
    if (!lesson.functions.includes("formatSpendColumn")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function formatSpendColumn()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function formatSpendColumn()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("functionformatSpendColumn(){returnnull")) {
      return {
        passed: false,
        detail:
          "`formatSpendColumn` is declared but still returns `null`. Replace the stub with a `setNumberFormat` write on F2:F61 and a `setFrozenRows(1)` call.",
        detailHe:
          "`formatSpendColumn` מוכרזת אבל עדיין מחזירה `null`. מחליפים את ה-stub בקריאה ל-`setNumberFormat` על F2:F61 ובקריאה ל-`setFrozenRows(1)`.",
      };
    }
    if (!lesson.source.includes("setNumberFormat")) {
      return {
        passed: false,
        detail:
          "`formatSpendColumn` doesn't call `setNumberFormat(...)`. The Range method that applies a number format is `setNumberFormat`; use the pattern `$#,##0.00` so spend values render as currency.",
        detailHe:
          "`formatSpendColumn` לא קורא ל-`setNumberFormat(...)`. ה-method של Range שמחיל number format הוא `setNumberFormat`; משתמשים בתבנית `$#,##0.00` כדי שערכי ה-spend יוצגו כמטבע.",
      };
    }
    if (!lesson.source.includes("setFrozenRows")) {
      return {
        passed: false,
        detail:
          "`formatSpendColumn` formats the column but doesn't freeze the header row. Add `sheet.setFrozenRows(1)` so the header stays visible while scrolling.",
        detailHe:
          "`formatSpendColumn` מעצב את העמודה אבל לא מקפיא את שורת הכותרת. מוסיפים `sheet.setFrozenRows(1)` כדי ששורת הכותרת תישאר גלויה בזמן גלילה.",
      };
    }
    // Anchor the format write to the specific range the lesson teaches.
    // We accept both A1 form ("F2:F61") and the integer form (which would
    // mention "F2" inside getRange, but Apps Script integer overloads use
    // numbers, so the most reliable check is the A1 form.
    if (!/F2\s*:\s*F61/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`formatSpendColumn` doesn't target the range `F2:F61`. The Spend column lives in F and the dataset has 60 rows, so the range is `F2:F61`. Pass that to `getRange`.",
        detailHe:
          "`formatSpendColumn` לא מכוון לטווח `F2:F61`. עמודת Spend נמצאת ב-F ולדאטה יש 60 שורות, אז הטווח הוא `F2:F61`, מעבירים אותו ל-`getRange`.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: F2's number format reads as CURRENCY or has a "$" in its pattern.
// The test fixture sets this directly to simulate the post-run state; on a
// real sheet the format is applied when the learner runs the macro from
// Tools → Macros.
const f2HasCurrencyFormat: Rule = {
  id: "f2-has-currency-format",
  label: "F2 carries a currency number format after running `formatSpendColumn`",
  labelHe: "התא F2 נושא number format של מטבע אחרי הרצת `formatSpendColumn`",
  answer: "$#,##0.00",
  async run(sheet) {
    const fmt = await sheet.cellNumberFormat("F2");
    if (!fmt) {
      return {
        passed: false,
        detail:
          "F2 doesn't have a custom number format yet. After writing the macro body, run `formatSpendColumn` from the Apps Script editor's Run dropdown (or from Tools → Macros). It applies the `$#,##0.00` format to F2:F61.",
        detailHe:
          "ל-F2 אין עדיין number format מותאם. אחרי שכותבים את גוף ה-macro, מריצים את `formatSpendColumn` מהתפריט הנפתח Run בעורך Apps Script (או מ-Tools → Macros). זה מחיל את התבנית `$#,##0.00` על F2:F61.",
      };
    }
    const isCurrencyType = fmt.type === "CURRENCY";
    const patternHasDollar = (fmt.pattern ?? "").includes("$");
    if (!isCurrencyType && !patternHasDollar) {
      return {
        passed: false,
        detail: `F2's number format is type \`${fmt.type}\` with pattern \`${fmt.pattern}\`. The lesson expects a currency format: type \`CURRENCY\` or a pattern containing \`$\` (e.g. \`$#,##0.00\`).`,
        detailHe: `ה-number format של F2 הוא מסוג \`${fmt.type}\` עם תבנית \`${fmt.pattern}\`. השיעור מצפה לפורמט מטבע, סוג \`CURRENCY\` או תבנית שמכילה \`$\` (למשל \`$#,##0.00\`).`,
      };
    }
    return { passed: true };
  },
};

// Rule 3: source mentions setFrozenRows(1). This is source-only because
// SheetReader doesn't expose the frozen-row count; the source check is the
// best we can do for grading "did the macro include the freeze step".
const scriptFreezesHeader: Rule = {
  id: "script-freezes-header",
  label: "Lesson.gs calls `setFrozenRows(1)` to pin the header row",
  labelHe: "הקובץ Lesson.gs קורא ל-`setFrozenRows(1)` כדי לקבע את שורת הכותרת",
  answer: "sheet.setFrozenRows(1)",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    // Tighter than rule 1's substring check: require the literal `1` so
    // a learner who wrote `setFrozenRows(2)` (or `setFrozenColumns(1)`,
    // which is a different method on a different axis) gets flagged.
    if (!/setFrozenRows\s*\(\s*1\s*\)/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "Lesson.gs doesn't call `setFrozenRows(1)` exactly. Freezing the header row is a one-row freeze, so the argument is the literal `1`. `setFrozenRows(0)` unfreezes; `setFrozenColumns(1)` freezes a column (different method).",
        detailHe:
          "ה-Lesson.gs לא קורא בדיוק ל-`setFrozenRows(1)`. הקפאת שורת הכותרת היא הקפאה של שורה אחת, אז הארגומנט הוא `1`. `setFrozenRows(0)` מבטל הקפאה; `setFrozenColumns(1)` מקפיא עמודה (method אחרת).",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-06-macros",
  lessonSlug: "apps-script/06-macros",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [...dataToCells(CAMPAIGNS_LARGE)],
  },
  seedScript,
  rules: [definesFormatSpendColumn, f2HasCurrencyFormat, scriptFreezesHeader],
};
