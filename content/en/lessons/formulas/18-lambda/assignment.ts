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

const inlineLambdaRoi: Rule = {
  id: "c2-inline-lambda-roi",
  label: "C2 invokes an inline LAMBDA to compute ROI",
  labelHe: "התא C2 מפעיל LAMBDA inline כדי לחשב ROI",
  answer: "=LAMBDA(s, r, (r-s)/s)(A2, B2)",
  async run(sheet) {
    const formula = await sheet.cellFormula("C2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "C2 is empty. Use `=LAMBDA(s, r, (r-s)/s)(A2, B2)` to compute ROI inline.",
        detailHe:
          "התא C2 ריק. משתמשים ב-`=LAMBDA(s, r, (r-s)/s)(A2, B2)` כדי לחשב ROI inline.",
      };
    }
    if (!formulaContains(formula, "LAMBDA")) {
      return {
        passed: false,
        detail: `C2 contains \`${formula}\`. Use the \`LAMBDA\` function and invoke it inline with \`(A2, B2)\` after the LAMBDA.`,
        detailHe: `התא C2 מכיל \`${formula}\`. משתמשים בפונקציית \`LAMBDA\` ומפעילים אותה inline עם \`(A2, B2)\` אחרי ה-LAMBDA.`,
      };
    }
    const value = await sheet.cellValue("C2");
    if (!approximatelyEqual(value, 1.5)) {
      return {
        passed: false,
        detail: `C2 evaluates to \`${value}\` but should be \`1.5\` (the ROI of spend 100 / revenue 250). Make sure the body is \`(r-s)/s\` and you invoked it with A2 (spend) and B2 (revenue).`,
        detailHe: `התא C2 מתוצא ל-\`${value}\` אבל צריך להיות \`1.5\` (ה-ROI של spend 100 / revenue 250). לוודא שהגוף הוא \`(r-s)/s\` ושהפעלת עם A2 (spend) ו-B2 (revenue).`,
      };
    }
    return { passed: true };
  },
};

const letNamedLambda: Rule = {
  id: "c4-let-named-lambda",
  label: "C4 names a LAMBDA with LET and calls it twice",
  labelHe: "התא C4 נותן שם ל-LAMBDA בעזרת LET וקורא לה פעמיים",
  answer: "=LET(roi, LAMBDA(s, r, (r-s)/s), roi(A2, B2) + roi(A3, B3))",
  async run(sheet) {
    const formula = await sheet.cellFormula("C4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "C4 is empty. Use `=LET(roi, LAMBDA(s, r, (r-s)/s), roi(A2, B2) + roi(A3, B3))` to sum the two ROIs.",
        detailHe:
          "התא C4 ריק. משתמשים ב-`=LET(roi, LAMBDA(s, r, (r-s)/s), roi(A2, B2) + roi(A3, B3))` כדי לסכם את שני ה-ROI.",
      };
    }
    if (!formulaContains(formula, "LET")) {
      return {
        passed: false,
        detail: `C4 contains \`${formula}\`. Use \`LET\` to give the LAMBDA a name.`,
        detailHe: `התא C4 מכיל \`${formula}\`. משתמשים ב-\`LET\` כדי לתת שם ל-LAMBDA.`,
      };
    }
    if (!formulaContains(formula, "LAMBDA")) {
      return {
        passed: false,
        detail: `C4 contains \`${formula}\`. Define a LAMBDA inside the LET.`,
        detailHe: `התא C4 מכיל \`${formula}\`. מגדירים LAMBDA בתוך ה-LET.`,
      };
    }
    const value = await sheet.cellValue("C4");
    if (!approximatelyEqual(value, 3.5)) {
      return {
        passed: false,
        detail: `C4 evaluates to \`${value}\` but should be \`3.5\` (1.5 + 2.0 = sum of the two ROIs).`,
        detailHe: `התא C4 מתוצא ל-\`${value}\` אבל צריך להיות \`3.5\` (1.5 + 2.0 = סכום שני ה-ROI).`,
      };
    }
    return { passed: true };
  },
};

const lambdaWithFee: Rule = {
  id: "c6-lambda-with-fee",
  label: "C6 defines a LAMBDA that subtracts a fee before computing ROI",
  labelHe: "התא C6 מגדיר LAMBDA שמחסירה fee לפני חישוב ROI",
  answer: "=LAMBDA(s, r, fee, (r - fee - s)/s)(A2, B2, 25)",
  async run(sheet) {
    const formula = await sheet.cellFormula("C6");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "C6 is empty. Use `=LAMBDA(s, r, fee, (r - fee - s)/s)(A2, B2, 25)` to compute ROI net of a $25 fee.",
        detailHe:
          "התא C6 ריק. משתמשים ב-`=LAMBDA(s, r, fee, (r - fee - s)/s)(A2, B2, 25)` כדי לחשב ROI לאחר ניכוי fee של 25 דולר.",
      };
    }
    if (!formulaContains(formula, "LAMBDA")) {
      return {
        passed: false,
        detail: `C6 contains \`${formula}\`. Use a LAMBDA with three parameters (spend, revenue, fee).`,
        detailHe: `התא C6 מכיל \`${formula}\`. משתמשים ב-LAMBDA עם שלושה פרמטרים (spend, revenue, fee).`,
      };
    }
    const value = await sheet.cellValue("C6");
    // (250 - 25 - 100) / 100 = 1.25
    if (!approximatelyEqual(value, 1.25)) {
      return {
        passed: false,
        detail: `C6 evaluates to \`${value}\` but should be \`1.25\` ((250 - 25 - 100) / 100 = 1.25). Subtract the fee from revenue before dividing by spend.`,
        detailHe: `התא C6 מתוצא ל-\`${value}\` אבל צריך להיות \`1.25\` ((250 - 25 - 100) / 100 = 1.25). מחסירים את ה-fee מה-revenue לפני החלוקה ב-spend.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-18-lambda",
  lessonSlug: "formulas/18-lambda",
  templateSheetId: null,
  seed: {
    tabTitle: "Lambda",
    cells: [
      { a1: "A1", value: "Spend" },
      { a1: "B1", value: "Revenue" },
      { a1: "C1", value: "ROI" },
      { a1: "A2", value: 100 },
      { a1: "B2", value: 250 },
      { a1: "A3", value: 200 },
      { a1: "B3", value: 600 },
      { a1: "A5", value: "Sum of ROIs:" },
      { a1: "A6", value: "ROI net of fee:" },
    ],
  },
  rules: [inlineLambdaRoi, letNamedLambda, lambdaWithFee],
};
