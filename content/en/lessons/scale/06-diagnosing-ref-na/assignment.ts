import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 6 grades the learner's fixes to three error-laden cells in the
// summary column on a Campaigns tab seeded with CAMPAIGNS_LARGE.
//   J1 starts as a broken SUM (a deleted column simulated as the literal
//     "#REF!" error value). Fix: SUM the spend column.
//   J2 starts as a VLOOKUP that returns "#N/A" for a missing buyer. Fix:
//     wrap it in IFNA (or IFERROR) with a readable fallback.
//   J3 starts empty. Fix: a defensive XLOOKUP for "Yoav Cohen" with a
//     fallback string baked into the call.

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContains(actual: string | null, needle: string): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return normalized.includes(needle.toUpperCase());
}

function formulaContainsAny(actual: string | null, needles: string[]): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.some((n) => normalized.includes(n.toUpperCase()));
}

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

// Expected totals computed from the dataset so the rules stay correct if
// CAMPAIGNS_LARGE shifts. Columns: A:Date B:Buyer C:Vertical D:Platform
// E:Country F:Spend G:Revenue. 60 data rows + 1 header.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);

// First spend value for buyer "Yoav Cohen" in the log. XLOOKUP returns the
// first match; that's row 1's spend (Yoav Cohen sits at the top of week 1).
const YOAV_FIRST_SPEND = (() => {
  const match = ROWS.find((r) => r[1] === "Yoav Cohen");
  return typeof match?.[5] === "number" ? match[5] : 0;
})();

const fixesRefError: Rule = {
  id: "j1-fixed-ref-error",
  label: "J1 replaces the broken #REF! formula with a working SUM",
  labelHe: "התא J1 מחליף את הנוסחה השבורה ב-`#REF!` ב-SUM שעובד",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. The original formula broke because the column it referenced was deleted; the cell shows `#REF!`. Replace it with `=SUM(F2:F61)` so the audit total comes from a column that still exists.",
        detailHe:
          "התא J1 ריק. הנוסחה המקורית נשברה כי העמודה שאליה היא הפנתה נמחקה, התא מציג `#REF!`. מחליפים ב-`=SUM(F2:F61)` כדי שסך הביקורת יבוא מעמודה שעדיין קיימת.",
      };
    }
    if (formulaContains(formula, "#REF!")) {
      return {
        passed: false,
        detail: `J1 still contains \`${formula}\`. The literal \`#REF!\` token means the formula is pointing at deleted cells. Rebuild the reference: \`=SUM(F2:F61)\`.`,
        detailHe: `התא J1 עדיין מכיל \`${formula}\`. הטוקן המילולי \`#REF!\` אומר שהנוסחה מצביעה על תאים שנמחקו. בונים מחדש את ה-reference: \`=SUM(F2:F61)\`.`,
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The fix is a working \`SUM\` over the Spend column. The point of the lesson is repair, not workaround.`,
        detailHe: `התא J1 מכיל \`${formula}\`. התיקון הוא \`SUM\` שעובד על עמודת ה-Spend. הרעיון של השיעור הוא תיקון, לא עקיפה.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (typeof value === "string" && value.startsWith("#")) {
      return {
        passed: false,
        detail: `J1 still evaluates to \`${value}\`. The formula compiles but the range is wrong. Use \`F2:F61\` (the Spend column over the 60 data rows).`,
        detailHe: `התא J1 עדיין מתוצא ל-\`${value}\`. הנוסחה מתחברת אבל הטווח לא נכון. משתמשים ב-\`F2:F61\` (עמודת ה-Spend על 60 שורות הנתונים).`,
      };
    }
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

const wrapsWithIfna: Rule = {
  id: "j2-wraps-with-ifna",
  label: "J2 wraps the VLOOKUP in IFNA (or IFERROR) with a readable fallback",
  labelHe: "התא J2 עוטף את ה-VLOOKUP ב-IFNA (או ב-IFERROR) עם fallback קריא",
  answer: '=IFNA(VLOOKUP("MissingBuyer", B:C, 2, FALSE), "not found")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J2 is empty. The original VLOOKUP for "MissingBuyer" returns `#N/A` because no such buyer exists in the log. Wrap it: `=IFNA(VLOOKUP("MissingBuyer", B:C, 2, FALSE), "not found")` so the cell reads as text rather than an error.',
        detailHe:
          'התא J2 ריק. ה-VLOOKUP המקורי על "MissingBuyer" מחזיר `#N/A` כי אין media buyer כזה בלוג. עוטפים: `=IFNA(VLOOKUP("MissingBuyer", B:C, 2, FALSE), "not found")` כדי שהתא יציג טקסט במקום שגיאה.',
      };
    }
    if (!formulaContains(formula, "VLOOKUP")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Keep the original \`VLOOKUP\` call but wrap it; the lesson is about handling the #N/A, not replacing the lookup.`,
        detailHe: `התא J2 מכיל \`${formula}\`. שומרים על קריאת ה-\`VLOOKUP\` המקורית ועוטפים אותה, השיעור הוא על טיפול ב-#N/A, לא על החלפת ה-lookup.`,
      };
    }
    if (!formulaContainsAny(formula, ["IFNA", "IFERROR"])) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Wrap the lookup in \`IFNA\` (preferred, catches only #N/A) or \`IFERROR\` (catches every error) with a fallback string. \`IFNA\` is the cleaner choice when the only error you expect is a missing match.`,
        detailHe: `התא J2 מכיל \`${formula}\`. עוטפים את ה-lookup ב-\`IFNA\` (מועדף, תופס רק #N/A) או ב-\`IFERROR\` (תופס כל שגיאה) עם מחרוזת fallback. \`IFNA\` היא הבחירה הנקייה כשהשגיאה היחידה שצפויה היא חוסר התאמה.`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (typeof value !== "string" || value === "#N/A" || value.startsWith("#")) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\`. The wrapped formula should produce the fallback text (something like \`"not found"\`), not an error code. Check the fallback argument inside your \`IFNA\`/\`IFERROR\` call.`,
        detailHe: `התא J2 מתוצא ל-\`${value}\`. הנוסחה העטופה צריכה לייצר את טקסט ה-fallback (משהו כמו \`"not found"\`), לא קוד שגיאה. יש לבדוק את הארגומנט של ה-fallback בקריאה ל-\`IFNA\`/\`IFERROR\`.`,
      };
    }
    return { passed: true };
  },
};

