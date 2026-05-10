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

const mapRoi: Rule = {
  id: "h2-map-roi",
  label: "H2 computes per-campaign ROI with MAP",
  labelHe: "התא H2 מחשב ROI לכל קמפיין בעזרת MAP",
  answer: "=MAP(E2:E13, F2:F13, LAMBDA(s, r, (r-s)/s))",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use `=MAP(E2:E13, F2:F13, LAMBDA(s, r, (r-s)/s))` to compute ROI for every campaign.",
        detailHe:
          "התא H2 ריק. משתמשים ב-`=MAP(E2:E13, F2:F13, LAMBDA(s, r, (r-s)/s))` כדי לחשב ROI לכל קמפיין.",
      };
    }
    if (!formulaContains(formula, "MAP")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the \`MAP\` function with two arrays (Spend and Revenue) and a LAMBDA.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציית \`MAP\` עם שני מערכים (Spend ו-Revenue) ו-LAMBDA.`,
      };
    }
    if (!formulaContains(formula, "LAMBDA")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. MAP needs a LAMBDA as its last argument.`,
        detailHe: `התא H2 מכיל \`${formula}\`. MAP מצריך LAMBDA כארגומנט האחרון.`,
      };
    }
    return { passed: true };
  },
};

const reduceFiltered: Rule = {
  id: "i1-reduce-filtered-sum",
  label: "I1 sums Spends greater than 300 with REDUCE",
  labelHe: "התא I1 מסכם Spends גדולים מ-300 בעזרת REDUCE",
  answer: "=REDUCE(0, E2:E13, LAMBDA(a, s, IF(s>300, a+s, a)))",
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "I1 is empty. Use `=REDUCE(0, E2:E13, LAMBDA(a, s, IF(s>300, a+s, a)))` to sum only the Spends greater than 300.",
        detailHe:
          "התא I1 ריק. משתמשים ב-`=REDUCE(0, E2:E13, LAMBDA(a, s, IF(s>300, a+s, a)))` כדי לסכם רק את ה-Spends הגדולים מ-300.",
      };
    }
    if (!formulaContains(formula, "REDUCE")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use the \`REDUCE\` function.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים בפונקציית \`REDUCE\`.`,
      };
    }
    if (!formulaContains(formula, "LAMBDA")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. REDUCE needs a LAMBDA(accumulator, current, body).`,
        detailHe: `התא I1 מכיל \`${formula}\`. REDUCE מצריך LAMBDA(accumulator, current, body).`,
      };
    }
    return { passed: true };
  },
};

const scanCumulative: Rule = {
  id: "j2-scan-cumulative-spend",
  label: "J2 builds a cumulative-spend running total with SCAN",
  labelHe: "התא J2 בונה סכום מצטבר של Spend בעזרת SCAN",
  answer: "=SCAN(0, E2:E13, LAMBDA(a, s, a+s))",
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J2 is empty. Use `=SCAN(0, E2:E13, LAMBDA(a, s, a+s))` to produce a running total of Spend.",
        detailHe:
          "התא J2 ריק. משתמשים ב-`=SCAN(0, E2:E13, LAMBDA(a, s, a+s))` כדי לייצר סכום רץ של Spend.",
      };
    }
    if (!formulaContains(formula, "SCAN")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Use the \`SCAN\` function: it returns intermediate values, not just the final sum.`,
        detailHe: `התא J2 מכיל \`${formula}\`. משתמשים בפונקציית \`SCAN\`: היא מחזירה ערכי ביניים, לא רק את הסכום הסופי.`,
      };
    }
    if (!formulaContains(formula, "LAMBDA")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. SCAN takes a LAMBDA(accumulator, current, body).`,
        detailHe: `התא J2 מכיל \`${formula}\`. SCAN מקבל LAMBDA(accumulator, current, body).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-19-lambda-helpers",
  lessonSlug: "formulas/19-lambda-helpers",
  templateSheetId: null,
  seed: {
    tabTitle: "Helpers",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [mapRoi, reduceFiltered, scanCumulative],
};
