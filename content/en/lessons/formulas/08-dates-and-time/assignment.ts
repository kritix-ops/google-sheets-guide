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

function formulaContainsAll(
  actual: string | null,
  needles: string[],
): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.every((n) => normalized.includes(n.toUpperCase()));
}

const buildPeriodStart: Rule = {
  id: "h1-period-start",
  label: "H1 builds May 1, 2026 with DATE (the team's billing period start)",
  labelHe: "התא H1 בונה את התאריך 1 במאי 2026 בעזרת DATE (תחילת תקופת החיוב של הצוות)",
  answer: "=DATE(2026, 5, 1)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H1 is empty. Use `=DATE(2026, 5, 1)` to build the team's current billing period start.",
        detailHe:
          "התא H1 ריק. משתמשים ב-`=DATE(2026, 5, 1)` כדי לבנות את תחילת תקופת החיוב הנוכחית של הצוות.",
      };
    }
    if (!formulaContains(formula, "DATE")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the \`DATE\` function: \`=DATE(2026, 5, 1)\`.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים בפונקציית \`DATE\`: \`=DATE(2026, 5, 1)\`.`,
      };
    }
    const value = await sheet.cellValue("H1");
    if (value !== 46143) {
      return {
        passed: false,
        detail: `H1 evaluates to \`${value}\` but should be \`46143\` (the date serial for May 1, 2026). Three arguments to DATE in order: year, month, day.`,
        detailHe: `התא H1 מתוצא ל-\`${value}\` אבל צריך להיות \`46143\` (ה-date serial של 1 במאי 2026). שלושה ארגומנטים ל-DATE לפי הסדר: שנה, חודש, יום.`,
      };
    }
    return { passed: true };
  },
};

const billingClose: Rule = {
  id: "h2-billing-close",
  label: "H2 returns the last day of May 2026 via EOMONTH (billing close date)",
  labelHe: "התא H2 מחזיר את היום האחרון של מאי 2026 בעזרת EOMONTH (תאריך סגירת חיוב)",
  answer: "=EOMONTH(DATE(2026, 5, 1), 0)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use `=EOMONTH(DATE(2026, 5, 1), 0)` to find the end of the May billing period.",
        detailHe:
          "התא H2 ריק. משתמשים ב-`=EOMONTH(DATE(2026, 5, 1), 0)` כדי למצוא את סוף תקופת החיוב של מאי.",
      };
    }
    if (!formulaContainsAll(formula, ["EOMONTH", "DATE"])) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Combine \`EOMONTH\` with \`DATE\`: \`=EOMONTH(DATE(2026, 5, 1), 0)\`.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משלבים \`EOMONTH\` עם \`DATE\`: \`=EOMONTH(DATE(2026, 5, 1), 0)\`.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (value !== 46173) {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be \`46173\` (the date serial for May 31, 2026). The second argument to EOMONTH is months from the input date: \`0\` means same month.`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות \`46173\` (ה-date serial של 31 במאי 2026). הארגומנט השני של EOMONTH הוא חודשים מתאריך הקלט: \`0\` משמעו אותו חודש.`,
      };
    }
    return { passed: true };
  },
};

const adDaysInMay: Rule = {
  id: "h3-ad-days",
  label: "H3 counts business days in May 2026 (ad-days for pacing)",
  labelHe: "התא H3 סופר ימי עסקים במאי 2026 (ad-days עבור pacing)",
  answer: "=NETWORKDAYS(DATE(2026, 5, 1), DATE(2026, 5, 31))",
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H3 is empty. Use `=NETWORKDAYS(DATE(2026, 5, 1), DATE(2026, 5, 31))` to count ad-days in May.",
        detailHe:
          "התא H3 ריק. משתמשים ב-`=NETWORKDAYS(DATE(2026, 5, 1), DATE(2026, 5, 31))` כדי לספור ad-days במאי.",
      };
    }
    if (!formulaContains(formula, "NETWORKDAYS")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use \`NETWORKDAYS(start, end)\`: \`=NETWORKDAYS(DATE(2026, 5, 1), DATE(2026, 5, 31))\`.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים ב-\`NETWORKDAYS(start, end)\`: \`=NETWORKDAYS(DATE(2026, 5, 1), DATE(2026, 5, 31))\`.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (value !== 21) {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be \`21\` (May 2026 has 31 days, 10 of which are weekend days, leaving 21 business days).`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות \`21\` (במאי 2026 יש 31 ימים, מתוכם 10 ימי סוף שבוע, ונשארים 21 ימי עסקים).`,
      };
    }
    return { passed: true };
  },
};

const buyerTenure: Rule = {
  id: "h4-buyer-tenure",
  label: "H4 computes months from Jan 1 2025 to May 1 2026 (buyer tenure)",
  labelHe: "התא H4 מחשב חודשים מ-1 בינואר 2025 ועד 1 במאי 2026 (ותק media buyer)",
  answer: '=DATEDIF(DATE(2025, 1, 1), DATE(2026, 5, 1), "M")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H4 is empty. Use `=DATEDIF(DATE(2025, 1, 1), DATE(2026, 5, 1), "M")` to compute full months.',
        detailHe:
          'התא H4 ריק. משתמשים ב-`=DATEDIF(DATE(2025, 1, 1), DATE(2026, 5, 1), "M")` כדי לחשב חודשים מלאים.',
      };
    }
    if (!formulaContains(formula, "DATEDIF")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. Use \`DATEDIF(start, end, unit)\` with unit \`"M"\` for full months.`,
        detailHe: `התא H4 מכיל \`${formula}\`. משתמשים ב-\`DATEDIF(start, end, unit)\` עם unit \`"M"\` לחודשים מלאים.`,
      };
    }
    const value = await sheet.cellValue("H4");
    if (value !== 16) {
      return {
        passed: false,
        detail: `H4 evaluates to \`${value}\` but should be \`16\` (the number of full months between Jan 1, 2025 and May 1, 2026).`,
        detailHe: `התא H4 מתוצא ל-\`${value}\` אבל צריך להיות \`16\` (מספר החודשים המלאים בין 1 בינואר 2025 ל-1 במאי 2026).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-08-dates-and-time",
  lessonSlug: "formulas/08-dates-and-time",
  templateSheetId: null,
  seed: {
    tabTitle: "Dates",
    cells: [
      { a1: "A1", value: "Task" },
      { a1: "B1", value: "Cell" },
      { a1: "A2", value: "Build May 1, 2026 (period start)" },
      { a1: "B2", value: "H1" },
      { a1: "A3", value: "End of May (billing close)" },
      { a1: "B3", value: "H2" },
      { a1: "A4", value: "Business days in May (ad-days)" },
      { a1: "B4", value: "H3" },
      { a1: "A5", value: "Months from Jan 1 2025 to May 1 2026 (tenure)" },
      { a1: "B5", value: "H4" },
    ],
  },
  rules: [buildPeriodStart, billingClose, adDaysInMay, buyerTenure],
};
