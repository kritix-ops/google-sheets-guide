import { CAMPAIGNS, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContains(actual: string | null, needle: string): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return normalized.includes(needle.toUpperCase());
}

function approxEqual(a: number, b: number, eps = 0.05): boolean {
  return Math.abs(a - b) < eps;
}

// Compute from the dataset so this stays correct when the data changes.
// Skip the header row; columns: B=Buyer, D=Platform, E=Spend, F=Revenue.
const YOAV_ROWS = CAMPAIGNS.slice(1).filter((r) => r[1] === "Yoav Cohen");
const YOAV_COUNT = YOAV_ROWS.length;
const YOAV_SPEND = YOAV_ROWS.reduce(
  (s, r) => s + (typeof r[4] === "number" ? r[4] : 0),
  0,
);
const YOAV_REVENUE = YOAV_ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const YOAV_GOOGLE_REVENUE = YOAV_ROWS.filter((r) => r[3] === "Google").reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);

const yoavCount: Rule = {
  id: "h1-yoav-count",
  label: "H1 counts Yoav Cohen's campaigns",
  labelHe: "התא H1 סופר את הקמפיינים של Yoav Cohen",
  answer: '=COUNTIFS(B2:B13, "Yoav Cohen")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H1 is empty. Use `=COUNTIFS(B2:B13, "Yoav Cohen")` to count Yoav\'s campaigns.',
        detailHe:
          'התא H1 ריק. משתמשים ב-`=COUNTIFS(B2:B13, "Yoav Cohen")` כדי לספור את הקמפיינים של Yoav.',
      };
    }
    if (!formulaContains(formula, "COUNTIF")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use COUNTIF or COUNTIFS to count campaigns matching Yoav Cohen.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים ב-COUNTIF או ב-COUNTIFS כדי לספור קמפיינים שמתאימים ל-Yoav Cohen.`,
      };
    }
    const value = await sheet.cellValue("H1");
    if (value !== YOAV_COUNT) {
      return {
        passed: false,
        detail: `H1 evaluates to \`${value}\` but should be \`${YOAV_COUNT}\` (Yoav has ${YOAV_COUNT} campaigns in the log: Car Deals on Google and Solar Systems & Panels on Outbrain).`,
        detailHe: `התא H1 מתוצא ל-\`${value}\` אבל צריך להיות \`${YOAV_COUNT}\` (ל-Yoav יש ${YOAV_COUNT} קמפיינים בלוג: Car Deals על Google ו-Solar Systems & Panels על Outbrain).`,
      };
    }
    return { passed: true };
  },
};

const yoavTotalSpend: Rule = {
  id: "h2-yoav-spend",
  label: "H2 sums Yoav's total spend",
  labelHe: "התא H2 מסכם את ה-spend של Yoav",
  answer: '=SUMIFS(E2:E13, B2:B13, "Yoav Cohen")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H2 is empty. Use `=SUMIFS(E2:E13, B2:B13, "Yoav Cohen")` to total Yoav\'s spend.',
        detailHe:
          'התא H2 ריק. משתמשים ב-`=SUMIFS(E2:E13, B2:B13, "Yoav Cohen")` כדי לסכם את ה-spend של Yoav.',
      };
    }
    if (!formulaContains(formula, "SUMIF")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use SUMIF or SUMIFS to total spend matching Yoav Cohen.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים ב-SUMIF או SUMIFS כדי לסכם spend שמתאים ל-Yoav Cohen.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (typeof value !== "number" || !approxEqual(value, YOAV_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be approximately \`${YOAV_SPEND.toFixed(2)}\` (sum of Yoav's ${YOAV_COUNT} campaign spends).`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות בערך \`${YOAV_SPEND.toFixed(2)}\` (סך ה-spend של ${YOAV_COUNT} הקמפיינים של Yoav).`,
      };
    }
    return { passed: true };
  },
};

const yoavTotalRevenue: Rule = {
  id: "h3-yoav-revenue",
  label: "H3 sums Yoav's total revenue",
  labelHe: "התא H3 מסכם את ה-revenue של Yoav",
  answer: '=SUMIFS(F2:F13, B2:B13, "Yoav Cohen")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H3 is empty. Use `=SUMIFS(F2:F13, B2:B13, "Yoav Cohen")` to total Yoav\'s revenue.',
        detailHe:
          'התא H3 ריק. משתמשים ב-`=SUMIFS(F2:F13, B2:B13, "Yoav Cohen")` כדי לסכם את ה-revenue של Yoav.',
      };
    }
    if (!formulaContains(formula, "SUMIF")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use SUMIF or SUMIFS to total revenue matching Yoav Cohen.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים ב-SUMIF או SUMIFS כדי לסכם revenue שמתאים ל-Yoav Cohen.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (typeof value !== "number" || !approxEqual(value, YOAV_REVENUE, 0.05)) {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be approximately \`${YOAV_REVENUE.toFixed(2)}\` (sum of Yoav's ${YOAV_COUNT} campaign revenues).`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות בערך \`${YOAV_REVENUE.toFixed(2)}\` (סך ה-revenue של ${YOAV_COUNT} הקמפיינים של Yoav).`,
      };
    }
    return { passed: true };
  },
};

const yoavGoogleRevenue: Rule = {
  id: "h4-yoav-google-revenue",
  label: "H4 sums Yoav's Google-only revenue with two criteria",
  labelHe: "התא H4 מסכם את ה-revenue של Yoav על Google בלבד עם שני תנאים",
  answer: '=SUMIFS(F2:F13, B2:B13, "Yoav Cohen", D2:D13, "Google")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H4 is empty. Use `=SUMIFS(F2:F13, B2:B13, "Yoav Cohen", D2:D13, "Google")` for Yoav\'s revenue on Google only.',
        detailHe:
          'התא H4 ריק. משתמשים ב-`=SUMIFS(F2:F13, B2:B13, "Yoav Cohen", D2:D13, "Google")` עבור ה-revenue של Yoav על Google בלבד.',
      };
    }
    if (!formulaContains(formula, "SUMIFS")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. Use SUMIFS (plural) for two criteria: buyer AND platform.`,
        detailHe: `התא H4 מכיל \`${formula}\`. משתמשים ב-SUMIFS (לשון רבים) עבור שני תנאים: media buyer וגם פלטפורמה.`,
      };
    }
    const value = await sheet.cellValue("H4");
    if (
      typeof value !== "number" ||
      !approxEqual(value, YOAV_GOOGLE_REVENUE, 0.05)
    ) {
      return {
        passed: false,
        detail: `H4 evaluates to \`${value}\` but should be approximately \`${YOAV_GOOGLE_REVENUE.toFixed(2)}\` (Yoav's Car Deals on Google). Remember: SUMIFS puts the sum range FIRST, then alternating criterion-range / criterion pairs.`,
        detailHe: `התא H4 מתוצא ל-\`${value}\` אבל צריך להיות בערך \`${YOAV_GOOGLE_REVENUE.toFixed(2)}\` (קמפיין Car Deals של Yoav על Google). זוכרים: ב-SUMIFS טווח הסכימה הוא הראשון, ואחריו זוגות מתחלפים של criterion-range ו-criterion.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-06-aggregation",
  lessonSlug: "formulas/06-aggregation",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [yoavCount, yoavTotalSpend, yoavTotalRevenue, yoavGoogleRevenue],
};
