import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 7 grades the learner's fixes to three circular-reference cells in
// the summary column on a Campaigns tab seeded with CAMPAIGNS_LARGE.
//   J1 starts as `=SUM(F2:F61)+J1` (the classic self-referencing total).
//   J2 starts as `=J3+1` and J3 starts as `=J2-1` (two-cell cycle).
//   The learner breaks the cycle by hardcoding J3 to a scalar and pointing
//   J2 at the now-stable J3.

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContains(actual: string | null, needle: string): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return normalized.includes(needle.toUpperCase());
}

function formulaIncludesCell(
  actual: string | null,
  cellRef: string,
): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  // Match the cell as a token, not as a substring of a larger ref. `\b` is
  // safe here because cell refs are letters-then-digits and the surrounding
  // characters are operators, commas, parens, or string boundaries.
  const pattern = new RegExp(`(^|[^A-Z0-9])${cellRef.toUpperCase()}(?![0-9A-Z])`, "i");
  return pattern.test(normalized);
}

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);

const noSelfReference: Rule = {
  id: "j1-no-self-reference",
  label: "J1 sums the Spend column without referencing itself",
  labelHe: "התא J1 מסכם את עמודת ה-Spend בלי להפנות לעצמו",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Replace the broken self-referencing formula with `=SUM(F2:F61)`. The cycle in the original came from including `J1` itself inside the SUM range, which Sheets refused to evaluate.",
        detailHe:
          "התא J1 ריק. מחליפים את הנוסחה השבורה שמפנה לעצמה ב-`=SUM(F2:F61)`. ה-cycle בנוסחה המקורית בא מהכללה של `J1` עצמו בתוך טווח ה-SUM, ש-Sheets סירב לחשב.",
      };
    }
    if (formulaIncludesCell(formula, "J1")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The fix is to remove \`J1\` from its own formula. A cell cannot be part of the range it sums; the engine flags that as a circular dependency and refuses to compute.`,
        detailHe: `התא J1 מכיל \`${formula}\`. התיקון הוא להוציא את \`J1\` מהנוסחה של עצמו. תא לא יכול להיות חלק מהטווח שהוא מסכם, המנוע מסמן את זה כתלות מעגלית ומסרב לחשב.`,
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use \`SUM\` on the Spend column. The goal was always the total; the cycle was incidental damage.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים ב-\`SUM\` על עמודת ה-Spend. המטרה תמיד הייתה הסכום, ה-cycle היה נזק לא קשור.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (!approxEqual(value, TOTAL_SPEND, 0.5)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (sum of all 60 spends). Check the range covers \`F2:F61\`.`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סך 60 ערכי ה-spend). יש לוודא שהטווח מכסה \`F2:F61\`.`,
      };
    }
    return { passed: true };
  },
};

