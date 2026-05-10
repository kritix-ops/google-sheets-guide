import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

const STARTER_LESSON_GS = `/**
 * Return the title of the spreadsheet this script is bound to.
 *
 * @return {string} The spreadsheet name as shown in the browser tab.
 * @customfunction
 */
function projectName() {
  // TODO: replace this with a call into SpreadsheetApp that returns the
  // active spreadsheet's name. One line. Hint: SpreadsheetApp.getActive
  // returns a Spreadsheet; Spreadsheet has a .getName() method.
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: the learner has opened the Apps Script editor, found the
// starter file, and edited the body. We detect the edit by checking the
// source for the SpreadsheetApp call chain, not by running the function
// (the in-memory grader has no Apps Script runtime).
const projectNameDefined: Rule = {
  id: "script-defines-projectname",
  label: "Lesson.gs defines `projectName()` and returns the spreadsheet title",
  labelHe:
    "הקובץ Lesson.gs מגדיר `projectName()` ומחזיר את שם ה-spreadsheet",
  answer:
    "function projectName() {\n  return SpreadsheetApp.getActiveSpreadsheet().getName();\n}",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found. Open the sheet, choose Extensions → Apps Script to launch the editor, then re-run grading.",
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
    if (!lesson.functions.includes("projectName")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function projectName()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function projectName()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`projectName` is declared but the body still returns `null`. Replace `return null;` with `return SpreadsheetApp.getActiveSpreadsheet().getName();`.",
        detailHe:
          "`projectName` מוכרזת אבל הגוף עדיין מחזיר `null`. מחליפים את `return null;` ב-`return SpreadsheetApp.getActiveSpreadsheet().getName();`.",
      };
    }
    if (
      !lesson.source.includes("SpreadsheetApp") ||
      !/getName\s*\(/.test(lesson.source)
    ) {
      return {
        passed: false,
        detail:
          "`projectName` doesn't read the spreadsheet's name. The expected body chains `SpreadsheetApp.getActiveSpreadsheet()` into `.getName()`.",
        detailHe:
          "`projectName` לא קוראת את שם ה-spreadsheet. הגוף המצופה משרשר `SpreadsheetApp.getActiveSpreadsheet()` ל-`.getName()`.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: the learner called the custom function from cell A1. We don't
// assert a specific value because the spreadsheet's title is per-attempt
// (the provisioner names it after the learner); any non-empty string is
// proof the function ran.
const a1CallsProjectName: Rule = {
  id: "a1-calls-projectname",
  label: "A1 calls `=projectName()` and shows a non-empty string",
  labelHe: "A1 קורא `=projectName()` ומציג מחרוזת לא ריקה",
  answer: "=projectName()",
  async run(sheet) {
    const formula = await sheet.cellFormula("A1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "A1 is empty. Type `=projectName()` so the cell calls your new custom function. The cell should show this workbook's title.",
        detailHe:
          "A1 ריק. מקלידים `=projectName()` כדי שהתא יקרא ל-custom function החדשה שלכם. התא צריך להציג את שם ה-spreadsheet הזה.",
      };
    }
    if (!/\bprojectName\s*\(/i.test(formula)) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. Call your function: \`=projectName()\` (no arguments).`,
        detailHe: `A1 מכיל \`${formula}\`. קוראים ל-function שלכם: \`=projectName()\` (בלי ארגומנטים).`,
      };
    }
    const value = await sheet.cellValue("A1");
    if (typeof value !== "string" || value.length === 0) {
      return {
        passed: false,
        detail: `A1 evaluates to \`${value}\` instead of a workbook title. The function probably still returns \`null\`: re-check the body in \`Lesson.gs\`.`,
        detailHe: `A1 מתוצא ל-\`${value}\` במקום לשם של spreadsheet. ה-function כנראה עדיין מחזירה \`null\`, בדקו שוב את הגוף ב-\`Lesson.gs\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-01-editor-and-project",
  lessonSlug: "apps-script/01-editor-and-project",
  templateSheetId: null,
  seed: {
    tabTitle: "Sheet1",
    cells: [
      // A small instructions cell so the learner sees a non-empty
      // workbook on first open. Column B is left clear for the formula
      // result so A1 holding the formula and B1 holding a label is the
      // standard summary-cell pairing the rest of the course uses.
      { a1: "B1", value: "Workbook title (returned by projectName)" },
    ],
  },
  seedScript,
  rules: [projectNameDefined, a1CallsProjectName],
};
