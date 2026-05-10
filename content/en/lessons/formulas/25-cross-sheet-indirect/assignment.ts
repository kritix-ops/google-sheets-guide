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

function formulaContainsAll(actual: string | null, needles: string[]): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.every((n) => normalized.includes(n.toUpperCase()));
}

const indirectSum: Rule = {
  id: "i1-indirect-sum",
  label: "I1 sums Spend by constructing the range with INDIRECT",
  labelHe: "התא I1 מסכם Spend על ידי בניית הטווח בעזרת INDIRECT",
  answer: '=SUM(INDIRECT("E2:E13"))',
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I1 is empty. Use `=SUM(INDIRECT("E2:E13"))` to sum Spend through INDIRECT. (Equivalent to `=SUM(E2:E13)`: the point is exercising the INDIRECT pattern.)',
        detailHe:
          'התא I1 ריק. משתמשים ב-`=SUM(INDIRECT("E2:E13"))` כדי לסכם Spend דרך INDIRECT. (שווה ל-`=SUM(E2:E13)`: המטרה היא לתרגל את הצורה של INDIRECT.)',
      };
    }
    if (!formulaContainsAll(formula, ["SUM", "INDIRECT"])) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use \`SUM\` wrapped around an \`INDIRECT\` call.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים ב-\`SUM\` עוטף קריאה ל-\`INDIRECT\`.`,
      };
    }
    const value = await sheet.cellValue("I1");
    // Sum of all 12 spends ≈ 3933.78
    if (typeof value !== "number" || Math.abs(value - 3933.78) > 1) {
      return {
        passed: false,
        detail: `I1 evaluates to \`${value}\` but should be ≈ 3933.78 (the sum of all 12 spends).`,
        detailHe: `התא I1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 3933.78 (סך 12 ערכי ה-spend).`,
      };
    }
    return { passed: true };
  },
};

const dynamicIndirect: Rule = {
  id: "i2-dynamic-indirect",
  label: "I2 builds an INDIRECT range from a cell value",
  labelHe: "התא I2 בונה טווח INDIRECT מערך תא",
  answer: '=SUM(INDIRECT(H2 & ":" & H3))',
  async run(sheet) {
    const formula = await sheet.cellFormula("I2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I2 is empty. Use `=SUM(INDIRECT(H2 & ":" & H3))` to build a range dynamically from cells H2 ("E2") and H3 ("E13"), then SUM it.',
        detailHe:
          'התא I2 ריק. משתמשים ב-`=SUM(INDIRECT(H2 & ":" & H3))` כדי לבנות טווח דינמית מהתאים H2 ("E2") ו-H3 ("E13"), ואז לסכם אותו.',
      };
    }
    if (!formulaContainsAll(formula, ["SUM", "INDIRECT"])) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. Use \`SUM(INDIRECT(...))\` and concatenate the range from cells.`,
        detailHe: `התא I2 מכיל \`${formula}\`. משתמשים ב-\`SUM(INDIRECT(...))\` ומשרשרים את הטווח מהתאים.`,
      };
    }
    if (!formulaContains(formula, "&")) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. Concatenate the bounds with \`&\` so the range string is built from H2 and H3: the point is constructing the reference dynamically.`,
        detailHe: `התא I2 מכיל \`${formula}\`. משרשרים את הקצוות עם \`&\` כדי שמחרוזת הטווח תיבנה מ-H2 ו-H3: המטרה היא לבנות את ה-reference דינמית.`,
      };
    }
    return { passed: true };
  },
};

const defensiveIndirect: Rule = {
  id: "i3-iferror-indirect",
  label: "I3 wraps INDIRECT in IFERROR for safe failure",
  labelHe: "התא I3 עוטף INDIRECT ב-IFERROR לכישלון בטוח",
  answer: '=IFERROR(SUM(INDIRECT(H4)), "Invalid range")',
  async run(sheet) {
    const formula = await sheet.cellFormula("I3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I3 is empty. Use `=IFERROR(SUM(INDIRECT(H4)), "Invalid range")` to gracefully handle a bad reference in H4.',
        detailHe:
          'התא I3 ריק. משתמשים ב-`=IFERROR(SUM(INDIRECT(H4)), "Invalid range")` כדי לטפל באלגנטיות ב-reference שגוי ב-H4.',
      };
    }
    if (!formulaContainsAll(formula, ["IFERROR", "INDIRECT"])) {
      return {
        passed: false,
        detail: `I3 contains \`${formula}\`. Wrap the INDIRECT call in \`IFERROR\` with a clear fallback message.`,
        detailHe: `התא I3 מכיל \`${formula}\`. עוטפים את הקריאה ל-INDIRECT ב-\`IFERROR\` עם הודעת fallback ברורה.`,
      };
    }
    const value = await sheet.cellValue("I3");
    // H4 contains "not_a_range", so the IFERROR fallback should fire.
    if (typeof value !== "string") {
      return {
        passed: false,
        detail: `I3 evaluates to \`${value}\` but should be a fallback string (the bad reference in H4 should trigger your IFERROR fallback).`,
        detailHe: `התא I3 מתוצא ל-\`${value}\` אבל צריך להיות מחרוזת fallback (ה-reference השגוי ב-H4 אמור להפעיל את ה-IFERROR fallback).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-25-cross-sheet-indirect",
  lessonSlug: "formulas/25-cross-sheet-indirect",
  templateSheetId: null,
  seed: {
    tabTitle: "Data",
    cells: [
      ...dataToCells(CAMPAIGNS),
      // Helper cells for the dynamic INDIRECT and the broken-reference test.
      { a1: "H1", value: "Range bounds:" },
      { a1: "H2", value: "E2" },
      { a1: "H3", value: "E13" },
      { a1: "H4", value: "not_a_range" },
    ],
  },
  rules: [indirectSum, dynamicIndirect, defensiveIndirect],
};
