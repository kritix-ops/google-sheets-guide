import {
  CAMPAIGNS,
  VERTICALS_LOOKUP,
  dataToCells,
} from "@/content/datasets/adtech";
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

const vlookupCategory: Rule = {
  id: "h2-vlookup-category",
  label: "H2 uses VLOOKUP to find the category for the first campaign's vertical",
  labelHe: "התא H2 משתמש ב-VLOOKUP כדי למצוא את ה-category של ה-vertical של הקמפיין הראשון",
  answer: "=VLOOKUP(C2, I2:K11, 2, FALSE)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Use `=VLOOKUP(C2, I2:K11, 2, FALSE)` to look up the first campaign's category from the Verticals table.",
        detailHe:
          "התא H2 ריק. משתמשים ב-`=VLOOKUP(C2, I2:K11, 2, FALSE)` כדי לעשות lookup ל-category של הקמפיין הראשון מטבלת ה-Verticals.",
      };
    }
    if (!formulaContains(formula, "VLOOKUP")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\` but is not a VLOOKUP. Use \`=VLOOKUP(C2, I2:K11, 2, FALSE)\`.`,
        detailHe: `התא H2 מכיל \`${formula}\` אבל זה לא VLOOKUP. משתמשים ב-\`=VLOOKUP(C2, I2:K11, 2, FALSE)\`.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (value !== "Autos & Vehicles") {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be \`Autos & Vehicles\` (the category for Car Deals PR). The third argument is the column number within the lookup range: Category is column 2 of I:K.`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות \`Autos & Vehicles\` (ה-category של Car Deals PR). הארגומנט השלישי הוא מספר העמודה בטווח ה-lookup: ה-Category היא עמודה 2 ב-I:K.`,
      };
    }
    return { passed: true };
  },
};

const indexMatchCategory: Rule = {
  id: "h3-index-match-category",
  label: "H3 uses INDEX/MATCH for the same lookup",
  labelHe: "התא H3 משתמש ב-INDEX/MATCH לאותו lookup",
  answer: "=INDEX(J2:J11, MATCH(C2, I2:I11, 0))",
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H3 is empty. Use `=INDEX(J2:J11, MATCH(C2, I2:I11, 0))` to look up the category with INDEX/MATCH.",
        detailHe:
          "התא H3 ריק. משתמשים ב-`=INDEX(J2:J11, MATCH(C2, I2:I11, 0))` כדי לעשות lookup ל-category באמצעות INDEX/MATCH.",
      };
    }
    if (!formulaContainsAll(formula, ["INDEX", "MATCH"])) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\` but should combine INDEX and MATCH. Use \`=INDEX(J2:J11, MATCH(C2, I2:I11, 0))\`.`,
        detailHe: `התא H3 מכיל \`${formula}\` אבל צריך לשלב INDEX ו-MATCH. משתמשים ב-\`=INDEX(J2:J11, MATCH(C2, I2:I11, 0))\`.`,
      };
    }
    const value = await sheet.cellValue("H3");
    if (value !== "Autos & Vehicles") {
      return {
        passed: false,
        detail: `H3 evaluates to \`${value}\` but should be \`Autos & Vehicles\`. MATCH returns the position of the vertical in I2:I11; INDEX returns the value at that position in J2:J11.`,
        detailHe: `התא H3 מתוצא ל-\`${value}\` אבל צריך להיות \`Autos & Vehicles\`. MATCH מחזיר את המיקום של ה-vertical ב-I2:I11; INDEX מחזיר את הערך באותו מיקום ב-J2:J11.`,
      };
    }
    return { passed: true };
  },
};