const defensiveXlookup: Rule = {
  id: "j3-defensive-xlookup",
  label: "J3 is a defensive XLOOKUP for Yoav Cohen with an inline fallback",
  labelHe: "התא J3 הוא XLOOKUP מתגונן ל-Yoav Cohen עם fallback בתוך הקריאה",
  answer: '=XLOOKUP("Yoav Cohen", B2:B61, F2:F61, "buyer not in log")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J3 is empty. Use `=XLOOKUP("Yoav Cohen", B2:B61, F2:F61, "buyer not in log")`. The fourth argument is `XLOOKUP`\'s built-in fallback, cleaner than wrapping the call in `IFNA` because the fallback sits next to the search.',
        detailHe:
          'התא J3 ריק. משתמשים ב-`=XLOOKUP("Yoav Cohen", B2:B61, F2:F61, "buyer not in log")`. הארגומנט הרביעי הוא ה-fallback המובנה של `XLOOKUP`, נקי יותר מלעטוף ב-`IFNA` כי ה-fallback יושב צמוד לחיפוש.',
      };
    }
    if (!formulaContains(formula, "XLOOKUP")) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Use \`XLOOKUP\` here, not \`VLOOKUP\` and not \`INDEX/MATCH\`. The point of the lesson is the fourth-argument fallback, which only \`XLOOKUP\` exposes natively.`,
        detailHe: `התא J3 מכיל \`${formula}\`. משתמשים ב-\`XLOOKUP\` פה, לא ב-\`VLOOKUP\` ולא ב-\`INDEX/MATCH\`. הרעיון של השיעור הוא ה-fallback בארגומנט הרביעי, ש-\`XLOOKUP\` חושף אותו באופן מובנה.`,
      };
    }
    // The fourth XLOOKUP argument should be a string literal in quotes. Check
    // the formula contains a quoted string after the third comma area.
    if (!/"[^"]+"/.test(formula)) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. The defensive piece is the fourth argument: a string literal in quotes that the cell shows when the lookup misses. Without it, a missed lookup falls back to \`#N/A\`.`,
        detailHe: `התא J3 מכיל \`${formula}\`. החלק המתגונן הוא הארגומנט הרביעי: מחרוזת בגרשיים שהתא מציג כשה-lookup מפספס. בלעדיו, lookup שמפספס נופל ל-\`#N/A\`.`,
      };
    }
    const value = await sheet.cellValue("J3");
    if (!approxEqual(value, YOAV_FIRST_SPEND, 0.01)) {
      return {
        passed: false,
        detail: `J3 evaluates to \`${value}\` but should be \`${YOAV_FIRST_SPEND}\` (the first matching Spend for Yoav Cohen in the log). Check the search column \`B2:B61\` and the return column \`F2:F61\`.`,
        detailHe: `התא J3 מתוצא ל-\`${value}\` אבל צריך להיות \`${YOAV_FIRST_SPEND}\` (ה-Spend הראשון שתואם ל-Yoav Cohen בלוג). יש לבדוק את עמודת החיפוש \`B2:B61\` ואת עמודת ההחזרה \`F2:F61\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-06-diagnosing-ref-na",
  lessonSlug: "scale/06-diagnosing-ref-na",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Summary labels in column I. The broken cells live in column J: J1 is
      // a literal #REF! (the broken-after-column-delete case); J2 is a
      // VLOOKUP that resolves to #N/A; J3 is empty for the learner to fill.
      { a1: "I1", value: "Total Spend (was broken)" },
      { a1: "I2", value: "Missing-buyer lookup (was #N/A)" },
      { a1: "I3", value: "Defensive XLOOKUP for Yoav Cohen" },
      // J1 starts broken: the formula refers to a column that was deleted, so
      // it evaluates to `#REF!`. The InMemoryReader returns the seeded value
      // as-is; the production provisioner stores the broken formula and the
      // Sheets engine produces the same error string.
      { a1: "J1", value: "#REF!", formula: "=SUM(#REF!:F61)" },
      // J2 starts as a VLOOKUP that produces #N/A. The cell value is the
      // evaluated error string; the formula text is preserved so the learner
      // can see what they need to wrap.
      {
        a1: "J2",
        value: "#N/A",
        formula: '=VLOOKUP("MissingBuyer", B:C, 2, FALSE)',
      },
    ],
  },
  rules: [fixesRefError, wrapsWithIfna, defensiveXlookup],
};
