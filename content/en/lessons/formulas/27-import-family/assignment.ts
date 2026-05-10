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

const basicImportrange: Rule = {
  id: "a1-basic-importrange",
  label: "A1 imports a range from another workbook with IMPORTRANGE",
  labelHe: "התא A1 מייבא טווח מ-spreadsheet אחר בעזרת IMPORTRANGE",
  answer:
    '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F")',
  async run(sheet) {
    const formula = await sheet.cellFormula("A1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'A1 is empty. Use `=IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F")` (substitute a real URL you have access to).',
        detailHe:
          'התא A1 ריק. משתמשים ב-`=IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F")` (מחליפים ב-URL אמיתי שיש לך גישה אליו).',
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. Use the \`IMPORTRANGE\` function with a URL and a sheet!range string.`,
        detailHe: `התא A1 מכיל \`${formula}\`. משתמשים בפונקציית \`IMPORTRANGE\` עם URL ומחרוזת sheet!range.`,
      };
    }
    return { passed: true };
  },
};

const queryImportrange: Rule = {
  id: "a3-query-importrange",
  label: "A3 wraps IMPORTRANGE in QUERY to filter at the source",
  labelHe: "התא A3 עוטף IMPORTRANGE ב-QUERY כדי לסנן במקור",
  answer:
    '=QUERY(IMPORTRANGE("...", "Campaigns!A:F"), "SELECT Col2, Col5, Col6 WHERE Col2 = \'Yoav Cohen\'", 1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("A3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'A3 is empty. Use `=QUERY(IMPORTRANGE("...", "Campaigns!A:F"), "SELECT Col2, Col5, Col6 WHERE Col2 = \'Yoav Cohen\'", 1)` to filter at the source: much faster than importing everything and filtering after.',
        detailHe:
          'התא A3 ריק. משתמשים ב-`=QUERY(IMPORTRANGE("...", "Campaigns!A:F"), "SELECT Col2, Col5, Col6 WHERE Col2 = \'Yoav Cohen\'", 1)` כדי לסנן במקור: הרבה יותר מהיר מלייבא הכל ולסנן אחר כך.',
      };
    }
    if (!formulaContainsAll(formula, ["QUERY", "IMPORTRANGE"])) {
      return {
        passed: false,
        detail: `A3 contains \`${formula}\`. Wrap the \`IMPORTRANGE\` call inside a \`QUERY\` so filtering happens server-side.`,
        detailHe: `התא A3 מכיל \`${formula}\`. עוטפים את הקריאה ל-\`IMPORTRANGE\` בתוך \`QUERY\` כדי שהסינון יקרה בצד השרת.`,
      };
    }
    return { passed: true };
  },
};

const defensiveImportrange: Rule = {
  id: "a5-iferror-importrange",
  label: "A5 wraps IMPORTRANGE in IFERROR with a clear fallback",
  labelHe: "התא A5 עוטף IMPORTRANGE ב-IFERROR עם fallback ברור",
  answer:
    '=IFERROR(IMPORTRANGE("...", "Campaigns!A:F"), "Source unavailable - check connection")',
  async run(sheet) {
    const formula = await sheet.cellFormula("A5");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'A5 is empty. Use `=IFERROR(IMPORTRANGE("...", "Campaigns!A:F"), "Source unavailable - check connection")` so a broken source shows a readable message instead of `#REF!`.',
        detailHe:
          'התא A5 ריק. משתמשים ב-`=IFERROR(IMPORTRANGE("...", "Campaigns!A:F"), "Source unavailable - check connection")` כדי שמקור שבור יציג הודעה קריאה במקום `#REF!`.',
      };
    }
    if (!formulaContainsAll(formula, ["IFERROR", "IMPORTRANGE"])) {
      return {
        passed: false,
        detail: `A5 contains \`${formula}\`. Wrap the \`IMPORTRANGE\` call in \`IFERROR\` with a fallback message.`,
        detailHe: `התא A5 מכיל \`${formula}\`. עוטפים את הקריאה ל-\`IMPORTRANGE\` ב-\`IFERROR\` עם הודעת fallback.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-27-import-family",
  lessonSlug: "formulas/27-import-family",
  templateSheetId: null,
  seed: {
    tabTitle: "Import",
    cells: [
      { a1: "A0", value: "Note: substitute a Sheet URL you control for the IMPORTRANGE source." },
    ],
  },
  rules: [basicImportrange, queryImportrange, defensiveImportrange],
};
