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

function approximatelyEqual(a: unknown, b: number, epsilon = 0.01): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < epsilon;
}

const arrayFormulaMarkup: Rule = {
  id: "h2-arrayformula-markup",
  label: "H2 replaces a fill-down with one ARRAYFORMULA (or MAP) over E2:E13",
  labelHe: "התא H2 מחליף fill-down ב-ARRAYFORMULA (או MAP) אחד על E2:E13",
  answer: "=ARRAYFORMULA(E2:E13 * 1.1)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use one of: `=ARRAYFORMULA(E2:E13 * 1.1)` or `=MAP(E2:E13, LAMBDA(x, x*1.1))` to compute marked-up Spend in a single formula instead of dragging.",
        detailHe:
          "התא H2 ריק. משתמשים באחד מהאלה: `=ARRAYFORMULA(E2:E13 * 1.1)` או `=MAP(E2:E13, LAMBDA(x, x*1.1))` כדי לחשב Spend מותאם בנוסחה אחת במקום לגרור.",
      };
    }
    if (!formulaContains(formula, "ARRAYFORMULA") && !formulaContains(formula, "MAP")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use \`ARRAYFORMULA\` or \`MAP\` so one formula spills the result instead of needing 12 dragged cells.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים ב-\`ARRAYFORMULA\` או ב-\`MAP\` כדי שנוסחה אחת תפרוש את התוצאה במקום שיהיה צורך ב-12 תאים נגררים.`,
      };
    }
    return { passed: true };
  },
};

const boundedRangeSum: Rule = {
  id: "i1-bounded-range",
  label: "I1 sums Spend with a bounded range (E2:E13), not a full-column reference",
  labelHe: "התא I1 מסכם Spend עם טווח חסום (E2:E13), לא reference לעמודה מלאה",
  answer: "=SUM(E2:E13)",
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail: "I1 is empty. Use `=SUM(E2:E13)` (the bounded range) instead of `=SUM(E:E)`.",
        detailHe: "התא I1 ריק. משתמשים ב-`=SUM(E2:E13)` (הטווח החסום) במקום ב-`=SUM(E:E)`.",
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use the \`SUM\` function.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים בפונקציית \`SUM\`.`,
      };
    }
    if (formulaContains(formula, "E:E")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Replace the full-column \`E:E\` reference with the bounded \`E2:E13\` so Sheets doesn't walk the whole column.`,
        detailHe: `התא I1 מכיל \`${formula}\`. מחליפים את ה-reference לעמודה מלאה \`E:E\` בטווח החסום \`E2:E13\` כדי ש-Sheets לא יעבור על כל העמודה.`,
      };
    }
    if (!formulaContains(formula, "E2:E13")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use the bounded range \`E2:E13\`.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים בטווח החסום \`E2:E13\`.`,
      };
    }
    const value = await sheet.cellValue("I1");
    if (!approximatelyEqual(value, 3933.78, 1)) {
      return {
        passed: false,
        detail: `I1 evaluates to \`${value}\` but should be ≈ 3933.78 (sum of all 12 spends).`,
        detailHe: `התא I1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 3933.78 (סך 12 ערכי ה-spend).`,
      };
    }
    return { passed: true };
  },
};

const letImportPattern: Rule = {
  id: "j1-let-compute-once",
  label: "J1 uses LET to compute a SUM once and reference it twice",
  labelHe: "התא J1 משתמש ב-LET לחשב SUM פעם אחת ולהשתמש בו פעמיים",
  answer:
    "=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), (revenue - spend) / spend)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Use `=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), (revenue - spend) / spend)` to compute portfolio ROI with the SUMs bound once each.",
        detailHe:
          "התא J1 ריק. משתמשים ב-`=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), (revenue - spend) / spend)` כדי לחשב ROI של פורטפוליו כשה-SUM-ים נקשרים פעם אחת כל אחד.",
      };
    }
    if (!formulaContains(formula, "LET")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use \`LET\` to bind \`spend\` and \`revenue\` once each: the "compute once, reference many" pattern.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים ב-\`LET\` כדי לקשר \`spend\` ו-\`revenue\` פעם אחת כל אחד: הצורה של "מחשבים פעם, משתמשים הרבה".`,
      };
    }
    const value = await sheet.cellValue("J1");
    // Total spend ≈ 3933.78, total revenue ≈ 5694.30 → ROI ≈ 0.4476
    if (!approximatelyEqual(value, 0.4476, 0.01)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ 0.448 (portfolio ROI = (sum revenue - sum spend) / sum spend).`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 0.448 (ROI של פורטפוליו = (sum revenue - sum spend) / sum spend).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-28-performance",
  lessonSlug: "formulas/28-performance",
  templateSheetId: null,
  seed: {
    tabTitle: "Performance",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [arrayFormulaMarkup, boundedRangeSum, letImportPattern],
};
