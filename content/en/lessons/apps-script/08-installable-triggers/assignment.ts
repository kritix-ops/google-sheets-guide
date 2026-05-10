import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// The lesson teaches two functions that work together:
//   - setupDailyRefresh() registers a time-driven installable trigger.
//   - refreshAggregator() is the handler the trigger fires every day.
// Production handlers would pull from Taboola/Outbrain. For grading
// purposes, the handler writes a timestamp into J1 so the learner has
// something to verify in the sheet after a manual test run.

const STARTER_LESSON_GS = `/**
 * Register a daily time-driven installable trigger that fires
 * \`refreshAggregator\` at 6 AM every day. Run this function once from
 * the Apps Script editor: accept the auth prompt that appears, and from
 * then on the schedule runs on its own.
 *
 * Use the ScriptApp builder:
 *   ScriptApp.newTrigger(handlerName)
 *     .timeBased()
 *     .everyDays(1)
 *     .atHour(6)
 *     .create();
 *
 * The handler name is a STRING that matches a top-level function in
 * this project. Apps Script looks it up at fire time.
 */
function setupDailyRefresh() {
  // TODO: register the trigger with the builder chain above.
}

/**
 * The handler the daily trigger fires. Installable triggers run with the
 * project owner's full auth, so this handler could send mail, call APIs,
 * or read other documents. For this lesson, write a timestamp into J1 so
 * you can verify the handler ran by looking at the sheet.
 */
function refreshAggregator() {
  // TODO: write the current Date() into cell J1 on the Campaigns tab.
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: setupDailyRefresh builds the trigger correctly. Source checks
// because the grader can't actually inspect ScriptApp.getProjectTriggers()
// from the in-memory fixture; the build chain is what tells us the learner
// understood the registration shape.
const definesSetupDailyRefresh: Rule = {
  id: "script-defines-setupdailyrefresh",
  label: "Lesson.gs defines `setupDailyRefresh()` that registers a daily time-driven trigger",
  labelHe:
    "הקובץ Lesson.gs מגדיר `setupDailyRefresh()` שרושם time-driven trigger יומי",
  answer:
    'function setupDailyRefresh() {\n  ScriptApp.newTrigger("refreshAggregator")\n    .timeBased()\n    .everyDays(1)\n    .atHour(6)\n    .create();\n}',
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
    if (!lesson.functions.includes("setupDailyRefresh")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function setupDailyRefresh()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function setupDailyRefresh()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const src = lesson.source;
    if (!/ScriptApp\.newTrigger/.test(src)) {
      return {
        passed: false,
        detail:
          "`setupDailyRefresh` doesn't call `ScriptApp.newTrigger(...)`. That's the builder entry point: `ScriptApp.newTrigger(\"refreshAggregator\").timeBased().everyDays(1).atHour(6).create();`.",
        detailHe:
          "`setupDailyRefresh` לא קוראת ל-`ScriptApp.newTrigger(...)`. זו נקודת הכניסה ל-builder: `ScriptApp.newTrigger(\"refreshAggregator\").timeBased().everyDays(1).atHour(6).create();`.",
      };
    }
    if (!/timeBased\s*\(\s*\)/.test(src)) {
      return {
        passed: false,
        detail:
          "`setupDailyRefresh` is missing `.timeBased()` in the builder chain. Without it, Apps Script can't tell which kind of trigger you're registering.",
        detailHe:
          "ל-`setupDailyRefresh` חסר `.timeBased()` בשרשרת ה-builder. בלי זה, Apps Script לא יודע איזה סוג trigger אתם רושמים.",
      };
    }
    if (!/\.create\s*\(\s*\)/.test(src)) {
      return {
        passed: false,
        detail:
          "`setupDailyRefresh` builds the trigger but never calls `.create()`. The builder doesn't register anything until you call `.create()` at the end of the chain.",
        detailHe:
          "`setupDailyRefresh` בונה את ה-trigger אבל לא קוראת ל-`.create()`. ה-builder לא רושם כלום עד שקוראים ל-`.create()` בסוף השרשרת.",
      };
    }
    if (!/["']refreshAggregator["']/.test(src)) {
      return {
        passed: false,
        detail:
          '`setupDailyRefresh` doesn\'t pass `"refreshAggregator"` as the handler. The handler name is a STRING that Apps Script looks up at fire time: `ScriptApp.newTrigger("refreshAggregator")`, with quotes.',
        detailHe:
          '`setupDailyRefresh` לא מעבירה `"refreshAggregator"` כ-handler. שם ה-handler הוא מחרוזת ש-Apps Script מחפש בזמן הירייה: `ScriptApp.newTrigger("refreshAggregator")`, עם מירכאות.',
      };
    }
    return { passed: true };
  },
};

