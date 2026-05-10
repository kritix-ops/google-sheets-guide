import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

const STARTER_LESSON_GS = `/**
 * Fetch the daily Taboola summary from an external API and write the
 * total spend it returned to J1. The lesson body covers UrlFetchApp's
 * options bag, JSON request/response handling, and error handling; the
 * test grades the source shape because UrlFetchApp can't run in tests.
 *
 * Run this from the Apps Script editor's Run dropdown. Accept the
 * urlfetch scope prompt the first time.
 */
function fetchTaboolaSummary() {
  // TODO:
  //   1. Call UrlFetchApp.fetch(url, { headers: { Authorization: "Bearer ..." }, muteHttpExceptions: true }).
  //   2. Parse the response body as JSON: JSON.parse(response.getContentText()).
  //   3. Write data.total_spend to J1 on the Campaigns tab.
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: `fetchTaboolaSummary` is declared, the body actually calls
// `UrlFetchApp.fetch`, and the call passes both a URL (https://...) and
// an Authorization header. We grade by source because UrlFetchApp cannot
// run in tests; the shape of the call is what matters here.
const definesFetchTaboolaSummary: Rule = {
  id: "script-defines-fetchtaboolasummary",
  label:
    "Lesson.gs defines `fetchTaboolaSummary()` that calls `UrlFetchApp.fetch` with an https URL and an Authorization header",
  labelHe:
    "הקובץ Lesson.gs מגדיר `fetchTaboolaSummary()` שקורא ל-`UrlFetchApp.fetch` עם URL ב-https ועם header של Authorization",
  answer:
    "function fetchTaboolaSummary() {\n" +
    '  const response = UrlFetchApp.fetch(\n' +
    '    "https://example.com/api/taboola/summary",\n' +
    "    {\n" +
    '      headers: { Authorization: "Bearer demo-token" },\n' +
    "      muteHttpExceptions: true,\n" +
    "    }\n" +
    "  );\n" +
    "  const data = JSON.parse(response.getContentText());\n" +
    '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue(data.total_spend);\n' +
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
    if (!lesson.functions.includes("fetchTaboolaSummary")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function fetchTaboolaSummary()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function fetchTaboolaSummary()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` is declared but still returns `null` without doing anything. Replace the stub with a `UrlFetchApp.fetch(url, options)` call, parse the body, and write the total to J1.",
        detailHe:
          "`fetchTaboolaSummary` מוכרזת אבל עדיין מחזירה `null` בלי לעשות כלום. מחליפים את ה-stub בקריאה `UrlFetchApp.fetch(url, options)`, מפענחים את הגוף, וכותבים את ה-total ל-J1.",
      };
    }
    if (!/\bUrlFetchApp\.fetch\s*\(/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` doesn't call `UrlFetchApp.fetch(...)`. That's the outbound HTTP entry point in Apps Script. Use `UrlFetchApp.fetch(\"https://...\", { headers: { Authorization: \"Bearer ...\" }, muteHttpExceptions: true })`.",
        detailHe:
          "`fetchTaboolaSummary` לא קוראת ל-`UrlFetchApp.fetch(...)`. זו נקודת הכניסה ל-HTTP יוצא ב-Apps Script. משתמשים ב-`UrlFetchApp.fetch(\"https://...\", { headers: { Authorization: \"Bearer ...\" }, muteHttpExceptions: true })`.",
      };
    }
    if (!/https?:\/\/\S+/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` calls `UrlFetchApp.fetch` but doesn't pass an `https://` URL. The starter expects `https://example.com/api/taboola/summary`; in real code this is the Taboola backstage URL or your wrapper endpoint.",
        detailHe:
          "`fetchTaboolaSummary` קוראת ל-`UrlFetchApp.fetch` אבל לא מעבירה URL של `https://`. ה-starter מצפה ל-`https://example.com/api/taboola/summary`; בקוד אמיתי זה ה-URL של Taboola backstage או של ה-endpoint העטיפה שלכם.",
      };
    }
    if (!/authorization/i.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` doesn't include an `Authorization` header. The starter expects `headers: { Authorization: \"Bearer demo-token\" }`. Without it, any real API will reject the request with a 401.",
        detailHe:
          "`fetchTaboolaSummary` לא כוללת header של `Authorization`. ה-starter מצפה ל-`headers: { Authorization: \"Bearer demo-token\" }`. בלעדיו, כל API אמיתי ידחה את הבקשה עם 401.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: JSON handling. The team's API wrappers always come back as
// JSON; the canonical line is `JSON.parse(response.getContentText())`.
// Both halves must appear in the source.
const parsesJsonResponse: Rule = {
  id: "script-parses-json-response",
  label:
    "`fetchTaboolaSummary` parses the response body with `JSON.parse(response.getContentText())`",
  labelHe:
    "ה-`fetchTaboolaSummary` מפענחת את גוף התשובה עם `JSON.parse(response.getContentText())`",
  answer: "const data = JSON.parse(response.getContentText());",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    if (!/\bJSON\.parse\s*\(/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` doesn't call `JSON.parse(...)`. The response from a JSON API arrives as text: you have to parse it into an object yourself: `const data = JSON.parse(response.getContentText());`.",
        detailHe:
          "`fetchTaboolaSummary` לא קוראת ל-`JSON.parse(...)`. התשובה מ-API של JSON מגיעה כטקסט, צריך לפענח אותה לאובייקט בעצמכם: `const data = JSON.parse(response.getContentText());`.",
      };
    }
    if (!/\.getContentText\s*\(/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` calls `JSON.parse(...)` but doesn't call `getContentText()`. The `HTTPResponse` object exposes the body as text only when you call `response.getContentText()`: `JSON.parse(response)` directly fails because `response` is an object, not a string.",
        detailHe:
          "`fetchTaboolaSummary` קוראת ל-`JSON.parse(...)` אבל לא ל-`getContentText()`. אובייקט ה-`HTTPResponse` חושף את הגוף כטקסט רק כשקוראים `response.getContentText()`. `JSON.parse(response)` ישירות נכשל כי `response` הוא object, לא string.",
      };
    }
    return { passed: true };
  },
};

// Rule 3: the parsed value lands in J1. Either `setValue` or `setValues`
// counts; the call must reference J1 either as a string literal or via a
// range like "Campaigns!J1".
const writesToJ1: Rule = {
  id: "script-writes-to-j1",
  label:
    "`fetchTaboolaSummary` writes the API response into J1 with `setValue` (or `setValues`)",
  labelHe:
    "ה-`fetchTaboolaSummary` כותבת את תשובת ה-API ל-J1 עם `setValue` (או `setValues`)",
  answer: 'sheet.getRange("J1").setValue(data.total_spend)',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    if (!/\bsetValues?\s*\(/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` doesn't write back to the sheet. Add `sheet.getRange(\"J1\").setValue(data.total_spend)` to put the API's number into J1.",
        detailHe:
          "`fetchTaboolaSummary` לא כותבת חזרה לגיליון. מוסיפים `sheet.getRange(\"J1\").setValue(data.total_spend)` כדי להציב את המספר מה-API ל-J1.",
      };
    }
    if (!/J1/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`fetchTaboolaSummary` calls `setValue` but doesn't target `J1`. The lesson assignment specifies cell J1 for the spend total: `sheet.getRange(\"J1\").setValue(data.total_spend)`.",
        detailHe:
          "`fetchTaboolaSummary` קוראת ל-`setValue` אבל לא מכוונת ל-`J1`. המטלה דורשת את התא J1 לסך ה-spend: `sheet.getRange(\"J1\").setValue(data.total_spend)`.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-11-external-apis",
  lessonSlug: "apps-script/11-external-apis",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // I1 labels the output column. J1 is left empty so a real run of
      // the learner's function writes there, and an empty J1 reads as
      // "the function never ran" rather than "function ran but produced
      // wrong number": same convention as lesson 4.
      { a1: "I1", value: "Total spend (Taboola API)" },
    ],
  },
  seedScript,
  rules: [definesFetchTaboolaSummary, parsesJsonResponse, writesToJ1],
};
