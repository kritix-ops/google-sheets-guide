import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 8 grades the learner's fixes to two pre-seeded broken IMPORTRANGE
// formulas and one defensive new one on a Dashboard tab. The grader checks
// formula shape only (no value comparison) because IMPORTRANGE fetches an
// external resource; the InMemoryReader cannot reproduce that, and a real
// fetch would resolve to whatever the URL happens to return on the day the
// grader runs.

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

function formulaContainsAny(actual: string | null, needles: string[]): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.some((n) => normalized.includes(n.toUpperCase()));
}

const a1ErrorHandled: Rule = {
  id: "a1-error-handled",
  label: "A1 wraps IMPORTRANGE in IFERROR with a readable fallback",
  labelHe: "התא A1 עוטף את IMPORTRANGE ב-IFERROR עם fallback קריא",
  answer:
    '=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "source unavailable")',
  async run(sheet) {
    const formula = await sheet.cellFormula("A1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'A1 is empty. The original `IMPORTRANGE` pointed at a deleted workbook (`MISSING_SHEET_ID`) and returned `#REF!`. Replace it with a working URL wrapped in `IFERROR`: `=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "source unavailable")`.',
        detailHe:
          'התא A1 ריק. ה-`IMPORTRANGE` המקורי הצביע על spreadsheet שנמחק (`MISSING_SHEET_ID`) והחזיר `#REF!`. מחליפים ב-URL שעובד עטוף ב-`IFERROR`: `=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "source unavailable")`.',
      };
    }
    if (!formulaContainsAll(formula, ["IMPORTRANGE"])) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. Keep the \`IMPORTRANGE\` call; the lesson is about wrapping it, not replacing it.`,
        detailHe: `התא A1 מכיל \`${formula}\`. שומרים על קריאת ה-\`IMPORTRANGE\`, השיעור הוא על עטיפה, לא על החלפה.`,
      };
    }
    if (!formulaContains(formula, "IFERROR")) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. Wrap the \`IMPORTRANGE\` call in \`IFERROR\` with a readable fallback string. When the source is unreachable, the cell should show text rather than \`#REF!\`.`,
        detailHe: `התא A1 מכיל \`${formula}\`. עוטפים את הקריאה ל-\`IMPORTRANGE\` ב-\`IFERROR\` עם מחרוזת fallback קריאה. כשהמקור לא נגיש, התא צריך להציג טקסט במקום \`#REF!\`.`,
      };
    }
    if (formulaContains(formula, "MISSING_SHEET_ID")) {
      return {
        passed: false,
        detail: `A1 still references the missing workbook id \`MISSING_SHEET_ID\`. Switch to a URL that actually resolves (the seed comments suggest \`EXAMPLE_SOURCE_ID\`, but any URL you have access to is fine). The \`IFERROR\` wrapper handles failure; it doesn't fix a deliberately broken URL.`,
        detailHe: `התא A1 עדיין מפנה ל-id של spreadsheet חסר \`MISSING_SHEET_ID\`. עוברים ל-URL שבאמת נפתר (ההערות ב-seed מציעות \`EXAMPLE_SOURCE_ID\`, אבל כל URL שיש לך גישה אליו עובד). ה-wrapper של \`IFERROR\` מטפל בכשלון, הוא לא מתקן URL שבור בכוונה.`,
      };
    }
    return { passed: true };
  },
};

const b1SheetNameCorrected: Rule = {
  id: "b1-sheet-name-corrected",
  label: "B1 corrects the sheet-name typo from `Campaign!` to `Campaigns!`",
  labelHe: "התא B1 מתקן את שגיאת ההקלדה בשם הגיליון מ-`Campaign!` ל-`Campaigns!`",
  answer:
    '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")',
  async run(sheet) {
    const formula = await sheet.cellFormula("B1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'B1 is empty. The original formula had a sheet-name typo: `"Campaign!A1:G61"` instead of `"Campaigns!A1:G61"`. Fix the range string so it references the actual tab name. The URL is fine; the sheet inside it has an `s` at the end.',
        detailHe:
          'התא B1 ריק. בנוסחה המקורית הייתה שגיאת הקלדה בשם הגיליון: `"Campaign!A1:G61"` במקום `"Campaigns!A1:G61"`. מתקנים את מחרוזת הטווח כך שתפנה לשם הגיליון האמיתי. ה-URL תקין, לגיליון בתוכו יש `s` בסוף.',
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `B1 contains \`${formula}\`. Keep the \`IMPORTRANGE\` call; the fix is the range string, not a different function.`,
        detailHe: `התא B1 מכיל \`${formula}\`. שומרים על קריאת ה-\`IMPORTRANGE\`, התיקון הוא במחרוזת הטווח, לא בפונקציה אחרת.`,
      };
    }
    if (!/CAMPAIGNS!/i.test(formula)) {
      return {
        passed: false,
        detail: `B1 contains \`${formula}\`. The range string needs to read \`Campaigns!\` (with the s). The original \`Campaign!\` is the typo; without the s, IMPORTRANGE returns \`#REF!\` with "did not find sheet" in the tooltip.`,
        detailHe: `התא B1 מכיל \`${formula}\`. מחרוזת הטווח צריכה להיות \`Campaigns!\` (עם ה-s). \`Campaign!\` המקורי הוא שגיאת ההקלדה, בלי ה-s ה-IMPORTRANGE מחזיר \`#REF!\` עם "did not find sheet" ב-tooltip.`,
      };
    }
    return { passed: true };
  },
};

