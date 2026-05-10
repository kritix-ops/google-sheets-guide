import { MESSY_CAMPAIGNS, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 14 grades cleanup formulas the learner writes against a seeded "Raw"
// tab full of intentionally dirty campaign rows. The fixture exhibits the five
// dirt patterns the lesson teaches: leading/trailing whitespace, mixed buyer
// casing, mixed date formats, a numeric-as-text spend, a duplicate row, an
// empty date, and a vertical typo missing the trailing "R". The cleanup
// summary block lives in column I on the same tab so the assignment grades
// against a single tab.

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContainsAll(actual: string | null, needles: string[]): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.every((n) => normalized.includes(n.toUpperCase()));
}

// Compute expectations from the dataset (skip header row).
const ROWS = MESSY_CAMPAIGNS.slice(1);

// I1: COUNTA on column A counts non-empty timestamp cells. The empty-date row
// drops out; the duplicate row stays (a duplicate is still a row).
const TOTAL_NONEMPTY_DATES = ROWS.filter(
  (r) => r[0] !== "" && r[0] != null,
).length;

// I2: distinct buyers after LOWER+TRIM normalization. "  Dina Dayan", "maya
// bar", and "YOAV COHEN" collapse onto their canonical-cased counterparts.
const UNIQUE_BUYERS = new Set(
  ROWS.map((r) => String(r[1] ?? "").trim().toLowerCase()),
).size;

// I3: rows where the vertical exactly matches the typo (missing the "R").
const TYPO_COUNT = ROWS.filter((r) => r[2] === "Senior Living P").length;

// I4: SUM of Spend with VALUE coercion. The numeric-as-text row "187.25"
// must be coerced; everything else is already numeric.
const TOTAL_SPEND = ROWS.reduce((sum, r) => {
  const raw = r[4];
  if (typeof raw === "number") return sum + raw;
  const coerced = Number(raw);
  return Number.isFinite(coerced) ? sum + coerced : sum;
}, 0);

const totalRawCount: Rule = {
  id: "i1-total-raw-count",
  label: "I1 counts non-empty date rows with COUNTA",
  labelHe: "התא I1 סופר שורות עם תאריך לא ריק דרך COUNTA",
  answer: "=COUNTA(A2:A14)",
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "I1 is empty. Use `=COUNTA(A2:A14)` to count non-empty date cells. The row with the missing date should drop out, the duplicate row should still count.",
        detailHe:
          "התא I1 ריק. משתמשים ב-`=COUNTA(A2:A14)` כדי לספור תאי תאריך לא ריקים. השורה עם התאריך החסר אמורה ליפול, השורה הכפולה עדיין נספרת.",
      };
    }
    if (!formulaContainsAll(formula, ["COUNTA"])) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use \`COUNTA\` so empty cells drop out. \`COUNT\` would only count numbers and would miss the date strings.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים ב-\`COUNTA\` כדי שתאים ריקים ייפלו. \`COUNT\` היה סופר רק מספרים ומפספס את ה-strings של התאריך.`,
      };
    }
    const value = await sheet.cellValue("I1");
    if (value !== TOTAL_NONEMPTY_DATES) {
      return {
        passed: false,
        detail: `I1 evaluates to \`${value}\` but should be \`${TOTAL_NONEMPTY_DATES}\`. The range should be \`A2:A14\` (all 13 data rows). The empty-date row drops out; the duplicate row stays.`,
        detailHe: `התא I1 מתוצא ל-\`${value}\` אבל צריך להיות \`${TOTAL_NONEMPTY_DATES}\`. הטווח צריך להיות \`A2:A14\` (כל 13 שורות הנתונים). השורה עם התאריך הריק יוצאת, השורה הכפולה נשארת.`,
      };
    }
    return { passed: true };
  },
};

