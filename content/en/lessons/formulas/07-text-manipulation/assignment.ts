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

const stripPrSuffix: Rule = {
  id: "h2-strip-pr",
  label: "H2 strips the ' PR' suffix from the first vertical name",
  labelHe: "התא H2 מסיר את הסיומת ' PR' משם ה-vertical הראשון",
  answer: '=LEFT(C2, LEN(C2)-3)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use `=LEFT(C2, LEN(C2)-3)` (or `=SUBSTITUTE(C2, \" PR\", \"\")`) to strip the trailing ' PR'.",
        detailHe:
          "התא H2 ריק. משתמשים ב-`=LEFT(C2, LEN(C2)-3)` (או ב-`=SUBSTITUTE(C2, \" PR\", \"\")`) כדי להסיר את ' PR' שבסוף.",
      };
    }
    if (!formulaContains(formula, "LEFT") && !formulaContains(formula, "SUBSTITUTE")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use either \`LEFT\` with \`LEN\` or \`SUBSTITUTE\` to remove the trailing " PR".`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים ב-\`LEFT\` עם \`LEN\` או ב-\`SUBSTITUTE\` כדי להסיר את ' PR' שבסוף.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (value !== "Car Deals") {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be \`Car Deals\` (the topic part of "Car Deals PR" with the trailing " PR" removed).`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות \`Car Deals\` (החלק התוכני של "Car Deals PR" אחרי הסרת ' PR' שבסוף).`,
      };
    }
    return { passed: true };
  },
};

const firstWord: Rule = {
  id: "h3-first-word",
  label: "H3 extracts the first word of the first vertical name",
  labelHe: "התא H3 שולף את המילה הראשונה משם ה-vertical הראשון",
  answer: '=LEFT(C2, FIND(" ", C2)-1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H3 is empty. Use `=LEFT(C2, FIND(" ", C2)-1)` to take everything before the first space.',
        detailHe:
          'התא H3 ריק. משתמשים ב-`=LEFT(C2, FIND(" ", C2)-1)` כדי לקחת את כל מה שלפני הרווח הראשון.',
      };
    }
    if (!formulaContains(formula, "FIND") || !formulaContains(formula, "LEFT")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Combine \`LEFT\` and \`FIND\` to take everything to the left of the first space.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משלבים \`LEFT\` עם \`FIND\` כדי לקחת את כל מה שמשמאל לרווח הראשון.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (value !== "Car") {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be \`Car\` (the first word of "Car Deals PR").`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות \`Car\` (המילה הראשונה ב-"Car Deals PR").`,
      };
    }
    return { passed: true };
  },
};

const buyerLength: Rule = {
  id: "h4-buyer-length",
  label: "H4 returns the length of the first buyer name",
  labelHe: "התא H4 מחזיר את האורך של שם ה-media buyer הראשון",
  answer: "=LEN(B2)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail: "H4 is empty. Use `=LEN(B2)` to count characters in the first buyer name.",
        detailHe: "התא H4 ריק. משתמשים ב-`=LEN(B2)` כדי לספור תווים בשם ה-media buyer הראשון.",
      };
    }
    if (!formulaContains(formula, "LEN(")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. Use the \`LEN\` function: \`=LEN(B2)\`.`,
        detailHe: `התא H4 מכיל \`${formula}\`. משתמשים בפונקציית \`LEN\`: \`=LEN(B2)\`.`,
      };
    }
    const value = await sheet.cellValue("H4");
    if (value !== 10) {
      return {
        passed: false,
        detail: `H4 evaluates to \`${value}\` but should be \`10\` (the length of "Yoav Cohen", including the space).`,
        detailHe: `התא H4 מתוצא ל-\`${value}\` אבל צריך להיות \`10\` (האורך של "Yoav Cohen", כולל הרווח).`,
      };
    }
    return { passed: true };
  },
};

const shortenBuyer: Rule = {
  id: "h5-shorten-buyer",
  label: "H5 shortens the first buyer name to 'Yoav C.'",
  labelHe: "התא H5 מקצר את שם ה-media buyer הראשון ל-'Yoav C.'",
  answer: '=SUBSTITUTE(B2, "Cohen", "C.")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H5");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H5 is empty. Use `=SUBSTITUTE(B2, "Cohen", "C.")` to shorten the surname to an initial.',
        detailHe:
          'התא H5 ריק. משתמשים ב-`=SUBSTITUTE(B2, "Cohen", "C.")` כדי לקצר את שם המשפחה לאות אחת.',
      };
    }
    if (!formulaContains(formula, "SUBSTITUTE")) {
      return {
        passed: false,
        detail: `H5 contains \`${formula}\`. Use the \`SUBSTITUTE\` function to swap one substring for another.`,
        detailHe: `התא H5 מכיל \`${formula}\`. משתמשים בפונקציית \`SUBSTITUTE\` כדי להחליף תת-מחרוזת באחרת.`,
      };
    }
    const value = await sheet.cellValue("H5");
    if (value !== "Yoav C.") {
      return {
        passed: false,
        detail: `H5 evaluates to \`${value}\` but should be \`Yoav C.\` ("Yoav Cohen" with "Cohen" replaced by "C.").`,
        detailHe: `התא H5 מתוצא ל-\`${value}\` אבל צריך להיות \`Yoav C.\` ("Yoav Cohen" כש-"Cohen" מוחלף ב-"C.").`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-07-text-manipulation",
  lessonSlug: "formulas/07-text-manipulation",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [stripPrSuffix, firstWord, buyerLength, shortenBuyer],
};
