import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. The lesson uses the Sheets advanced service to read
// F2:G61 in one call, sums column F (Spend), and writes the total to J1
// via the same advanced service. Computing the expected total here means
// the grader stays in sync with the dataset.
const TOTAL_SPEND = (() => {
  let t = 0;
  for (let i = 1; i < CAMPAIGNS_LARGE.length; i++) {
    const v = CAMPAIGNS_LARGE[i][5];
    if (typeof v === "number") t += v;
  }
  return t;
})();

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

const STARTER_LESSON_GS = `/**
 * Use the Sheets advanced service to:
 *   1. Read F2:G61 in one round-trip via Sheets.Spreadsheets.values.get.
 *   2. Sum column F (the Spend column, first element of each row).
 *   3. Write the total back to J1 via Sheets.Spreadsheets.values.update
 *      with valueInputOption "RAW".
 *
 * Two pieces of setup before this works:
 *   a) Enable the advanced service in the manifest. Open the editor's
 *      Services panel (left rail), click +, find "Google Sheets API",
 *      add it, and confirm. The manifest gains a dependencies entry.
 *   b) The first run prompts for OAuth consent because the advanced
 *      service requires a broader scope than SpreadsheetApp.
 *
 * The advanced service shape: it's the Sheets v4 REST API surfaced as a
 * global called Sheets. Calls map 1:1 to REST endpoints.
 */
function batchUpdateUsingAdvancedService() {
  // TODO: read F2:G61 with the advanced service, sum the spend, and write
  // the total to J1.
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1. The manifest must list Sheets as an enabled advanced service.
// Without the entry, calls into `Sheets.Spreadsheets.values.*` fail at
// runtime with "Sheets is not defined". The provisioner reserves the
// manifest, so the learner edits it via the Services panel in the editor;
// the grader reads the saved manifest source.
const manifestHasSheetsAdvancedService: Rule = {
  id: "manifest-has-sheets-advanced-service",
  label:
    "The manifest enables the Sheets advanced service (`enabledAdvancedServices` includes `serviceId: \"sheets\"`)",
  labelHe:
    "ה-manifest מפעיל את ה-advanced service של Sheets (`enabledAdvancedServices` כולל `serviceId: \"sheets\"`)",
  answer:
    '"dependencies": {\n  "enabledAdvancedServices": [\n    { "userSymbol": "Sheets", "serviceId": "sheets", "version": "v4" }\n  ]\n}',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found. Open the sheet and choose Extensions → Apps Script to launch the editor.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר. פותחים את ה-spreadsheet ובוחרים Extensions → Apps Script.",
      };
    }
    const manifest = project.files.find((f) => f.name === "appsscript");
    if (!manifest) {
      return {
        passed: false,
        detail:
          "The manifest file (`appsscript.json`) is missing from the bound project. The provisioner creates it on first save; if you don't see it, open and save any file in the editor and the manifest reappears.",
        detailHe:
          "קובץ ה-manifest (`appsscript.json`) חסר בפרויקט המקושר. ה-provisioner יוצר אותו בשמירה הראשונה; אם לא רואים אותו, פותחים ושומרים קובץ כלשהו בעורך וה-manifest מופיע מחדש.",
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(manifest.source);
    } catch {
      return {
        passed: false,
        detail:
          "The manifest source isn't valid JSON. Open `appsscript.json` in the editor (Project Settings → Show \"appsscript.json\" manifest file in editor) and fix any syntax errors before adding the Sheets advanced service entry.",
        detailHe:
          "מקור ה-manifest אינו JSON תקין. פותחים את `appsscript.json` בעורך (Project Settings → Show \"appsscript.json\" manifest file in editor) ומתקנים שגיאות syntax לפני הוספת רשומת ה-Sheets advanced service.",
      };
    }
    if (typeof parsed !== "object" || parsed === null) {
      return {
        passed: false,
        detail:
          "The manifest must be a JSON object. The top-level shape is `{ ... }` containing `dependencies`, `timeZone`, etc.",
        detailHe:
          "ה-manifest חייב להיות object של JSON. הצורה ברמה העליונה היא `{ ... }` עם `dependencies`, `timeZone` וכו'.",
      };
    }
    const manifestObj = parsed as Record<string, unknown>;
    const deps = manifestObj.dependencies as
      | Record<string, unknown>
      | undefined;
    if (!deps || typeof deps !== "object") {
      return {
        passed: false,
        detail:
          "The manifest has no `dependencies` block. Add `\"dependencies\": { \"enabledAdvancedServices\": [...] }` at the top level. The Services panel in the editor adds this entry for you when you enable Google Sheets API.",
        detailHe:
          "ל-manifest אין בלוק `dependencies`. מוסיפים `\"dependencies\": { \"enabledAdvancedServices\": [...] }` ברמה העליונה. הפאנל Services בעורך מוסיף את הרשומה הזו עבורכם כשמפעילים Google Sheets API.",
      };
    }
    const enabled = deps.enabledAdvancedServices;
    if (!Array.isArray(enabled)) {
      return {
        passed: false,
        detail:
          "`dependencies.enabledAdvancedServices` must be an array of service entries. Each entry looks like `{ \"userSymbol\": \"Sheets\", \"serviceId\": \"sheets\", \"version\": \"v4\" }`.",
        detailHe:
          "`dependencies.enabledAdvancedServices` חייב להיות מערך של רשומות services. כל רשומה נראית כמו `{ \"userSymbol\": \"Sheets\", \"serviceId\": \"sheets\", \"version\": \"v4\" }`.",
      };
    }
    const hasSheets = enabled.some((entry) => {
      if (typeof entry !== "object" || entry === null) return false;
      const e = entry as Record<string, unknown>;
      return e.serviceId === "sheets";
    });
    if (!hasSheets) {
      const ids = enabled
        .map((entry) =>
          typeof entry === "object" && entry !== null
            ? String((entry as Record<string, unknown>).serviceId)
            : "(invalid)",
        )
        .join(", ");
      return {
        passed: false,
        detail: `\`enabledAdvancedServices\` doesn't include an entry with \`serviceId: "sheets"\`. Current entries: ${ids || "(empty)"}. Open the Services panel (left rail of the editor, + icon), find "Google Sheets API", and add it. The userSymbol defaults to "Sheets", which is the global your code calls.`,
        detailHe: `ל-\`enabledAdvancedServices\` אין רשומה עם \`serviceId: "sheets"\`. רשומות קיימות: ${ids || "(ריק)"}. פותחים את הפאנל Services (סרגל שמאלי של העורך, אייקון +), מוצאים את "Google Sheets API" ומוסיפים אותו. userSymbol שמוגדר כברירת מחדל הוא "Sheets", זה ה-global שהקוד שלכם קורא לו.`,
      };
    }
    return { passed: true };
  },
};

