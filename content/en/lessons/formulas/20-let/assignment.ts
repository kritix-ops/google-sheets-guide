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

function approximatelyEqual(a: unknown, b: number, epsilon = 0.001): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < epsilon;
}

const letRoi: Rule = {
  id: "h2-let-roi",
  label: "H2 computes ROI for the first campaign with named LET bindings",
  labelHe: "התא H2 מחשב ROI לקמפיין הראשון בעזרת LET עם שמות",
  answer: "=LET(spend, E2, revenue, F2, (revenue-spend)/spend)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use `=LET(spend, E2, revenue, F2, (revenue-spend)/spend)` to compute ROI with named bindings.",
        detailHe:
          "התא H2 ריק. משתמשים ב-`=LET(spend, E2, revenue, F2, (revenue-spend)/spend)` כדי לחשב ROI עם שמות.",
      };
    }
    if (!formulaContains(formula, "LET")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the \`LET\` function to bind names to values before computing.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציית \`LET\` כדי לקשר שמות לערכים לפני החישוב.`,
      };
    }
    const value = await sheet.cellValue("H2");
    // (487.30 - 342.18) / 342.18 ≈ 0.4241
    if (!approximatelyEqual(value as number, 0.4241, 0.01)) {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be ≈ 0.424 (ROI of (487.30 - 342.18) / 342.18).`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 0.424 (ROI של (487.30 - 342.18) / 342.18).`,
      };
    }
    return { passed: true };
  },
};

const letBucket: Rule = {
  id: "h3-let-bucket",
  label: "H3 buckets the first campaign into Scale/Hold/Watch/Kill via LET",
  labelHe: "התא H3 מסווג את הקמפיין הראשון ל-Scale/Hold/Watch/Kill בעזרת LET",
  answer:
    '=LET(roi, (F2-E2)/E2, IF(roi>0.5, "Scale", IF(roi>0, "Hold", IF(roi>-0.2, "Watch", "Kill"))))',
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H3 is empty. Use `=LET(roi, (F2-E2)/E2, IF(roi>0.5, "Scale", IF(roi>0, "Hold", IF(roi>-0.2, "Watch", "Kill"))))` to categorize the campaign.',
        detailHe:
          'התא H3 ריק. משתמשים ב-`=LET(roi, (F2-E2)/E2, IF(roi>0.5, "Scale", IF(roi>0, "Hold", IF(roi>-0.2, "Watch", "Kill"))))` כדי לסווג את הקמפיין.',
      };
    }
    if (!formulaContains(formula, "LET")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use \`LET\` to name the ROI calculation, then nested IF for the buckets.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים ב-\`LET\` כדי לתת שם לחישוב ה-ROI, ואז IF מקונן עבור הקטגוריות.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (value !== "Hold") {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be \`Hold\` (ROI ≈ 0.424 falls between 0 and 0.5). Check the threshold order: > 0.5 → Scale, > 0 → Hold, > -0.2 → Watch, else Kill.`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות \`Hold\` (ROI ≈ 0.424 נופל בין 0 ל-0.5). בודקים את סדר הספים: > 0.5 → Scale, > 0 → Hold, > -0.2 → Watch, אחרת Kill.`,
      };
    }
    return { passed: true };
  },
};

const letPortfolio: Rule = {
  id: "h5-let-portfolio",
  label: "H5 builds a portfolio summary with multi-step LET bindings",
  labelHe: "התא H5 בונה סיכום פורטפוליו עם LET רב-שלבי",
  answer:
    '=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), profit, revenue - spend, roi, profit / spend, IF(roi > 0.3, "Strong period", "Weak period"))',
  async run(sheet) {
    const formula = await sheet.cellFormula("H5");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H5 is empty. Use `=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), profit, revenue - spend, roi, profit / spend, IF(roi > 0.3, \"Strong period\", \"Weak period\"))` to summarize the period.",
        detailHe:
          'התא H5 ריק. משתמשים ב-`=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), profit, revenue - spend, roi, profit / spend, IF(roi > 0.3, "Strong period", "Weak period"))` כדי לסכם את התקופה.',
      };
    }
    if (!formulaContains(formula, "LET")) {
      return {
        passed: false,
        detail: `H5 contains \`${formula}\`. Use \`LET\` with at least 4 bindings (spend, revenue, profit, roi) and a verdict body.`,
        detailHe: `התא H5 מכיל \`${formula}\`. משתמשים ב-\`LET\` עם לפחות 4 שמות (spend, revenue, profit, roi) וגוף שמחזיר verdict.`,
      };
    }
    if (
      !formulaContains(formula, "SUM(E2:E13)") ||
      !formulaContains(formula, "SUM(F2:F13)")
    ) {
      return {
        passed: false,
        detail: `H5 contains \`${formula}\`. The bindings should aggregate the whole Spend (E2:E13) and Revenue (F2:F13) columns with SUM.`,
        detailHe: `התא H5 מכיל \`${formula}\`. השמות צריכים לאגרגט את כל עמודות ה-Spend (E2:E13) וה-Revenue (F2:F13) בעזרת SUM.`,
      };
    }
    const value = await sheet.cellValue("H5");
    if (value !== "Strong period" && value !== "Weak period") {
      return {
        passed: false,
        detail: `H5 evaluates to \`${value}\` but should be either \`Strong period\` or \`Weak period\` based on whether overall ROI > 0.3.`,
        detailHe: `התא H5 מתוצא ל-\`${value}\` אבל צריך להיות \`Strong period\` או \`Weak period\` לפי האם ה-ROI הכולל > 0.3.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-20-let",
  lessonSlug: "formulas/20-let",
  templateSheetId: null,
  seed: {
    tabTitle: "Let",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [letRoi, letBucket, letPortfolio],
};
