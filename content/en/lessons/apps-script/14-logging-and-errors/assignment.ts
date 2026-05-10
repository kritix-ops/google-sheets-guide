import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. The lesson reads F2 (spend on the first campaign in the
// log) inside a try/catch, then writes either the value or the string
// "error" to J1. Numbers come from the dataset so the rule's "is this a
// number?" check works against the same value the cell would actually hold.
const ROW2 = CAMPAIGNS_LARGE[1];
const F2_SPEND = typeof ROW2[5] === "number" ? ROW2[5] : 0;

const STARTER_LESSON_GS = `/**
 * Read F2 (Spend) inside a try/catch.
 *   - On success: console.log the value, then setValue(spend * 1) into J1.
 *   - On failure: console.error("Failed to read spend: " + e.toString())
 *                 and setValue("error") into J1.
 *
 * The point of the lesson: every production trigger handler the team writes
 * looks like this. A reader that can throw, wrapped in a try/catch, with
 * structured logging on both paths so Cloud Logging can pick up the failure.
 */
function processSpendSafely() {
  // TODO: implement the try/catch. The success path logs and writes the
  // number; the catch path logs the error and writes the string "error".
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1. Lesson.gs declares `function processSpendSafely()` and the body
// uses `try { ... } catch (e) { ... }` with `console.error` (or `Logger.log`)
// inside the catch block. We grep the source rather than executing because
// the test fixture can't simulate the API call failing.
const usesTryCatch: Rule = {
  id: "script-uses-trycatch",
  label:
    "`processSpendSafely` wraps the read in a `try/catch` and logs the error",
  labelHe:
    "`processSpendSafely` עוטפת את הקריאה ב-`try/catch` ומתעדת את השגיאה",
  answer:
    'function processSpendSafely() {\n  try {\n    const spend = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("F2").getValue();\n    console.log("Read spend: " + spend);\n    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue(spend * 1);\n  } catch (e) {\n    console.error("Failed to read spend: " + e.toString());\n    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue("error");\n  }\n}',
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
    if (!lesson.functions.includes("processSpendSafely")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function processSpendSafely()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}. The function name has to match exactly so the editor's Run button finds it.`,
        detailHe: `ל-Lesson.gs חסר \`function processSpendSafely()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}. שם ה-function צריך להיות מדויק כדי שכפתור ה-Run בעורך ימצא אותה.`,
      };
    }
    const src = lesson.source;
    const hasTry = /\btry\s*\{/.test(src);
    const hasCatch = /\bcatch\s*\(/.test(src);
    if (!hasTry || !hasCatch) {
      return {
        passed: false,
        detail:
          "`processSpendSafely` doesn't have a `try { ... } catch (e) { ... }` block. The read can throw (sheet renamed, permissions revoked, F2 holds an unexpected value) and you want to handle that instead of letting the trigger crash. Wrap the read in `try` and the recovery in `catch (e)`.",
        detailHe:
          "ל-`processSpendSafely` אין בלוק `try { ... } catch (e) { ... }`. הקריאה יכולה לזרוק exception (גיליון ששינה שם, הרשאות שנשללו, F2 שמכיל ערך לא צפוי) וצריך לטפל בזה במקום לתת ל-trigger לקרוס. עוטפים את הקריאה ב-`try` ואת ההתאוששות ב-`catch (e)`.",
      };
    }
    // Look for an error-level log inside the catch. console.error is the
    // modern surface; Logger.log is the legacy one. Either counts.
    const catchBlockMatch = src.match(/catch\s*\([^)]*\)\s*\{([\s\S]*?)\}/);
    const catchBody = catchBlockMatch ? catchBlockMatch[1] : "";
    const logsInCatch =
      /console\.error/.test(catchBody) || /Logger\.log/.test(catchBody);
    if (!logsInCatch) {
      return {
        passed: false,
        detail:
          "The `catch` block doesn't log the error. Add `console.error(\"Failed to read spend: \" + e.toString())` inside the catch so the failure shows up in the Executions panel under the error severity filter.",
        detailHe:
          "בלוק ה-`catch` לא מתעד את השגיאה. מוסיפים `console.error(\"Failed to read spend: \" + e.toString())` בתוך ה-catch כדי שהכשל יופיע בפאנל Executions תחת פילטר error.",
      };
    }
    return { passed: true };
  },
};