const brokenCycle: Rule = {
  id: "j2-broken-cycle",
  label: "J2 references J3 with no return edge back to J2",
  labelHe: "התא J2 מפנה ל-J3 בלי קצה חוזר ל-J2",
  answer: "=J3+1",
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J2 is empty. Use `=J3+1` so J2 depends on J3 but nothing flows back. The original cycle came from J2 pointing at J3 and J3 pointing back at J2; breaking the loop means one of them stops being a formula.",
        detailHe:
          "התא J2 ריק. משתמשים ב-`=J3+1` כך ש-J2 תלוי ב-J3 ושום דבר לא חוזר. ה-cycle המקורי נבע מ-J2 שמצביע על J3 ומ-J3 שמצביע חזרה על J2, שבירת הלולאה אומרת שאחד מהם מפסיק להיות נוסחה.",
      };
    }
    if (!formulaIncludesCell(formula, "J3")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. The fix should still reference \`J3\` (otherwise the lesson's structure is lost). Reference \`J3\` directly and let it hold a concrete value.`,
        detailHe: `התא J2 מכיל \`${formula}\`. התיקון אמור עדיין להפנות ל-\`J3\` (אחרת המבנה של השיעור הולך לאיבוד). מפנים ישירות ל-\`J3\` ונותנים לו להחזיק ערך קונקרטי.`,
      };
    }
    const j2Value = await sheet.cellValue("J2");
    const j3Value = await sheet.cellValue("J3");
    if (typeof j3Value !== "number") {
      return {
        passed: false,
        detail: `J2 references J3, but J3 evaluates to \`${j3Value}\` (not a number). Make J3 a concrete numeric value before J2 can resolve cleanly.`,
        detailHe: `התא J2 מפנה ל-J3, אבל J3 מתוצא ל-\`${j3Value}\` (לא מספר). הופכים את J3 לערך מספרי קונקרטי לפני ש-J2 יכול להיפתר נקי.`,
      };
    }
    if (!approxEqual(j2Value, j3Value + 1, 0.01)) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${j2Value}\` but should be \`${j3Value + 1}\` (one more than J3). The exact arithmetic doesn't matter for the cycle test as long as J2 depends on J3 with no return edge.`,
        detailHe: `התא J2 מתוצא ל-\`${j2Value}\` אבל צריך להיות \`${j3Value + 1}\` (אחד יותר מ-J3). החשבון המדויק לא חשוב לבדיקת ה-cycle כל עוד J2 תלוי ב-J3 בלי קצה חוזר.`,
      };
    }
    return { passed: true };
  },
};

const hardcodedJ3: Rule = {
  id: "j3-hardcoded",
  label: "J3 holds a hardcoded number, not a formula referencing J2",
  labelHe: "התא J3 מחזיק מספר קשיח, לא נוסחה שמפנה ל-J2",
  answer: "100",
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    const value = await sheet.cellValue("J3");
    if (formula != null && formulaIncludesCell(formula, "J2")) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. As long as J3 references \`J2\` while J2 references \`J3\`, the two cells form a cycle and neither evaluates. Replace J3 with a constant (e.g. \`100\`) or with a formula that doesn't include J2.`,
        detailHe: `התא J3 מכיל \`${formula}\`. כל עוד J3 מפנה ל-\`J2\` ו-J2 מפנה ל-\`J3\`, שני התאים מהווים cycle ואף אחד מהם לא מחשב. מחליפים את J3 בקבוע (למשל \`100\`) או בנוסחה שלא כוללת את J2.`,
      };
    }
    if (typeof value !== "number") {
      return {
        passed: false,
        detail: `J3 holds \`${value}\` (a ${typeof value}). The simplest fix is a hardcoded number; that's what breaks the cycle. Any numeric value works (the test below uses 100).`,
        detailHe: `התא J3 מחזיק \`${value}\` (מסוג ${typeof value}). התיקון הפשוט ביותר הוא מספר קשיח, זה מה ששובר את ה-cycle. כל ערך מספרי עובד (הבדיקה למטה משתמשת ב-100).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-07-diagnosing-circular",
  lessonSlug: "scale/07-diagnosing-circular",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Summary labels.
      { a1: "I1", value: "Total Spend (was self-referencing)" },
      { a1: "I2", value: "J2 (was in a J2↔J3 cycle)" },
      { a1: "I3", value: "J3 (was in a J2↔J3 cycle)" },
      // J1: classic self-reference. Sheets surfaces this as a `#REF!` with
      // "Circular dependency detected" in the tooltip.
      {
        a1: "J1",
        value: "#REF!",
        formula: "=SUM(F2:F61)+J1",
      },
      // J2 and J3: two-cell cycle. Each references the other; neither
      // evaluates.
      { a1: "J2", value: "#REF!", formula: "=J3+1" },
      { a1: "J3", value: "#REF!", formula: "=J2-1" },
    ],
  },
  rules: [noSelfReference, brokenCycle, hardcodedJ3],
};
