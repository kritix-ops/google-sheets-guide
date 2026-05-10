import { FORM_RESPONSES, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 13 grades cleanup formulas the learner writes against a seeded
// "Form Responses 1" tab. The fixture has 20 rows of survey responses with
// realistic edge cases the learner has to handle: mixed-case emails, a
// duplicate submission, blank optional fields. The cleanup cells live on
// the same tab in column J so a single-tab assignment grades cleanly.

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContainsAll(actual: string | null, needles: string[]): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.every((n) => normalized.includes(n.toUpperCase()));
}

// Compute expectations from the dataset (skip header row).
const ROWS = FORM_RESPONSES.slice(1);
const TOTAL_RESPONSES = ROWS.length;
const UNIQUE_EMAILS = new Set(
  ROWS.map((r) => String(r[1] ?? "").trim().toLowerCase()),
).size;
const NEWSLETTER_YES = ROWS.filter((r) => r[6] === "Yes").length;
const NATIVE_EMEA_COUNT = ROWS.filter((r) => r[3] === "Native EMEA").length;

const totalResponses: Rule = {
  id: "j1-total-responses",
  label: "J1 counts the raw response count",
  labelHe: "התא J1 סופר את מספר התשובות הגולמי",
  answer: "=COUNTA(A2:A21)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Use `=COUNTA(A2:A21)` to count the raw response rows on this tab. This is the simplest possible summary: how many forms came in.",
        detailHe:
          "התא J1 ריק. משתמשים ב-`=COUNTA(A2:A21)` כדי לספור את שורות התשובות הגולמיות בגיליון הזה. זה הסיכום הכי פשוט: כמה טפסים נכנסו.",
      };
    }
    if (!formulaContainsAll(formula, ["COUNTA"])) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use \`COUNTA\` to count non-empty timestamp cells.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים ב-\`COUNTA\` כדי לספור תאי timestamp לא ריקים.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (value !== TOTAL_RESPONSES) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be \`${TOTAL_RESPONSES}\` (one row per submission, header excluded).`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות \`${TOTAL_RESPONSES}\` (שורה אחת לכל submission, ללא הכותרת).`,
      };
    }
    return { passed: true };
  },
};

const uniquePeople: Rule = {
  id: "j2-unique-people",
  label: "J2 counts distinct people via LOWER + TRIM + UNIQUE",
  labelHe: "התא J2 סופר אנשים מובחנים דרך LOWER + TRIM + UNIQUE",
  answer: "=COUNTA(UNIQUE(LOWER(TRIM(B2:B21))))",
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J2 is empty. Use `=COUNTA(UNIQUE(LOWER(TRIM(B2:B21))))` to count distinct people after normalizing email case and whitespace. The raw column has one email in ALL CAPS that would otherwise count twice.",
        detailHe:
          "התא J2 ריק. משתמשים ב-`=COUNTA(UNIQUE(LOWER(TRIM(B2:B21))))` כדי לספור אנשים מובחנים אחרי נרמול case ו-whitespace של ה-email. בעמודה הגולמית יש email אחד באותיות גדולות שאחרת היה נספר פעמיים.",
      };
    }
    if (
      !formulaContainsAll(formula, ["UNIQUE", "LOWER"]) &&
      !formulaContainsAll(formula, ["UNIQUE", "PROPER"])
    ) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Wrap the email column in \`LOWER\` (or \`PROPER\`) before passing to \`UNIQUE\`. Without case normalization, \`DINA.DAYAN@...\` and \`dina.dayan@...\` count as two different people.`,
        detailHe: `התא J2 מכיל \`${formula}\`. עוטפים את עמודת ה-email ב-\`LOWER\` (או ב-\`PROPER\`) לפני שמעבירים ל-\`UNIQUE\`. בלי נרמול case, \`DINA.DAYAN@...\` ו-\`dina.dayan@...\` נספרים כשני אנשים שונים.`,
      };
    }
    if (!formulaContainsAll(formula, ["TRIM"])) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Add \`TRIM\` too. Forms preserve trailing whitespace from copy-paste and " yoav@..." would silently differ from "yoav@...".`,
        detailHe: `התא J2 מכיל \`${formula}\`. מוסיפים גם \`TRIM\`. Forms שומר whitespace בסוף מהדבקת copy-paste, ו-" yoav@..." היה שונה בשקט מ-"yoav@...".`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (value !== UNIQUE_EMAILS) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\` but should be \`${UNIQUE_EMAILS}\`. Make sure the range is \`B2:B21\` (the email column, headers excluded).`,
        detailHe: `התא J2 מתוצא ל-\`${value}\` אבל צריך להיות \`${UNIQUE_EMAILS}\`. מוודאים שהטווח הוא \`B2:B21\` (עמודת ה-email, ללא כותרות).`,
      };
    }
    return { passed: true };
  },
};

