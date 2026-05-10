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

function approxEqual(a: number, b: number, eps = 0.02): boolean {
  return Math.abs(a - b) < eps;
}

// Compute expected profit per row from the dataset itself so this stays
// correct when the data changes. Skip the header; columns: E=Spend, F=Revenue.
const EXPECTED_PROFIT = CAMPAIGNS.slice(1).map((r) =>
  typeof r[5] === "number" && typeof r[4] === "number" ? r[5] - r[4] : 0,
);
const EXPECTED_STATUS = EXPECTED_PROFIT.map((p) => (p > 0 ? "Profit" : "Loss"));

const fixedRangeProfit: Rule = {
  id: "g1-fixed-profit",
  label: "G1 uses ARRAYFORMULA for a fixed-range profit column",
  labelHe: "התא G1 משתמש ב-ARRAYFORMULA עבור עמודת profit עם טווח קבוע",
  answer: "=ARRAYFORMULA(F2:F13-E2:E13)",
  async run(sheet) {
    const formula = await sheet.cellFormula("G1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "G1 is empty. Use `=ARRAYFORMULA(F2:F13-E2:E13)` to spill a profit column from one cell.",
        detailHe:
          "התא G1 ריק. משתמשים ב-`=ARRAYFORMULA(F2:F13-E2:E13)` כדי לפרוש עמודת profit מתא אחד.",
      };
    }
    if (!formulaContains(formula, "ARRAYFORMULA")) {
      return {
        passed: false,
        detail: `G1 contains \`${formula}\`. Wrap the subtraction in \`ARRAYFORMULA(...)\` so it spills.`,
        detailHe: `התא G1 מכיל \`${formula}\`. עוטפים את החיסור ב-\`ARRAYFORMULA(...)\` כדי שיעשה spill.`,
      };
    }
    const values = await sheet.rangeValues("G1:G12");
    for (let i = 0; i < 12; i++) {
      const actual = values[i]?.[0];
      const expected = EXPECTED_PROFIT[i]!;
      if (typeof actual !== "number" || !approxEqual(actual, expected, 0.05)) {
        return {
          passed: false,
          detail: `G${i + 1} should be approximately \`${expected.toFixed(2)}\` but is \`${actual ?? "empty"}\`. Check the ranges align row-for-row.`,
          detailHe: `התא G${i + 1} צריך להיות בערך \`${expected.toFixed(2)}\` אבל הוא \`${actual ?? "ריק"}\`. בודקים שהטווחים מיושרים שורה-מול-שורה.`,
        };
      }
    }
    return { passed: true };
  },
};

const openEndedProfit: Rule = {
  id: "i1-open-ended-profit",
  label: "I1 uses ARRAYFORMULA with an open-ended range and an empty-row guard",
  labelHe: "התא I1 משתמש ב-ARRAYFORMULA עם טווח פתוח ושמירה על שורות ריקות",
  answer: '=ARRAYFORMULA(IF(E2:E="","",F2:F-E2:E))',
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I1 is empty. Use `=ARRAYFORMULA(IF(E2:E="","",F2:F-E2:E))` for an open-ended profit column.',
        detailHe:
          'התא I1 ריק. משתמשים ב-`=ARRAYFORMULA(IF(E2:E="","",F2:F-E2:E))` עבור עמודת profit עם טווח פתוח.',
      };
    }
    if (!formulaContains(formula, "ARRAYFORMULA")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Wrap in \`ARRAYFORMULA(...)\` so the formula spills.`,
        detailHe: `התא I1 מכיל \`${formula}\`. עוטפים ב-\`ARRAYFORMULA(...)\` כדי שהנוסחה תעשה spill.`,
      };
    }
    if (!formulaContains(formula, "IF(") || !formulaContains(formula, "E2:E")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. The open-ended pattern uses \`E2:E\` (no row number on the end) and an \`IF\` guard for empty rows: \`=ARRAYFORMULA(IF(E2:E="","",F2:F-E2:E))\`.`,
        detailHe: `התא I1 מכיל \`${formula}\`. הצורה הפתוחה משתמשת ב-\`E2:E\` (בלי מספר שורה בסוף) ובשמירה של \`IF\` על שורות ריקות: \`=ARRAYFORMULA(IF(E2:E="","",F2:F-E2:E))\`.`,
      };
    }
    const values = await sheet.rangeValues("I1:I12");
    for (let i = 0; i < 12; i++) {
      const actual = values[i]?.[0];
      const expected = EXPECTED_PROFIT[i]!;
      if (typeof actual !== "number" || !approxEqual(actual, expected, 0.05)) {
        return {
          passed: false,
          detail: `I${i + 1} should be approximately \`${expected.toFixed(2)}\` but is \`${actual ?? "empty"}\`.`,
          detailHe: `התא I${i + 1} צריך להיות בערך \`${expected.toFixed(2)}\` אבל הוא \`${actual ?? "ריק"}\`.`,
        };
      }
    }
    return { passed: true };
  },
};

const statusColumn: Rule = {
  id: "k1-status-column",
  label: "K1 uses ARRAYFORMULA + IF to label every row Profit or Loss",
  labelHe: "התא K1 משתמש ב-ARRAYFORMULA + IF כדי לתייג כל שורה כ-Profit או Loss",
  answer: '=ARRAYFORMULA(IF(F2:F13-E2:E13>0,"Profit","Loss"))',
  async run(sheet) {
    const formula = await sheet.cellFormula("K1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'K1 is empty. Use `=ARRAYFORMULA(IF(F2:F13-E2:E13>0,"Profit","Loss"))` to label every row.',
        detailHe:
          'התא K1 ריק. משתמשים ב-`=ARRAYFORMULA(IF(F2:F13-E2:E13>0,"Profit","Loss"))` כדי לתייג כל שורה.',
      };
    }
    if (!formulaContains(formula, "ARRAYFORMULA")) {
      return {
        passed: false,
        detail: `K1 contains \`${formula}\`. Wrap the IF in \`ARRAYFORMULA(...)\` so it applies row-by-row.`,
        detailHe: `התא K1 מכיל \`${formula}\`. עוטפים את ה-IF ב-\`ARRAYFORMULA(...)\` כדי שיופעל שורה-אחר-שורה.`,
      };
    }
    if (!formulaContains(formula, "IF(")) {
      return {
        passed: false,
        detail: `K1 contains \`${formula}\`. Use IF inside ARRAYFORMULA to branch each row.`,
        detailHe: `התא K1 מכיל \`${formula}\`. משתמשים ב-IF בתוך ARRAYFORMULA כדי להסתעף בכל שורה.`,
      };
    }
    const values = await sheet.rangeValues("K1:K12");
    for (let i = 0; i < 12; i++) {
      const actual = values[i]?.[0];
      const expected = EXPECTED_STATUS[i]!;
      if (actual !== expected) {
        return {
          passed: false,
          detail: `K${i + 1} should be \`${expected}\` but is \`${actual ?? "empty"}\`.`,
          detailHe: `התא K${i + 1} צריך להיות \`${expected}\` אבל הוא \`${actual ?? "ריק"}\`.`,
        };
      }
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-10-arrayformula-basics",
  lessonSlug: "formulas/10-arrayformula-basics",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [fixedRangeProfit, openEndedProfit, statusColumn],
};
