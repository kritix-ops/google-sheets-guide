import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
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

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

// CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. The clinic seeds five broken cells in column J; the
// grader recomputes the expected values from the dataset so the rules stay
// correct if rows shift later.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const UNIQUE_BUYERS = new Set(ROWS.map((r) => r[1])).size;

// Volatile function names the team avoids on dashboard cells. INDIRECT and
// OFFSET aren't volatile on every spreadsheet engine but Google treats them
// as volatile recalc triggers, which is what the lesson body covers.
const VOLATILE_FUNCTIONS = ["TODAY", "NOW", "RAND", "OFFSET", "INDIRECT"];

const boundedSum: Rule = {
  id: "j1-bounded-sum",
  label: "J1 totals Spend with a bounded `F2:F61` range, not full-column `F:F`",
  labelHe: "התא J1 מסכם Spend עם טווח חסום `F2:F61`, לא עם עמודה מלאה `F:F`",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. The seeded formula `=SUM(F:F)` was slow; replace it with the bounded `=SUM(F2:F61)`. A full-column SUM forces Sheets to walk a million empty cells on every recalc.",
        detailHe:
          "התא J1 ריק. הנוסחה השתולה `=SUM(F:F)` הייתה איטית; מחליפים אותה ב-`=SUM(F2:F61)` החסום. SUM של עמודה מלאה מאלץ את Sheets לעבור על מיליון תאים ריקים בכל recalc.",
      };
    }
    if (formulaContains(formula, "F:F")) {
      return {
        passed: false,
        detail: `J1 still contains \`${formula}\`. The full-column \`F:F\` is exactly the bug. Replace it with the bounded \`F2:F61\` so SUM only walks the 60 data rows.`,
        detailHe: `J1 עדיין מכיל \`${formula}\`. עמודה מלאה \`F:F\` היא בדיוק הבאג. מחליפים אותה ב-\`F2:F61\` החסום כדי ש-SUM יעבור רק על 60 שורות הנתונים.`,
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use the \`SUM\` function on the bounded Spend range \`F2:F61\`.`,
        detailHe: `J1 מכיל \`${formula}\`. משתמשים בפונקציית \`SUM\` על טווח ה-Spend החסום \`F2:F61\`.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (!approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (sum of F2:F61). The bound is right but the column or range is off.`,
        detailHe: `J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סכום F2:F61). החסימה נכונה אבל העמודה או הטווח לא.`,
      };
    }
    return { passed: true };
  },
};

const handlesNA: Rule = {
  id: "j2-handles-na",
  label: "J2 wraps the VLOOKUP in `IFNA` (or `IFERROR`) so #N/A doesn't leak",
  labelHe: "התא J2 עוטף את ה-VLOOKUP ב-`IFNA` (או ב-`IFERROR`) כך ש-#N/A לא דולף",
  answer: '=IFNA(VLOOKUP("NonExistentBuyer", B2:G61, 5, FALSE), 0)',
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J2 is empty. The seeded formula was `=VLOOKUP("NonExistentBuyer", B:F, 5, FALSE)` which returns `#N/A`. Wrap it in `IFNA` (or `IFERROR`) with a fallback like `0`: `=IFNA(VLOOKUP("NonExistentBuyer", B2:G61, 5, FALSE), 0)`.',
        detailHe:
          'J2 ריק. הנוסחה השתולה הייתה `=VLOOKUP("NonExistentBuyer", B:F, 5, FALSE)` שמחזירה `#N/A`. עוטפים ב-`IFNA` (או ב-`IFERROR`) עם ערך fallback כמו `0`: `=IFNA(VLOOKUP("NonExistentBuyer", B2:G61, 5, FALSE), 0)`.',
      };
    }
    if (!formulaContains(formula, "VLOOKUP")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Keep the \`VLOOKUP\`; the clinic teaches handling its failure modes, not swapping the function out.`,
        detailHe: `J2 מכיל \`${formula}\`. שומרים על ה-\`VLOOKUP\`; הקליניקה מלמדת איך לטפל במצבי הכשל שלו, לא איך להחליף את ה-function.`,
      };
    }
    const hasIfna = formulaContains(formula, "IFNA");
    const hasIferror = formulaContains(formula, "IFERROR");
    if (!hasIfna && !hasIferror) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. The VLOOKUP is still raw; wrap it: \`=IFNA(VLOOKUP(...), 0)\`. \`IFNA\` catches the #N/A case specifically; \`IFERROR\` catches every error, which is broader and can hide real bugs.`,
        detailHe: `J2 מכיל \`${formula}\`. ה-VLOOKUP עדיין חשוף; עוטפים אותו: \`=IFNA(VLOOKUP(...), 0)\`. \`IFNA\` תופס ספציפית את מקרה ה-#N/A, \`IFERROR\` תופס כל שגיאה, מה שרחב יותר ויכול להסתיר באגים אמיתיים.`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (value === null || value === undefined) {
      return {
        passed: false,
        detail: `J2 evaluates to a blank. The wrapper is there but the fallback value didn't take. Make sure the second argument to IFNA is a literal like \`0\`, not an empty string or another lookup that also fails.`,
        detailHe: `J2 מתוצא לריק. העטיפה שם אבל ערך ה-fallback לא תפס. יש לוודא שהארגומנט השני של IFNA הוא ערך מילולי כמו \`0\`, לא מחרוזת ריקה או lookup נוסף שגם נכשל.`,
      };
    }
    if (typeof value === "string" && value.startsWith("#")) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\`. The error is still leaking. Either the wrapper isn't applied to the outermost expression or the fallback itself is an expression that errors.`,
        detailHe: `J2 מתוצא ל-\`${value}\`. השגיאה עדיין דולפת. או שהעטיפה לא חלה על הביטוי החיצוני ביותר, או שה-fallback עצמו הוא ביטוי שגוי.`,
      };
    }
    return { passed: true };
  },
};

