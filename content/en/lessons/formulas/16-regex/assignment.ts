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

const validateCode: Rule = {
  id: "b1-regexmatch-validate",
  label: "B1 validates the campaign code format with REGEXMATCH",
  labelHe: "התא B1 מאמת את הפורמט של קוד הקמפיין בעזרת REGEXMATCH",
  answer: '=REGEXMATCH(A1, "^[A-Za-z]+_[A-Za-z]+PR_[A-Za-z]+_\\d{4}-\\d{2}$")',
  async run(sheet) {
    const formula = await sheet.cellFormula("B1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'B1 is empty. Use `=REGEXMATCH(A1, "^[A-Za-z]+_[A-Za-z]+PR_[A-Za-z]+_\\d{4}-\\d{2}$")` to validate the campaign code format.',
        detailHe:
          'התא B1 ריק. משתמשים ב-`=REGEXMATCH(A1, "^[A-Za-z]+_[A-Za-z]+PR_[A-Za-z]+_\\d{4}-\\d{2}$")` כדי לאמת את הפורמט של קוד הקמפיין.',
      };
    }
    if (!formulaContains(formula, "REGEXMATCH")) {
      return {
        passed: false,
        detail: `B1 contains \`${formula}\`. Use the \`REGEXMATCH\` function.`,
        detailHe: `התא B1 מכיל \`${formula}\`. משתמשים בפונקציית \`REGEXMATCH\`.`,
      };
    }
    const value = await sheet.cellValue("B1");
    if (value !== true && value !== "TRUE") {
      return {
        passed: false,
        detail: `B1 evaluates to \`${value}\` but should be \`TRUE\`. Make sure the pattern is anchored with \`^\` and \`$\` and matches the full \`Platform_VerticalPR_Audience_YYYY-MM\` shape.`,
        detailHe: `התא B1 מתוצא ל-\`${value}\` אבל צריך להיות \`TRUE\`. לוודא שה-pattern מעוגן עם \`^\` ו-\`$\` ושהוא מתאים לצורה המלאה \`Platform_VerticalPR_Audience_YYYY-MM\`.`,
      };
    }
    return { passed: true };
  },
};

const extractPlatform: Rule = {
  id: "b2-regexextract-platform",
  label: "B2 extracts the platform name with REGEXEXTRACT",
  labelHe: "התא B2 שולף את שם הפלטפורמה בעזרת REGEXEXTRACT",
  answer: '=REGEXEXTRACT(A1, "^([A-Za-z]+)_")',
  async run(sheet) {
    const formula = await sheet.cellFormula("B2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'B2 is empty. Use `=REGEXEXTRACT(A1, "^([A-Za-z]+)_")` to pull the platform name from the campaign code.',
        detailHe:
          'התא B2 ריק. משתמשים ב-`=REGEXEXTRACT(A1, "^([A-Za-z]+)_")` כדי לשלוף את שם הפלטפורמה מקוד הקמפיין.',
      };
    }
    if (!formulaContains(formula, "REGEXEXTRACT")) {
      return {
        passed: false,
        detail: `B2 contains \`${formula}\`. Use the \`REGEXEXTRACT\` function with a capture group.`,
        detailHe: `התא B2 מכיל \`${formula}\`. משתמשים בפונקציית \`REGEXEXTRACT\` עם capture group.`,
      };
    }
    const value = await sheet.cellValue("B2");
    if (value !== "Taboola") {
      return {
        passed: false,
        detail: `B2 evaluates to \`${value}\` but should be \`Taboola\`. Use a capture group \`(...)\` around the letters before the first underscore.`,
        detailHe: `התא B2 מתוצא ל-\`${value}\` אבל צריך להיות \`Taboola\`. משתמשים ב-capture group \`(...)\` סביב האותיות שלפני הקו התחתון הראשון.`,
      };
    }
    return { passed: true };
  },
};

const stripDate: Rule = {
  id: "b3-regexreplace-strip-date",
  label: "B3 strips the trailing _YYYY-MM date with REGEXREPLACE",
  labelHe: "התא B3 מסיר את התאריך _YYYY-MM שבסוף בעזרת REGEXREPLACE",
  answer: '=REGEXREPLACE(A1, "_\\d{4}-\\d{2}$", "")',
  async run(sheet) {
    const formula = await sheet.cellFormula("B3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'B3 is empty. Use `=REGEXREPLACE(A1, "_\\d{4}-\\d{2}$", "")` to strip the trailing date.',
        detailHe:
          'התא B3 ריק. משתמשים ב-`=REGEXREPLACE(A1, "_\\d{4}-\\d{2}$", "")` כדי להסיר את התאריך שבסוף.',
      };
    }
    if (!formulaContains(formula, "REGEXREPLACE")) {
      return {
        passed: false,
        detail: `B3 contains \`${formula}\`. Use the \`REGEXREPLACE\` function.`,
        detailHe: `התא B3 מכיל \`${formula}\`. משתמשים בפונקציית \`REGEXREPLACE\`.`,
      };
    }
    const value = await sheet.cellValue("B3");
    if (value !== "Taboola_UsedCarsPR_DesktopUS") {
      return {
        passed: false,
        detail: `B3 evaluates to \`${value}\` but should be \`Taboola_UsedCarsPR_DesktopUS\`. Anchor the pattern with \`$\` so it only strips the trailing date, and replace with an empty string.`,
        detailHe: `התא B3 מתוצא ל-\`${value}\` אבל צריך להיות \`Taboola_UsedCarsPR_DesktopUS\`. מעגנים את ה-pattern עם \`$\` כדי שיסיר רק את התאריך שבסוף, ומחליפים במחרוזת ריקה.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-16-regex",
  lessonSlug: "formulas/16-regex",
  templateSheetId: null,
  seed: {
    tabTitle: "Regex",
    cells: [{ a1: "A1", value: "Taboola_UsedCarsPR_DesktopUS_2026-05" }],
  },
  rules: [validateCode, extractPlatform, stripDate],
};
