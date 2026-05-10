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

const filterByBuyer: Rule = {
  id: "h1-filter-buyer",
  label: "H1 filters Yoav Cohen's campaigns with FILTER",
  labelHe: "התא H1 מסנן את הקמפיינים של Yoav Cohen בעזרת FILTER",
  answer: '=FILTER(A2:F13, B2:B13="Yoav Cohen")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H1 is empty. Use `=FILTER(A2:F13, B2:B13="Yoav Cohen")` to filter to Yoav\'s campaigns.',
        detailHe:
          'התא H1 ריק. משתמשים ב-`=FILTER(A2:F13, B2:B13="Yoav Cohen")` כדי לסנן לקמפיינים של Yoav.',
      };
    }
    if (!formulaContains(formula, "FILTER")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the \`FILTER\` function with a boolean condition.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים בפונקציית \`FILTER\` עם תנאי בוליאני.`,
      };
    }
    return { passed: true };
  },
};

const sortByRevenue: Rule = {
  id: "p1-sort-revenue",
  label: "P1 sorts the entire log by revenue descending with SORT",
  labelHe: "התא P1 ממיין את כל הלוג לפי revenue יורד בעזרת SORT",
  answer: "=SORT(A2:F13, 6, FALSE)",
  async run(sheet) {
    const formula = await sheet.cellFormula("P1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "P1 is empty. Use `=SORT(A2:F13, 6, FALSE)` to sort the log by revenue descending.",
        detailHe:
          "התא P1 ריק. משתמשים ב-`=SORT(A2:F13, 6, FALSE)` כדי למיין את הלוג לפי revenue יורד.",
      };
    }
    if (!formulaContains(formula, "SORT")) {
      return {
        passed: false,
        detail: `P1 contains \`${formula}\`. Use the \`SORT\` function with column index 6 and FALSE for descending.`,
        detailHe: `התא P1 מכיל \`${formula}\`. משתמשים בפונקציית \`SORT\` עם אינדקס עמודה 6 ו-FALSE למיון יורד.`,
      };
    }
    return { passed: true };
  },
};

const uniqueVerticals: Rule = {
  id: "x1-unique-verticals",
  label: "X1 returns distinct verticals with UNIQUE",
  labelHe: "התא X1 מחזיר verticals ייחודיים בעזרת UNIQUE",
  answer: "=UNIQUE(C2:C13)",
  async run(sheet) {
    const formula = await sheet.cellFormula("X1");
    if (formula == null) {
      return {
        passed: false,
        detail: "X1 is empty. Use `=UNIQUE(C2:C13)` to list distinct verticals.",
        detailHe: "התא X1 ריק. משתמשים ב-`=UNIQUE(C2:C13)` כדי להציג verticals ייחודיים.",
      };
    }
    if (!formulaContains(formula, "UNIQUE")) {
      return {
        passed: false,
        detail: `X1 contains \`${formula}\`. Use the \`UNIQUE\` function on the vertical column.`,
        detailHe: `התא X1 מכיל \`${formula}\`. משתמשים בפונקציית \`UNIQUE\` על עמודת ה-vertical.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-14-filter-sort-unique",
  lessonSlug: "formulas/14-filter-sort-unique",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [filterByBuyer, sortByRevenue, uniqueVerticals],
};