const c1DefensivePattern: Rule = {
  id: "c1-defensive-pattern",
  label: "C1 builds a defensive IMPORTRANGE pattern around ISERROR or IFERROR",
  labelHe: "התא C1 בונה תבנית מתגוננת סביב IMPORTRANGE עם ISERROR או IFERROR",
  answer:
    '=IF(ISERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")), "fetch failed", IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"))',
  async run(sheet) {
    const formula = await sheet.cellFormula("C1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'C1 is empty. Use either `=IFERROR(IMPORTRANGE(...), "fetch failed")` for the short form, or `=IF(ISERROR(IMPORTRANGE(...)), "fetch failed", IMPORTRANGE(...))` for the more explicit one. Either way the cell never bare-faces a `#REF!` to the dashboard.',
        detailHe:
          'התא C1 ריק. משתמשים ב-`=IFERROR(IMPORTRANGE(...), "fetch failed")` בצורה הקצרה, או ב-`=IF(ISERROR(IMPORTRANGE(...)), "fetch failed", IMPORTRANGE(...))` בצורה המפורשת. בכל מקרה, התא לעולם לא מציג `#REF!` חשוף ל-dashboard.',
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `C1 contains \`${formula}\`. The cell must call \`IMPORTRANGE\` somewhere; the defensive shape wraps the call, not replaces it.`,
        detailHe: `התא C1 מכיל \`${formula}\`. התא חייב לקרוא ל-\`IMPORTRANGE\` איפשהו, הצורה המתגוננת עוטפת את הקריאה, לא מחליפה אותה.`,
      };
    }
    if (!formulaContainsAny(formula, ["ISERROR", "IFERROR"])) {
      return {
        passed: false,
        detail: `C1 contains \`${formula}\`. The defensive piece is the error test: either \`IFERROR(IMPORTRANGE(...), fallback)\` or \`IF(ISERROR(IMPORTRANGE(...)), fallback, IMPORTRANGE(...))\`. Without one of those, the cell is no safer than the bare call.`,
        detailHe: `התא C1 מכיל \`${formula}\`. החלק המתגונן הוא בדיקת השגיאה: או \`IFERROR(IMPORTRANGE(...), fallback)\` או \`IF(ISERROR(IMPORTRANGE(...)), fallback, IMPORTRANGE(...))\`. בלי אחד מהם, התא לא בטוח יותר מהקריאה החשופה.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-08-diagnosing-broken-importrange",
  lessonSlug: "scale/08-diagnosing-broken-importrange",
  templateSheetId: null,
  seed: {
    tabTitle: "Dashboard",
    cells: [
      // Two pre-seeded broken IMPORTRANGE formulas. Both evaluate to #REF!
      // in the production cell; the InMemoryReader returns the seeded value
      // as-is. The formula text is preserved so the learner can see what
      // they need to fix.
      {
        a1: "A1",
        value: "#REF!",
        formula:
          '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/MISSING_SHEET_ID/edit", "Campaigns!A1:G61")',
      },
      {
        a1: "B1",
        value: "#REF!",
        formula:
          '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaign!A1:G61")',
      },
      // Labels in row 3 so the learner has context next to each cell.
      { a1: "A3", value: "A1: was pointing at a deleted workbook" },
      { a1: "B3", value: "B1: was using the wrong sheet name (Campaign vs Campaigns)" },
      { a1: "C3", value: "C1: write a defensive IMPORTRANGE from scratch" },
    ],
  },
  rules: [a1ErrorHandled, b1SheetNameCorrected, c1DefensivePattern],
};
