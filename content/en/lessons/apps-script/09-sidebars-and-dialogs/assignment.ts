import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// The course's bound project reserves "Sidebar.html" for the lesson shell
//: the provisioner silently drops any seedScript file named "Sidebar".
// The assignment uses "Reports" instead. The HTML file is seeded with a
// stub the learner edits to add real markup; the JS file is seeded with
// a stub showReportsSidebar() the learner completes.

const STARTER_LESSON_GS = `/**
 * Open a sidebar that displays the Reports.html UI inside the
 * spreadsheet. Sidebars are a 300px persistent panel docked to the right
 * of the grid; they survive sheet edits but close on tab close or
 * reload.
 *
 * The shape:
 *   const html = HtmlService.createHtmlOutputFromFile("Reports")
 *     .setTitle("Reports");
 *   SpreadsheetApp.getUi().showSidebar(html);
 *
 * The file name passed to createHtmlOutputFromFile is the name shown in
 * the Apps Script editor's file picker: NOT the full filename. The
 * editor stores it as "Reports.html" on disk, but you reference it as
 * "Reports" in code.
 */
function showReportsSidebar() {
  // TODO: build the HtmlOutput from the Reports file, set its title,
  // and call showSidebar.
}
`;

const STARTER_REPORTS_HTML = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
  </head>
  <body>
    <!--
      Stub HTML. Replace this comment and the placeholder below with
      a heading (h1 or h2) and at least one paragraph about spend
      that mentions the word "spend" or "Spend" somewhere.
    -->
    <p>Replace me.</p>
  </body>
</html>
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
  { name: "Reports", type: "HTML", source: STARTER_REPORTS_HTML },
];

