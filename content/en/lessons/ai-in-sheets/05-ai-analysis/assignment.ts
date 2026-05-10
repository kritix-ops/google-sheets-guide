import { CAMPAIGNS_TIMESERIES, dataToCells } from "@/content/datasets/adtech";
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

function rawFormulaContainsCi(formula: string | null, needle: string): boolean {
  if (formula == null) return false;
  return formula.toLowerCase().includes(needle.toLowerCase());
}

function asString(value: CellValue): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

// CAMPAIGNS_TIMESERIES = 30 days + 1 header. Daily metrics with a spike on
// 2026-04-15 (launch day) and a low-outlier day on 2026-04-22 (pixel issue).
// Schema: A:Date B:Spend C:Revenue D:Clicks E:Impressions F:Conversions.
// The seed lives on a Daily tab so A1:F31 covers the full block.

const i1AnalysisPrompt: Rule = {
  id: "a1-analysis-prompt",
  label:
    "I1 calls AI() on the daily-spend time series with a spike/outlier prompt",
  labelHe:
    "התא I1 קורא ל-AI() על time series של ה-spend היומי עם prompt על spike או outlier",
  answer:
    '=AI("Identify the date with the highest spend spike and explain why it stands out", A2:F31)',
  async run(sheet) {
    const formula = await sheet.cellFormula("I1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'I1 is empty. Use `=AI("Identify the date with the highest spend spike and explain why it stands out", A2:F31)`. Pointing AI() at the daily data with a specific question (spike/outlier) is the pattern for "AI as a peer reviewer of your analysis".',
        detailHe:
          'התא I1 ריק. משתמשים ב-`=AI("Identify the date with the highest spend spike and explain why it stands out", A2:F31)`. להפנות AI() לנתונים היומיים עם שאלה ספציפית (spike/outlier) היא התבנית של "AI כסוקר עמיתים של הניתוח שלכם".',
      };
    }
    if (!formulaContains(formula, "AI(")) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Use the \`AI\` function. A literal answer typed in isn't the lesson; the lesson is letting AI() flag things you might have missed.`,
        detailHe: `התא I1 מכיל \`${formula}\`. משתמשים בפונקציה \`AI\`. תשובה ספרותית שהוקלדה היא לא השיעור, השיעור הוא לתת ל-AI() לסמן דברים שאולי פספסתם.`,
      };
    }
    // The reference should cover at least the daily data range. Accept any
    // range that overlaps the data (A1:F31, A2:F31, A:F). The grader is
    // permissive here because there are several reasonable ways to point at
    // the data; the key is that the second argument is a range.
    const refsData =
      formulaContains(formula, "A2:F31") ||
      formulaContains(formula, "A1:F31") ||
      formulaContains(formula, "A:F") ||
      formulaContains(formula, "B2:B31") ||
      formulaContains(formula, "A2:B31");
    if (!refsData) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\`. Reference the daily-data range (e.g. \`A2:F31\` or at least the date+spend columns) so Gemini sees the actual numbers and can point to a date.`,
        detailHe: `התא I1 מכיל \`${formula}\`. מפנים לטווח הנתונים היומיים (לדוגמה \`A2:F31\` או לפחות עמודות התאריך וה-spend) כך ש-Gemini יראה את המספרים בפועל ויוכל להצביע על תאריך.`,
      };
    }
    const hasSpikeOrOutlier =
      rawFormulaContainsCi(formula, "spike") ||
      rawFormulaContainsCi(formula, "outlier");
    if (!hasSpikeOrOutlier) {
      return {
        passed: false,
        detail: `I1 contains \`${formula}\` but the prompt doesn't mention \`spike\` or \`outlier\`. Specific words direct the model's attention. "Tell me about the data" returns rambling prose; "Identify the spike/outlier" returns a date and a reason.`,
        detailHe: `התא I1 מכיל \`${formula}\` אבל ב-prompt לא מוזכר \`spike\` או \`outlier\`. מילים ספציפיות מכוונות את תשומת הלב של המודל. "Tell me about the data" מחזיר פרוזה מפותלת, "Identify the spike/outlier" מחזיר תאריך וסיבה.`,
      };
    }
    const value = await sheet.cellValue("I1");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          "I1's formula is fine but the cell is empty. AI() returns text. Give Gemini a few seconds, or wrap in IFERROR to make empty failures visible.",
        detailHe:
          "הנוסחה ב-I1 תקינה אבל התא ריק. AI() מחזיר טקסט. ממתינים כמה שניות ל-Gemini, או עוטפים ב-IFERROR.",
      };
    }
    return { passed: true };
  },
};

