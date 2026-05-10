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

function approxEqual(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) < eps;
}

const arrayFormulaProfit: Rule = {
  id: "g1-arrayformula-profit",
  label: "G1 uses ARRAYFORMULA to compute profit for every campaign",
  labelHe: "התא G1 משתמש ב-ARRAYFORMULA כדי לחשב רווח לכל קמפיין",
  answer: "=ARRAYFORMULA(F2:F13-E2:E13)",
  async run(sheet) {
    const formula = await sheet.cellFormula("G1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "G1 is empty. Use `=ARRAYFORMULA(F2:F13-E2:E13)` to spill a profit column from a single formula.",
        detailHe:
          "התא G1 ריק. משתמשים ב-`=ARRAYFORMULA(F2:F13-E2:E13)` כדי לפרוש עמודת רווח מנוסחה אחת.",
      };
    }
    if (!formulaContains(formula, "ARRAYFORMULA")) {
      return {
        passed: false,
        detail: `G1 contains \`${formula}\`. Without \`ARRAYFORMULA\`, Sheets returns only the first value. Wrap the subtraction: \`=ARRAYFORMULA(F2:F13-E2:E13)\`.`,
        detailHe: `התא G1 מכיל \`${formula}\`. בלי \`ARRAYFORMULA\`, Sheets מחזיר רק את הערך הראשון. עוטפים את החיסור: \`=ARRAYFORMULA(F2:F13-E2:E13)\`.`,
      };
    }
    const expected = [
      487.3 - 342.18,
      198.4 - 215.5,
      1124.6 - 512.0,
      245.8 - 187.25,
      380.2 - 432.7,
      588.4 - 605.1,
      401.9 - 318.45,
      412.15 - 296.4,
      461.2 - 224.6,
      322.05 - 178.9,
      89.5 - 142.3,
      982.7 - 478.3,
    ];
    const values = await sheet.rangeValues("G1:G12");
    for (let i = 0; i < 12; i++) {
      const actual = values[i]?.[0];
      if (typeof actual !== "number" || !approxEqual(actual, expected[i]!, 0.02)) {
        return {
          passed: false,
          detail: `G${i + 1} should be \`${expected[i]?.toFixed(2)}\` (revenue minus spend for row ${i + 2}) but is \`${actual ?? "empty"}\`.`,
          detailHe: `התא G${i + 1} צריך להיות \`${expected[i]?.toFixed(2)}\` (revenue פחות spend בשורה ${i + 2}) אבל הוא \`${actual ?? "ריק"}\`.`,
        };
      }
    }
    return { passed: true };
  },
};

const queryHighRevenue: Rule = {
  id: "i1-query-high-revenue",
  label: "I1 uses QUERY to filter campaigns with revenue >= 400 sorted descending",
  labelHe: "התא I1 משתמש ב-QUERY כדי לסנן קמפיינים עם revenue >= 400 ממוין יורד",
  answer: '=QUERY(A2:F13, "SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")',
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I1 is empty. Write a QUERY in I1 that returns Buyer, Vertical, Revenue for campaigns with revenue >= 400, sorted by revenue descending: `=QUERY(A2:F13, "SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")`.',
        detailHe:
          'התא I1 ריק. כותבים ב-I1 נוסחת QUERY שמחזירה Buyer, Vertical ו-Revenue עבור קמפיינים עם revenue >= 400, ממוין לפי revenue יורד: `=QUERY(A2:F13, "SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")`.',
      };
    }
    if (!formulaContains(formula, "QUERY")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use QUERY: \`=QUERY(A2:F13, "SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")\`.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים ב-QUERY: \`=QUERY(A2:F13, "SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")\`.`,
      };
    }
    const result = await sheet.rangeValues("I1:K7");
    const expected: Array<[string, string, number]> = [
      ["Maya Bar", "Cruises PR", 1124.6],
      ["Ben Nahum", "Reverse Mortgage PR", 982.7],
      ["Ben Nahum", "Dental Implants PR", 588.4],
      ["Yoav Cohen", "Car Deals PR", 487.3],
      ["Maya Bar", "Pet Insurance PR", 461.2],
      ["Dina Dayan", "Senior Living PR", 412.15],
      ["Yoav Cohen", "Solar Systems & Panels PR", 401.9],
    ];
    for (let i = 0; i < 7; i++) {
      const buyer = result[i]?.[0];
      const vertical = result[i]?.[1];
      const revenue = result[i]?.[2];
      const expRev = expected[i]![2];
      const revOk = typeof revenue === "number" && approxEqual(revenue, expRev, 0.02);
      if (
        buyer !== expected[i]![0] ||
        vertical !== expected[i]![1] ||
        !revOk
      ) {
        return {
          passed: false,
          detail: `Row ${i + 1} of the QUERY result should be \`${expected[i]![0]}, ${expected[i]![1]}, ${expRev}\` but is \`${buyer ?? "?"}, ${vertical ?? "?"}, ${revenue ?? "?"}\`. Filter on revenue >= 400 and order by revenue descending.`,
          detailHe: `שורה ${i + 1} בתוצאת ה-QUERY צריכה להיות \`${expected[i]![0]}, ${expected[i]![1]}, ${expRev}\` אבל היא \`${buyer ?? "?"}, ${vertical ?? "?"}, ${revenue ?? "?"}\`. לסנן revenue >= 400 ולמיין יורד לפי revenue.`,
        };
      }
    }
    return { passed: true };
  },
};

const xlookupYoavRevenue: Rule = {
  id: "h1-xlookup-yoav",
  label: "H1 uses XLOOKUP to find Yoav Cohen's first campaign revenue",
  labelHe: "התא H1 משתמש ב-XLOOKUP כדי למצוא את ה-revenue של הקמפיין הראשון של Yoav Cohen",
  answer: '=XLOOKUP("Yoav Cohen", B2:B13, F2:F13)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H1 is empty. Use `=XLOOKUP("Yoav Cohen", B2:B13, F2:F13)` to find Yoav\'s first campaign revenue.',
        detailHe:
          'התא H1 ריק. משתמשים ב-`=XLOOKUP("Yoav Cohen", B2:B13, F2:F13)` כדי למצוא את ה-revenue של הקמפיין הראשון של Yoav.',
      };
    }
    if (!formulaContains(formula, "XLOOKUP")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\` but is not an XLOOKUP. Use \`=XLOOKUP("Yoav Cohen", B2:B13, F2:F13)\`.`,
        detailHe: `התא H1 מכיל \`${formula}\` אבל זה לא XLOOKUP. משתמשים ב-\`=XLOOKUP("Yoav Cohen", B2:B13, F2:F13)\`.`,
      };
    }
    const value = await sheet.cellValue("H1");
    if (typeof value !== "number" || !approxEqual(value, 487.3, 0.02)) {
      return {
        passed: false,
        detail: `H1 evaluates to \`${value}\` but should be \`487.3\` (Yoav's first campaign revenue, the May 1 Car Deals PR campaign on Google).`,
        detailHe: `התא H1 מתוצא ל-\`${value}\` אבל צריך להיות \`487.3\` (ה-revenue של הקמפיין הראשון של Yoav, קמפיין Car Deals PR מה-1 במאי על Google).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-02-coming-from-excel",
  lessonSlug: "formulas/02-coming-from-excel",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [arrayFormulaProfit, queryHighRevenue, xlookupYoavRevenue],
};
