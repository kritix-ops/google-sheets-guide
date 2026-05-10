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

const querySumByBuyer: Rule = {
  id: "h1-sum-by-buyer",
  label: "H1 returns total revenue per buyer with GROUP BY",
  labelHe: "התא H1 מחזיר revenue כולל לכל media buyer בעזרת GROUP BY",
  answer: '=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B ORDER BY SUM(F) DESC", 1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H1 is empty. Use `=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B ORDER BY SUM(F) DESC", 1)` to summarize revenue by buyer.',
        detailHe:
          'התא H1 ריק. משתמשים ב-`=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B ORDER BY SUM(F) DESC", 1)` כדי לסכם revenue לפי media buyer.',
      };
    }
    if (!formulaContains(formula, "QUERY") || !formulaContains(formula, "GROUP")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use QUERY with GROUP BY and an aggregate function.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים ב-QUERY עם GROUP BY ופונקציית אגרגציה.`,
      };
    }
    return { passed: true };
  },
};

const queryPivot: Rule = {
  id: "k1-pivot-buyer-platform",
  label: "K1 builds a buyer-vs-platform pivot with PIVOT",
  labelHe: "התא K1 בונה pivot של media buyer מול פלטפורמה בעזרת PIVOT",
  answer: '=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B PIVOT D", 1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("K1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'K1 is empty. Use `=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B PIVOT D", 1)` for a buyer-vs-platform revenue pivot.',
        detailHe:
          'התא K1 ריק. משתמשים ב-`=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B PIVOT D", 1)` עבור pivot של revenue לפי media buyer מול פלטפורמה.',
      };
    }
    if (!formulaContains(formula, "PIVOT")) {
      return {
        passed: false,
        detail: `K1 contains \`${formula}\`. Use the PIVOT clause to rotate platforms into columns.`,
        detailHe: `התא K1 מכיל \`${formula}\`. משתמשים בפסוקית PIVOT כדי להפוך פלטפורמות לעמודות.`,
      };
    }
    return { passed: true };
  },
};

const queryWithLabel: Rule = {
  id: "n1-vertical-totals-label",
  label: "N1 shows revenue by vertical with a custom column label",
  labelHe: "התא N1 מציג revenue לפי vertical עם תווית עמודה מותאמת",
  answer:
    "=QUERY(A1:F13, \"SELECT C, SUM(F) GROUP BY C ORDER BY SUM(F) DESC LABEL SUM(F) 'Total Revenue'\", 1)",
  async run(sheet) {
    const formula = await sheet.cellFormula("N1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "N1 is empty. Use `=QUERY(A1:F13, \"SELECT C, SUM(F) GROUP BY C ORDER BY SUM(F) DESC LABEL SUM(F) 'Total Revenue'\", 1)` to summarize revenue by vertical with a clean column header.",
        detailHe:
          "התא N1 ריק. משתמשים ב-`=QUERY(A1:F13, \"SELECT C, SUM(F) GROUP BY C ORDER BY SUM(F) DESC LABEL SUM(F) 'Total Revenue'\", 1)` כדי לסכם revenue לפי vertical עם כותרת עמודה נקייה.",
      };
    }
    if (!formulaContains(formula, "LABEL")) {
      return {
        passed: false,
        detail: `N1 contains \`${formula}\`. Use the LABEL clause to rename the SUM(F) column to "Total Revenue".`,
        detailHe: `התא N1 מכיל \`${formula}\`. משתמשים בפסוקית LABEL כדי לשנות את שם עמודת SUM(F) ל-"Total Revenue".`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-13-query-in-depth",
  lessonSlug: "formulas/13-query-in-depth",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [querySumByBuyer, queryPivot, queryWithLabel],
};