const xlookupCategory: Rule = {
  id: "h4-xlookup-category",
  label: "H4 uses XLOOKUP for the same lookup",
  labelHe: "התא H4 משתמש ב-XLOOKUP לאותו lookup",
  answer: "=XLOOKUP(C2, I2:I11, J2:J11)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H4 is empty. Use `=XLOOKUP(C2, I2:I11, J2:J11)` for the same lookup with XLOOKUP.",
        detailHe:
          "התא H4 ריק. משתמשים ב-`=XLOOKUP(C2, I2:I11, J2:J11)` לאותו lookup באמצעות XLOOKUP.",
      };
    }
    if (!formulaContains(formula, "XLOOKUP")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\` but should use XLOOKUP. Try \`=XLOOKUP(C2, I2:I11, J2:J11)\`.`,
        detailHe: `התא H4 מכיל \`${formula}\` אבל צריך להשתמש ב-XLOOKUP. מנסים \`=XLOOKUP(C2, I2:I11, J2:J11)\`.`,
      };
    }
    const value = await sheet.cellValue("H4");
    if (value !== "Autos & Vehicles") {
      return {
        passed: false,
        detail: `H4 evaluates to \`${value}\` but should be \`Autos & Vehicles\`. XLOOKUP takes search key, lookup range, return range: three arguments are enough for an exact match.`,
        detailHe: `התא H4 מתוצא ל-\`${value}\` אבל צריך להיות \`Autos & Vehicles\`. XLOOKUP מקבל search key, טווח lookup, וטווח החזרה: שלושה ארגומנטים מספיקים להתאמה מדויקת.`,
      };
    }
    return { passed: true };
  },
};

const xlookupHighestCpc: Rule = {
  id: "h5-xlookup-highest-cpc",
  label: "H5 uses XLOOKUP right-to-left to find the highest-CPC vertical",
  labelHe: "התא H5 משתמש ב-XLOOKUP מימין-לשמאל כדי למצוא את ה-vertical עם ה-CPC הגבוה ביותר",
  answer: "=XLOOKUP(MAX(K2:K11), K2:K11, I2:I11)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H5");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H5 is empty. Use `=XLOOKUP(MAX(K2:K11), K2:K11, I2:I11)` to find the vertical name for the highest Avg CPC.",
        detailHe:
          "התא H5 ריק. משתמשים ב-`=XLOOKUP(MAX(K2:K11), K2:K11, I2:I11)` כדי למצוא את שם ה-vertical עם ה-Avg CPC הגבוה ביותר.",
      };
    }
    if (!formulaContains(formula, "XLOOKUP")) {
      return {
        passed: false,
        detail: `H5 contains \`${formula}\` but should use XLOOKUP. The point of this exercise is XLOOKUP's right-to-left ability: VLOOKUP can't do it.`,
        detailHe: `התא H5 מכיל \`${formula}\` אבל צריך להשתמש ב-XLOOKUP. הנקודה בתרגיל הזה היא היכולת של XLOOKUP לעבוד מימין-לשמאל: VLOOKUP לא יכול.`,
      };
    }
    const value = await sheet.cellValue("H5");
    if (value !== "Online MBA PR") {
      return {
        passed: false,
        detail: `H5 evaluates to \`${value}\` but should be \`Online MBA PR\` (Avg CPC 2.15, the highest in the table). The lookup range is K2:K11 (CPC); the return range is I2:I11 (vertical name).`,
        detailHe: `התא H5 מתוצא ל-\`${value}\` אבל צריך להיות \`Online MBA PR\` (Avg CPC 2.15, הגבוה ביותר בטבלה). טווח ה-lookup הוא K2:K11 (CPC); טווח ההחזרה הוא I2:I11 (שם ה-vertical).`,
      };
    }
    return { passed: true };
  },
};

function buildSeed() {
  const cells = dataToCells(CAMPAIGNS);
  const verticalsCells = dataToCells(VERTICALS_LOOKUP, 9, 1);
  return [...cells, ...verticalsCells];
}

export const assignment: AssignmentSpec = {
  id: "formulas-04-lookups",
  lessonSlug: "formulas/04-lookups",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: buildSeed(),
  },
  rules: [
    vlookupCategory,
    indexMatchCategory,
    xlookupCategory,
    xlookupHighestCpc,
  ],
};
