import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. The lesson hooks onto column F (Spend, the 6th column)
// so the trigger fires on the exact column buyers re-touch most often, and
// writes a marker into column J (the 10th column) one row over so the marker
// doesn't clobber any real adtech data.
const WATCHED_SHEET = "Campaigns";
const WATCHED_COLUMN = 6; // F = Spend
const MARKER_COLUMN = 10; // J = Last edited marker

const STARTER_LESSON_GS = `/**
 * Simple onEdit trigger. Apps Script auto-invokes this reserved function
 * every time a user edits a cell in the bound spreadsheet. Simple triggers
 * run with a stripped auth context: no MailApp, no UrlFetchApp, no access
 * to other documents. They get the event object \`e\` and a 30-second budget.
 *
 * The body needs three things:
 *   1. Read e.range. If the edit didn't happen on the "Campaigns" tab, bail.
 *   2. If the edit didn't happen in column F (the Spend column), bail.
 *   3. Otherwise, write "updated" into the same row's column J.
 *
 * Reminder: column F is index 6, column J is index 10 (A=1, B=2, ...).
 */
function onEdit(e) {
  // TODO: implement the three checks above.
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: Lesson.gs declares `function onEdit(e)` and the body references
// e.range, the sheet name "Campaigns", and column 6 (or "F"), and writes
// into column 10 (or "J"). We check the source text rather than executing
// the function because simple triggers only fire in a live spreadsheet : 
// the test fixture can't actually invoke them.
const definesOnEdit: Rule = {
  id: "script-defines-onedit",
  label: "Lesson.gs defines `onEdit(e)` that filters by sheet + column F and writes to column J",
  labelHe:
    "הקובץ Lesson.gs מגדיר `onEdit(e)` שמסנן לפי גיליון ועמודה F וכותב לעמודה J",
  answer:
    'function onEdit(e) {\n  const range = e.range;\n  if (range.getSheet().getName() !== "Campaigns") return;\n  if (range.getColumn() !== 6) return;\n  range.getSheet().getRange(range.getRow(), 10).setValue("updated");\n}',
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
    if (!lesson.functions.includes("onEdit")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function onEdit(e)\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}. Reserved trigger names are case-sensitive: \`onedit\` lowercase doesn't fire.`,
        detailHe: `ל-Lesson.gs חסר \`function onEdit(e)\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}. שמות trigger שמורים רגישים לאותיות גדולות וקטנות, \`onedit\` באותיות קטנות לא יפעל.`,
      };
    }
    const src = lesson.source;
    if (!/e\.range/.test(src)) {
      return {
        passed: false,
        detail:
          "`onEdit` is declared but the body never reads `e.range`. The event object carries the edited range: read it with `e.range`, then check the sheet name and column on that range.",
        detailHe:
          "`onEdit` מוכרזת אבל הגוף לא קורא ל-`e.range`. אובייקט ה-event נושא את הטווח שנערך, קוראים אותו דרך `e.range` ואז בודקים את שם הגיליון והעמודה על הטווח הזה.",
      };
    }
    if (!/["']Campaigns["']/.test(src)) {
      return {
        passed: false,
        detail:
          '`onEdit` doesn\'t reference the sheet name `"Campaigns"`. Without that check the trigger fires on every tab in the workbook. Add `if (range.getSheet().getName() !== "Campaigns") return;` before the column check.',
        detailHe:
          '`onEdit` לא מתייחסת לשם הגיליון `"Campaigns"`. בלי הבדיקה הזו ה-trigger יורה בכל tab ב-spreadsheet. מוסיפים `if (range.getSheet().getName() !== "Campaigns") return;` לפני בדיקת העמודה.',
      };
    }
    // Accept either the numeric column index (6) or the string "F" against
    // a literal column-letter check. Both teach the same idea; the test
    // covers both shapes.
    const hasColumnCheck =
      /getColumn\s*\(\s*\)\s*[!=]==?\s*6/.test(src) ||
      /===?\s*6\b/.test(src) ||
      /["']F["']/.test(src);
    if (!hasColumnCheck) {
      return {
        passed: false,
        detail:
          "`onEdit` doesn't restrict to column F. Compare `range.getColumn()` against `6` (F is the 6th column) so the trigger only marks edits to the Spend column.",
        detailHe:
          "`onEdit` לא מגבילה לעמודה F. משווים את `range.getColumn()` ל-`6` (F היא העמודה השישית) כדי שה-trigger יסמן רק עריכות לעמודת ה-spend.",
      };
    }
    if (!/setValue/.test(src)) {
      return {
        passed: false,
        detail:
          "`onEdit` never calls `setValue` to write the marker. Use `range.getSheet().getRange(range.getRow(), 10).setValue(\"updated\")` to fill column J of the edited row.",
        detailHe:
          "`onEdit` לא קוראת ל-`setValue` כדי לכתוב את הסימן. משתמשים ב-`range.getSheet().getRange(range.getRow(), 10).setValue(\"updated\")` כדי למלא את עמודה J בשורה שנערכה.",
      };
    }
    // Match `..., 10)` with optional whitespace. Avoid the naive
    // `getRange([^)]*, 10)` form because the inner `range.getRow()` has its
    // own closing paren and trips the negated character class.
    const hasMarkerWrite =
      /,\s*10\s*\)\s*\.setValue/.test(src) ||
      /getRange\s*\(\s*\d+\s*,\s*10\s*\)/.test(src) ||
      /["']J\d*["']/.test(src);
    if (!hasMarkerWrite) {
      return {
        passed: false,
        detail:
          "`onEdit` calls `setValue` but not on column J. Target the row's 10th column: `getRange(range.getRow(), 10)`.",
        detailHe:
          "`onEdit` קוראת ל-`setValue` אבל לא על עמודה J. מכוונים לעמודה ה-10 של השורה: `getRange(range.getRow(), 10)`.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: In a real workbook the learner edits F2 and watches J2 fill in.
// The grader can't fire a simple trigger from a test fixture (or from the
// sidebar), so we treat J2 as the observable state: if the learner's
// onEdit fired correctly at least once, J2 holds "updated". The fixture
// in the test provides that post-edit state.
const j2MarkerAfterEdit: Rule = {
  id: "j2-marker-after-edit",
  label: 'After editing F2 (Spend), cell J2 holds the marker "updated"',
  labelHe: 'אחרי עריכת F2 (Spend), התא J2 מכיל את הסימן "updated"',
  answer: '"updated" (written by the onEdit trigger on edit of F2)',
  async run(sheet) {
    const value = await sheet.cellValue("J2");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J2 is empty. After saving your `onEdit` in the Apps Script editor, click into F2 in the Campaigns tab, type a new spend number, and press Enter. The trigger should fill J2 with `\"updated\"`. If nothing appears, check the Apps Script Execution log (left-rail clock icon) for an error.",
        detailHe:
          "J2 ריק. אחרי ששומרים את ה-`onEdit` בעורך Apps Script, לוחצים על F2 ב-tab Campaigns, מקלידים מספר spend חדש, ולוחצים Enter. ה-trigger אמור למלא את J2 ב-`\"updated\"`. אם כלום לא מופיע, בודקים את ה-Execution log של Apps Script (אייקון השעון בסרגל הצדדי) לשגיאה.",
      };
    }
    if (value !== "updated") {
      return {
        passed: false,
        detail: `J2 holds \`${value}\` but should be exactly \`"updated"\`. The lesson body writes the literal string "updated" with \`setValue("updated")\`. Anything else means the trigger fired with a different value.`,
        detailHe: `J2 מכיל \`${value}\` אבל צריך להיות בדיוק \`"updated"\`. גוף השיעור כותב את המחרוזת הליטרלית "updated" עם \`setValue("updated")\`. כל ערך אחר אומר שה-trigger ירה עם ערך אחר.`,
      };
    }
    return { passed: true };
  },
};

// Rule 3: Source-level guardrail. Simple triggers silently fail when they
// call MailApp, UrlFetchApp, or any other service that needs a real auth
// scope. Catch the mistake at grading time rather than letting the learner
// wonder why their email never goes out.
const noRestrictedServices: Rule = {
  id: "simple-trigger-no-restricted-services",
  label: "`onEdit` doesn't call MailApp or UrlFetchApp (simple triggers silently fail on those)",
  labelHe:
    "`onEdit` לא קוראת ל-MailApp או UrlFetchApp (simple triggers נכשלים בשקט עליהם)",
  answer:
    "Use only services available to simple triggers (SpreadsheetApp on the active document, Utilities, console.log).",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't check the source. Open the sheet and choose Extensions → Apps Script to launch the editor.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לבדוק את המקור. פותחים את ה-spreadsheet ובוחרים Extensions → Apps Script כדי להפעיל את העורך.",
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
    const src = lesson.source;
    if (/MailApp\.sendEmail/.test(src)) {
      return {
        passed: false,
        detail:
          "`onEdit` calls `MailApp.sendEmail`. Simple triggers run without the mail scope: the call silently fails and no email is sent. If you need to email from an edit, register an installable trigger (next lesson) instead.",
        detailHe:
          "`onEdit` קוראת ל-`MailApp.sendEmail`. Simple triggers רצים בלי mail scope, הקריאה נכשלת בשקט וכלום לא נשלח. אם צריך לשלוח אימייל מעריכה, רושמים installable trigger (השיעור הבא) במקום.",
      };
    }
    if (/UrlFetchApp\.fetch/.test(src)) {
      return {
        passed: false,
        detail:
          "`onEdit` calls `UrlFetchApp.fetch`. Simple triggers can't hit the network: the call silently fails. Push the network call to an installable trigger that runs with full auth.",
        detailHe:
          "`onEdit` קוראת ל-`UrlFetchApp.fetch`. Simple triggers לא יכולים לגשת לרשת, הקריאה נכשלת בשקט. מעבירים את הקריאה ל-installable trigger שרץ עם auth מלא.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-07-simple-triggers",
  lessonSlug: "apps-script/07-simple-triggers",
  templateSheetId: null,
  seed: {
    tabTitle: WATCHED_SHEET,
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Marker column header so the learner sees what J is for before
      // anything has been written there.
      { a1: "I1", value: "Last edited marker" },
    ],
  },
  seedScript,
  rules: [definesOnEdit, j2MarkerAfterEdit, noRestrictedServices],
};

// Exported for the test file so we don't drift on which column the lesson
// teaches. These are not part of the public AssignmentSpec API.
export const TEST_CONSTANTS = {
  WATCHED_SHEET,
  WATCHED_COLUMN,
  MARKER_COLUMN,
} as const;
