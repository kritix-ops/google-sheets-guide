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

function approximatelyEqual(a: unknown, b: number, epsilon = 1): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < epsilon;
}

const medianSpend: Rule = {
  id: "h1-median-spend",
  label: "H1 returns the median Spend",
  labelHe: "התא H1 מחזיר את החציון של ה-Spend",
  answer: "=MEDIAN(E2:E13)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail: "H1 is empty. Use `=MEDIAN(E2:E13)` to compute the median Spend.",
        detailHe: "התא H1 ריק. משתמשים ב-`=MEDIAN(E2:E13)` כדי לחשב את חציון ה-Spend.",
      };
    }
    if (!formulaContains(formula, "MEDIAN")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the \`MEDIAN\` function on the Spend column.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים בפונקציית \`MEDIAN\` על עמודת ה-Spend.`,
      };
    }
    const value = await sheet.cellValue("H1");
    // Median of the 12 spends is around 307.425
    if (!approximatelyEqual(value, 307.4, 5)) {
      return {
        passed: false,
        detail: `H1 evaluates to \`${value}\` but should be ≈ 307.4 (the median of the 12 spends).`,
        detailHe: `התא H1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 307.4 (החציון של 12 ערכי ה-spend).`,
      };
    }
    return { passed: true };
  },
};

const p90Revenue: Rule = {
  id: "h2-percentile-revenue",
  label: "H2 returns the 90th-percentile Revenue",
  labelHe: "התא H2 מחזיר את ה-Revenue באחוזון ה-90",
  answer: "=PERCENTILE(F2:F13, 0.9)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use `=PERCENTILE(F2:F13, 0.9)` to compute the 90th-percentile Revenue.",
        detailHe:
          "התא H2 ריק. משתמשים ב-`=PERCENTILE(F2:F13, 0.9)` כדי לחשב את ה-Revenue באחוזון ה-90.",
      };
    }
    if (!formulaContains(formula, "PERCENTILE")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the \`PERCENTILE\` function with 0.9 as the percentile argument.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציית \`PERCENTILE\` עם 0.9 כארגומנט האחוזון.`,
      };
    }
    return { passed: true };
  },
};

const spendRevenueCorrel: Rule = {
  id: "h3-correl-spend-revenue",
  label: "H3 returns the correlation between Spend and Revenue",
  labelHe: "התא H3 מחזיר את הקורלציה בין Spend ל-Revenue",
  answer: "=CORREL(E2:E13, F2:F13)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H3 is empty. Use `=CORREL(E2:E13, F2:F13)` to compute the correlation between Spend and Revenue.",
        detailHe:
          "התא H3 ריק. משתמשים ב-`=CORREL(E2:E13, F2:F13)` כדי לחשב את הקורלציה בין Spend ל-Revenue.",
      };
    }
    if (!formulaContains(formula, "CORREL")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use the \`CORREL\` function on the Spend and Revenue columns.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים בפונקציית \`CORREL\` על עמודות ה-Spend וה-Revenue.`,
      };
    }
    const value = await sheet.cellValue("H3");
    // Correlation should be a number between -1 and 1
    if (typeof value !== "number" || value < -1 || value > 1) {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be a number between -1 and 1.`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות מספר בין -1 ל-1.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-23-statistical",
  lessonSlug: "formulas/23-statistical",
  templateSheetId: null,
  seed: {
    tabTitle: "Stats",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [medianSpend, p90Revenue, spendRevenueCorrel],
};
