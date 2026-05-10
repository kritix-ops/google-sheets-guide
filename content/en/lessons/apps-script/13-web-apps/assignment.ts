import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE header row plus 60 data rows. We pre-seed J1 with the
// total spend so doGet has something to read without first running a
// recompute. The point of this lesson is the web-app surface, not the
// sum.
const SPEND_COL = 5;
const TOTAL_SPEND = CAMPAIGNS_LARGE.slice(1).reduce<number>((sum, row) => {
  const v = row[SPEND_COL];
  return sum + (typeof v === "number" ? v : 0);
}, 0);

const STARTER_LESSON_GS = `/**
 * Deploy this script as a web app to expose two endpoints:
 *   GET  /exec  -> doGet: returns an HTML page with the current J1 spend
 *   POST /exec  -> doPost: parses a JSON body and writes payload.value to K1,
 *                  then returns a JSON success response
 *
 * The grader doesn't deploy or hit the URL: it reads the source and
 * checks the canonical shapes are there. Once your shapes pass, Deploy
 * → New deployment → Web app from the editor to mint a real URL.
 */

function doGet(e) {
  // TODO: Read J1 on Campaigns, wrap it in an HtmlService response, return it.
  return null;
}

function doPost(e) {
  // TODO:
  //   1. Parse e.postData.contents as JSON.
  //   2. Write payload.value to K1 on Campaigns.
  //   3. Return ContentService.createTextOutput(JSON.stringify({ ok: true }))
  //        .setMimeType(ContentService.MimeType.JSON);
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: `doGet` is declared, the body uses an Html/Content service
// to return a response object, and it reads J1. The grader can't
// actually call the URL, so this is a source-shape check.
const definesDoGet: Rule = {
  id: "script-defines-doget",
  label:
    "Lesson.gs defines `doGet(e)` that reads J1 and returns an `HtmlService` or `ContentService` response",
  labelHe:
    "הקובץ Lesson.gs מגדיר `doGet(e)` שקורא את J1 ומחזיר response של `HtmlService` או `ContentService`",
  answer:
    "function doGet(e) {\n" +
    '  const spend = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
    "  return HtmlService.createHtmlOutput(`<h1>Total spend: $${spend}</h1>`);\n" +
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
    if (!lesson.functions.includes("doGet")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function doGet(e)\`. Apps Script requires the exact name \`doGet\` (camelCase, no leading capital) for the runtime to wire GET requests to it. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function doGet(e)\` ברמה העליונה. Apps Script דורש את השם המדויק \`doGet\` (camelCase, בלי אות גדולה בהתחלה) כדי שה-runtime ייקשר אליו את בקשות ה-GET. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    // Body checks: isolate the doGet body so we don't catch keywords
    // from doPost.
    const docGetBodyMatch = lesson.source.match(
      /function\s+doGet\s*\([^)]*\)\s*{([\s\S]*?)\n}/,
    );
    const doGetBody = docGetBodyMatch ? docGetBodyMatch[1] : "";
    const strippedBody = doGetBody.replace(/\s+/g, "");
    if (strippedBody.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`doGet` is declared but still returns `null` without doing anything. Replace the stub with an `HtmlService.createHtmlOutput(...)` (or `ContentService.createTextOutput(...)`) call that includes the spend total from J1.",
        detailHe:
          "`doGet` מוכרזת אבל עדיין מחזירה `null` בלי לעשות כלום. מחליפים את ה-stub בקריאה ל-`HtmlService.createHtmlOutput(...)` (או ל-`ContentService.createTextOutput(...)`) שכוללת את ה-spend מ-J1.",
      };
    }
    const usesResponseService =
      /HtmlService\.createHtmlOutput\s*\(/.test(doGetBody) ||
      /ContentService\.createTextOutput\s*\(/.test(doGetBody);
    if (!usesResponseService) {
      return {
        passed: false,
        detail:
          "`doGet` doesn't return an `HtmlService.createHtmlOutput(...)` or a `ContentService.createTextOutput(...)`. Web-app responses have to be one of those two types: raw strings don't work because Apps Script doesn't know what content-type to set.",
        detailHe:
          "`doGet` לא מחזיר `HtmlService.createHtmlOutput(...)` או `ContentService.createTextOutput(...)`. response של web app חייב להיות אחד משני הסוגים האלה, מחרוזות גולמיות לא עובדות כי Apps Script לא יודע איזה content-type להציב.",
      };
    }
    if (!/J1/.test(doGetBody)) {
      return {
        passed: false,
        detail:
          "`doGet` doesn't reference `J1`. The lesson asks for an endpoint that shows the current spend total: read it with `sheet.getRange(\"J1\").getValue()` and embed it in the response body.",
        detailHe:
          "`doGet` לא מפנה ל-`J1`. השיעור מבקש endpoint שמציג את ה-spend הכולל הנוכחי. קוראים אותו עם `sheet.getRange(\"J1\").getValue()` ומשלבים אותו בגוף ה-response.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: `doPost` is declared, parses the request body, writes to K1,
// and returns a JSON ContentService response. Four shape checks.
const definesDoPost: Rule = {
  id: "script-defines-dopost",
  label:
    "Lesson.gs defines `doPost(e)` that parses the JSON body, writes to K1, and returns a JSON response",
  labelHe:
    "הקובץ Lesson.gs מגדיר `doPost(e)` שמפענח את גוף ה-JSON, כותב ל-K1, ומחזיר response של JSON",
  answer:
    "function doPost(e) {\n" +
    "  const payload = JSON.parse(e.postData.contents);\n" +
    '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("K1").setValue(payload.value);\n' +
    "  return ContentService.createTextOutput(JSON.stringify({ ok: true }))\n" +
    "    .setMimeType(ContentService.MimeType.JSON);\n" +
    "}",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    if (!lesson.functions.includes("doPost")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function doPost(e)\`. Apps Script requires the exact name \`doPost\` for the runtime to wire POST requests to it. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function doPost(e)\` ברמה העליונה. Apps Script דורש את השם המדויק \`doPost\` כדי שה-runtime ייקשר אליו את בקשות ה-POST. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const doPostBodyMatch = lesson.source.match(
      /function\s+doPost\s*\([^)]*\)\s*{([\s\S]*?)\n}/,
    );
    const doPostBody = doPostBodyMatch ? doPostBodyMatch[1] : "";
    const strippedBody = doPostBody.replace(/\s+/g, "");
    if (strippedBody.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`doPost` is declared but still returns `null` without doing anything. The canonical body is: parse `e.postData.contents` as JSON, write the value to K1, return a `ContentService` response.",
        detailHe:
          "`doPost` מוכרזת אבל עדיין מחזירה `null` בלי לעשות כלום. הגוף הקנוני: מפענחים את `e.postData.contents` כ-JSON, כותבים את הערך ל-K1, מחזירים response של `ContentService`.",
      };
    }
    if (!/JSON\.parse\s*\(\s*e\.postData\.contents/.test(doPostBody)) {
      return {
        passed: false,
        detail:
          "`doPost` doesn't parse `e.postData.contents`. POST bodies in Apps Script web apps arrive on `e.postData.contents` as the raw request body: for a JSON POST you parse it with `JSON.parse(e.postData.contents)`.",
        detailHe:
          "`doPost` לא מפענחת את `e.postData.contents`. גופי POST ב-web apps של Apps Script מגיעים ב-`e.postData.contents` כגוף הבקשה הגולמי, ל-POST של JSON מפענחים עם `JSON.parse(e.postData.contents)`.",
      };
    }
    if (!/K1/.test(doPostBody) || !/\bsetValue\s*\(/.test(doPostBody)) {
      return {
        passed: false,
        detail:
          "`doPost` doesn't write to `K1` with `setValue`. The assignment asks for the parsed payload to land at `K1` on the Campaigns tab: `sheet.getRange(\"K1\").setValue(payload.value)`.",
        detailHe:
          "`doPost` לא כותבת ל-`K1` עם `setValue`. המטלה דורשת שה-payload המפוענח ינחת ב-`K1` בלשונית Campaigns: `sheet.getRange(\"K1\").setValue(payload.value)`.",
      };
    }
    if (!/ContentService\.createTextOutput\s*\(/.test(doPostBody)) {
      return {
        passed: false,
        detail:
          "`doPost` doesn't return a `ContentService.createTextOutput(...)`. JSON web-app responses always come from `ContentService` because it can set the content-type to `application/json`: `HtmlService` can't.",
        detailHe:
          "`doPost` לא מחזירה `ContentService.createTextOutput(...)`. responses של JSON ב-web app תמיד מגיעים מ-`ContentService` כי הוא יכול להציב content-type של `application/json`, `HtmlService` לא יכול.",
      };
    }
    if (
      !/MimeType\.JSON/.test(doPostBody) &&
      !/setMimeType\s*\([^)]*JSON/.test(doPostBody)
    ) {
      return {
        passed: false,
        detail:
          "`doPost` returns a text output but doesn't set the MIME type to JSON. Chain `.setMimeType(ContentService.MimeType.JSON)` so the response advertises `application/json` to the caller. Without it, clients fall back to parsing the body as text.",
        detailHe:
          "`doPost` מחזירה text output אבל לא מציבה את ה-MIME type ל-JSON. משרשרים `.setMimeType(ContentService.MimeType.JSON)` כדי שה-response יכריז `application/json` לקורא. בלי זה, clients נופלים לפענוח הגוף כ-text.",
      };
    }
    return { passed: true };
  },
};

// Rule 3: defensive guard. Web-app endpoints should be fast: don't
// send email or hit Drive synchronously inside doGet/doPost. We flag
// MailApp/GmailApp specifically because the team has been bitten by it
// (a doPost that sent an email per call started timing out the moment
// the source service started retrying with a small burst).
const noSlowServicesInBodies: Rule = {
  id: "script-not-using-restricted-services",
  label:
    "`doGet` and `doPost` bodies don't call `MailApp` / `GmailApp` synchronously (web-app responses should stay fast)",
  labelHe:
    "הגופים של `doGet` ו-`doPost` לא קוראים ל-`MailApp` / `GmailApp` באופן סינכרוני (responses של web app צריכים להישאר מהירים)",
  answer:
    "Move email-sending out of doGet/doPost. Push the work onto a time-driven trigger or a queued job, and respond to the request immediately.",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    const bodies: string[] = [];
    const doGetMatch = lesson.source.match(
      /function\s+doGet\s*\([^)]*\)\s*{([\s\S]*?)\n}/,
    );
    if (doGetMatch) bodies.push(doGetMatch[1]);
    const doPostMatch = lesson.source.match(
      /function\s+doPost\s*\([^)]*\)\s*{([\s\S]*?)\n}/,
    );
    if (doPostMatch) bodies.push(doPostMatch[1]);
    const combined = bodies.join("\n");
    if (/\bMailApp\.\w+\s*\(/.test(combined)) {
      return {
        passed: false,
        detail:
          "`doGet` or `doPost` calls `MailApp.*` synchronously. Web-app responses block until the function returns, so an email send inside the response loop adds 200–500 ms per request and risks timing out under bursts. Push email-sending onto a time-driven trigger or write the work to a queue tab and process it later.",
        detailHe:
          "`doGet` או `doPost` קוראת ל-`MailApp.*` באופן סינכרוני. responses של web app חוסמים עד שה-function חוזרת, אז שליחת מייל בתוך לולאת ה-response מוסיפה 200–500 ms לכל בקשה ומסתכנת ב-timeout תחת bursts. דוחפים את שליחת המייל ל-trigger מבוסס-זמן או כותבים את העבודה ללשונית queue ומעבדים אותה מאוחר יותר.",
      };
    }
    if (/\bGmailApp\.\w+\s*\(/.test(combined)) {
      return {
        passed: false,
        detail:
          "`doGet` or `doPost` calls `GmailApp.*` synchronously. Same issue as `MailApp`: gmail calls are slow relative to a request lifecycle. Move them out of the response path.",
        detailHe:
          "`doGet` או `doPost` קוראת ל-`GmailApp.*` באופן סינכרוני. אותה בעיה כמו עם `MailApp`, קריאות gmail איטיות יחסית למחזור חיים של בקשה. מעבירים אותן מחוץ לנתיב ה-response.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-13-web-apps",
  lessonSlug: "apps-script/13-web-apps",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Pre-seed I1 (label), J1 (pre-computed total spend so doGet has
      // something to read on the first call), and L1 (label for K1's
      // "POST inbox" that doPost writes into).
      { a1: "I1", value: "Total spend" },
      { a1: "J1", value: TOTAL_SPEND },
      { a1: "L1", value: "POST inbox" },
    ],
  },
  seedScript,
  rules: [definesDoGet, definesDoPost, noSlowServicesInBodies],
};
