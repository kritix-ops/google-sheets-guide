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

const basicSparkline: Rule = {
  id: "i2-sparkline-basic",
  label: "I2 draws a basic line sparkline of Yoav's 7-day revenue",
  labelHe: "התא I2 מצייר sparkline בסיסי של revenue ל-7 ימים של Yoav",
  answer: "=SPARKLINE(B2:H2)",
  async run(sheet) {
    const formula = await sheet.cellFormula("I2");
    if (formula == null) {
      return {
        passed: false,
        detail: "I2 is empty. Use `=SPARKLINE(B2:H2)` to draw a default line sparkline.",
        detailHe: "התא I2 ריק. משתמשים ב-`=SPARKLINE(B2:H2)` כדי לצייר sparkline ברירת מחדל מסוג line.",
      };
    }
    if (!formulaContains(formula, "SPARKLINE")) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. Use the \`SPARKLINE\` function with B2:H2 as the data.`,
        detailHe: `התא I2 מכיל \`${formula}\`. משתמשים בפונקציית \`SPARKLINE\` עם B2:H2 כנתונים.`,
      };
    }
    if (!formulaContains(formula, "B2:H2")) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. Pass the 7-day revenue range B2:H2 as the data argument.`,
        detailHe: `התא I2 מכיל \`${formula}\`. מעבירים את טווח ה-revenue של 7 ימים B2:H2 כארגומנט הנתונים.`,
      };
    }
    return { passed: true };
  },
};

const styledSparkline: Rule = {
  id: "i3-sparkline-styled",
  label: "I3 draws a styled line sparkline with color and linewidth options",
  labelHe: "התא I3 מצייר sparkline מסוג line מעוצב עם אפשרויות color ו-linewidth",
  answer:
    '=SPARKLINE(B3:H3, {"charttype","line";"color","#4285F4";"linewidth",2})',
  async run(sheet) {
    const formula = await sheet.cellFormula("I3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I3 is empty. Use `=SPARKLINE(B3:H3, {"charttype","line";"color","#4285F4";"linewidth",2})` to draw Dina\'s trend with custom styling.',
        detailHe:
          'התא I3 ריק. משתמשים ב-`=SPARKLINE(B3:H3, {"charttype","line";"color","#4285F4";"linewidth",2})` כדי לצייר את הטרנד של Dina עם עיצוב מותאם.',
      };
    }
    if (!formulaContains(formula, "SPARKLINE")) {
      return {
        passed: false,
        detail: `I3 contains \`${formula}\`. Use the \`SPARKLINE\` function.`,
        detailHe: `התא I3 מכיל \`${formula}\`. משתמשים בפונקציית \`SPARKLINE\`.`,
      };
    }
    if (!formulaContains(formula, "B3:H3")) {
      return {
        passed: false,
        detail: `I3 contains \`${formula}\`. Pass Dina's 7-day revenue range B3:H3 as the data argument.`,
        detailHe: `התא I3 מכיל \`${formula}\`. מעבירים את טווח ה-revenue של 7 ימים של Dina ב-B3:H3 כארגומנט הנתונים.`,
      };
    }
    if (!formulaContains(formula, '"COLOR"')) {
      return {
        passed: false,
        detail: `I3 contains \`${formula}\`. Include a \`"color"\` option in the options object so the line is styled.`,
        detailHe: `התא I3 מכיל \`${formula}\`. כוללים אפשרות \`"color"\` באובייקט האפשרויות כדי שהקו יעוצב.`,
      };
    }
    return { passed: true };
  },
};

const winlossSparkline: Rule = {
  id: "i4-sparkline-winloss",
  label: "I4 draws a winloss sparkline of Maya's daily revenue vs target",
  labelHe: "התא I4 מצייר sparkline מסוג winloss של revenue יומי של Maya מול יעד",
  answer:
    '=SPARKLINE(B4:H4 - 500, {"charttype","winloss";"color1","green";"negcolor","red"})',
  async run(sheet) {
    const formula = await sheet.cellFormula("I4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I4 is empty. Use `=SPARKLINE(B4:H4 - 500, {"charttype","winloss";"color1","green";"negcolor","red"})` to show days above/below a $500 target.',
        detailHe:
          'התא I4 ריק. משתמשים ב-`=SPARKLINE(B4:H4 - 500, {"charttype","winloss";"color1","green";"negcolor","red"})` כדי להציג ימים מעל/מתחת ליעד של 500 דולר.',
      };
    }
    if (!formulaContains(formula, "SPARKLINE")) {
      return {
        passed: false,
        detail: `I4 contains \`${formula}\`. Use the \`SPARKLINE\` function.`,
        detailHe: `התא I4 מכיל \`${formula}\`. משתמשים בפונקציית \`SPARKLINE\`.`,
      };
    }
    if (!formulaContains(formula, '"WINLOSS"')) {
      return {
        passed: false,
        detail: `I4 contains \`${formula}\`. Set \`"charttype","winloss"\` in the options so days above/below the target render as a win/loss strip.`,
        detailHe: `התא I4 מכיל \`${formula}\`. מגדירים \`"charttype","winloss"\` באפשרויות כדי שימים מעל/מתחת ליעד יוצגו כסטריפ של win/loss.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-26-sparkline",
  lessonSlug: "formulas/26-sparkline",
  templateSheetId: null,
  seed: {
    tabTitle: "Sparklines",
    cells: [
      { a1: "A1", value: "Buyer" },
      { a1: "B1", value: "Mon" },
      { a1: "C1", value: "Tue" },
      { a1: "D1", value: "Wed" },
      { a1: "E1", value: "Thu" },
      { a1: "F1", value: "Fri" },
      { a1: "G1", value: "Sat" },
      { a1: "H1", value: "Sun" },
      { a1: "I1", value: "Trend" },
      // Yoav: rising trend
      { a1: "A2", value: "Yoav Cohen" },
      { a1: "B2", value: 412 },
      { a1: "C2", value: 387 },
      { a1: "D2", value: 450 },
      { a1: "E2", value: 522 },
      { a1: "F2", value: 489 },
      { a1: "G2", value: 540 },
      { a1: "H2", value: 510 },
      // Dina: flat trend
      { a1: "A3", value: "Dina Dayan" },
      { a1: "B3", value: 380 },
      { a1: "C3", value: 395 },
      { a1: "D3", value: 372 },
      { a1: "E3", value: 388 },
      { a1: "F3", value: 401 },
      { a1: "G3", value: 384 },
      { a1: "H3", value: 391 },
      // Maya: spiky, mostly above 500
      { a1: "A4", value: "Maya Bar" },
      { a1: "B4", value: 520 },
      { a1: "C4", value: 485 },
      { a1: "D4", value: 612 },
      { a1: "E4", value: 470 },
      { a1: "F4", value: 580 },
      { a1: "G4", value: 540 },
      { a1: "H4", value: 495 },
    ],
  },
  rules: [basicSparkline, styledSparkline, winlossSparkline],
};