const uniqueBuyers: Rule = {
  id: "i2-unique-buyers",
  label: "I2 counts unique buyers via LOWER + TRIM + UNIQUE",
  labelHe: "התא I2 סופר media buyers ייחודיים דרך LOWER + TRIM + UNIQUE",
  answer: "=COUNTA(UNIQUE(LOWER(TRIM(B2:B14))))",
  async run(sheet) {
    const formula = await sheet.cellFormula("I2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "I2 is empty. Use `=COUNTA(UNIQUE(LOWER(TRIM(B2:B14))))` to count distinct buyers after normalizing whitespace and case. The raw column has `\"  Dina Dayan\"`, `\"maya bar\"`, and `\"YOAV COHEN\"` that would each count as a separate person without normalization.",
        detailHe:
          "התא I2 ריק. משתמשים ב-`=COUNTA(UNIQUE(LOWER(TRIM(B2:B14))))` כדי לספור media buyers מובחנים אחרי נרמול whitespace ו-case. בעמודה הגולמית יש `\"  Dina Dayan\"`, `\"maya bar\"`, ו-`\"YOAV COHEN\"` שהיו נספרים כאנשים נפרדים בלי נרמול.",
      };
    }
    if (
      !formulaContainsAll(formula, ["UNIQUE", "LOWER"]) &&
      !formulaContainsAll(formula, ["UNIQUE", "UPPER"]) &&
      !formulaContainsAll(formula, ["UNIQUE", "PROPER"])
    ) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. Wrap the buyer column in \`LOWER\` (or \`UPPER\`/\`PROPER\`) before passing to \`UNIQUE\`. Without case normalization, \`YOAV COHEN\` and \`Yoav Cohen\` count as two different buyers.`,
        detailHe: `התא I2 מכיל \`${formula}\`. עוטפים את עמודת ה-buyer ב-\`LOWER\` (או ב-\`UPPER\`/\`PROPER\`) לפני שמעבירים ל-\`UNIQUE\`. בלי נרמול case, \`YOAV COHEN\` ו-\`Yoav Cohen\` נספרים כשני media buyers שונים.`,
      };
    }
    if (!formulaContainsAll(formula, ["TRIM"])) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. Add \`TRIM\` too. The raw column has \`"  Dina Dayan"\` (leading whitespace) which would silently differ from \`"Dina Dayan"\` without it.`,
        detailHe: `התא I2 מכיל \`${formula}\`. מוסיפים גם \`TRIM\`. בעמודה הגולמית יש \`"  Dina Dayan"\` (whitespace בהתחלה) שהיה שונה בשקט מ-\`"Dina Dayan"\` בלי TRIM.`,
      };
    }
    const value = await sheet.cellValue("I2");
    if (value !== UNIQUE_BUYERS) {
      return {
        passed: false,
        detail: `I2 evaluates to \`${value}\` but should be \`${UNIQUE_BUYERS}\`. Make sure the range is \`B2:B14\` (the buyer column, headers excluded).`,
        detailHe: `התא I2 מתוצא ל-\`${value}\` אבל צריך להיות \`${UNIQUE_BUYERS}\`. מוודאים שהטווח הוא \`B2:B14\` (עמודת ה-buyer, ללא כותרות).`,
      };
    }
    return { passed: true };
  },
};

const typoCount: Rule = {
  id: "i3-vertical-typo",
  label: 'I3 counts rows with the "Senior Living P" typo',
  labelHe: 'התא I3 סופר שורות עם הטעות "Senior Living P"',
  answer: '=COUNTIF(C2:C14,"Senior Living P")',
  async run(sheet) {
    const formula = await sheet.cellFormula("I3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I3 is empty. Use `=COUNTIF(C2:C14,"Senior Living P")` to count rows where the vertical name is missing the trailing "R". This is the typo-catcher pattern: a quick sanity check on a column you expect to follow a strict format.',
        detailHe:
          'התא I3 ריק. משתמשים ב-`=COUNTIF(C2:C14,"Senior Living P")` כדי לספור שורות שבהן שם ה-vertical חסר את ה-"R" בסוף. זאת תבנית תופס הטעויות, sanity check מהיר על עמודה שמצופה ממנה לעקוב אחרי פורמט מחמיר.',
      };
    }
    if (!formulaContainsAll(formula, ["COUNTIF"])) {
      return {
        passed: false,
        detail: `I3 contains \`${formula}\`. Use \`COUNTIF\` with criterion \`"Senior Living P"\` (no trailing R) on column C.`,
        detailHe: `התא I3 מכיל \`${formula}\`. משתמשים ב-\`COUNTIF\` עם קריטריון \`"Senior Living P"\` (בלי R בסוף) על עמודה C.`,
      };
    }
    const value = await sheet.cellValue("I3");
    if (value !== TYPO_COUNT) {
      return {
        passed: false,
        detail: `I3 evaluates to \`${value}\` but should be \`${TYPO_COUNT}\`. The criterion must be exactly \`"Senior Living P"\` (no trailing R). The string \`"Senior Living PR"\` would match the correct rows, not the typo.`,
        detailHe: `התא I3 מתוצא ל-\`${value}\` אבל צריך להיות \`${TYPO_COUNT}\`. הקריטריון חייב להיות בדיוק \`"Senior Living P"\` (בלי R בסוף). ה-string \`"Senior Living PR"\` היה תופס את השורות הנכונות, לא את הטעות.`,
      };
    }
    return { passed: true };
  },
};

