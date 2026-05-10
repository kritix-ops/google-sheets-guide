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

function approxEqual(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) < eps;
}

// Computed from the dataset itself so this stays correct when the data changes.
// Skip the header row (index 0); spend is column index 4.
const TOTAL_SPEND = CAMPAIGNS.slice(1).reduce(
  (s, row) => s + (typeof row[4] === "number" ? row[4] : 0),
  0,
);

const sumTotal: Rule = {
  id: "h1-sum-spend",
  label: "H1 sums every campaign's spend",
  labelHe: "התא H1 מסכם את ה-spend של כל הקמפיינים",
  answer: "=SUM(E2:E13)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H1 is empty. Use `=SUM(E2:E13)` to total the spend across every campaign.",
        detailHe:
          "התא H1 ריק. משתמשים ב-`=SUM(E2:E13)` כדי לסכם את ה-spend של כל הקמפיינים.",
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the \`SUM\` function: \`=SUM(E2:E13)\`.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים בפונקציית \`SUM\`: \`=SUM(E2:E13)\`.`,
      };
    }
    const value = await sheet.cellValue("H1");
    if (typeof value !== "number" || !approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `H1 evaluates to \`${value}\` but should be approximately \`${TOTAL_SPEND.toFixed(2)}\` (the total of all 12 campaign spends).`,
        detailHe: `התא H1 מתוצא ל-\`${value}\` אבל צריך להיות בערך \`${TOTAL_SPEND.toFixed(2)}\` (סך ה-spend של כל 12 הקמפיינים).`,
      };
    }
    return { passed: true };
  },
};

const upperBuyer: Rule = {
  id: "h2-upper-buyer",
  label: "H2 uppercases the first buyer name",
  labelHe: "התא H2 ממיר לאותיות גדולות את שם ה-media buyer הראשון",
  answer: "=UPPER(B2)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail: "H2 is empty. Use `=UPPER(B2)` to uppercase Yoav's name.",
        detailHe: "התא H2 ריק. משתמשים ב-`=UPPER(B2)` כדי להמיר את השם של Yoav לאותיות גדולות.",
      };
    }
    if (!formulaContains(formula, "UPPER")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the \`UPPER\` function: \`=UPPER(B2)\`.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציית \`UPPER\`: \`=UPPER(B2)\`.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (value !== "YOAV COHEN") {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be \`YOAV COHEN\`. Reference \`B2\` (the first buyer name) inside \`UPPER\`.`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות \`YOAV COHEN\`. עושים reference ל-\`B2\` (שם ה-media buyer הראשון) בתוך \`UPPER\`.`,
      };
    }
    return { passed: true };
  },
};

const dateRange: Rule = {
  id: "h3-date-range",
  label: "H3 computes days in 2026 fiscal year",
  labelHe: "התא H3 מחשב את מספר הימים בשנת הכספים 2026",
  answer: "=DATE(2026,12,31)-DATE(2026,1,1)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H3 is empty. Compute days from Jan 1 2026 to Dec 31 2026: `=DATE(2026,12,31)-DATE(2026,1,1)`.",
        detailHe:
          "התא H3 ריק. מחשבים את מספר הימים מ-1 בינואר 2026 עד 31 בדצמבר 2026: `=DATE(2026,12,31)-DATE(2026,1,1)`.",
      };
    }
    if (!formulaContains(formula, "DATE")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use \`DATE(year, month, day)\` for both endpoints and subtract: \`=DATE(2026,12,31)-DATE(2026,1,1)\`.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים ב-\`DATE(year, month, day)\` בשני הקצוות ומחסרים: \`=DATE(2026,12,31)-DATE(2026,1,1)\`.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (value !== 364) {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be \`364\` (days from Jan 1 to Dec 31 of the same year). Check the order: end minus start.`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות \`364\` (מספר הימים מ-1 בינואר עד 31 בדצמבר באותה שנה). בודקים את הסדר: סוף פחות התחלה.`,
      };
    }
    return { passed: true };
  },
};

const ifProfitable: Rule = {
  id: "h4-if-profitable",
  label: "H4 uses IF to label the first campaign as Profitable",
  labelHe: "התא H4 משתמש ב-IF כדי לתייג את הקמפיין הראשון כ-Profitable",
  answer: '=IF(F2>E2,"Profitable","Loss")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H4 is empty. Use `=IF(F2>E2,"Profitable","Loss")` to label the first campaign based on whether revenue beats spend.',
        detailHe:
          'התא H4 ריק. משתמשים ב-`=IF(F2>E2,"Profitable","Loss")` כדי לתייג את הקמפיין הראשון לפי השאלה אם ה-revenue גבוה מה-spend.',
      };
    }
    if (!formulaContains(formula, "IF")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. Use the \`IF\` function: \`=IF(F2>E2,"Profitable","Loss")\`.`,
        detailHe: `התא H4 מכיל \`${formula}\`. משתמשים בפונקציית \`IF\`: \`=IF(F2>E2,"Profitable","Loss")\`.`,
      };
    }
    const value = await sheet.cellValue("H4");
    if (value !== "Profitable") {
      return {
        passed: false,
        detail: `H4 evaluates to \`${value}\` but should be \`Profitable\` (revenue 487.30 > spend 342.18 for the first campaign).`,
        detailHe: `התא H4 מתוצא ל-\`${value}\` אבל צריך להיות \`Profitable\` (revenue 487.30 > spend 342.18 בקמפיין הראשון).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-03-math-text-date-logical",
  lessonSlug: "formulas/03-math-text-date-logical",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [sumTotal, upperBuyer, dateRange, ifProfitable],
};