const i2ConfirmedFinding: Rule = {
  id: "a2-confirmed-finding",
  label: "I2 confirms the spike with a date or launch-day reference",
  labelHe: "התא I2 מאשר את ה-spike עם תאריך או הפנייה ליום launch",
  answer: '"2026-04-15 is the launch-day spike confirmed by the daily totals"',
  async run(sheet) {
    const value = await sheet.cellValue("I2");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'I2 is empty. After AI() flags a date, verify it against the data with your own eyes. Write a short literal note that references either the specific date `2026-04-15` or the word `launch`. Example: `Confirmed: 2026-04-15 spike is the launch-day surge`.',
        detailHe:
          'התא I2 ריק. אחרי ש-AI() מסמן תאריך, מאמתים אותו מול הנתונים בעיניים שלכם. כותבים תזכורת ספרותית קצרה שמפנה לתאריך `2026-04-15` או למילה `launch`. דוגמה: `Confirmed: 2026-04-15 spike is the launch-day surge`.',
      };
    }
    const lower = str.toLowerCase();
    const hasDate = lower.includes("2026-04-15");
    const hasLaunch = lower.includes("launch");
    if (!hasDate && !hasLaunch) {
      return {
        passed: false,
        detail: `I2 reads \`${str}\` and references neither \`2026-04-15\` nor \`launch\`. Verification means naming the thing you confirmed. A confirmed finding without a date isn't a confirmation, it's a vibe.`,
        detailHe: `התא I2 מכיל \`${str}\` ולא מפנה ל-\`2026-04-15\` או ל-\`launch\`. אימות אומר לציין את הדבר שאישרתם. ממצא מאומת בלי תאריך הוא לא אימות, זה תחושה.`,
      };
    }
    return { passed: true };
  },
};

const i3CriticalThinking: Rule = {
  id: "a3-critical-thinking",
  label:
    "I3 records the discipline: pair AI findings with domain knowledge / human review",
  labelHe:
    "התא I3 מתעד את המשמעת: לזווג ממצאי AI עם domain knowledge / סקירה אנושית",
  answer:
    '"AI flags candidates; domain knowledge and human review decide what they mean"',
  async run(sheet) {
    const value = await sheet.cellValue("I3");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'I3 is empty. Write a literal note about the discipline of AI-assisted analysis. The note must mention either `domain knowledge` or `human review`. Example: `AI flags candidates; domain knowledge and human review decide what they mean`.',
        detailHe:
          'התא I3 ריק. כותבים תזכורת ספרותית על המשמעת של ניתוח עם AI. התזכורת חייבת להזכיר `domain knowledge` או `human review`. דוגמה: `AI flags candidates; domain knowledge and human review decide what they mean`.',
      };
    }
    const lower = str.toLowerCase();
    const hasDomainKnowledge = lower.includes("domain knowledge");
    const hasHumanReview = lower.includes("human review");
    if (!hasDomainKnowledge && !hasHumanReview) {
      return {
        passed: false,
        detail: `I3 reads \`${str}\` and mentions neither \`domain knowledge\` nor \`human review\`. The lesson framing is "AI is a peer, not an oracle"; the note has to name the human side of that pairing.`,
        detailHe: `התא I3 מכיל \`${str}\` ולא מזכיר \`domain knowledge\` או \`human review\`. המסגור של השיעור הוא "AI הוא עמית, לא אורקל", התזכורת חייבת לציין את הצד האנושי של הזיווג הזה.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "ai-05-ai-analysis",
  lessonSlug: "ai-in-sheets/05-ai-analysis",
  templateSheetId: null,
  seed: {
    tabTitle: "Daily",
    cells: [
      ...dataToCells(CAMPAIGNS_TIMESERIES),
      // Labels for the analysis column so the learner knows what each cell is for.
      { a1: "H1", value: "AI spike-finder" },
      { a1: "H2", value: "Confirmed finding" },
      { a1: "H3", value: "Discipline note" },
    ],
  },
  rules: [i1AnalysisPrompt, i2ConfirmedFinding, i3CriticalThinking],
};
