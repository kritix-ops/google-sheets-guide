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

function formulaContainsAll(
  actual: string | null,
  needles: string[],
): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.every((n) => normalized.includes(n.toUpperCase()));
}

const ifsRoiBucket: Rule = {
  id: "h2-ifs-roi",
  label: "H2 uses IFS to bucket the first campaign's ROI",
  labelHe: "התא H2 משתמש ב-IFS כדי לחלק לקטגוריות את ה-ROI של הקמפיין הראשון",
  answer: '=IFS(F2/E2>=2,"Star",F2/E2>=1.2,"Profitable",F2/E2>=0.9,"Break-even",TRUE,"Loss")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H2 is empty. Use `=IFS(F2/E2>=2,"Star",F2/E2>=1.2,"Profitable",F2/E2>=0.9,"Break-even",TRUE,"Loss")` to bucket the ROI.',
        detailHe:
          'התא H2 ריק. משתמשים ב-`=IFS(F2/E2>=2,"Star",F2/E2>=1.2,"Profitable",F2/E2>=0.9,"Break-even",TRUE,"Loss")` כדי לחלק את ה-ROI לקטגוריות.',
      };
    }
    if (!formulaContains(formula, "IFS")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\` but should use IFS. Nested IFs work, but IFS is cleaner.`,
        detailHe: `התא H2 מכיל \`${formula}\` אבל צריך להשתמש ב-IFS. IF מקונן עובד, אבל IFS נקי יותר.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (value !== "Profitable") {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be \`Profitable\` (the first campaign's ROI is 487.30/342.18 ≈ 1.42, which lands in the "Profitable" band of >= 1.2 but < 2).`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות \`Profitable\` (ה-ROI של הקמפיין הראשון הוא 487.30/342.18 ≈ 1.42, שנופל ברצועת "Profitable" של >= 1.2 אבל < 2).`,
      };
    }
    return { passed: true };
  },
};

const switchPlatformCategory: Rule = {
  id: "h3-switch-platform",
  label: "H3 uses SWITCH to translate the platform into a category",
  labelHe: "התא H3 משתמש ב-SWITCH כדי לתרגם את הפלטפורמה ל-category",
  answer: '=SWITCH(D2,"Taboola","Native","Outbrain","Native","MediaGo","Native","Poppin","Native","Facebook","Social","TikTok","Social","Google","Search","Other")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H3 is empty. Use SWITCH on the platform name in D2 to return Native/Social/Search.',
        detailHe:
          "התא H3 ריק. משתמשים ב-SWITCH על שם הפלטפורמה ב-D2 כדי להחזיר Native/Social/Search.",
      };
    }
    if (!formulaContains(formula, "SWITCH")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\` but should use SWITCH. Equality matches are SWITCH's specialty.`,
        detailHe: `התא H3 מכיל \`${formula}\` אבל צריך להשתמש ב-SWITCH. התאמות שוויון הן ההתמחות של SWITCH.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (value !== "Search") {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be \`Search\` (Google is a Search platform).`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות \`Search\` (Google היא פלטפורמת Search).`,
      };
    }
    return { passed: true };
  },
};

const ifAndScaleCandidate: Rule = {
  id: "h4-if-and-scale",
  label: "H4 uses IF with AND to flag the first campaign as a scale candidate",
  labelHe: "התא H4 משתמש ב-IF עם AND כדי לסמן את הקמפיין הראשון כמועמד לסקייל",
  answer: '=IF(AND(F2>E2,E2>=200),"Scale candidate","Other")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H4 is empty. Use `=IF(AND(F2>E2,E2>=200),"Scale candidate","Other")` to flag the first campaign.',
        detailHe:
          'התא H4 ריק. משתמשים ב-`=IF(AND(F2>E2,E2>=200),"Scale candidate","Other")` כדי לסמן את הקמפיין הראשון.',
      };
    }
    if (!formulaContainsAll(formula, ["IF(", "AND("])) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. The condition needs both a profitability check and a spend-threshold check: wrap them in AND inside an IF.`,
        detailHe: `התא H4 מכיל \`${formula}\`. התנאי צריך גם בדיקת רווחיות וגם בדיקת סף spend: עוטפים אותם ב-AND בתוך IF.`,
      };
    }
    const value = await sheet.cellValue("H4");
    if (value !== "Scale candidate") {
      return {
        passed: false,
        detail: `H4 evaluates to \`${value}\` but should be \`Scale candidate\` (first campaign: revenue 487.30 > spend 342.18 AND spend 342.18 >= 200, so both AND conditions hold).`,
        detailHe: `התא H4 מתוצא ל-\`${value}\` אבל צריך להיות \`Scale candidate\` (קמפיין ראשון: revenue 487.30 > spend 342.18 וגם spend 342.18 >= 200, אז שני תנאי ה-AND מתקיימים).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-05-conditional-logic",
  lessonSlug: "formulas/05-conditional-logic",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [ifsRoiBucket, switchPlatformCategory, ifAndScaleCandidate],
};
