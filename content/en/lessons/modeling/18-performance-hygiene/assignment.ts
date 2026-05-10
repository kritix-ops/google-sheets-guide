import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 18 grades three summary formulas the learner writes against a
// seeded campaigns tab populated with the 60-row CAMPAIGNS_LARGE dataset.
// The lesson teaches workbook-level performance hygiene: bounded ranges
// (no full-column refs), the LET + COUNTA + INDEX pattern for ranges that
// can grow, and "compute once, reference many" for derived metrics. The
// summary cells live in column J on the same tab so a single-tab assignment
// grades cleanly.

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
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

// Compute expectations from the dataset (skip header row). CAMPAIGNS_LARGE
// schema: A Date | B Buyer | C Vertical | D Platform | E Country | F Spend
// | G Revenue.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = Number(
  ROWS.reduce((sum, r) => sum + Number(r[5] ?? 0), 0).toFixed(2),
);
const TOTAL_REVENUE = Number(
  ROWS.reduce((sum, r) => sum + Number(r[6] ?? 0), 0).toFixed(2),
);
const PORTFOLIO_ROI = (TOTAL_REVENUE - TOTAL_SPEND) / TOTAL_SPEND;

function approxEqual(actual: unknown, expected: number, tolerance = 0.05): boolean {
  if (typeof actual !== "number") return false;
  return Math.abs(actual - expected) <= tolerance;
}

const totalSpendBounded: Rule = {
  id: "j1-total-spend-bounded",
  label: "J1 sums Spend with a bounded range, not a full-column ref",
  labelHe: "התא J1 מסכם spend עם טווח חסום, לא reference לעמודה שלמה",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Use `=SUM(F2:F61)` to total Spend over the 60 rows of data. A bounded range walks 60 cells; `SUM(F:F)` walks the whole column.",
        detailHe:
          "התא J1 ריק. משתמשים ב-`=SUM(F2:F61)` כדי לסכם spend על 60 שורות הנתונים. טווח חסום עובר על 60 תאים, `SUM(F:F)` עובר על כל העמודה.",
      };
    }
    if (!formulaContainsAll(formula, ["SUM"])) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use \`SUM\` over column F (Spend).`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים ב-\`SUM\` על עמודה F (spend).`,
      };
    }
    // Reject full-column refs to F. Match `F:F`, `$F:$F`, `$F:F`, `F:$F`.
    const normalized = normalizeFormula(formula) ?? "";
    if (/\$?F:\$?F/.test(normalized)) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Replace the full-column reference \`F:F\` with a bounded range like \`F2:F61\`. Full-column refs scan the entire column on every recalc.`,
        detailHe: `התא J1 מכיל \`${formula}\`. מחליפים את ה-reference לעמודה שלמה \`F:F\` בטווח חסום כמו \`F2:F61\`. references לעמודה שלמה סורקים את כל העמודה בכל חישוב מחדש.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (!approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be \`${TOTAL_SPEND}\`. Check that the range covers \`F2:F61\` (the full Spend column, headers excluded).`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות \`${TOTAL_SPEND}\`. מוודאים שהטווח מכסה את \`F2:F61\` (עמודת ה-spend המלאה, ללא כותרות).`,
      };
    }
    return { passed: true };
  },
};

