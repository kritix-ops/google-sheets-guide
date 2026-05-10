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

const splitCode: Rule = {
  id: "b1-split-code",
  label: "B1 splits the campaign code on underscores",
  labelHe: "התא B1 מפצל את קוד הקמפיין לפי קווים תחתונים",
  answer: '=SPLIT(A1, "_")',
  async run(sheet) {
    const formula = await sheet.cellFormula("B1");
    if (formula == null) {
      return {
        passed: false,
        detail: 'B1 is empty. Use `=SPLIT(A1, "_")` to break the campaign code apart.',
        detailHe: 'התא B1 ריק. משתמשים ב-`=SPLIT(A1, "_")` כדי לפרק את קוד הקמפיין לחלקים.',
      };
    }
    if (!formulaContains(formula, "SPLIT")) {
      return {
        passed: false,
        detail: `B1 contains \`${formula}\`. Use the \`SPLIT\` function with the underscore delimiter.`,
        detailHe: `התא B1 מכיל \`${formula}\`. משתמשים בפונקציית \`SPLIT\` עם תו הקו התחתון כמפריד.`,
      };
    }
    const value = await sheet.cellValue("B1");
    if (value !== "Taboola") {
      return {
        passed: false,
        detail: `B1 evaluates to \`${value}\` but should be \`Taboola\` (the first part of the campaign code).`,
        detailHe: `התא B1 מתוצא ל-\`${value}\` אבל צריך להיות \`Taboola\` (החלק הראשון של קוד הקמפיין).`,
      };
    }
    return { passed: true };
  },
};

const textjoinBuyers: Rule = {
  id: "b3-textjoin-buyers",
  label: "B3 joins the three buyer names with a comma-space separator",
  labelHe: "התא B3 מאחד שלושה שמות media buyers עם פסיק-רווח כמפריד",
  answer: '=TEXTJOIN(", ", TRUE, A3:A5)',
  async run(sheet) {
    const formula = await sheet.cellFormula("B3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'B3 is empty. Use `=TEXTJOIN(", ", TRUE, A3:A5)` to stitch the buyer names into one cell.',
        detailHe:
          'התא B3 ריק. משתמשים ב-`=TEXTJOIN(", ", TRUE, A3:A5)` כדי לחבר את שמות ה-media buyers לתא אחד.',
      };
    }
    if (!formulaContains(formula, "TEXTJOIN")) {
      return {
        passed: false,
        detail: `B3 contains \`${formula}\`. Use the \`TEXTJOIN\` function.`,
        detailHe: `התא B3 מכיל \`${formula}\`. משתמשים בפונקציית \`TEXTJOIN\`.`,
      };
    }
    const value = await sheet.cellValue("B3");
    if (value !== "Yoav Cohen, Dina Dayan, Maya Bar") {
      return {
        passed: false,
        detail: `B3 evaluates to \`${value}\` but should be \`Yoav Cohen, Dina Dayan, Maya Bar\`.`,
        detailHe: `התא B3 מתוצא ל-\`${value}\` אבל צריך להיות \`Yoav Cohen, Dina Dayan, Maya Bar\`.`,
      };
    }
    return { passed: true };
  },
};

const flattenGrid: Rule = {
  id: "g1-flatten-grid",
  label: "G1 flattens a 2x3 grid into a single column with FLATTEN",
  labelHe: "התא G1 משטח רשת 2x3 לעמודה אחת בעזרת FLATTEN",
  answer: "=FLATTEN(D1:F2)",
  async run(sheet) {
    const formula = await sheet.cellFormula("G1");
    if (formula == null) {
      return {
        passed: false,
        detail: "G1 is empty. Use `=FLATTEN(D1:F2)` to flatten the 2x3 grid into a single column.",
        detailHe: "התא G1 ריק. משתמשים ב-`=FLATTEN(D1:F2)` כדי לשטח את רשת ה-2x3 לעמודה אחת.",
      };
    }
    if (!formulaContains(formula, "FLATTEN")) {
      return {
        passed: false,
        detail: `G1 contains \`${formula}\`. Use the \`FLATTEN\` function.`,
        detailHe: `התא G1 מכיל \`${formula}\`. משתמשים בפונקציית \`FLATTEN\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-15-split-join-textjoin",
  lessonSlug: "formulas/15-split-join-textjoin",
  templateSheetId: null,
  seed: {
    tabTitle: "Text",
    cells: [
      { a1: "A1", value: "Taboola_UsedCarsPR_DesktopUS_2026-05" },
      { a1: "A3", value: "Yoav Cohen" },
      { a1: "A4", value: "Dina Dayan" },
      { a1: "A5", value: "Maya Bar" },
      { a1: "D1", value: "Native" },
      { a1: "E1", value: "Social" },
      { a1: "F1", value: "Search" },
      { a1: "D2", value: "Taboola" },
      { a1: "E2", value: "Facebook" },
      { a1: "F2", value: "Google" },
    ],
  },
  rules: [splitCode, textjoinBuyers, flattenGrid],
};
