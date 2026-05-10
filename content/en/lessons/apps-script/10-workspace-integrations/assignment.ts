import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// CAMPAIGNS_LARGE header row plus 60 data rows. The Spend column is the
// 6th (index 5: A:Date B:Buyer C:Vertical D:Platform E:Country F:Spend
// G:Revenue). We pre-seed J1 with the total so the lesson focuses on the
// outbound side (reading then mailing), not on the sum itself: that work
// belongs to lesson 4.
const SPEND_COL = 5;
const TOTAL_SPEND = CAMPAIGNS_LARGE.slice(1).reduce<number>((sum, row) => {
  const v = row[SPEND_COL];
  return sum + (typeof v === "number" ? v : 0);
}, 0);

const STARTER_LESSON_GS = `/**
 * Read the total spend from J1 on the Campaigns tab and email it to the
 * team. The lesson body covers MailApp.sendEmail and the safe-defaults
 * options bag; the test grades that the function reads J1, calls a mail
 * service, sends to a real-looking address, and ships a subject line.
 *
 * Run this from the Apps Script editor's Run dropdown. On the first run
 * Apps Script will prompt for the gmail scope; accept it and run again.
 */
function emailSpendReport() {
  // TODO:
  //   1. Read J1 from the Campaigns tab via SpreadsheetApp.
  //   2. Build a message body that includes the total.
  //   3. Send it with MailApp.sendEmail({ to, subject, body }).
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: `emailSpendReport` exists at the top level and the body shows
// the three load-bearing pieces of the lesson: SpreadsheetApp (read), a
// mail service call (write to Gmail), and J1 in the source. We do not
// grade the cell value because MailApp.sendEmail can't run in tests; the
// shape of the source is what matters here.
const definesEmailSpendReport: Rule = {
  id: "script-defines-emailspendreport",
  label:
    "Lesson.gs defines `emailSpendReport()` that reads J1 and calls a mail service",
  labelHe:
    "הקובץ Lesson.gs מגדיר `emailSpendReport()` שקורא את J1 וקורא לשירות שליחת מייל",
  answer:
    "function emailSpendReport() {\n" +
    '  const spend = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
    "  MailApp.sendEmail({\n" +
    '    to: "info@flexelent.com",\n' +
    '    subject: "Daily spend report",\n' +
    "    body: `Total spend today: $${spend}`,\n" +
    "  });\n" +
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
    if (!lesson.functions.includes("emailSpendReport")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function emailSpendReport()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function emailSpendReport()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`emailSpendReport` is declared but still returns `null` without doing anything. Replace the stub with a `getRange(\"J1\").getValue()` read and a `MailApp.sendEmail({...})` call.",
        detailHe:
          "`emailSpendReport` מוכרזת אבל עדיין מחזירה `null` בלי לעשות כלום. מחליפים את ה-stub בקריאה `getRange(\"J1\").getValue()` ובקריאה `MailApp.sendEmail({...})`.",
      };
    }
    if (!lesson.source.includes("SpreadsheetApp")) {
      return {
        passed: false,
        detail:
          "`emailSpendReport` doesn't reference `SpreadsheetApp`. The function needs to read the total spend from J1, which means going through `SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\")`.",
        detailHe:
          "`emailSpendReport` לא מפנה ל-`SpreadsheetApp`. ה-function צריכה לקרוא את ה-spend הכולל מ-J1, וזה אומר לעבור דרך `SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\")`.",
      };
    }
    if (!/J1/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`emailSpendReport` doesn't mention `J1`. The total spend you're mailing lives in `J1` on the Campaigns tab: read it with `sheet.getRange(\"J1\").getValue()`.",
        detailHe:
          "`emailSpendReport` לא מזכיר את `J1`. ה-spend הכולל ששולחים נמצא ב-`J1` בלשונית Campaigns. קוראים אותו עם `sheet.getRange(\"J1\").getValue()`.",
      };
    }
    const callsMail =
      /\bMailApp\.sendEmail\s*\(/.test(lesson.source) ||
      /\bGmailApp\.sendEmail\s*\(/.test(lesson.source);
    if (!callsMail) {
      return {
        passed: false,
        detail:
          "`emailSpendReport` doesn't call `MailApp.sendEmail(...)` or `GmailApp.sendEmail(...)`. Pick one: `MailApp` is the simpler service and uses a tighter scope, `GmailApp` is the full Gmail API surface. Either one ends the function.",
        detailHe:
          "`emailSpendReport` לא קוראת ל-`MailApp.sendEmail(...)` או ל-`GmailApp.sendEmail(...)`. בוחרים אחד. `MailApp` פשוט יותר ומשתמש ב-scope צר יותר, `GmailApp` הוא משטח ה-Gmail המלא. כל אחד מהם מסיים את ה-function.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: the message ships to a real-looking address. We don't pin a
// specific email because the lesson body shows `info@flexelent.com` as an
// example; a learner using their own address should still pass. The regex
// is lenient enough to accept `to: "x@y.z"` and `"to":"x@y.z"`.
const emailIncludesRecipient: Rule = {
  id: "email-includes-recipient",
  label:
    "`emailSpendReport` sends the message to a real-looking email address",
  labelHe:
    "ה-`emailSpendReport` שולחת את ההודעה לכתובת מייל אמיתית למראה",
  answer: 'to: "info@flexelent.com"',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    // The lesson teaches the options-bag form `sendEmail({ to, subject,
    // body })`. We accept either `to:` (object literal) or `to =` (a
    // variable declaration like `const to = "..."`). The address itself
    // is matched with a lenient pattern.
    const emailMatch = lesson.source.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (!emailMatch) {
      return {
        passed: false,
        detail:
          "`emailSpendReport` doesn't contain a real-looking email address. The `to` field should be a literal like `\"info@flexelent.com\"` or your own address. The lesson uses the options-bag form: `MailApp.sendEmail({ to: \"info@flexelent.com\", subject: \"...\", body: \"...\" })`.",
        detailHe:
          "`emailSpendReport` לא מכילה כתובת מייל אמיתית למראה. שדה ה-`to` צריך להיות literal כמו `\"info@flexelent.com\"` או הכתובת שלכם. השיעור משתמש בצורת options-bag: `MailApp.sendEmail({ to: \"info@flexelent.com\", subject: \"...\", body: \"...\" })`.",
      };
    }
    if (!/\bto\b\s*[:=]/.test(lesson.source)) {
      return {
        passed: false,
        detail: `\`emailSpendReport\` mentions \`${emailMatch[0]}\` but it isn't wired to a \`to\` field. Use the options-bag form: \`MailApp.sendEmail({ to: "${emailMatch[0]}", subject: "...", body: "..." })\`.`,
        detailHe: `\`emailSpendReport\` מזכירה את \`${emailMatch[0]}\` אבל היא לא מחווטת לשדה \`to\`. משתמשים בצורת options-bag: \`MailApp.sendEmail({ to: "${emailMatch[0]}", subject: "...", body: "..." })\`.`,
      };
    }
    return { passed: true };
  },
};

// Rule 3: the message has a subject. MailApp will silently send a blank
// subject if you don't set one; the team's mailers always pin one because
// inbox-side filtering depends on it.
const emailIncludesSubject: Rule = {
  id: "email-includes-subject",
  label: "`emailSpendReport` sets a non-empty subject line",
  labelHe: "ה-`emailSpendReport` מציבה subject line לא ריק",
  answer: 'subject: "Daily spend report"',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) return { passed: true };
    // Match `subject: "..."` or `subject = "..."` with a non-empty quoted
    // string OR a template literal that contains at least one character.
    const subjectMatch =
      lesson.source.match(/\bsubject\b\s*[:=]\s*(["'`])([^"'`]+)\1/);
    if (!subjectMatch) {
      return {
        passed: false,
        detail:
          "`emailSpendReport` doesn't set a `subject`. Add a `subject: \"Daily spend report\"` (or similar) to the options bag: without it the message lands with a blank subject and gets buried by every inbox filter.",
        detailHe:
          "`emailSpendReport` לא מציבה `subject`. מוסיפים `subject: \"Daily spend report\"` (או דומה) ל-options bag. בלי זה ההודעה נוחתת בלי subject ונבלעת בכל פילטר בתיבת הדואר.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-10-workspace-integrations",
  lessonSlug: "apps-script/10-workspace-integrations",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // J1 is pre-seeded with the total spend so the learner's function
      // can read it without first re-running the lesson 4 sum. I1 is the
      // matching label column header that the team uses on the actual
      // aggregator tab.
      { a1: "I1", value: "Total spend" },
      { a1: "J1", value: TOTAL_SPEND },
    ],
  },
  seedScript,
  rules: [definesEmailSpendReport, emailIncludesRecipient, emailIncludesSubject],
};