// Rule 2. Source uses the advanced service surface. Any call into
// `Sheets.Spreadsheets.values.*` or `Sheets.Spreadsheets.batchUpdate`
// counts. They all teach the same idea: REST endpoints via a global.
const usesAdvancedService: Rule = {
  id: "script-uses-advanced-service",
  label:
    "`batchUpdateUsingAdvancedService` calls the Sheets advanced service",
  labelHe:
    "`batchUpdateUsingAdvancedService` קוראת ל-Sheets advanced service",
  answer:
    'Sheets.Spreadsheets.values.get(spreadsheetId, "Campaigns!F2:G61");',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't check the source.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לבדוק את המקור.",
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
    if (!lesson.functions.includes("batchUpdateUsingAdvancedService")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function batchUpdateUsingAdvancedService()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function batchUpdateUsingAdvancedService()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const src = lesson.source;
    const usesAdvanced =
      /Sheets\.Spreadsheets\.values\.get/.test(src) ||
      /Sheets\.Spreadsheets\.values\.update/.test(src) ||
      /Sheets\.Spreadsheets\.values\.batchUpdate/.test(src) ||
      /Sheets\.Spreadsheets\.batchUpdate/.test(src);
    if (!usesAdvanced) {
      return {
        passed: false,
        detail:
          "`batchUpdateUsingAdvancedService` doesn't call the Sheets advanced service. The lesson teaches that surface specifically. Replace any `SpreadsheetApp` calls with `Sheets.Spreadsheets.values.get(...)` for reads or `Sheets.Spreadsheets.values.update(...)` for writes. The `Sheets` global comes from the manifest entry; if your call says `Sheets is not defined`, the manifest doesn't have the service enabled yet.",
        detailHe:
          "`batchUpdateUsingAdvancedService` לא קוראת ל-Sheets advanced service. השיעור מלמד את ה-surface הזה ספציפית, מחליפים כל קריאת `SpreadsheetApp` ב-`Sheets.Spreadsheets.values.get(...)` לקריאות או ב-`Sheets.Spreadsheets.values.update(...)` לכתיבות. ה-global `Sheets` מגיע מהרשומה ב-manifest; אם הקריאה אומרת `Sheets is not defined`, ה-manifest עדיין לא מפעיל את ה-service.",
      };
    }
    return { passed: true };
  },
};

