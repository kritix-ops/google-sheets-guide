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

const sumSpend: Rule = {
  id: "h1-sum-spend-table",
  label: "H1 sums the Spend column with a structured table reference",
  labelHe: "התא H1 מסכם את עמודת ה-Spend בעזרת structured table reference",
  answer: "=SUM(Campaigns[Spend])",
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H1 is empty. Convert A1:F13 to a table (Format → Convert to table) and rename it `Campaigns`, then use `=SUM(Campaigns[Spend])`.",
        detailHe:
          "התא H1 ריק. ממירים את A1:F13 לטבלה (Format → Convert to table), נותנים לה שם `Campaigns`, ואז משתמשים ב-`=SUM(Campaigns[Spend])`.",
      };
    }
    if (!formulaContains(formula, "CAMPAIGNS[SPEND]")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the structured reference \`Campaigns[Spend]\` (not the range \`E2:E13\`) so the formula auto-extends when new rows are added.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים ב-structured reference \`Campaigns[Spend]\` (ולא בטווח \`E2:E13\`) כדי שהנוסחה תתרחב אוטומטית כשמוסיפים שורות חדשות.`,
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Wrap the column reference in \`SUM(...)\`.`,
        detailHe: `התא H1 מכיל \`${formula}\`. עוטפים את ה-reference לעמודה ב-\`SUM(...)\`.`,
      };
    }
    return { passed: true };
  },
};

const sumifsByBuyer: Rule = {
  id: "h2-sumifs-buyer-table",
  label: "H2 sums Yoav Cohen's Revenue with structured references",
  labelHe: "התא H2 מסכם את ה-revenue של Yoav Cohen בעזרת structured references",
  answer: '=SUMIFS(Campaigns[Revenue], Campaigns[Buyer], "Yoav Cohen")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H2 is empty. Use `=SUMIFS(Campaigns[Revenue], Campaigns[Buyer], "Yoav Cohen")` to sum Yoav\'s revenue.',
        detailHe:
          'התא H2 ריק. משתמשים ב-`=SUMIFS(Campaigns[Revenue], Campaigns[Buyer], "Yoav Cohen")` כדי לסכם את ה-revenue של Yoav.',
      };
    }
    if (!formulaContains(formula, "SUMIFS")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the \`SUMIFS\` function.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציית \`SUMIFS\`.`,
      };
    }
    if (!formulaContains(formula, "CAMPAIGNS[REVENUE]")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Reference the Revenue column with \`Campaigns[Revenue]\`, not the range.`,
        detailHe: `התא H2 מכיל \`${formula}\`. עושים reference לעמודת Revenue ב-\`Campaigns[Revenue]\`, לא בטווח.`,
      };
    }
    if (!formulaContains(formula, "CAMPAIGNS[BUYER]")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. The criteria range should be \`Campaigns[Buyer]\`, not the range.`,
        detailHe: `התא H2 מכיל \`${formula}\`. טווח ה-criteria צריך להיות \`Campaigns[Buyer]\`, לא הטווח.`,
      };
    }
    return { passed: true };
  },
};

const countifVertical: Rule = {
  id: "h3-countif-vertical-table",
  label: "H3 counts Car Deals PR campaigns with COUNTIF and a table reference",
  labelHe: "התא H3 סופר קמפיינים של Car Deals PR בעזרת COUNTIF ו-table reference",
  answer: '=COUNTIF(Campaigns[Vertical], "Car Deals PR")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H3 is empty. Use `=COUNTIF(Campaigns[Vertical], "Car Deals PR")` to count Car Deals PR campaigns.',
        detailHe:
          'התא H3 ריק. משתמשים ב-`=COUNTIF(Campaigns[Vertical], "Car Deals PR")` כדי לספור קמפיינים של Car Deals PR.',
      };
    }
    if (!formulaContains(formula, "COUNTIF")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use the \`COUNTIF\` function.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים בפונקציית \`COUNTIF\`.`,
      };
    }
    if (!formulaContains(formula, "CAMPAIGNS[VERTICAL]")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Reference the Vertical column with \`Campaigns[Vertical]\`, not the range.`,
        detailHe: `התא H3 מכיל \`${formula}\`. עושים reference לעמודת Vertical ב-\`Campaigns[Vertical]\`, לא בטווח.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-17-tables",
  lessonSlug: "formulas/17-tables",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [sumSpend, sumifsByBuyer, countifVertical],
};
