import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, CellValue } from "@/lib/grading/types";

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContains(actual: string | null, needle: string): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return normalized.includes(needle.toUpperCase());
}

function asString(value: CellValue): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

function countMatches(haystack: string, needles: string[]): number {
  const lower = haystack.toLowerCase();
  let n = 0;
  for (const needle of needles) {
    if (lower.includes(needle.toLowerCase())) n += 1;
  }
  return n;
}

// CAMPAIGNS_LARGE has 60 data rows + 1 header = A1:G61. The summary AI()
// call covers the whole rectangle.
const VISIBLE_DATA_KEYWORDS = [
  "values",
  "formulas",
  "structure",
  "edits",
  "charts",
  "named ranges",
];

const h1AiSummary: Rule = {
  id: "h1-uses-ai-on-data",
  label: "H1 calls AI() over the campaign log to draft a one-sentence summary",
  labelHe: "התא H1 קורא ל-AI() על לוג הקמפיינים לסיכום של משפט אחד",
  answer: '=AI("Summarize the dataset in one sentence", A1:G61)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H1 is empty. Use `=AI("Summarize the dataset in one sentence", A1:G61)` to ask Gemini for a one-line summary of the campaign log. The range tells Gemini exactly which cells to read.',
        detailHe:
          'התא H1 ריק. משתמשים ב-`=AI("Summarize the dataset in one sentence", A1:G61)` כדי לבקש מ-Gemini סיכום של שורה אחת על לוג הקמפיינים. הטווח אומר ל-Gemini בדיוק אילו תאים לקרוא.',
      };
    }
    if (!formulaContains(formula, "AI(")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the \`AI\` function. Plain prose in a cell isn't a call to Gemini, it's just a literal string.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים בפונקציה \`AI\`. טקסט רגיל בתא הוא לא קריאה ל-Gemini, אלא רק string ספרותי.`,
      };
    }
    if (!formulaContains(formula, "A1:G61")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Reference the bounded range \`A1:G61\` so Gemini sees the entire campaign log (and only the campaign log). Open-ended references like \`A:G\` waste context.`,
        detailHe: `התא H1 מכיל \`${formula}\`. מפנים לטווח החסום \`A1:G61\` כדי ש-Gemini יראה את כל לוג הקמפיינים (ורק אותו). references פתוחים כמו \`A:G\` מבזבזים context.`,
      };
    }
    const value = await sheet.cellValue("H1");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          "H1's formula is fine but the cell is empty. AI() returns text. If you see a blank, Gemini may not have run yet, or the formula errored. Wait a few seconds, or check IFERROR-wrap it for production use.",
        detailHe:
          "הנוסחה ב-H1 תקינה אבל התא ריק. AI() מחזיר טקסט. אם רואים ריק, יכול להיות ש-Gemini עדיין לא רץ, או שהנוסחה נכשלה. ממתינים כמה שניות, או עוטפים ב-IFERROR לשימוש production.",
      };
    }
    return { passed: true };
  },
};

const h2VisibleData: Rule = {
  id: "h2-lists-visible-data",
  label: "H2 lists at least three things Gemini sees on the active sheet",
  labelHe: "התא H2 מפרט לפחות שלושה דברים ש-Gemini רואה בגיליון הפעיל",
  answer: '"values, formulas, sheet structure, recent edits, charts, named ranges"',
  async run(sheet) {
    const value = await sheet.cellValue("H2");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'H2 is empty. Write a literal note listing what Gemini can see on the active sheet. Include at least three of: values, formulas, structure, edits, charts, named ranges. For example: `values, formulas, sheet structure, recent edits, charts, named ranges`.',
        detailHe:
          'התא H2 ריק. כותבים תזכורת ספרותית של מה ש-Gemini רואה בגיליון הפעיל. כוללים לפחות שלושה מתוך: values, formulas, structure, edits, charts, named ranges. לדוגמה: `values, formulas, sheet structure, recent edits, charts, named ranges`.',
      };
    }
    const matched = countMatches(str, VISIBLE_DATA_KEYWORDS);
    if (matched < 3) {
      return {
        passed: false,
        detail: `H2 reads \`${str}\` and mentions ${matched} of the things Gemini can see. List at least three. Useful set: values, formulas, sheet structure, recent edits, charts, named ranges.`,
        detailHe: `התא H2 מכיל \`${str}\` ומזכיר ${matched} מהדברים ש-Gemini רואה. יש לפרט לפחות שלושה. סט שימושי: values, formulas, sheet structure, recent edits, charts, named ranges.`,
      };
    }
    return { passed: true };
  },
};

const h3CostNote: Rule = {
  id: "h3-cost-note",
  label: "H3 captures the cost-and-quota context for Gemini calls",
  labelHe: "התא H3 לוכד את ההקשר של עלות ומכסה לקריאות Gemini",
  answer: '"Each AI() call is billed per Workspace plan; promo quotas run through July 15 2026."',
  async run(sheet) {
    const value = await sheet.cellValue("H3");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'H3 is empty. Write a short literal note that mentions both `Workspace` and `plan`. Example: `Each AI() call is billed per Workspace plan; promo quotas through July 15 2026, then per-plan limits.`',
        detailHe:
          'התא H3 ריק. כותבים תזכורת ספרותית קצרה שמזכירה גם `Workspace` וגם `plan`. דוגמה: `Each AI() call is billed per Workspace plan; promo quotas through July 15 2026, then per-plan limits.`',
      };
    }
    const lower = str.toLowerCase();
    const hasWorkspace = lower.includes("workspace");
    const hasPlan = lower.includes("plan");
    if (!hasWorkspace || !hasPlan) {
      const missing: string[] = [];
      if (!hasWorkspace) missing.push("Workspace");
      if (!hasPlan) missing.push("plan");
      return {
        passed: false,
        detail: `H3 reads \`${str}\` and is missing: ${missing.join(", ")}. The cost note has to anchor on the two facts that matter operationally: it's billed per Workspace plan, not free.`,
        detailHe: `התא H3 מכיל \`${str}\` וחסר: ${missing.join(", ")}. תזכורת העלות צריכה להתבסס על שתי העובדות שחשובות בשטח: מחויב לפי Workspace plan, לא בחינם.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "ai-01-how-gemini-sees-sheets",
  lessonSlug: "ai-in-sheets/01-how-gemini-sees-sheets",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Right-side scratchpad labels in column I so the learner knows what each
      // H cell is for. Column H is where the answers go.
      { a1: "I1", value: "AI summary of the data" },
      { a1: "I2", value: "What Gemini can see" },
      { a1: "I3", value: "Cost / quota note" },
    ],
  },
  rules: [h1AiSummary, h2VisibleData, h3CostNote],
};
