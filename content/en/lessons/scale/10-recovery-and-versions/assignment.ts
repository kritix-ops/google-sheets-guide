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
// F:Spend G:Revenue. Compute the expected total spend from the dataset
// so the rule stays correct if the rows shift later. The seed plants a
// broken `0` in J1 that the learner has to repair.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);

const restoreTotalSpend: Rule = {
  id: "j1-restored-total-spend",
  label: "J1 restores the correct total Spend with `=SUM(F2:F61)`",
  labelHe: "התא J1 משחזר את ה-Spend הכולל הנכון עם `=SUM(F2:F61)`",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. The seeded value `0` was wrong; replace it with `=SUM(F2:F61)` so the dashboard total matches the raw log again. Restoring from version history would also work, but typing the formula is the cleaner recovery here because only one cell is wrong.",
        detailHe:
          "התא J1 ריק. הערך השתול `0` היה שגוי; מחליפים אותו ב-`=SUM(F2:F61)` כדי שסכום ה-dashboard יתאים שוב ללוג הגולמי. שחזור מהיסטוריית גרסאות גם היה עובד, אבל הקלדת הנוסחה היא ה-recovery הנקי פה כי רק תא אחד שגוי.",
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use \`SUM\` on the Spend column. The broken seed value was a raw \`0\` with no formula behind it. The cell should compute, not just display.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים ב-\`SUM\` על עמודת ה-Spend. ערך הזריעה השבור היה \`0\` גולמי בלי נוסחה מאחוריו. התא צריך לחשב, לא רק להציג.`,
      };
    }
    if (formulaContains(formula, "F:F")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use the bounded range \`F2:F61\` instead of \`F:F\`. The team's convention is bounded ranges on every dashboard cell so recalc time stays low.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים בטווח החסום \`F2:F61\` במקום ב-\`F:F\`. הקונבנציה של הצוות היא טווחים חסומים בכל תא של dashboard כדי שזמן ה-recalc יישאר נמוך.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (!approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (the sum of F2:F61). If the value is still \`0\`, the formula isn't pointing at the Spend column.`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סכום F2:F61). אם הערך עדיין \`0\`, הנוסחה לא מצביעה על עמודת ה-Spend.`,
      };
    }
    return { passed: true };
  },
};

const namingConvention: Rule = {
  id: "j3-naming-convention",
  label: "J3 writes the team's version-naming convention",
  labelHe: "התא J3 כותב את קונבנציית מתן השמות לגרסאות של הצוות",
  answer: "PreMonthEnd-YYYY-MM",
  async run(sheet) {
    const value = await sheet.cellValue("J3");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J3 is empty. Write the team's version-naming convention as a string, e.g. `PreMonthEnd-YYYY-MM` or `pre-month-end-yyyy-mm`. The point is a stable, dated prefix that anyone scanning the version-history list two months from now can recognize.",
        detailHe:
          "התא J3 ריק. כותבים את קונבנציית מתן השמות לגרסאות של הצוות כ-string, למשל `PreMonthEnd-YYYY-MM` או `pre-month-end-yyyy-mm`. הרעיון הוא prefix יציב ומתוארך שכל מי שיסקרור את רשימת היסטוריית הגרסאות בעוד חודשיים יזהה.",
      };
    }
    if (typeof value !== "string") {
      return {
        passed: false,
        detail: `J3 contains \`${value}\` of type \`${typeof value}\`. The cell should hold a string with the naming convention, not a number or a formula result.`,
        detailHe: `התא J3 מכיל \`${value}\` מסוג \`${typeof value}\`. התא צריך להחזיק string עם קונבנציית מתן השמות, לא מספר או תוצאת נוסחה.`,
      };
    }
    const lower = value.toLowerCase();
    const matchesConvention =
      lower.includes("premonthend") || lower.includes("pre-month-end");
    if (!matchesConvention) {
      return {
        passed: false,
        detail: `J3 contains \`${value}\`. The team's convention is a \`PreMonthEnd-...\` (or \`pre-month-end-...\`) prefix followed by a date. The literal substring \`PreMonthEnd\` or \`pre-month-end\` needs to be present so the version list groups under one sortable prefix.`,
        detailHe: `התא J3 מכיל \`${value}\`. הקונבנציה של הצוות היא prefix של \`PreMonthEnd-...\` (או \`pre-month-end-...\`) ואחריו תאריך. תת-המחרוזת המילולית \`PreMonthEnd\` או \`pre-month-end\` חייבת להיות שם כדי שרשימת הגרסאות תתאגד תחת prefix אחד שניתן למיון.`,
      };
    }
    return { passed: true };
  },
};

