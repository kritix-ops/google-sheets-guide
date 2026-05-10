import type { AssignmentSpec, Rule } from "@/lib/grading/types";

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContainsAll(actual: string | null, needles: string[]): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.every((n) => normalized.includes(n.toUpperCase()));
}

function approximatelyEqual(a: unknown, b: number, epsilon = 0.001): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < epsilon;
}

const twoWayLookup: Rule = {
  id: "g1-two-way-lookup",
  label: "G1 looks up a buyer × vertical cell with INDEX(MATCH, MATCH)",
  labelHe: "התא G1 עושה lookup לתא של media buyer × vertical בעזרת INDEX(MATCH, MATCH)",
  answer: '=INDEX(B2:D5, MATCH("Maya Bar", A2:A5, 0), MATCH("Cruises PR", B1:D1, 0))',
  async run(sheet) {
    const formula = await sheet.cellFormula("G1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'G1 is empty. Use `=INDEX(B2:D5, MATCH("Maya Bar", A2:A5, 0), MATCH("Cruises PR", B1:D1, 0))` to look up the cell at Maya Bar × Cruises PR.',
        detailHe:
          'התא G1 ריק. משתמשים ב-`=INDEX(B2:D5, MATCH("Maya Bar", A2:A5, 0), MATCH("Cruises PR", B1:D1, 0))` כדי לעשות lookup לתא של Maya Bar × Cruises PR.',
      };
    }
    if (!formulaContainsAll(formula, ["INDEX(", "MATCH("])) {
      return {
        passed: false,
        detail: `G1 contains \`${formula}\`. Use \`INDEX\` with two \`MATCH\` calls (one for the row, one for the column).`,
        detailHe: `התא G1 מכיל \`${formula}\`. משתמשים ב-\`INDEX\` עם שתי קריאות \`MATCH\` (אחת לשורה, אחת לעמודה).`,
      };
    }
    const value = await sheet.cellValue("G1");
    if (!approximatelyEqual(value, 1124.6)) {
      return {
        passed: false,
        detail: `G1 evaluates to \`${value}\` but should be \`1124.6\` (Maya Bar's Cruises PR revenue).`,
        detailHe: `התא G1 מתוצא ל-\`${value}\` אבל צריך להיות \`1124.6\` (ה-revenue של Maya Bar ב-Cruises PR).`,
      };
    }
    return { passed: true };
  },
};

const dynamicColumnLookup: Rule = {
  id: "g2-dynamic-column-vlookup",
  label: "G2 uses VLOOKUP with MATCH for a dynamic column index",
  labelHe: "התא G2 משתמש ב-VLOOKUP עם MATCH עבור אינדקס עמודה דינמי",
  answer: "=VLOOKUP($A2, $A$2:$F$13, MATCH($G$1, $A$1:$F$1, 0), FALSE)",
  async run(sheet) {
    const formula = await sheet.cellFormula("G2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "G2 is empty. Use `=VLOOKUP($A2, $A$2:$F$13, MATCH($G$1, $A$1:$F$1, 0), FALSE)` to look up the metric named in G1.",
        detailHe:
          "התא G2 ריק. משתמשים ב-`=VLOOKUP($A2, $A$2:$F$13, MATCH($G$1, $A$1:$F$1, 0), FALSE)` כדי לעשות lookup למטריקה שצוינה ב-G1.",
      };
    }
    if (!formulaContainsAll(formula, ["VLOOKUP", "MATCH"])) {
      return {
        passed: false,
        detail: `G2 contains \`${formula}\`. Use \`VLOOKUP\` with \`MATCH\` as the third argument so the column index is computed dynamically.`,
        detailHe: `התא G2 מכיל \`${formula}\`. משתמשים ב-\`VLOOKUP\` עם \`MATCH\` כארגומנט השלישי כדי שאינדקס העמודה יחושב דינמית.`,
      };
    }
    return { passed: true };
  },
};

const tierLookup: Rule = {
  id: "g3-tier-xlookup",
  label: "G3 classifies a spend into a tier with XLOOKUP range mode",
  labelHe: "התא G3 מסווג spend ל-tier בעזרת XLOOKUP במצב טווח",
  answer: '=XLOOKUP(3400, J2:J5, K2:K5, "n/a", -1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("G3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'G3 is empty. Use `=XLOOKUP(3400, J2:J5, K2:K5, "n/a", -1)` to find the tier whose threshold is exact-or-just-below 3400.',
        detailHe:
          'התא G3 ריק. משתמשים ב-`=XLOOKUP(3400, J2:J5, K2:K5, "n/a", -1)` כדי למצוא את ה-tier שהסף שלו שווה-או-נמוך-מיד-מ-3400.',
      };
    }
    if (!formulaContainsAll(formula, ["XLOOKUP"])) {
      return {
        passed: false,
        detail: `G3 contains \`${formula}\`. Use \`XLOOKUP\` with the fifth argument set to \`-1\` for "exact or next smaller".`,
        detailHe: `התא G3 מכיל \`${formula}\`. משתמשים ב-\`XLOOKUP\` עם הארגומנט החמישי שווה ל-\`-1\` עבור "מדויק או הבא הקטן יותר".`,
      };
    }
    const value = await sheet.cellValue("G3");
    if (value !== "T2") {
      return {
        passed: false,
        detail: `G3 evaluates to \`${value}\` but should be \`T2\` ($3,400 falls in the 1000-4999 band per the threshold table at J2:K5).`,
        detailHe: `התא G3 מתוצא ל-\`${value}\` אבל צריך להיות \`T2\` (3,400 דולר נופל ברצועת 1000-4999 לפי טבלת הספים ב-J2:K5).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-22-advanced-lookups",
  lessonSlug: "formulas/22-advanced-lookups",
  templateSheetId: null,
  seed: {
    tabTitle: "Lookups",
    cells: [
      // Pivot: buyers × verticals
      { a1: "A1", value: "Buyer / Vertical" },
      { a1: "B1", value: "Car Deals PR" },
      { a1: "C1", value: "Cruises PR" },
      { a1: "D1", value: "Pet Insurance PR" },
      { a1: "A2", value: "Yoav Cohen" },
      { a1: "B2", value: 487.3 },
      { a1: "C2", value: 0 },
      { a1: "D2", value: 0 },
      { a1: "A3", value: "Dina Dayan" },
      { a1: "B3", value: 0 },
      { a1: "C3", value: 0 },
      { a1: "D3", value: 0 },
      { a1: "A4", value: "Maya Bar" },
      { a1: "B4", value: 0 },
      { a1: "C4", value: 1124.6 },
      { a1: "D4", value: 461.2 },
      { a1: "A5", value: "Eitan Kohen" },
      { a1: "B5", value: 0 },
      { a1: "C5", value: 0 },
      { a1: "D5", value: 0 },
      // Tier threshold table
      { a1: "J1", value: "Min Spend" },
      { a1: "K1", value: "Tier" },
      { a1: "J2", value: 0 },
      { a1: "K2", value: "T3" },
      { a1: "J3", value: 1000 },
      { a1: "K3", value: "T2" },
      { a1: "J4", value: 5000 },
      { a1: "K4", value: "T1" },
      { a1: "J5", value: 25000 },
      { a1: "K5", value: "Whale" },
    ],
  },
  rules: [twoWayLookup, dynamicColumnLookup, tierLookup],
};
