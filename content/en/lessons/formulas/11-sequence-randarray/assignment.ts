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

const verticalSequence: Rule = {
  id: "h1-vertical-sequence",
  label: "H1 generates 1-12 down column H with SEQUENCE",
  labelHe: "התא H1 מייצר 1-12 לאורך עמודה H בעזרת SEQUENCE",
  answer: "=SEQUENCE(12)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail: "H1 is empty. Use `=SEQUENCE(12)` to generate the numbers 1-12 down column H.",
        detailHe: "התא H1 ריק. משתמשים ב-`=SEQUENCE(12)` כדי לייצר את המספרים 1-12 לאורך עמודה H.",
      };
    }
    if (!formulaContains(formula, "SEQUENCE")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the \`SEQUENCE\` function: \`=SEQUENCE(12)\`.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים בפונקציית \`SEQUENCE\`: \`=SEQUENCE(12)\`.`,
      };
    }
    const values = await sheet.rangeValues("H1:H12");
    for (let i = 0; i < 12; i++) {
      if (values[i]?.[0] !== i + 1) {
        return {
          passed: false,
          detail: `H${i + 1} should be \`${i + 1}\` but is \`${values[i]?.[0] ?? "empty"}\`. SEQUENCE(12) spills 1, 2, 3, ..., 12 down the column.`,
          detailHe: `התא H${i + 1} צריך להיות \`${i + 1}\` אבל הוא \`${values[i]?.[0] ?? "ריק"}\`. SEQUENCE(12) פורש 1, 2, 3, ..., 12 לאורך העמודה.`,
        };
      }
    }
    return { passed: true };
  },
};

const horizontalSteppedSequence: Rule = {
  id: "i1-stepped-sequence",
  label: "I1 generates 10, 15, 20, 25, 30 across with SEQUENCE",
  labelHe: "התא I1 מייצר 10, 15, 20, 25, 30 לרוחב בעזרת SEQUENCE",
  answer: "=SEQUENCE(1, 5, 10, 5)",
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "I1 is empty. Use `=SEQUENCE(1, 5, 10, 5)` to generate 10, 15, 20, 25, 30 across columns I through M.",
        detailHe:
          "התא I1 ריק. משתמשים ב-`=SEQUENCE(1, 5, 10, 5)` כדי לייצר 10, 15, 20, 25, 30 לרוחב מעמודה I עד M.",
      };
    }
    if (!formulaContains(formula, "SEQUENCE")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use \`SEQUENCE\` with four arguments: rows, columns, start, step.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים ב-\`SEQUENCE\` עם ארבעה ארגומנטים: שורות, עמודות, התחלה, צעד.`,
      };
    }
    const expected = [10, 15, 20, 25, 30];
    const values = await sheet.rangeValues("I1:M1");
    for (let i = 0; i < 5; i++) {
      if (values[0]?.[i] !== expected[i]) {
        return {
          passed: false,
          detail: `Cell ${String.fromCharCode(73 + i)}1 should be \`${expected[i]}\` but is \`${values[0]?.[i] ?? "empty"}\`. SEQUENCE(1, 5, 10, 5) gives 1 row, 5 columns, starting at 10, stepping by 5.`,
          detailHe: `התא ${String.fromCharCode(73 + i)}1 צריך להיות \`${expected[i]}\` אבל הוא \`${values[0]?.[i] ?? "ריק"}\`. SEQUENCE(1, 5, 10, 5) נותן שורה אחת, 5 עמודות, מתחיל ב-10, צעד של 5.`,
        };
      }
    }
    return { passed: true };
  },
};

const monthEndDates: Rule = {
  id: "n1-month-ends",
  label: "N1 generates 12 month-end dates for 2026 via SEQUENCE + EOMONTH",
  labelHe: "התא N1 מייצר 12 תאריכי סוף-חודש לשנת 2026 בעזרת SEQUENCE + EOMONTH",
  answer: "=ARRAYFORMULA(EOMONTH(DATE(2026,1,1), SEQUENCE(12)-1))",
  async run(sheet) {
    const formula = await sheet.cellFormula("N1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "N1 is empty. Use `=ARRAYFORMULA(EOMONTH(DATE(2026,1,1), SEQUENCE(12)-1))` to generate 12 month-end dates for 2026.",
        detailHe:
          "התא N1 ריק. משתמשים ב-`=ARRAYFORMULA(EOMONTH(DATE(2026,1,1), SEQUENCE(12)-1))` כדי לייצר 12 תאריכי סוף-חודש ל-2026.",
      };
    }
    if (!formulaContains(formula, "EOMONTH") || !formulaContains(formula, "SEQUENCE")) {
      return {
        passed: false,
        detail: `N1 contains \`${formula}\`. Combine \`EOMONTH\` with \`SEQUENCE\` to get all 12 month-ends in one formula.`,
        detailHe: `התא N1 מכיל \`${formula}\`. משלבים \`EOMONTH\` עם \`SEQUENCE\` כדי לקבל את כל 12 סופי החודש בנוסחה אחת.`,
      };
    }
    const expected = [46053, 46081, 46112, 46142, 46173, 46203, 46234, 46265, 46295, 46326, 46356, 46387];
    const values = await sheet.rangeValues("N1:N12");
    for (let i = 0; i < 12; i++) {
      if (values[i]?.[0] !== expected[i]) {
        return {
          passed: false,
          detail: `N${i + 1} should be \`${expected[i]}\` (the date serial for the end of month ${i + 1} in 2026) but is \`${values[i]?.[0] ?? "empty"}\`.`,
          detailHe: `התא N${i + 1} צריך להיות \`${expected[i]}\` (ה-date serial של סוף החודש ה-${i + 1} ב-2026) אבל הוא \`${values[i]?.[0] ?? "ריק"}\`.`,
        };
      }
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-11-sequence-randarray",
  lessonSlug: "formulas/11-sequence-randarray",
  templateSheetId: null,
  seed: {
    tabTitle: "Sequences",
    cells: [
      { a1: "A1", value: "Task" },
      { a1: "A2", value: "Generate 1-12 in H1:H12" },
      { a1: "A3", value: "Generate 10,15,20,25,30 in I1:M1" },
      { a1: "A4", value: "Generate 12 month-end dates in N1:N12 (Jan 31, Feb 28, ..., Dec 31)" },
    ],
  },
  rules: [verticalSequence, horizontalSteppedSequence, monthEndDates],
};