const newsletterCount: Rule = {
  id: "j3-newsletter-yes",
  label: 'J3 counts "Yes" newsletter responses with COUNTIF',
  labelHe: 'התא J3 סופר תשובות "Yes" ל-newsletter עם COUNTIF',
  answer: '=COUNTIF(G2:G21,"Yes")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J3 is empty. Use `=COUNTIF(G2:G21,"Yes")` to count newsletter sign-ups. Yes/No fields are the bread and butter of form-response analysis.',
        detailHe:
          'התא J3 ריק. משתמשים ב-`=COUNTIF(G2:G21,"Yes")` כדי לספור הרשמות ל-newsletter. שדות Yes/No הם הלחם והחמאה של ניתוח תשובות form.',
      };
    }
    if (!formulaContainsAll(formula, ["COUNTIF"])) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Use \`COUNTIF\` with criterion \`"Yes"\` on column G.`,
        detailHe: `התא J3 מכיל \`${formula}\`. משתמשים ב-\`COUNTIF\` עם קריטריון \`"Yes"\` על עמודה G.`,
      };
    }
    const value = await sheet.cellValue("J3");
    if (value !== NEWSLETTER_YES) {
      return {
        passed: false,
        detail: `J3 evaluates to \`${value}\` but should be \`${NEWSLETTER_YES}\`. Make sure the criterion is exactly \`"Yes"\` (case-sensitive) and the range is \`G2:G21\`.`,
        detailHe: `התא J3 מתוצא ל-\`${value}\` אבל צריך להיות \`${NEWSLETTER_YES}\`. מוודאים שהקריטריון הוא בדיוק \`"Yes"\` (case-sensitive) והטווח \`G2:G21\`.`,
      };
    }
    return { passed: true };
  },
};

const teamFilter: Rule = {
  id: "j4-native-emea",
  label: 'J4 counts "Native EMEA" team responses',
  labelHe: 'התא J4 סופר תשובות מצוות "Native EMEA"',
  answer: '=COUNTIF(D2:D21,"Native EMEA")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J4 is empty. Use `=COUNTIF(D2:D21,"Native EMEA")` to count submissions from one team. This is how every form-driven team breakdown starts.',
        detailHe:
          'התא J4 ריק. משתמשים ב-`=COUNTIF(D2:D21,"Native EMEA")` כדי לספור submissions מצוות אחד. ככה מתחיל כל פירוט צוותי שמתבסס על form.',
      };
    }
    if (!formulaContainsAll(formula, ["COUNTIF"])) {
      return {
        passed: false,
        detail: `J4 contains \`${formula}\`. Use \`COUNTIF\` with criterion \`"Native EMEA"\` on column D.`,
        detailHe: `התא J4 מכיל \`${formula}\`. משתמשים ב-\`COUNTIF\` עם קריטריון \`"Native EMEA"\` על עמודה D.`,
      };
    }
    const value = await sheet.cellValue("J4");
    if (value !== NATIVE_EMEA_COUNT) {
      return {
        passed: false,
        detail: `J4 evaluates to \`${value}\` but should be \`${NATIVE_EMEA_COUNT}\`. Criterion must be \`"Native EMEA"\` exactly and range \`D2:D21\`.`,
        detailHe: `התא J4 מתוצא ל-\`${value}\` אבל צריך להיות \`${NATIVE_EMEA_COUNT}\`. הקריטריון חייב להיות \`"Native EMEA"\` בדיוק והטווח \`D2:D21\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-13-forms-sheets-pipeline",
  lessonSlug: "modeling/13-forms-sheets-pipeline",
  templateSheetId: null,
  seed: {
    tabTitle: "Form Responses 1",
    cells: [
      ...dataToCells(FORM_RESPONSES),
      // Summary labels in column I, separated from the form data block by
      // the natural visual gap (the form columns end at H).
      { a1: "I1", value: "Total responses" },
      { a1: "I2", value: "Unique people (cleaned)" },
      { a1: "I3", value: "Newsletter Yes" },
      { a1: "I4", value: "Native EMEA submissions" },
    ],
  },
  rules: [totalResponses, uniquePeople, newsletterCount, teamFilter],
};