// Rule 2: refreshAggregator exists. The body should write to a cell
// (or otherwise do something productive); a function that returns null
// teaches nothing about installable triggers.
const definesRefreshAggregator: Rule = {
  id: "script-defines-refreshaggregator",
  label: "Lesson.gs defines `refreshAggregator()` that writes a timestamp into J1",
  labelHe: "הקובץ Lesson.gs מגדיר `refreshAggregator()` שכותב timestamp ל-J1",
  answer:
    'function refreshAggregator() {\n  SpreadsheetApp.getActiveSpreadsheet()\n    .getSheetByName("Campaigns")\n    .getRange("J1")\n    .setValue(new Date());\n}',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't read the source.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לקרוא את המקור.",
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
    if (!lesson.functions.includes("refreshAggregator")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function refreshAggregator()\`. The trigger you register in \`setupDailyRefresh\` looks up the handler BY NAME at fire time: if no function with that name exists, the trigger fires with no effect (and logs an error in the Executions dashboard). Functions Apps Script saw: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function refreshAggregator()\` ברמה העליונה. ה-trigger שאתם רושמים ב-\`setupDailyRefresh\` מחפש את ה-handler לפי שם בזמן הירייה, אם אין function עם השם הזה ה-trigger יורה בלי השפעה (ורושם שגיאה ב-Executions dashboard). פונקציות ש-Apps Script ראה: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const src = lesson.source;
    // Pull just the refreshAggregator body so we don't accidentally accept
    // a setValue that lives in some other function.
    const bodyMatch = src.match(
      /function\s+refreshAggregator\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
    );
    const body = bodyMatch ? bodyMatch[1] : "";
    if (!/setValue/.test(body) && !/setValues/.test(body)) {
      return {
        passed: false,
        detail:
          "`refreshAggregator` is declared but its body doesn't call `setValue` (or `setValues`). For this lesson, write `new Date()` into J1 on the Campaigns tab so you can confirm the handler ran. Production handlers would pull from an external API here: installable triggers have the auth scopes for it.",
        detailHe:
          "`refreshAggregator` מוכרזת אבל הגוף שלה לא קורא ל-`setValue` (או `setValues`). למטרת השיעור, כותבים `new Date()` ל-J1 ב-tab Campaigns כדי לאמת שה-handler רץ. handlers בפרודקשן ימשכו מ-API חיצוני, ל-installable triggers יש את ה-auth scopes לזה.",
      };
    }
    return { passed: true };
  },
};

// Rule 3: the lesson's point: installable triggers can call services
// simple triggers can't. The grader rewards any productive action in the
// handler body (setValue, MailApp, UrlFetchApp, etc.) instead of insisting
// on one specific pattern. A handler that returns null without doing
// anything misses the point.
const handlerUsesFullAuth: Rule = {
  id: "trigger-handler-uses-full-auth",
  label: "`refreshAggregator` does some productive work (write, fetch, or send)",
  labelHe: "`refreshAggregator` עושה עבודה פרודוקטיבית (כתיבה, fetch, או שליחה)",
  answer:
    "The handler body uses at least one of: setValue, setValues, MailApp, GmailApp, UrlFetchApp.",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't read the source.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לקרוא את המקור.",
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
    const bodyMatch = src.match(
      /function\s+refreshAggregator\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
    );
    if (!bodyMatch) {
      return {
        passed: false,
        detail:
          "`refreshAggregator` body couldn't be parsed. Make sure the function uses a normal `function refreshAggregator() { ... }` declaration.",
        detailHe:
          "לא הצלחנו לפרסר את גוף `refreshAggregator`. מוודאים שה-function משתמשת בהכרזה רגילה `function refreshAggregator() { ... }`.",
      };
    }
    const body = bodyMatch[1];
    const productive = [
      /setValue/,
      /setValues/,
      /MailApp/,
      /GmailApp/,
      /UrlFetchApp/,
    ].some((re) => re.test(body));
    if (!productive) {
      return {
        passed: false,
        detail:
          "`refreshAggregator` body doesn't do any productive work. Installable triggers have full auth: that's the whole point of moving from a simple trigger to an installable one. Call at least one of: `setValue` / `setValues` (write to the sheet), `MailApp.sendEmail`, `GmailApp.*`, or `UrlFetchApp.fetch`. For this lesson, the simplest thing is `SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\").getRange(\"J1\").setValue(new Date());`.",
        detailHe:
          "גוף `refreshAggregator` לא עושה שום עבודה פרודוקטיבית. ל-installable triggers יש auth מלא, זו כל הנקודה של המעבר מ-simple trigger ל-installable. קוראים לפחות לאחת מאלה: `setValue` / `setValues` (כתיבה ל-sheet), `MailApp.sendEmail`, `GmailApp.*`, או `UrlFetchApp.fetch`. למטרת השיעור, הדבר הפשוט ביותר הוא `SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\").getRange(\"J1\").setValue(new Date());`.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-08-installable-triggers",
  lessonSlug: "apps-script/08-installable-triggers",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Label for the cell the handler writes into. The learner sees what
      // J1 is for before the trigger fires.
      { a1: "I1", value: "Last refresh" },
    ],
  },
  seedScript,
  rules: [definesSetupDailyRefresh, definesRefreshAggregator, handlerUsesFullAuth],
};
