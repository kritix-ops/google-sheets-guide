import { CAMPAIGNS, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaMatches(actual: string | null, expected: string): boolean {
  return normalizeFormula(actual) === normalizeFormula(expected);
}

const h1Relative: Rule = {
  id: "h1-relative-ref",
  label: "H1 holds a relative reference to E5",
  labelHe: "התא H1 מכיל reference יחסי ל-E5",
  answer: "=E5",
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H1 is empty. Type `=E5` in H1 to reference Eitan's Hearing Aids spend.",
        detailHe:
          "התא H1 ריק. מקלידים `=E5` ב-H1 כ-reference ל-spend של Eitan ב-Hearing Aids.",
      };
    }
    if (!formulaMatches(formula, "=E5")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`, not \`=E5\`. A relative reference has no \`$\` characters.`,
        detailHe: `התא H1 מכיל \`${formula}\`, ולא \`=E5\`. ב-reference יחסי אין סימני \`$\`.`,
      };
    }
    return { passed: true };
  },
};

const h2Absolute: Rule = {
  id: "h2-absolute-ref",
  label: "H2 holds an absolute reference to E5",
  labelHe: "התא H2 מכיל reference מוחלט ל-E5",
  answer: "=$E$5",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Type `=$E$5` in H2 to reference Eitan's spend with both column and row locked.",
        detailHe:
          "התא H2 ריק. מקלידים `=$E$5` ב-H2 כדי לעשות reference ל-spend של Eitan עם נעילה של העמודה ושל השורה.",
      };
    }
    if (!formulaMatches(formula, "=$E$5")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`, not \`=$E$5\`. Both column and row need a \`$\` to make the reference fully absolute.`,
        detailHe: `התא H2 מכיל \`${formula}\`, ולא \`=$E$5\`. גם העמודה וגם השורה צריכות \`$\` כדי שה-reference יהיה מוחלט.`,
      };
    }
    return { passed: true };
  },
};

const h3Mixed: Rule = {
  id: "h3-mixed-ref",
  label: "H3 holds a row-locked mixed reference to E5",
  labelHe: "התא H3 מכיל reference מעורב נעול-שורה ל-E5",
  answer: "=E$5",
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail: "H3 is empty. Type `=E$5` in H3.",
        detailHe: "התא H3 ריק. מקלידים `=E$5` ב-H3.",
      };
    }
    if (!formulaMatches(formula, "=E$5")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`, not \`=E$5\`. Lock just the row (\`E$5\`); the column stays free.`,
        detailHe: `התא H3 מכיל \`${formula}\`, ולא \`=E$5\`. נועלים רק את השורה (\`E$5\`); העמודה נשארת חופשית.`,
      };
    }
    return { passed: true };
  },
};

const spendNamedRange: Rule = {
  id: "spend-named-range",
  label: "A named range called `spend` covers E2:E13",
  labelHe: "Named range בשם `spend` מכסה את E2:E13",
  answer: "Data → Named ranges → name: `spend`, range: `Campaigns!E2:E13`",
  async run(sheet) {
    const named = await sheet.namedRange("spend");
    if (!named) {
      return {
        passed: false,
        detail:
          "No named range called `spend` exists. Open Data → Named ranges, name it `spend`, and select E2:E13 (the Spend column).",
        detailHe:
          "לא קיים named range בשם `spend`. פותחים Data → Named ranges, נותנים שם `spend`, ובוחרים E2:E13 (עמודת ה-Spend).",
      };
    }
    const rows = named.values.length;
    const cols = named.values[0]?.length ?? 0;
    if (rows !== 12 || cols !== 1) {
      return {
        passed: false,
        detail: `\`spend\` covers ${rows} rows × ${cols} columns; it should cover E2:E13 (12 rows × 1 column: the spend for every campaign in the log).`,
        detailHe: `ה-named range \`spend\` מכסה ${rows} שורות × ${cols} עמודות; צריך לכסות את E2:E13 (12 שורות × עמודה אחת: ה-spend של כל קמפיין בלוג).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-01-grid-model",
  lessonSlug: "formulas/01-grid-model",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [h1Relative, h2Absolute, h3Mixed, spendNamedRange],
};
