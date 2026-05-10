import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
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

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

// Compute expected values from the dataset so the rules stay correct if the
// dataset shifts. CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical
// D:Platform E:Country F:Spend G:Revenue. 60 data rows + 1 header.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const TOTAL_REVENUE = ROWS.reduce(
  (s, r) => s + (typeof r[6] === "number" ? r[6] : 0),
  0,
);
const PORTFOLIO_ROI = (TOTAL_REVENUE - TOTAL_SPEND) / TOTAL_SPEND;
const UNIQUE_BUYERS = new Set(ROWS.map((r) => r[1])).size;

const totalSpend: Rule = {
  id: "j1-total-spend",
  label: "J1 sums total Spend across the bounded range",
  labelHe: "התא J1 מסכם את ה-Spend הכולל על טווח חסום",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Use `=SUM(F2:F61)` to total Spend. The summary block sits outside the raw log on purpose.",
        detailHe:
          "התא J1 ריק. משתמשים ב-`=SUM(F2:F61)` כדי לסכם Spend. בלוק הסיכום יושב מחוץ ללוג הגולמי בכוונה.",
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use the \`SUM\` function on the Spend column.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים בפונקציית \`SUM\` על עמודת ה-Spend.`,
      };
    }
    if (formulaContains(formula, "F:F")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Replace the full-column \`F:F\` reference with the bounded \`F2:F61\` so Sheets isn't recalculating across a million empty cells.`,
        detailHe: `התא J1 מכיל \`${formula}\`. מחליפים את ה-reference לעמודה מלאה \`F:F\` בטווח החסום \`F2:F61\` כדי ש-Sheets לא יחשב מחדש על פני מיליון תאים ריקים.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (!approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (sum of all 60 spends).`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סך 60 ערכי ה-spend).`,
      };
    }
    return { passed: true };
  },
};

const totalRevenue: Rule = {
  id: "j2-total-revenue",
  label: "J2 sums total Revenue across the bounded range",
  labelHe: "התא J2 מסכם את ה-Revenue הכולל על טווח חסום",
  answer: "=SUM(G2:G61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J2 is empty. Use `=SUM(G2:G61)` to total Revenue.",
        detailHe:
          "התא J2 ריק. משתמשים ב-`=SUM(G2:G61)` כדי לסכם Revenue.",
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Use the \`SUM\` function on the Revenue column.`,
        detailHe: `התא J2 מכיל \`${formula}\`. משתמשים בפונקציית \`SUM\` על עמודת ה-Revenue.`,
      };
    }
    if (formulaContains(formula, "G:G")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Use the bounded range \`G2:G61\` instead of the full-column \`G:G\`.`,
        detailHe: `התא J2 מכיל \`${formula}\`. משתמשים בטווח החסום \`G2:G61\` במקום ב-\`G:G\`.`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (!approxEqual(value, TOTAL_REVENUE, 0.05)) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\` but should be ≈ \`${TOTAL_REVENUE.toFixed(2)}\`.`,
        detailHe: `התא J2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_REVENUE.toFixed(2)}\`.`,
      };
    }
    return { passed: true };
  },
};

const portfolioRoi: Rule = {
  id: "j3-portfolio-roi",
  label: "J3 computes portfolio ROI by referencing J1 and J2",
  labelHe: "התא J3 מחשב ROI של פורטפוליו על ידי הפנייה ל-J1 ול-J2",
  answer: "=(J2-J1)/J1",
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J3 is empty. Use `=(J2-J1)/J1` to compute portfolio ROI from the totals already in the summary block. Reusing J1 and J2 means changing the source range only updates one place.",
        detailHe:
          "התא J3 ריק. משתמשים ב-`=(J2-J1)/J1` כדי לחשב ROI של פורטפוליו מהסכומים שכבר בבלוק הסיכום. שימוש חוזר ב-J1 וב-J2 אומר ששינוי טווח המקור מעדכן רק מקום אחד.",
      };
    }
    if (!formulaContains(formula, "J1") || !formulaContains(formula, "J2")) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Reference \`J1\` (spend) and \`J2\` (revenue) directly. Don't recompute the SUMs here. The whole point of the summary block is reuse.`,
        detailHe: `התא J3 מכיל \`${formula}\`. מפנים ל-\`J1\` (spend) ול-\`J2\` (revenue) ישירות. אל תחשבו שוב את ה-SUM-ים פה. כל הרעיון של בלוק הסיכום הוא שימוש חוזר.`,
      };
    }
    const value = await sheet.cellValue("J3");
    if (!approxEqual(value, PORTFOLIO_ROI, 0.005)) {
      return {
        passed: false,
        detail: `J3 evaluates to \`${value}\` but should be ≈ \`${PORTFOLIO_ROI.toFixed(4)}\` ((revenue - spend) / spend).`,
        detailHe: `התא J3 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${PORTFOLIO_ROI.toFixed(4)}\` ((revenue - spend) / spend).`,
      };
    }
    return { passed: true };
  },
};

const uniqueBuyers: Rule = {
  id: "j4-unique-buyers",
  label: "J4 counts unique buyers with COUNTA(UNIQUE(...))",
  labelHe: "התא J4 סופר media buyers ייחודיים עם COUNTA(UNIQUE(...))",
  answer: "=COUNTA(UNIQUE(B2:B61))",
  async run(sheet) {
    const formula = await sheet.cellFormula("J4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J4 is empty. Use `=COUNTA(UNIQUE(B2:B61))` to count distinct buyers in the log.",
        detailHe:
          "התא J4 ריק. משתמשים ב-`=COUNTA(UNIQUE(B2:B61))` כדי לספור media buyers ייחודיים בלוג.",
      };
    }
    if (!formulaContains(formula, "UNIQUE")) {
      return {
        passed: false,
        detail: `J4 contains \`${formula}\`. Use \`UNIQUE\` to dedupe the buyer column, then \`COUNTA\` to count what came back.`,
        detailHe: `התא J4 מכיל \`${formula}\`. משתמשים ב-\`UNIQUE\` כדי לבטל כפילויות בעמודת ה-media buyers, ואז ב-\`COUNTA\` כדי לספור את מה שחזר.`,
      };
    }
    const value = await sheet.cellValue("J4");
    if (value !== UNIQUE_BUYERS) {
      return {
        passed: false,
        detail: `J4 evaluates to \`${value}\` but should be \`${UNIQUE_BUYERS}\` (the team has ${UNIQUE_BUYERS} buyers across the log).`,
        detailHe: `התא J4 מתוצא ל-\`${value}\` אבל צריך להיות \`${UNIQUE_BUYERS}\` (לצוות יש ${UNIQUE_BUYERS} media buyers בלוג).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-01-workbook-structure",
  lessonSlug: "modeling/01-workbook-structure",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Summary block labels in column I, separated from the raw log by an
      // empty H column. The learner fills in the values in column J.
      { a1: "I1", value: "Total Spend" },
      { a1: "I2", value: "Total Revenue" },
      { a1: "I3", value: "Portfolio ROI" },
      { a1: "I4", value: "Unique buyers" },
    ],
  },
  rules: [totalSpend, totalRevenue, portfolioRoi, uniqueBuyers],
};