const notVolatile: Rule = {
  id: "j3-not-volatile",
  label:
    "J3 holds a non-volatile value (no TODAY, NOW, RAND, OFFSET, or INDIRECT)",
  labelHe:
    "התא J3 מחזיק ערך לא תנודתי (בלי TODAY, NOW, RAND, OFFSET או INDIRECT)",
  answer: "=A2",
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    const value = await sheet.cellValue("J3");
    if (formula == null && (value == null || value === "")) {
      return {
        passed: false,
        detail:
          "J3 is empty. The seed was `=TODAY()-1`, a volatile formula that recomputed on every edit. Replace it with a hardcoded date (e.g. `2026-05-10`) or a reference to a non-volatile source like `=A2` (the first date in the log).",
        detailHe:
          "J3 ריק. הזרע היה `=TODAY()-1`, נוסחה תנודתית שמחושבת מחדש בכל עריכה. מחליפים אותה בתאריך מקובע (למשל `2026-05-10`) או בהפניה למקור לא-תנודתי כמו `=A2` (התאריך הראשון בלוג).`",
      };
    }
    if (formula != null) {
      for (const fn of VOLATILE_FUNCTIONS) {
        if (formulaContains(formula, fn)) {
          return {
            passed: false,
            detail: `J3 contains \`${formula}\` which still calls the volatile \`${fn}\` function. Volatiles recompute on every edit anywhere in the workbook; on a busy dashboard that's recalc lag with no upside. Hardcode the date or reference a stable cell like \`=A2\`.`,
            detailHe: `J3 מכיל \`${formula}\` שעדיין קורא ל-\`${fn}\` התנודתי. תנודתיות מחושבת מחדש בכל עריכה בכל מקום ב-spreadsheet, ב-dashboard עמוס זה recalc lag בלי שום תועלת. מקבעים את התאריך או מפנים לתא יציב כמו \`=A2\`.`,
          };
        }
      }
    }
    return { passed: true };
  },
};

const brokenCycle: Rule = {
  id: "j4-broken-cycle",
  label: "J4 no longer references itself; the circular reference is gone",
  labelHe: "התא J4 לא מפנה לעצמו יותר; ה-circular reference נעלם",
  answer: "0",
  async run(sheet) {
    const formula = await sheet.cellFormula("J4");
    const value = await sheet.cellValue("J4");
    if (formula == null && (value == null || value === "")) {
      return {
        passed: false,
        detail:
          "J4 is empty. The seed was `=J4+1`, which references itself (a circular reference). Replace it with a non-self-referencing expression: a hardcoded `0`, or any formula that doesn't include J4 on the right-hand side.",
        detailHe:
          "J4 ריק. הזרע היה `=J4+1`, שמפנה לעצמו (circular reference). מחליפים בביטוי שלא מפנה לעצמו: `0` מקובע, או כל נוסחה שלא כוללת את J4 בצד ימין.`",
      };
    }
    if (formula != null && /\bJ4\b/i.test(formula)) {
      return {
        passed: false,
        detail: `J4 contains \`${formula}\` which still references \`J4\`. A cell that points at itself never resolves; Sheets either flags the circular reference or shows a stale value. Remove the self-reference: a literal value or a formula pointing at another cell.`,
        detailHe: `J4 מכיל \`${formula}\` שעדיין מפנה ל-\`J4\`. תא שמפנה לעצמו אף פעם לא מתיישב; Sheets או מסמן את ה-circular reference או מציג ערך מיושן. מסירים את ה-self-reference: ערך מילולי או נוסחה שמפנה לתא אחר.`,
      };
    }
    // Even after the cycle is removed, the cell value must be a finite number
    // or a non-error string. #REF! / #NUM! / circular indicators are strings
    // that start with "#" in the value layer.
    if (typeof value === "string" && value.startsWith("#")) {
      return {
        passed: false,
        detail: `J4 evaluates to \`${value}\`. The cycle may have been removed but the cell is still erroring. Check the new formula against the other cells it touches.`,
        detailHe: `J4 מתוצא ל-\`${value}\`. ה-cycle אולי הוסר אבל התא עדיין שגוי. בודקים את הנוסחה החדשה מול שאר התאים שהיא נוגעת בהם.`,
      };
    }
    return { passed: true };
  },
};