// Rule 1: Lesson.gs exports `showReportsSidebar` and its body
// constructs HtmlOutput from the Reports file then calls showSidebar.
const definesShowReportsSidebar: Rule = {
  id: "script-defines-showreportssidebar",
  label: "Lesson.gs defines `showReportsSidebar()` that opens the Reports HTML as a sidebar",
  labelHe:
    "הקובץ Lesson.gs מגדיר `showReportsSidebar()` שפותח את ה-HTML Reports בתור sidebar",
  answer:
    'function showReportsSidebar() {\n  const html = HtmlService.createHtmlOutputFromFile("Reports")\n    .setTitle("Reports");\n  SpreadsheetApp.getUi().showSidebar(html);\n}',
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
    if (!lesson.functions.includes("showReportsSidebar")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function showReportsSidebar()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function showReportsSidebar()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const src = lesson.source;
    if (!/createHtmlOutputFromFile/.test(src)) {
      return {
        passed: false,
        detail:
          "`showReportsSidebar` doesn't call `HtmlService.createHtmlOutputFromFile(...)`. That's the entry point: pass the HTML file's name (\"Reports\", without the .html extension).",
        detailHe:
          "`showReportsSidebar` לא קוראת ל-`HtmlService.createHtmlOutputFromFile(...)`. זו נקודת הכניסה, מעבירים את שם קובץ ה-HTML (\"Reports\", בלי הסיומת .html).",
      };
    }
    if (!/["']Reports["']/.test(src)) {
      return {
        passed: false,
        detail:
          '`showReportsSidebar` calls `createHtmlOutputFromFile` but not with `"Reports"` as the argument. The HTML file in this project is named `Reports`: pass that exact string.',
        detailHe:
          '`showReportsSidebar` קוראת ל-`createHtmlOutputFromFile` אבל לא עם `"Reports"` כארגומנט. קובץ ה-HTML בפרויקט נקרא `Reports`, מעבירים את המחרוזת הזו בדיוק.',
      };
    }
    if (!/showSidebar/.test(src)) {
      return {
        passed: false,
        detail:
          "`showReportsSidebar` builds the HtmlOutput but never opens it. Call `SpreadsheetApp.getUi().showSidebar(html)` at the end of the body.",
        detailHe:
          "`showReportsSidebar` בונה את ה-HtmlOutput אבל לא פותחת אותו. קוראים ל-`SpreadsheetApp.getUi().showSidebar(html)` בסוף הגוף.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: The Reports HTML file exists, has a real body and heading,
// and was edited from the stub (the stub didn't mention "spend"; the
// learner adds it as part of writing the report markup).
const reportsHtmlExists: Rule = {
  id: "reports-html-exists",
  label: "Reports.html exists with a body, a heading, and report content",
  labelHe: "Reports.html קיים עם body, כותרת, ותוכן report",
  answer:
    '<!DOCTYPE html>\n<html>\n  <head><base target="_top"></head>\n  <body>\n    <h2>Spend report</h2>\n    <p>Today\'s total spend: <span id="spend">...</span></p>\n  </body>\n</html>',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't read the Reports file.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לקרוא את קובץ Reports.",
      };
    }
    const reports = project.files.find(
      (f) => f.name === "Reports" && f.type === "HTML",
    );
    if (!reports) {
      return {
        passed: false,
        detail:
          "The Apps Script project doesn't have an HTML file named `Reports`. In the editor, click + → HTML, name the file `Reports` (the editor adds the `.html` extension on disk).",
        detailHe:
          "לפרויקט Apps Script אין קובץ HTML בשם `Reports`. בעורך, לוחצים + → HTML, נותנים לקובץ את השם `Reports` (העורך מוסיף את הסיומת `.html` בדיסק).",
      };
    }
    const src = reports.source;
    if (!/<body[\s>]/i.test(src)) {
      return {
        passed: false,
        detail:
          "Reports.html is missing a `<body>` element. A bare fragment renders in some places but not as a sidebar: wrap your content in a normal `<!DOCTYPE html><html><body>...</body></html>` shape.",
        detailHe:
          "ל-Reports.html חסר אלמנט `<body>`. fragment חשוף נרנדר במקומות מסוימים אבל לא כ-sidebar, עוטפים את התוכן ב-`<!DOCTYPE html><html><body>...</body></html>` רגיל.",
      };
    }
    if (!/<h[12][\s>]/i.test(src)) {
      return {
        passed: false,
        detail:
          "Reports.html doesn't contain a heading (`<h1>` or `<h2>`). Sidebars are real HTML: give the panel a visible title with an `<h2>`.",
        detailHe:
          "ב-Reports.html אין כותרת (`<h1>` או `<h2>`). sidebars הם HTML אמיתי, נותנים ל-panel כותרת גלויה עם `<h2>`.",
      };
    }
    // The learner has to edit the stub: the stub doesn't mention spend.
    if (!/spend/i.test(src)) {
      return {
        passed: false,
        detail:
          "Reports.html doesn't mention spend. Replace the stub `<p>Replace me.</p>` with real report content: a heading like `<h2>Spend report</h2>` and a paragraph that names what the sidebar shows.",
        detailHe:
          "ב-Reports.html לא מוזכר spend. מחליפים את ה-stub `<p>Replace me.</p>` בתוכן report אמיתי, כותרת כמו `<h2>Spend report</h2>` ופסקה שאומרת מה ה-sidebar מציג.",
      };
    }
    // The placeholder paragraph from the stub should be replaced.
    if (/Replace me\./.test(src)) {
      return {
        passed: false,
        detail:
          "Reports.html still contains the placeholder `<p>Replace me.</p>`. Delete it and put real content in its place.",
        detailHe:
          "Reports.html עדיין מכיל את ה-placeholder `<p>Replace me.</p>`. מוחקים אותו ושמים תוכן אמיתי במקומו.",
      };
    }
    return { passed: true };
  },
};

// Rule 3: Guardrail. The course's bound project already has a reserved
// HTML file named "Sidebar" (the course shell). If the learner references
// "Sidebar" in createHtmlOutputFromFile, they'll either fail (the
// provisioner dropped their seed file) or hijack the course shell. Catch
// the mistake at source-check time.
const notUsingReservedName: Rule = {
  id: "script-not-using-reserved-name",
  label: "Lesson.gs references `\"Reports\"`, not the reserved `\"Sidebar\"` shell name",
  labelHe:
    "Lesson.gs מתייחס ל-`\"Reports\"`, לא לשם הקובץ השמור `\"Sidebar\"`",
  answer:
    'Use createHtmlOutputFromFile("Reports"): "Sidebar" is reserved for the course shell.',
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
    // Catch a learner who copy-pasted from the provisioner's Code.gs.
    if (/createHtmlOutputFromFile\s*\(\s*["']Sidebar["']\s*\)/.test(src)) {
      return {
        passed: false,
        detail:
          'Lesson.gs calls `createHtmlOutputFromFile("Sidebar")`, but `"Sidebar"` is reserved in this course for the shell that hosts the in-sheet companion. Change the argument to `"Reports"` and make sure you have a `Reports.html` file in the project.',
        detailHe:
          'Lesson.gs קורא ל-`createHtmlOutputFromFile("Sidebar")`, אבל `"Sidebar"` שמור בקורס הזה ל-shell שמארח את ה-companion בתוך ה-spreadsheet. משנים את הארגומנט ל-`"Reports"` ומוודאים שיש קובץ `Reports.html` בפרויקט.',
      };
    }
    // Belt-and-suspenders: the learner must affirmatively reference Reports.
    if (!/["']Reports["']/.test(src)) {
      return {
        passed: false,
        detail:
          'Lesson.gs doesn\'t reference the string `"Reports"` anywhere. The HTML file you\'re showing is named Reports: pass that string to `createHtmlOutputFromFile`.',
        detailHe:
          'Lesson.gs לא מתייחס למחרוזת `"Reports"` באף מקום. קובץ ה-HTML שאתם מציגים נקרא Reports, מעבירים את המחרוזת ל-`createHtmlOutputFromFile`.',
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-09-sidebars-and-dialogs",
  lessonSlug: "apps-script/09-sidebars-and-dialogs",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [...dataToCells(CAMPAIGNS_LARGE)],
  },
  seedScript,
  rules: [definesShowReportsSidebar, reportsHtmlExists, notUsingReservedName],
};
