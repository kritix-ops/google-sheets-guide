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

// CAMPAIGNS_LARGE: 60 data rows in A2:G61. Schema A:Date B:Buyer C:Vertical
// D:Platform E:Country F:Spend G:Revenue.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const ROW_COUNT = ROWS.length;

// Volatile functions the J3 cell must NOT contain. Each one re-evaluates on
// every edit and on the minute timer.
const VOLATILE_FUNCTIONS = ["TODAY", "NOW", "RAND", "RANDBETWEEN", "OFFSET", "INDIRECT"];

const boundedSum: Rule = {
  id: "j1-bounded-sum",
  label: "J1 sums Spend over the bounded range F2:F61",
  labelHe: "התא J1 מסכם Spend על טווח חסום F2:F61",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Replace the seeded `=SUM(F:F)` with `=SUM(F2:F61)` so Sheets isn't walking a million empty cells on every recalc.",
        detailHe:
          "התא J1 ריק. מחליפים את ה-`=SUM(F:F)` שנשתל ב-`=SUM(F2:F61)` כדי ש-Sheets לא יעבור על מיליון תאים ריקים בכל חישוב מחדש.",
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Keep \`SUM\` as the function; just bound the range.`,
        detailHe: `התא J1 מכיל \`${formula}\`. שומרים על \`SUM\` כפונקציה, רק חוסמים את הטווח.`,
      };
    }
    if (formulaContains(formula, "F:F")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The full-column \`F:F\` is the slow shape. Replace it with the bounded \`F2:F61\` (or any explicit \`F2:F<n>\`).`,
        detailHe: `התא J1 מכיל \`${formula}\`. ה-reference לעמודה מלאה \`F:F\` הוא הצורה האיטית. מחליפים אותו בטווח החסום \`F2:F61\` (או \`F2:F<n>\` מפורש).`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (!approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (sum of the ${ROW_COUNT} spends).`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סך ${ROW_COUNT} ערכי ה-spend).`,
      };
    }
    return { passed: true };
  },
};

const boundedCounta: Rule = {
  id: "j2-bounded-counta",
  label: "J2 counts Buyer rows over the bounded range B2:B61",
  labelHe: "התא J2 סופר שורות Buyer על טווח חסום B2:B61",
  answer: "=COUNTA(B2:B61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J2 is empty. Replace the seeded `=COUNTA(B:B)` with `=COUNTA(B2:B61)`. The header row is fine to exclude either way; the point is the bounded range.",
        detailHe:
          "התא J2 ריק. מחליפים את ה-`=COUNTA(B:B)` שנשתל ב-`=COUNTA(B2:B61)`. שורת הכותרת לא משנה לכאן או לכאן, הנקודה היא הטווח החסום.",
      };
    }
    if (!formulaContains(formula, "COUNTA")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Keep \`COUNTA\` as the function; just bound the range.`,
        detailHe: `התא J2 מכיל \`${formula}\`. שומרים על \`COUNTA\` כפונקציה, רק חוסמים את הטווח.`,
      };
    }
    if (formulaContains(formula, "B:B")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. The full-column \`B:B\` is what's making the workbook slow. Replace it with \`B2:B61\`.`,
        detailHe: `התא J2 מכיל \`${formula}\`. ה-reference לעמודה מלאה \`B:B\` הוא מה שמאט את ה-spreadsheet. מחליפים אותו ב-\`B2:B61\`.`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (value !== ROW_COUNT) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\` but should be \`${ROW_COUNT}\` (the count of populated Buyer rows).`,
        detailHe: `התא J2 מתוצא ל-\`${value}\` אבל צריך להיות \`${ROW_COUNT}\` (מספר שורות ה-Buyer המאוכלסות).`,
      };
    }
    return { passed: true };
  },
};

const nonVolatileDate: Rule = {
  id: "j3-not-volatile",
  label: "J3 holds a non-volatile date (no TODAY/NOW/RAND/OFFSET/INDIRECT)",
  labelHe: "התא J3 מחזיק תאריך לא תנודתי (בלי TODAY/NOW/RAND/OFFSET/INDIRECT)",
  answer: '"2026-05-10"',
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    const value = await sheet.cellValue("J3");
    if (formula == null && (value == null || value === "")) {
      return {
        passed: false,
        detail:
          "J3 is empty. The seeded `=TODAY()-1` was volatile; replace it with a stable date string like `\"2026-05-10\"` or a reference to a date cell already in the sheet. Don't leave it blank.",
        detailHe:
          "התא J3 ריק. ה-`=TODAY()-1` שנשתל היה תנודתי. מחליפים אותו במחרוזת תאריך יציבה כמו `\"2026-05-10\"` או ב-reference לתא תאריך שכבר בגיליון. לא משאירים ריק.",
      };
    }
    if (formula != null) {
      for (const v of VOLATILE_FUNCTIONS) {
        if (formulaContains(formula, v)) {
          return {
            passed: false,
            detail: `J3 contains \`${formula}\`. \`${v}\` is volatile, which means Sheets re-evaluates it on every edit and on the minute timer. Replace it with a hardcoded date like \`"2026-05-10"\` or a reference to a static date cell.`,
            detailHe: `התא J3 מכיל \`${formula}\`. \`${v}\` היא פונקציה תנודתית, שאומרת ש-Sheets מחשב אותה מחדש בכל עריכה ובכל דקה. מחליפים אותה בתאריך מוקשח כמו \`"2026-05-10"\` או ב-reference לתא תאריך סטטי.`,
          };
        }
      }
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-02-why-its-slow",
  lessonSlug: "scale/02-why-its-slow",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Summary block labels in column I, separated from the raw log by an
      // empty H column.
      { a1: "I1", value: "Total Spend" },
      { a1: "I2", value: "Row count" },
      { a1: "I3", value: "Report date (non-volatile)" },
      // Pre-seed the slow versions so the learner has something to refactor.
      // These are what the lesson body warns against.
      { a1: "J1", formula: "=SUM(F:F)", value: TOTAL_SPEND },
      { a1: "J2", formula: "=COUNTA(B:B)", value: ROW_COUNT + 1 },
      { a1: "J3", formula: "=TODAY()-1", value: "2026-05-10" },
    ],
  },
  rules: [boundedSum, boundedCounta, nonVolatileDate],
};
