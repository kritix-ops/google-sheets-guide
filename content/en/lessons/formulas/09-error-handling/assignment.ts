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

const iferrorRoi: Rule = {
  id: "h1-iferror-roi",
  label: "H1 wraps a ROI division in IFERROR for the zero-spend row",
  labelHe: "התא H1 עוטף חישוב ROI ב-IFERROR עבור שורה עם spend אפס",
  answer: '=IFERROR(C2/B2, "no spend")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H1 is empty. Use `=IFERROR(C2/B2, "no spend")` to compute ROI safely for the zero-spend row.',
        detailHe:
          'התא H1 ריק. משתמשים ב-`=IFERROR(C2/B2, "no spend")` כדי לחשב ROI בבטחה לשורה עם spend אפס.',
      };
    }
    if (!formulaContains(formula, "IFERROR")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use \`IFERROR\` to catch the #DIV/0! error: \`=IFERROR(C2/B2, "no spend")\`.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים ב-\`IFERROR\` כדי ללכוד את שגיאת #DIV/0!: \`=IFERROR(C2/B2, "no spend")\`.`,
      };
    }
    const value = await sheet.cellValue("H1");
    if (value !== "no spend") {
      return {
        passed: false,
        detail: `H1 evaluates to \`${value}\` but should be \`no spend\` (the fallback for the zero-spend row).`,
        detailHe: `התא H1 מתוצא ל-\`${value}\` אבל צריך להיות \`no spend\` (ערך ברירת המחדל לשורה עם spend אפס).`,
      };
    }
    return { passed: true };
  },
};

const ifnaVerticalLookup: Rule = {
  id: "h2-ifna-vertical",
  label: "H2 wraps a vertical lookup in IFNA",
  labelHe: "התא H2 עוטף lookup של vertical ב-IFNA",
  answer: '=IFNA(VLOOKUP(F2, E2:F2, 2, FALSE), "Uncategorized")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H2 is empty. Use `=IFNA(VLOOKUP(F2, E2:F2, 2, FALSE), "Uncategorized")` to handle the missing vertical gracefully.',
        detailHe:
          'התא H2 ריק. משתמשים ב-`=IFNA(VLOOKUP(F2, E2:F2, 2, FALSE), "Uncategorized")` כדי לטפל ב-vertical חסר באלגנטיות.',
      };
    }
    if (!formulaContains(formula, "IFNA")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use \`IFNA\` (not IFERROR) so unrelated errors still surface visibly.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים ב-\`IFNA\` (ולא ב-IFERROR) כדי ששגיאות לא קשורות עדיין יופיעו בבירור.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (value !== "Uncategorized") {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be \`Uncategorized\` (the fallback for the missing vertical).`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות \`Uncategorized\` (ערך ברירת המחדל ל-vertical החסר).`,
      };
    }
    return { passed: true };
  },
};

const isnaCheck: Rule = {
  id: "h3-isna-check",
  label: "H3 uses IF + ISNA to label a missing lookup row",
  labelHe: "התא H3 משתמש ב-IF + ISNA כדי לתייג שורת lookup חסרה",
  answer: '=IF(ISNA(VLOOKUP(F2, E2:F2, 2, FALSE)), "Add to backlog", "Already known")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H3 is empty. Use `=IF(ISNA(VLOOKUP(F2, E2:F2, 2, FALSE)), "Add to backlog", "Already known")` to branch on lookup success.',
        detailHe:
          'התא H3 ריק. משתמשים ב-`=IF(ISNA(VLOOKUP(F2, E2:F2, 2, FALSE)), "Add to backlog", "Already known")` כדי להסתעף לפי הצלחת ה-lookup.',
      };
    }
    if (!formulaContains(formula, "ISNA")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use \`ISNA\` inside \`IF\` to branch based on whether the lookup found a match.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים ב-\`ISNA\` בתוך \`IF\` כדי להסתעף לפי האם ה-lookup מצא התאמה.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (value !== "Add to backlog") {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be \`Add to backlog\` (since the lookup for the missing vertical returns #N/A).`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות \`Add to backlog\` (כי ה-lookup ל-vertical החסר מחזיר #N/A).`,
      };
    }
    return { passed: true };
  },
};

const countifErrors: Rule = {
  id: "h4-count-errors",
  label: "H4 counts how many cells in a range hold #N/A",
  labelHe: "התא H4 סופר כמה תאים בטווח מכילים #N/A",
  answer: '=COUNTIF(I2:I4, "#N/A")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H4 is empty. Use `=COUNTIF(I2:I4, "#N/A")` to count #N/A errors in the test range.',
        detailHe:
          'התא H4 ריק. משתמשים ב-`=COUNTIF(I2:I4, "#N/A")` כדי לספור שגיאות #N/A בטווח הבדיקה.',
      };
    }
    if (!formulaContains(formula, "COUNTIF")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. Use \`COUNTIF\` with the literal criterion \`"#N/A"\` to count error cells.`,
        detailHe: `התא H4 מכיל \`${formula}\`. משתמשים ב-\`COUNTIF\` עם criterion ליטרלי \`"#N/A"\` כדי לספור תאי שגיאה.`,
      };
    }
    const value = await sheet.cellValue("H4");
    if (value !== 2) {
      return {
        passed: false,
        detail: `H4 evaluates to \`${value}\` but should be \`2\` (two of the three test cells in I2:I4 hold #N/A).`,
        detailHe: `התא H4 מתוצא ל-\`${value}\` אבל צריך להיות \`2\` (שניים משלושת תאי הבדיקה ב-I2:I4 מכילים #N/A).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-09-error-handling",
  lessonSlug: "formulas/09-error-handling",
  templateSheetId: null,
  seed: {
    tabTitle: "Errors",
    cells: [
      { a1: "A1", value: "Buyer" },
      { a1: "B1", value: "Spend" },
      { a1: "C1", value: "Revenue" },
      { a1: "A2", value: "Yoav Cohen" },
      { a1: "B2", value: 0 },
      { a1: "C2", value: 0 },
      { a1: "E1", value: "Vertical lookup" },
      { a1: "F1", value: "Category" },
      { a1: "E2", value: "Used Cars PR" },
      { a1: "F2", value: "Automotive" },
      { a1: "I1", value: "Test errors" },
      { a1: "I2", formula: "=NA()" },
      { a1: "I3", value: "OK" },
      { a1: "I4", formula: "=NA()" },
    ],
  },
  rules: [iferrorRoi, ifnaVerticalLookup, isnaCheck, countifErrors],
};
