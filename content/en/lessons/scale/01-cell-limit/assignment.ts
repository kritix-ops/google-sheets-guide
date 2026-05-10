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

// CAMPAIGNS_LARGE = 60 data rows + 1 header row, 7 columns each. The lesson's
// "useful payload" is the 60 x 7 = 420 filled cells. The visible grid that
// Sheets allocates for the tab is A1:Z1000 = 26 * 1000 = 26,000 cells. The
// waste = 26000 - 420 = 25,580. The grader recomputes from the dataset so the
// numbers stay correct if CAMPAIGNS_LARGE shifts later.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const FILLED_CELLS = ROWS.length * 7;
const ALLOCATED_COLS = 26;
const ALLOCATED_ROWS = 1000;
const ALLOCATED_CELLS = ALLOCATED_COLS * ALLOCATED_ROWS;
const WASTED_CELLS = ALLOCATED_CELLS - FILLED_CELLS;

const filledCellsRule: Rule = {
  id: "j1-counts-filled-cells",
  label: "J1 counts the filled data cells with COUNTA",
  labelHe: "התא J1 סופר את התאים המלאים עם COUNTA",
  answer: "=COUNTA(A2:G61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Use `=COUNTA(A2:G61)` to count the actual filled cells in the campaign log. This is your useful payload.",
        detailHe:
          "התא J1 ריק. משתמשים ב-`=COUNTA(A2:G61)` כדי לספור את התאים המלאים בלוג הקמפיינים. זה ה-payload השימושי.",
      };
    }
    if (!formulaContains(formula, "COUNTA")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use \`COUNTA\` so empty cells inside the rectangle (if any) don't get counted as data.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים ב-\`COUNTA\` כדי שתאים ריקים בתוך המלבן (אם יש) לא ייספרו כנתונים.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (value !== FILLED_CELLS) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be \`${FILLED_CELLS}\` (60 data rows times 7 columns). Check your COUNTA range covers \`A2:G61\`.`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות \`${FILLED_CELLS}\` (60 שורות נתונים כפול 7 עמודות). יש לוודא שטווח ה-COUNTA מכסה את \`A2:G61\`.`,
      };
    }
    return { passed: true };
  },
};

const allocatedCellsRule: Rule = {
  id: "j2-computes-allocated-cells",
  label: "J2 computes the allocated grid cells (A:Z over rows 1..1000)",
  labelHe: "התא J2 מחשב את התאים שהוקצו ברשת (A:Z על שורות 1..1000)",
  answer: "=COLUMNS(A:Z)*ROWS(A1:A1000)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J2 is empty. Use `=COLUMNS(A:Z)*ROWS(A1:A1000)` to compute the grid Sheets has allocated for this tab. Every one of those cells counts against the 10M workbook limit, even the empty ones.",
        detailHe:
          "התא J2 ריק. משתמשים ב-`=COLUMNS(A:Z)*ROWS(A1:A1000)` כדי לחשב את הרשת ש-Sheets הקצה לגיליון. כל אחד מהתאים נספר מול תקרת 10M ב-spreadsheet, גם אלה הריקים.",
      };
    }
    const normalized = normalizeFormula(formula);
    const usesColumnsRows =
      normalized != null &&
      (normalized.includes("COLUMNS") || normalized.includes("ROWS"));
    if (!usesColumnsRows) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Build the count from \`COLUMNS\` and \`ROWS\` (or a literal product like \`=26*1000\`) so it's obvious where the number came from.`,
        detailHe: `התא J2 מכיל \`${formula}\`. בונים את הסכום מ-\`COLUMNS\` ומ-\`ROWS\` (או מכפלה מפורשת כמו \`=26*1000\`) כדי שיהיה ברור מאיפה המספר.`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (value !== ALLOCATED_CELLS) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\` but should be \`${ALLOCATED_CELLS}\` (26 columns times 1000 rows). The tab is allocated as A1:Z1000, not just where your data ends.`,
        detailHe: `התא J2 מתוצא ל-\`${value}\` אבל צריך להיות \`${ALLOCATED_CELLS}\` (26 עמודות כפול 1000 שורות). הגיליון הוקצה כ-A1:Z1000, לא רק היכן שהנתונים נגמרים.`,
      };
    }
    return { passed: true };
  },
};

const wastedCellsRule: Rule = {
  id: "j3-computes-waste",
  label: "J3 computes wasted cells by referencing J1 and J2",
  labelHe: "התא J3 מחשב תאים מבוזבזים על ידי הפנייה ל-J1 ול-J2",
  answer: "=J2-J1",
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J3 is empty. Use `=J2-J1` to compute the waste. Reusing the cells above (instead of recomputing COUNTA and ROWS*COLUMNS) means the audit stays self-consistent.",
        detailHe:
          "התא J3 ריק. משתמשים ב-`=J2-J1` כדי לחשב את הבזבוז. שימוש חוזר בתאים שלמעלה (במקום לחשב שוב COUNTA ו-ROWS*COLUMNS) משאיר את הביקורת עקבית בפני עצמה.",
      };
    }
    if (!formulaContains(formula, "J1") || !formulaContains(formula, "J2")) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Reference \`J1\` and \`J2\` directly. Recomputing the counts here defeats the point of the summary block.`,
        detailHe: `התא J3 מכיל \`${formula}\`. מפנים ל-\`J1\` ול-\`J2\` ישירות. חישוב מחדש של הסכומים פה מפספס את הרעיון של בלוק הסיכום.`,
      };
    }
    const value = await sheet.cellValue("J3");
    if (value !== WASTED_CELLS) {
      return {
        passed: false,
        detail: `J3 evaluates to \`${value}\` but should be \`${WASTED_CELLS}\` (allocated minus filled).`,
        detailHe: `התא J3 מתוצא ל-\`${value}\` אבל צריך להיות \`${WASTED_CELLS}\` (הוקצה פחות מלא).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-01-cell-limit",
  lessonSlug: "scale/01-cell-limit",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Summary block labels in column I, separated from the raw log by an
      // empty H column. The learner fills column J.
      { a1: "I1", value: "Filled cells" },
      { a1: "I2", value: "Allocated cells (A:Z, 1:1000)" },
      { a1: "I3", value: "Wasted cells" },
    ],
  },
  rules: [filledCellsRule, allocatedCellsRule, wastedCellsRule],
};