const totalRevenueDynamic: Rule = {
  id: "j2-total-revenue-dynamic-bound",
  label: "J2 sums Revenue with a LET + COUNTA dynamic upper bound",
  labelHe:
    "התא J2 מסכם revenue עם גבול עליון דינמי דרך LET + COUNTA",
  answer: "=LET(n, COUNTA(A2:A1000), SUM(G2:INDEX(G:G, n+1)))",
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J2 is empty. Use `=LET(n, COUNTA(A2:A1000), SUM(G2:INDEX(G:G, n+1)))` to total Revenue with a bound that grows with the data. The formula picks up new rows from `IMPORTRANGE` without anyone editing the range.",
        detailHe:
          "התא J2 ריק. משתמשים ב-`=LET(n, COUNTA(A2:A1000), SUM(G2:INDEX(G:G, n+1)))` כדי לסכם revenue עם גבול שגדל עם הנתונים. הנוסחה תופסת שורות חדשות מ-`IMPORTRANGE` בלי שאף אחד יערוך את הטווח.",
      };
    }
    if (!formulaContainsAll(formula, ["LET"])) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Wrap the calculation in \`LET\` so the row count is named once and the SUM bound is computed dynamically. The skeleton: \`=LET(n, COUNTA(A2:A1000), SUM(G2:INDEX(G:G, n+1)))\`.`,
        detailHe: `התא J2 מכיל \`${formula}\`. עוטפים את החישוב ב-\`LET\` כך שמספר השורות נקרא בשם פעם אחת והגבול של SUM מחושב באופן דינמי. השלד: \`=LET(n, COUNTA(A2:A1000), SUM(G2:INDEX(G:G, n+1)))\`.`,
      };
    }
    if (!formulaContainsAll(formula, ["COUNTA"])) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Use \`COUNTA\` inside \`LET\` to count the data rows dynamically. A hardcoded number defeats the purpose: the formula breaks the moment a row is added.`,
        detailHe: `התא J2 מכיל \`${formula}\`. משתמשים ב-\`COUNTA\` בתוך \`LET\` כדי לספור את שורות הנתונים באופן דינמי. מספר קבוע מאבד את הפואנטה: הנוסחה נשברת ברגע שמוסיפים שורה.`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (!approxEqual(value, TOTAL_REVENUE, 0.05)) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\` but should be \`${TOTAL_REVENUE}\`. Make sure the SUM ends at \`INDEX(G:G, n+1)\` (the +1 accounts for the header row in row 1).`,
        detailHe: `התא J2 מתוצא ל-\`${value}\` אבל צריך להיות \`${TOTAL_REVENUE}\`. מוודאים שה-SUM מסתיים ב-\`INDEX(G:G, n+1)\` (ה-+1 לוקח בחשבון את שורת הכותרת בשורה 1).`,
      };
    }
    return { passed: true };
  },
};

const portfolioRoi: Rule = {
  id: "j3-portfolio-roi-reuses-cells",
  label: "J3 computes portfolio ROI by referencing J1 and J2",
  labelHe: "התא J3 מחשב ROI כולל דרך reference ל-J1 ול-J2",
  answer: "=(J2-J1)/J1",
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J3 is empty. Use `=(J2-J1)/J1` to compute portfolio ROI. Reference the cells you already computed; do not re-SUM the columns inside this formula.",
        detailHe:
          "התא J3 ריק. משתמשים ב-`=(J2-J1)/J1` כדי לחשב ROI כולל. עושים reference לתאים שכבר חישבתם, לא מסכמים שוב את העמודות בתוך הנוסחה הזאת.",
      };
    }
    const normalized = normalizeFormula(formula) ?? "";
    if (!normalized.includes("J1") || !normalized.includes("J2")) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Reference both \`J1\` and \`J2\` directly: \`=(J2-J1)/J1\`. Recomputing the SUMs here doubles the work and makes the formula harder to update when the source range changes.`,
        detailHe: `התא J3 מכיל \`${formula}\`. עושים reference ישירות גם ל-\`J1\` וגם ל-\`J2\`: \`=(J2-J1)/J1\`. חישוב מחדש של ה-SUMs כאן מכפיל את העבודה ומקשה על עדכון הנוסחה כשטווח המקור משתנה.`,
      };
    }
    if (formulaContainsAny(formula, ["SUM(", "COUNTA(", "INDEX("])) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. The point of this cell is to reuse \`J1\` and \`J2\`, not to rebuild them. Replace the SUM/COUNTA/INDEX work with the cell references: \`=(J2-J1)/J1\`.`,
        detailHe: `התא J3 מכיל \`${formula}\`. המטרה של התא הזה היא להשתמש מחדש ב-\`J1\` וב-\`J2\`, לא לבנות אותם מחדש. מחליפים את העבודה של SUM/COUNTA/INDEX ב-references לתאים: \`=(J2-J1)/J1\`.`,
      };
    }
    const value = await sheet.cellValue("J3");
    if (!approxEqual(value, PORTFOLIO_ROI, 0.001)) {
      return {
        passed: false,
        detail: `J3 evaluates to \`${value}\` but should be approximately \`${PORTFOLIO_ROI.toFixed(4)}\`. The formula is \`(J2 - J1) / J1\` (revenue minus spend, divided by spend).`,
        detailHe: `התא J3 מתוצא ל-\`${value}\` אבל צריך להיות בערך \`${PORTFOLIO_ROI.toFixed(4)}\`. הנוסחה היא \`(J2 - J1) / J1\` (revenue פחות spend, חלקי spend).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-18-performance-hygiene",
  lessonSlug: "modeling/18-performance-hygiene",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Summary labels in column I, separated from the data block by the
      // natural visual gap (the campaign columns end at G).
      { a1: "I1", value: "Total Spend (bounded)" },
      { a1: "I2", value: "Total Revenue (LET + COUNTA + INDEX)" },
      { a1: "I3", value: "Portfolio ROI (reuses J1, J2)" },
    ],
  },
  rules: [totalSpendBounded, totalRevenueDynamic, portfolioRoi],
};