// Rule 3. J1 holds the total spend. Numeric comparison with epsilon
// because the floating-point sum of 60 spend values won't be exact.
const j1ShowsTotalSpend: Rule = {
  id: "j1-shows-total-spend",
  label: `J1 equals the total spend across F2:F61 (≈ ${TOTAL_SPEND.toFixed(2)})`,
  labelHe: `J1 שווה לסך ה-spend ב-F2:F61 (≈ ${TOTAL_SPEND.toFixed(2)})`,
  answer: TOTAL_SPEND.toFixed(2),
  async run(sheet) {
    const value = await sheet.cellValue("J1");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J1 is empty. The advanced service's `Sheets.Spreadsheets.values.update` call never landed. Common causes: the URL range string doesn't include the sheet name (it should be `\"Campaigns!J1\"`, not just `\"J1\"`), or the request body is missing the `values` field (the shape is `{ values: [[total]] }`).",
        detailHe:
          "J1 ריק. הקריאה ל-`Sheets.Spreadsheets.values.update` של ה-advanced service לא נחתה. סיבות נפוצות: מחרוזת ה-range ב-URL לא כוללת את שם הגיליון (היא צריכה להיות `\"Campaigns!J1\"`, לא רק `\"J1\"`), או שגוף ה-request חסר השדה `values` (הצורה היא `{ values: [[total]] }`).",
      };
    }
    if (!approxEqual(value, TOTAL_SPEND, 1)) {
      return {
        passed: false,
        detail: `J1 holds \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (the sum of all 60 spend values in F2:F61). If J1 is way off, the loop is probably summing the wrong column index. The advanced service returns the range as \`[[F, G], [F, G], ...]\`, so spend is \`row[0]\`, not \`row[1]\`.`,
        detailHe: `J1 מכיל \`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סכום כל 60 ערכי ה-spend ב-F2:F61). אם J1 רחוק לגמרי, סביר להניח שהלולאה מסכמת את ה-index הלא נכון של עמודה, ה-advanced service מחזיר את ה-range כ-\`[[F, G], [F, G], ...]\`, אז spend הוא \`row[0]\`, לא \`row[1]\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-17-advanced-sheets-service",
  lessonSlug: "apps-script/17-advanced-sheets-service",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      { a1: "I1", value: "Total spend (advanced service)" },
    ],
  },
  seedScript,
  rules: [
    manifestHasSheetsAdvancedService,
    usesAdvancedService,
    j1ShowsTotalSpend,
  ],
};

export const TEST_CONSTANTS = { TOTAL_SPEND } as const;