const uniqueBuyersRule: Rule = {
  id: "j5-unique-buyers",
  label: "J5 counts unique buyers with `=COUNTA(UNIQUE(B2:B61))`",
  labelHe: "התא J5 סופר media buyers ייחודיים עם `=COUNTA(UNIQUE(B2:B61))`",
  answer: "=COUNTA(UNIQUE(B2:B61))",
  async run(sheet) {
    const formula = await sheet.cellFormula("J5");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J5 is empty. The missing entry the analysis needs is the count of distinct media buyers. Write `=COUNTA(UNIQUE(B2:B61))`. UNIQUE dedupes the buyer column, COUNTA counts what came back.",
        detailHe:
          "J5 ריק. הערך החסר שהניתוח צריך הוא ספירת media buyers ייחודיים. כותבים `=COUNTA(UNIQUE(B2:B61))`. UNIQUE מבטל כפילויות בעמודת ה-media buyers, COUNTA סופר את מה שחזר.",
      };
    }
    if (!formulaContains(formula, "UNIQUE")) {
      return {
        passed: false,
        detail: `J5 contains \`${formula}\`. Use \`UNIQUE\` to dedupe the buyer column. Counting the raw column with \`COUNTA(B2:B61)\` would give 60 (every row), not the distinct buyer count.`,
        detailHe: `J5 מכיל \`${formula}\`. משתמשים ב-\`UNIQUE\` כדי לבטל כפילויות בעמודת ה-media buyers. ספירת העמודה הגולמית עם \`COUNTA(B2:B61)\` הייתה נותנת 60 (כל שורה), לא את ספירת ה-media buyers הייחודיים.`,
      };
    }
    if (!formulaContains(formula, "COUNTA")) {
      return {
        passed: false,
        detail: `J5 contains \`${formula}\`. Wrap the UNIQUE in \`COUNTA\` to get the count, not the deduped list itself.`,
        detailHe: `J5 מכיל \`${formula}\`. עוטפים את ה-UNIQUE ב-\`COUNTA\` כדי לקבל את הספירה, לא את הרשימה ללא הכפילויות עצמה.`,
      };
    }
    const value = await sheet.cellValue("J5");
    if (value !== UNIQUE_BUYERS) {
      return {
        passed: false,
        detail: `J5 evaluates to \`${value}\` but should be \`${UNIQUE_BUYERS}\` (the log has ${UNIQUE_BUYERS} distinct media buyers). Check the UNIQUE range covers \`B2:B61\` exactly.`,
        detailHe: `J5 מתוצא ל-\`${value}\` אבל צריך להיות \`${UNIQUE_BUYERS}\` (ללוג יש ${UNIQUE_BUYERS} media buyers ייחודיים). בודקים שטווח ה-UNIQUE מכסה את \`B2:B61\` בדיוק.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-11-broken-sheet-clinic",
  lessonSlug: "scale/11-broken-sheet-clinic",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Five bugs planted in column J, with column-I labels next to each.
      // J5 is intentionally left empty for the learner to fill: the clinic
      // covers four "fix the broken formula" tasks plus one "write the
      // missing one" task.
      { a1: "I1", value: "Total Spend (fix the slow SUM)" },
      { a1: "J1", value: TOTAL_SPEND, formula: "=SUM(F:F)" },
      { a1: "I2", value: "Buyer lookup (handle #N/A)" },
      {
        a1: "J2",
        value: "#N/A",
        formula: '=VLOOKUP("NonExistentBuyer", B2:G61, 5, FALSE)',
      },
      { a1: "I3", value: "Report date (kill the volatile)" },
      { a1: "J3", value: null, formula: "=TODAY()-1" },
      { a1: "I4", value: "Counter (break the cycle)" },
      { a1: "J4", value: null, formula: "=J4+1" },
      { a1: "I5", value: "Unique buyers (write me)" },
    ],
  },
  rules: [boundedSum, handlesNA, notVolatile, brokenCycle, uniqueBuyersRule],
};
