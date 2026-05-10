import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE: A:Date B:Buyer C:Vertical D:Platform E:Country F:Spend G:Revenue.
// J1 is pre-seeded with the total spend so `alertSpend` has a number to read.
const SPEND_COL = 5;
const TOTAL_SPEND = CAMPAIGNS_LARGE.slice(1).reduce<number>((sum, row) => {
  const v = row[SPEND_COL];
  return sum + (typeof v === "number" ? v : 0);
}, 0);

const STARTER_LESSON_GS = `/**
 * Build a "Reports" menu in the spreadsheet toolbar with a single item
 * that runs alertSpend.
 *
 * The bound project's Code.gs already declares onOpen(), so we don't
 * declare it again here; JavaScript would just overwrite one with the
 * other. Run addReportsMenu manually from the Apps Script editor's
 * Run dropdown. In production you'd call addReportsMenu() from
 * onOpen() so the menu shows up automatically when the sheet loads.
 */
function addReportsMenu() {
  // TODO:
  //   1. Get the UI via SpreadsheetApp.getUi().
  //   2. Build a menu named "Reports" with createMenu(...).
  //   3. Add a single item named "Show spend total" that runs the
  //      function "alertSpend". Note the function name is a STRING.
  //   4. Attach with addToUi().
  return null;
}

/**
 * Read the total spend from J1 and show it to the user in an alert dialog.
 *
 * This fires when the learner clicks Reports → Show spend total in the
 * spreadsheet toolbar (once addReportsMenu has been run).
 */
function alertSpend() {
  // TODO:
  //   1. Read J1's value with SpreadsheetApp.getActiveSpreadsheet()
  //      .getSheetByName("Campaigns").getRange("J1").getValue().
  //   2. Show it with SpreadsheetApp.getUi().alert("Total spend: " + value).
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: addReportsMenu defined, builds a menu, and registers an item
// whose handler is the string "alertSpend" (typos there are silent).
const definesAddReportsMenu: Rule = {
  id: "script-defines-addreportsmenu",
  label:
    "Lesson.gs defines `addReportsMenu()` that builds a Reports menu wired to `alertSpend`",
  labelHe:
    "הקובץ Lesson.gs מגדיר `addReportsMenu()` שבונה תפריט Reports שמחובר ל-`alertSpend`",
  answer:
    "function addReportsMenu() {\n" +
    "  SpreadsheetApp.getUi()\n" +
    "    .createMenu(\"Reports\")\n" +
    "    .addItem(\"Show spend total\", \"alertSpend\")\n" +
    "    .addToUi();\n" +
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
    if (!lesson.functions.includes("addReportsMenu")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function addReportsMenu()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function addReportsMenu()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    if (!lesson.source.includes("createMenu")) {
      return {
        passed: false,
        detail:
          "`addReportsMenu` doesn't call `createMenu(...)`. Start with `SpreadsheetApp.getUi().createMenu(\"Reports\")`.",
        detailHe:
          "`addReportsMenu` לא קורא ל-`createMenu(...)`. מתחילים עם `SpreadsheetApp.getUi().createMenu(\"Reports\")`.",
      };
    }
    if (!lesson.source.includes("addItem")) {
      return {
        passed: false,
        detail:
          "`addReportsMenu` builds a menu but never adds an item to it. Chain `.addItem(\"Show spend total\", \"alertSpend\")` onto the createMenu call.",
        detailHe:
          "`addReportsMenu` בונה תפריט אבל אף פעם לא מוסיף לו פריט. שורשרים `.addItem(\"Show spend total\", \"alertSpend\")` על הקריאה ל-createMenu.",
      };
    }
    if (!lesson.source.includes("addToUi")) {
      return {
        passed: false,
        detail:
          "`addReportsMenu` builds the menu but never attaches it. Chain `.addToUi()` at the end; without it the menu is constructed in memory and immediately thrown away.",
        detailHe:
          "`addReportsMenu` בונה את התפריט אבל אף פעם לא מצרף אותו. שורשרים `.addToUi()` בסוף, בלעדיו התפריט נבנה בזיכרון ומיד נזרק.",
      };
    }
    // The function name passed to addItem must match the JS function name
    // EXACTLY. Apps Script doesn't check this at save time, and a typo here is
    // the most common silent bug in custom menus.
    if (!/["']alertSpend["']/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`addReportsMenu` doesn't pass the string `\"alertSpend\"` to `addItem`. Menu items take the handler's name as a STRING, and a typo here fails silently the moment the user clicks the item.",
        detailHe:
          "`addReportsMenu` לא מעביר את ה-string `\"alertSpend\"` ל-`addItem`. פריטי תפריט מקבלים את שם ה-handler כ-STRING, טעות הקלדה כאן נכשלת בשקט ברגע שהמשתמש לוחץ על הפריט.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: alertSpend reads J1 and shows it via ui.alert.
const definesAlertSpend: Rule = {
  id: "script-defines-alertspend",
  label: "Lesson.gs defines `alertSpend()` that reads J1 and shows it in an alert",
  labelHe: "הקובץ Lesson.gs מגדיר `alertSpend()` שקורא את J1 ומציג אותו ב-alert",
  answer:
    "function alertSpend() {\n" +
    "  const total = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\").getRange(\"J1\").getValue();\n" +
    "  SpreadsheetApp.getUi().alert(\"Total spend: \" + total);\n" +
    "}",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      // The other rule already flagged this; pass here so the learner sees
      // a single failure rather than three for the same root cause.
      return { passed: true };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    if (!lesson.functions.includes("alertSpend")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function alertSpend()\`. Without it, the menu item points at a handler that doesn't exist and clicking the menu silently does nothing.`,
        detailHe: `ל-Lesson.gs חסר \`function alertSpend()\` ברמה העליונה. בלעדיו, פריט התפריט מצביע ל-handler שלא קיים ולחיצה על התפריט בשקט לא עושה כלום.`,
      };
    }
    // Source check: a stub that returns null isn't doing the read OR the
    // alert. Use the same shape as lesson 3's stub guard.
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("functionalertSpend(){returnnull")) {
      return {
        passed: false,
        detail:
          "`alertSpend` is declared but still returns `null` without reading J1 or showing an alert. Replace the stub with a `getRange(\"J1\").getValue()` read and a `getUi().alert(...)` call.",
        detailHe:
          "`alertSpend` מוכרזת אבל עדיין מחזירה `null` בלי לקרוא את J1 ובלי להציג alert. מחליפים את ה-stub בקריאה `getRange(\"J1\").getValue()` ובקריאה ל-`getUi().alert(...)`.",
      };
    }
    if (!/getUi\s*\(\s*\)\s*\.\s*alert\s*\(/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`alertSpend` doesn't call `SpreadsheetApp.getUi().alert(...)`. The whole point of the menu item is to surface the value in a dialog the user actually sees.",
        detailHe:
          "`alertSpend` לא קורא ל-`SpreadsheetApp.getUi().alert(...)`. כל הרעיון של פריט התפריט הוא להציג את הערך ב-dialog שהמשתמש באמת רואה.",
      };
    }
    // Force the read to come from J1 specifically (not a hardcoded number,
    // not a different cell). The team's actual workbooks compute aggregates
    // in script and read them from a known anchor cell, same shape here.
    if (!/["']J1["']/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`alertSpend` doesn't reference cell J1. The assignment writes the total to J1; read it back with `getRange(\"J1\").getValue()` rather than hardcoding the number.",
        detailHe:
          "`alertSpend` לא מתייחס לתא J1. המטלה כותבת את הסכום ל-J1; קוראים אותו חזרה עם `getRange(\"J1\").getValue()` במקום לקבע את המספר בקוד.",
      };
    }
    return { passed: true };
  },
};