const totalSpend: Rule = {
  id: "i4-total-spend",
  label: "I4 sums Spend with VALUE coercion for the text-string row",
  labelHe: "התא I4 סוכם Spend עם coercion דרך VALUE לשורה שמאוחסנת כטקסט",
  answer: "=SUMPRODUCT(IFERROR(VALUE(E2:E14),0))",
  async run(sheet) {
    const formula = await sheet.cellFormula("I4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "I4 is empty. Use `=SUMPRODUCT(IFERROR(VALUE(E2:E14),0))` to sum Spend while coercing the one row stored as text. A plain `SUM` would silently skip the text cell and return a smaller total without an error.",
        detailHe:
          "התא I4 ריק. משתמשים ב-`=SUMPRODUCT(IFERROR(VALUE(E2:E14),0))` כדי לסכם Spend תוך coercion על השורה היחידה שמאוחסנת כטקסט. `SUM` רגיל היה מדלג על תא הטקסט בשקט ומחזיר סכום קטן יותר בלי שגיאה.",
      };
    }
    if (!formulaContainsAll(formula, ["VALUE"])) {
      return {
        passed: false,
        detail: `I4 contains \`${formula}\`. Wrap the spend column in \`VALUE\` to coerce text-stored numbers. Without it, \`SUM\` skips the \`"187.25"\` row silently and the total comes out short by that amount.`,
        detailHe: `התא I4 מכיל \`${formula}\`. עוטפים את עמודת ה-spend ב-\`VALUE\` כדי ל-coerce מספרים שמאוחסנים כטקסט. בלי זה, \`SUM\` מדלג בשקט על שורת ה-\`"187.25"\` והסכום יוצא קצר בכמות הזו.`,
      };
    }
    const value = await sheet.cellValue("I4");
    if (typeof value !== "number" || Math.abs(value - TOTAL_SPEND) > 0.001) {
      return {
        passed: false,
        detail: `I4 evaluates to \`${value}\` but should be \`${TOTAL_SPEND}\`. The range should be \`E2:E14\`. \`SUMPRODUCT(IFERROR(VALUE(E2:E14),0))\` is the canonical shape: \`VALUE\` coerces, \`IFERROR\` defaults bad cells to zero, \`SUMPRODUCT\` makes it work over a range.`,
        detailHe: `התא I4 מתוצא ל-\`${value}\` אבל צריך להיות \`${TOTAL_SPEND}\`. הטווח צריך להיות \`E2:E14\`. \`SUMPRODUCT(IFERROR(VALUE(E2:E14),0))\` זאת הצורה הקנונית: \`VALUE\` עושה coerce, \`IFERROR\` נותן ברירת מחדל אפס לתאים רעים, \`SUMPRODUCT\` גורם לזה לעבוד על טווח.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-14-data-cleanup-recipes",
  lessonSlug: "modeling/14-data-cleanup-recipes",
  templateSheetId: null,
  seed: {
    tabTitle: "Raw",
    cells: [
      ...dataToCells(MESSY_CAMPAIGNS),
      // Summary labels in column H, separated from the data block (A:F) by a
      // one-column visual gap. Cleanup formulas land in column I.
      { a1: "H1", value: "Total raw rows" },
      { a1: "H2", value: "Unique buyers (cleaned)" },
      { a1: "H3", value: "Vertical typo count" },
      { a1: "H4", value: "Total spend (coerced)" },
    ],
  },
  rules: [totalRawCount, uniqueBuyers, typoCount, totalSpend],
};
