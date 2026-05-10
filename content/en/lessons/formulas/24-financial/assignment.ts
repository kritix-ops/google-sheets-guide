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

const roiCell: Rule = {
  id: "d2-roi",
  label: "D2 computes ROI as (revenue - spend) / spend",
  labelHe: "התא D2 מחשב ROI כ-(revenue - spend) / spend",
  answer: "=(B2-A2)/A2",
  async run(sheet) {
    const formula = await sheet.cellFormula("D2");
    if (formula == null) {
      return {
        passed: false,
        detail: "D2 is empty. Use `=(B2-A2)/A2` to compute ROI.",
        detailHe: "התא D2 ריק. משתמשים ב-`=(B2-A2)/A2` כדי לחשב ROI.",
      };
    }
    const value = await sheet.cellValue("D2");
    if (!approximatelyEqual(value, 0.4241, 0.005)) {
      return {
        passed: false,
        detail: `D2 evaluates to \`${value}\` but should be ≈ 0.424. ROI = (revenue - spend) / spend.`,
        detailHe: `התא D2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 0.424. ROI = (revenue - spend) / spend.`,
      };
    }
    return { passed: true };
  },
};

const roasCell: Rule = {
  id: "e2-roas",
  label: "E2 computes ROAS as revenue / spend",
  labelHe: "התא E2 מחשב ROAS כ-revenue / spend",
  answer: "=B2/A2",
  async run(sheet) {
    const formula = await sheet.cellFormula("E2");
    if (formula == null) {
      return {
        passed: false,
        detail: "E2 is empty. Use `=B2/A2` to compute ROAS.",
        detailHe: "התא E2 ריק. משתמשים ב-`=B2/A2` כדי לחשב ROAS.",
      };
    }
    const value = await sheet.cellValue("E2");
    if (!approximatelyEqual(value, 1.4241, 0.005)) {
      return {
        passed: false,
        detail: `E2 evaluates to \`${value}\` but should be ≈ 1.424. ROAS = revenue / spend.`,
        detailHe: `התא E2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 1.424. ROAS = revenue / spend.`,
      };
    }
    return { passed: true };
  },
};

const npvCell: Rule = {
  id: "h2-npv",
  label: "H2 computes NPV with the period-0 correction",
  labelHe: "התא H2 מחשב NPV עם תיקון של period-0",
  answer: "=NPV(0.10, G3:G6) + G2",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use `=NPV(0.10, G3:G6) + G2` to compute NPV at 10% with the period-0 outflow added unscanned.",
        detailHe:
          "התא H2 ריק. משתמשים ב-`=NPV(0.10, G3:G6) + G2` כדי לחשב NPV ב-10% כשהיציאה של period-0 מוספת ללא היוון.",
      };
    }
    if (!formulaContains(formula, "NPV")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the \`NPV\` function and add the period-0 cash flow separately.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציית \`NPV\` ומוסיפים את ה-cash flow של period-0 בנפרד.`,
      };
    }
    const value = await sheet.cellValue("H2");
    // NPV with cash flows -1000, 400, 400, 400, 400 at 10%
    // NPV(0.10, 400, 400, 400, 400) = ~1267.95 - 1000 = ~267.95
    if (!approximatelyEqual(value, 267.95, 5)) {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be ≈ 267.95. Standard pattern: \`=NPV(rate, period_1_onward) + period_0\`. Sheets' NPV discounts every flow you give it, so passing the period-0 outflow separately is the correct fix.`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 267.95. הצורה הסטנדרטית: \`=NPV(rate, period_1_onward) + period_0\`. ה-NPV של Sheets מהוון כל cash flow שמעבירים לו, אז להעביר את היציאה של period-0 בנפרד זה התיקון.`,
      };
    }
    return { passed: true };
  },
};

const irrCell: Rule = {
  id: "h3-irr",
  label: "H3 computes IRR for the cash-flow series",
  labelHe: "התא H3 מחשב IRR עבור סדרת ה-cash flow",
  answer: "=IRR(G2:G6)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail: "H3 is empty. Use `=IRR(G2:G6)` to compute the IRR.",
        detailHe: "התא H3 ריק. משתמשים ב-`=IRR(G2:G6)` כדי לחשב את ה-IRR.",
      };
    }
    if (!formulaContains(formula, "IRR")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use the \`IRR\` function on the full cash-flow series.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים בפונקציית \`IRR\` על סדרת ה-cash flow המלאה.`,
      };
    }
    const value = await sheet.cellValue("H3");
    // IRR of -1000, 400, 400, 400, 400 ≈ 0.2186 (21.86%)
    if (!approximatelyEqual(value, 0.2186, 0.01)) {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be ≈ 0.219 (21.9%). IRR is the discount rate at which NPV equals zero.`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות ≈ 0.219 (21.9%). IRR הוא שיעור ההיוון שבו ה-NPV שווה לאפס.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-24-financial",
  lessonSlug: "formulas/24-financial",
  templateSheetId: null,
  seed: {
    tabTitle: "Finance",
    cells: [
      // Margin block: A1:E2
      { a1: "A1", value: "Spend" },
      { a1: "B1", value: "Revenue" },
      { a1: "C1", value: "Profit" },
      { a1: "D1", value: "ROI" },
      { a1: "E1", value: "ROAS" },
      { a1: "A2", value: 342.18 },
      { a1: "B2", value: 487.3 },
      // Cash-flow block: G1:H3
      { a1: "G1", value: "Cash flow" },
      { a1: "G2", value: -1000 },
      { a1: "G3", value: 400 },
      { a1: "G4", value: 400 },
      { a1: "G5", value: 400 },
      { a1: "G6", value: 400 },
      { a1: "H1", value: "Result" },
    ],
  },
  rules: [roiCell, roasCell, npvCell, irrCell],
};