// Rule 3: sanity check on the seed. The provisioner should have put the
// total in J1 so `alertSpend` has something real to display. This always
// passes when the seed runs correctly; it exists so a misconfigured seed
// surfaces as a graded check instead of a confusing silent failure.
const j1PrepopulatedSpend: Rule = {
  id: "j1-prepopulated-spend",
  label: "J1 holds the seeded total spend that `alertSpend` reads",
  labelHe: "התא J1 מחזיק את סכום ה-spend המוזרק ש-`alertSpend` קורא",
  answer: TOTAL_SPEND.toFixed(2),
  async run(sheet) {
    const value = await sheet.cellValue("J1");
    if (typeof value !== "number") {
      return {
        passed: false,
        detail: `J1 isn't holding a number (it has \`${value}\`). The lesson seeds J1 with the dataset's total spend so \`alertSpend\` has a real value to read. If you cleared J1 manually, type \`${TOTAL_SPEND.toFixed(2)}\` back into it.`,
        detailHe: `J1 לא מחזיק מספר (יש בו \`${value}\`). השיעור מזריק ל-J1 את סכום ה-spend הכולל של הדאטה כדי ש-\`alertSpend\` תקבל ערך אמיתי לקרוא. אם ניקיתם את J1 ידנית, מקלידים בחזרה \`${TOTAL_SPEND.toFixed(2)}\`.`,
      };
    }
    if (Math.abs(value - TOTAL_SPEND) > 0.5) {
      return {
        passed: false,
        detail: `J1 holds \`${value}\` but the seeded total is \`≈ ${TOTAL_SPEND.toFixed(2)}\`. The lesson reads this value, so a drift here makes the alert show the wrong number. Reset J1 to the expected total or re-seed the assignment.`,
        detailHe: `J1 מחזיק \`${value}\` אבל הסכום המוזרק הוא \`≈ ${TOTAL_SPEND.toFixed(2)}\`. השיעור קורא את הערך הזה, כך ש-drift כאן יגרום ל-alert להציג את המספר הלא נכון. מאפסים את J1 לסכום הצפוי או מזריקים מחדש את המטלה.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-05-menus-and-dialogs",
  lessonSlug: "apps-script/05-menus-and-dialogs",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      { a1: "I1", value: "Total spend" },
      // Pre-seed J1 so the learner's alertSpend function has a real number
      // to read on day one (it's the same total their lesson-4 function
      // would have computed). They focus on the menu wiring, not on
      // recomputing aggregates.
      { a1: "J1", value: TOTAL_SPEND },
    ],
  },
  seedScript,
  rules: [definesAddReportsMenu, definesAlertSpend, j1PrepopulatedSpend],
};