// Rule 2. Source must also contain console.log on the success path. The
// idea: the learner should think about both branches, not just the failure
// one. console.log on the success path is what makes Cloud Logging useful
// for noticing "the trigger ran, read a number, all good."
const usesConsoleLog: Rule = {
  id: "script-uses-console-log",
  label: "`processSpendSafely` calls `console.log` on the success path",
  labelHe: "`processSpendSafely` קוראת ל-`console.log` במסלול ההצלחה",
  answer: 'console.log("Read spend: " + spend);',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't check the source. Open the sheet and choose Extensions → Apps Script to launch the editor.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לבדוק את המקור. פותחים את ה-spreadsheet ובוחרים Extensions → Apps Script.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail: "`Lesson.gs` is missing. Restore it and re-run grading.",
        detailHe: "`Lesson.gs` חסר. משחזרים אותו ומריצים grading שוב.",
      };
    }
    if (!/console\.log/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`processSpendSafely` never calls `console.log`. Production trigger handlers log on both branches: `console.error` in the catch, `console.log` on the success path. Without the success log you have no way to confirm the trigger fired and read a real number. Add `console.log(\"Read spend: \" + spend)` after the read.",
        detailHe:
          "`processSpendSafely` לא קוראת ל-`console.log`. handlers של triggers בפרודקשן מתעדים בשני המסלולים: `console.error` ב-catch, `console.log` במסלול ההצלחה. בלי לוג ההצלחה אין דרך לאשר שה-trigger ירה וקרא מספר אמיתי. מוסיפים `console.log(\"Read spend: \" + spend)` אחרי הקריאה.",
      };
    }
    return { passed: true };
  },
};

// Rule 3. Observable state: J1 holds either a number (success path fired)
// or the string "error" (catch path fired). The test fixture sets one or
// the other to simulate each branch. The rule accepts both.
const j1ShowsSpendOrError: Rule = {
  id: "j1-shows-spend-or-error",
  label: 'J1 holds the spend (number) or the string "error"',
  labelHe: 'J1 מחזיק את ה-spend (מספר) או את המחרוזת "error"',
  answer: `${F2_SPEND} on success, "error" in the catch path`,
  async run(sheet) {
    const value = await sheet.cellValue("J1");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J1 is empty. After saving `processSpendSafely`, click Run in the Apps Script editor (or rerun your trigger). The success path writes `spend * 1` to J1; the catch path writes `\"error\"`. An empty J1 means the function never ran or the body never reached either branch.",
        detailHe:
          "J1 ריק. אחרי ששומרים את `processSpendSafely`, לוחצים Run בעורך Apps Script (או מריצים מחדש את ה-trigger). מסלול ההצלחה כותב `spend * 1` ל-J1; מסלול ה-catch כותב `\"error\"`. J1 ריק אומר שה-function לא רצה או שהגוף לא הגיע לאף אחד מהמסלולים.",
      };
    }
    if (typeof value === "number") {
      return { passed: true };
    }
    if (typeof value === "string" && value.toLowerCase() === "error") {
      return { passed: true };
    }
    return {
      passed: false,
      detail: `J1 holds \`${value}\`. The success path writes the number from F2; the catch path writes the exact string \`"error"\`. Anything else means the body produced an unexpected output. Common cause: a stray \`setValue(spend)\` without the \`* 1\` (still a number, still passes) versus a hardcoded label like "done" or "ok" (fails).`,
      detailHe: `J1 מכיל \`${value}\`. מסלול ההצלחה כותב את המספר מ-F2; מסלול ה-catch כותב את המחרוזת המדויקת \`"error"\`. כל ערך אחר אומר שהגוף הפיק פלט לא צפוי. סיבה נפוצה: \`setValue(spend)\` בלי \`* 1\` (עדיין מספר, עדיין עובר) לעומת לייבל קשיח כמו "done" או "ok" (נכשל).`,
    };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-14-logging-and-errors",
  lessonSlug: "apps-script/14-logging-and-errors",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      { a1: "I1", value: "Spend (with error handling)" },
    ],
  },
  seedScript,
  rules: [usesTryCatch, usesConsoleLog, j1ShowsSpendOrError],
};

// Exported so the test file shares the F2 constant with the rule.
export const TEST_CONSTANTS = { F2_SPEND } as const;
