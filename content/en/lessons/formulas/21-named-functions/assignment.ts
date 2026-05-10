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

const roiOnSingleRow: Rule = {
  id: "h2-roi-named-row",
  label: "H2 calls a named ROI function on the first campaign",
  labelHe: "התא H2 קורא לפונקציה מותאמת בשם ROI על הקמפיין הראשון",
  answer: "=ROI(E2, F2)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. After defining a named function `ROI(spend, revenue) = (revenue - spend) / spend`, use `=ROI(E2, F2)` in H2.",
        detailHe:
          "התא H2 ריק. אחרי שמגדירים פונקציה בשם `ROI(spend, revenue) = (revenue - spend) / spend`, משתמשים ב-`=ROI(E2, F2)` ב-H2.",
      };
    }
    if (!formulaContains(formula, "ROI(")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the named function \`=ROI(E2, F2)\`: define it first via Data → Named functions if you haven't.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציה המותאמת \`=ROI(E2, F2)\`: מגדירים אותה קודם דרך Data → Named functions אם עדיין לא הגדרתם.`,
      };
    }
    const value = await sheet.cellValue("H2");
    // (487.30 - 342.18) / 342.18 ≈ 0.4241
    if (!approximatelyEqual(value, 0.4241, 0.01)) {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be ≈ 0.424. Check that your named function body is \`(revenue - spend) / spend\` and you're passing E2 (Spend) and F2 (Revenue) in that order.`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 0.424. בודקים שהגוף של הפונקציה הוא \`(revenue - spend) / spend\` ושהעברת E2 (Spend) ו-F2 (Revenue) בסדר הזה.`,
      };
    }
    return { passed: true };
  },
};

const roiOnPortfolio: Rule = {
  id: "h3-roi-named-portfolio",
  label: "H3 calls the named ROI function on the portfolio totals",
  labelHe: "התא H3 קורא לפונקציה המותאמת ROI על סך הפורטפוליו",
  answer: "=ROI(SUM(E2:E13), SUM(F2:F13))",
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H3 is empty. Use `=ROI(SUM(E2:E13), SUM(F2:F13))` to get portfolio-level ROI from your named function.",
        detailHe:
          "התא H3 ריק. משתמשים ב-`=ROI(SUM(E2:E13), SUM(F2:F13))` כדי לקבל ROI ברמת פורטפוליו מהפונקציה המותאמת שלך.",
      };
    }
    if (!formulaContains(formula, "ROI(")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use the named \`ROI\` function on the SUM of Spend and Revenue.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים בפונקציה המותאמת \`ROI\` על SUM של Spend ו-Revenue.`,
      };
    }
    if (
      !formulaContains(formula, "SUM(E2:E13)") ||
      !formulaContains(formula, "SUM(F2:F13)")
    ) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. The two arguments to ROI should be \`SUM(E2:E13)\` (total spend) and \`SUM(F2:F13)\` (total revenue).`,
        detailHe: `התא H3 מכיל \`${formula}\`. שני הארגומנטים ל-ROI צריכים להיות \`SUM(E2:E13)\` (סך ה-spend) ו-\`SUM(F2:F13)\` (סך ה-revenue).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-21-named-functions",
  lessonSlug: "formulas/21-named-functions",
  templateSheetId: null,
  seed: {
    tabTitle: "NamedFn",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [roiOnSingleRow, roiOnPortfolio],
};