const recoveryProcess: Rule = {
  id: "j5-recovery-process",
  label:
    "J5 describes the recovery process, naming both `version history` and `restore`",
  labelHe:
    "התא J5 מתאר את תהליך השחזור ומזכיר גם `version history` וגם `restore`",
  answer:
    "Open File > Version history > See version history, pick a named version from before the break, then click Restore this version.",
  async run(sheet) {
    const value = await sheet.cellValue("J5");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J5 is empty. Write a one-line description of the recovery flow. It needs to name two things: the **version history** surface (where the snapshots live) and the **restore** action (how you bring an old state back). Something like: `Open File > Version history, pick the right named version, then click Restore this version`.",
        detailHe:
          "התא J5 ריק. כותבים תיאור של שורה אחת לזרימת ה-recovery. הוא צריך להזכיר שני דברים: את משטח ה-**version history** (איפה ה-snapshots חיים) ואת פעולת ה-**restore** (איך מחזירים מצב ישן). משהו כמו: `Open File > Version history, pick the right named version, then click Restore this version`.",
      };
    }
    if (typeof value !== "string") {
      return {
        passed: false,
        detail: `J5 contains \`${value}\` of type \`${typeof value}\`. The cell should hold a string description of the recovery flow.`,
        detailHe: `התא J5 מכיל \`${value}\` מסוג \`${typeof value}\`. התא צריך להחזיק string שמתאר את זרימת ה-recovery.`,
      };
    }
    const lower = value.toLowerCase();
    const hasHistory = lower.includes("version history");
    const hasRestore = lower.includes("restore");
    if (!hasHistory && !hasRestore) {
      return {
        passed: false,
        detail: `J5 contains \`${value}\`. The description has to name both the **version history** surface and the **restore** action, in plain words. Both are missing.`,
        detailHe: `התא J5 מכיל \`${value}\`. התיאור חייב להזכיר גם את משטח ה-**version history** וגם את פעולת ה-**restore**, במילים פשוטות. שניהם חסרים.`,
      };
    }
    if (!hasHistory) {
      return {
        passed: false,
        detail: `J5 contains \`${value}\`. The text mentions \`restore\` but not \`version history\`. Both belong in the description; the version-history list is where the named snapshots live.`,
        detailHe: `התא J5 מכיל \`${value}\`. הטקסט מזכיר \`restore\` אבל לא \`version history\`. שניהם שייכים לתיאור, רשימת version history היא המקום שבו ה-snapshots עם השמות חיים.`,
      };
    }
    if (!hasRestore) {
      return {
        passed: false,
        detail: `J5 contains \`${value}\`. The text mentions \`version history\` but not \`restore\`. Both belong; the restore action is what actually undoes the break.`,
        detailHe: `התא J5 מכיל \`${value}\`. הטקסט מזכיר \`version history\` אבל לא \`restore\`. שניהם שייכים, פעולת ה-restore היא מה שבאמת מבטלת את השבירה.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-10-recovery-and-versions",
  lessonSlug: "scale/10-recovery-and-versions",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // The "broken" dashboard cell sits in J1 with a flat `0`. The learner
      // restores the SUM formula. The labels in column I match the team's
      // pattern of column-I labels next to column-J summary cells.
      { a1: "I1", value: "Total Spend (restore me)" },
      { a1: "J1", value: 0 },
      { a1: "I3", value: "Version-naming convention" },
      { a1: "I5", value: "Recovery process (one sentence)" },
    ],
  },
  rules: [restoreTotalSpend, namingConvention, recoveryProcess],
};
