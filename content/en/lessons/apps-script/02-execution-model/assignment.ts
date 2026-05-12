import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// Realistic numbers the lesson body cites for free-tier Apps Script:
//   UrlFetchApp: 20,000 fetches/day (consumer, documented).
//   Per-minute target: 300 (no documented throttle exists; the team treats
//   ~300/min as the safe ceiling under sustained load and prefers
//   fetchAll past that).
const PER_DAY = 20000;
const PER_MINUTE = 300;
const EXPECTED_SUMMARY = `${PER_DAY} per day, ${PER_MINUTE} per minute`;

const STARTER_LESSON_GS = `/**
 * Format a quota summary line from two integers.
 *
 * @param {number} perDay     Calls allowed per day.
 * @param {number} perMinute  Calls allowed per minute.
 * @return {string} A one-line summary, e.g. "20000 per day, 300 per minute".
 * @customfunction
 */
function quotaSummary(perDay, perMinute) {
  // TODO: return a template-literal string of the form
  // \`\${perDay} per day, \${perMinute} per minute\`.
  // Template literals are a V8-only feature: they wouldn't work on the
  // legacy Rhino runtime. Lesson 2's whole point is that V8 is what
  // makes modern JS available here.
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: the function exists, the source uses a template literal (the
// V8-only feature the lesson is teaching), and the body composes the
// expected output.
const quotaSummaryDefined: Rule = {
  id: "script-defines-quotasummary",
  label: "Lesson.gs defines `quotaSummary(perDay, perMinute)` with a template literal",
  labelHe:
    "הקובץ Lesson.gs מגדיר `quotaSummary(perDay, perMinute)` עם template literal",
  answer:
    "function quotaSummary(perDay, perMinute) {\n  return `${perDay} per day, ${perMinute} per minute`;\n}",
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
    if (!lesson.functions.includes("quotaSummary")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function quotaSummary(perDay, perMinute)\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function quotaSummary(perDay, perMinute)\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`quotaSummary` is declared but still returns `null`. Replace `return null;` with the template-literal expression.",
        detailHe:
          "`quotaSummary` מוכרזת אבל עדיין מחזירה `null`. מחליפים את `return null;` בביטוי ה-template literal.",
      };
    }
    // The V8-vs-Rhino lesson lands when the body actually uses a template
    // literal. Concatenation with + would compose the same string at
    // runtime; we explicitly reject it so the rule teaches the syntax.
    if (!lesson.source.includes("`")) {
      return {
        passed: false,
        detail:
          "`quotaSummary` doesn't use a template literal (backticks). The whole point of V8 in Apps Script is the modern JS syntax: write the body as `` `${perDay} per day, ${perMinute} per minute` ``.",
        detailHe:
          "`quotaSummary` לא משתמשת ב-template literal (backticks). כל הרעיון של V8 ב-Apps Script הוא תחביר JS מודרני, כותבים את הגוף כ-`` `${perDay} per day, ${perMinute} per minute` ``.",
      };
    }
    if (
      !lesson.source.includes("${perDay}") ||
      !lesson.source.includes("${perMinute}")
    ) {
      return {
        passed: false,
        detail:
          "`quotaSummary` has a template literal but isn't interpolating both arguments. Use `${perDay}` and `${perMinute}` inside the backticks.",
        detailHe:
          "ל-`quotaSummary` יש template literal אבל היא לא משלבת את שני הארגומנטים. משתמשים ב-`${perDay}` וב-`${perMinute}` בתוך ה-backticks.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: A1 calls the function with realistic UrlFetchApp quota numbers
// and shows the composed string. The value check pins the literal output
// so the rule catches subtle template-literal typos ("per/day" vs " per day").
const a1CallsQuotaSummary: Rule = {
  id: "a1-calls-quotasummary",
  label: `A1 calls \`=quotaSummary(${PER_DAY}, ${PER_MINUTE})\` and shows the composed string`,
  labelHe: `A1 קורא \`=quotaSummary(${PER_DAY}, ${PER_MINUTE})\` ומציג את המחרוזת המורכבת`,
  answer: `=quotaSummary(${PER_DAY}, ${PER_MINUTE})`,
  async run(sheet) {
    const formula = await sheet.cellFormula("A1");
    if (formula == null) {
      return {
        passed: false,
        detail: `A1 is empty. Type \`=quotaSummary(${PER_DAY}, ${PER_MINUTE})\`: ${PER_DAY} is UrlFetchApp's documented consumer daily cap; ${PER_MINUTE} is the team's safe per-minute target (Google does not publish a per-minute number).`,
        detailHe: `A1 ריק. מקלידים \`=quotaSummary(${PER_DAY}, ${PER_MINUTE})\`: ${PER_DAY} הוא ה-cap היומי המתועד של UrlFetchApp ב-tier הצרכני; ${PER_MINUTE} הוא היעד הבטוח בדקה שהצוות עובד מולו (Google לא מפרסמת מספר רשמי לדקה).`,
      };
    }
    if (!/\bquotaSummary\s*\(/i.test(formula)) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. Call your function: \`=quotaSummary(${PER_DAY}, ${PER_MINUTE})\`.`,
        detailHe: `A1 מכיל \`${formula}\`. קוראים ל-function שלכם: \`=quotaSummary(${PER_DAY}, ${PER_MINUTE})\`.`,
      };
    }
    if (!formula.includes(String(PER_DAY)) || !formula.includes(String(PER_MINUTE))) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. Pass the lesson's two example quota numbers: \`${PER_DAY}\` (per day) and \`${PER_MINUTE}\` (per minute).`,
        detailHe: `A1 מכיל \`${formula}\`. מעבירים את שני מספרי ה-quota מהשיעור: \`${PER_DAY}\` (ביום) ו-\`${PER_MINUTE}\` (בדקה).`,
      };
    }
    const value = await sheet.cellValue("A1");
    if (value !== EXPECTED_SUMMARY) {
      return {
        passed: false,
        detail: `A1 evaluates to \`${value}\` but should be exactly \`${EXPECTED_SUMMARY}\`. If it's empty, the function body still returns \`null\`. If the wording is off, check the spaces and commas inside the template literal.`,
        detailHe: `A1 מתוצא ל-\`${value}\` אבל צריך להיות בדיוק \`${EXPECTED_SUMMARY}\`. אם זה ריק, גוף ה-function עדיין מחזיר \`null\`. אם הניסוח שונה, בודקים את הרווחים והפסיקים בתוך ה-template literal.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-02-execution-model",
  lessonSlug: "apps-script/02-execution-model",
  templateSheetId: null,
  seed: {
    tabTitle: "Sheet1",
    cells: [
      { a1: "B1", value: "UrlFetchApp quota summary (returned by quotaSummary)" },
    ],
  },
  seedScript,
  rules: [quotaSummaryDefined, a1CallsQuotaSummary],
};
