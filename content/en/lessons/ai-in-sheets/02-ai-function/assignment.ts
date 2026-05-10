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

// Lowercase variant: needed when the keyword sits inside the prompt string
// (quoted) and case matters for the learner's spelling but not for our match.
function rawFormulaContainsCi(formula: string | null, needle: string): boolean {
  if (formula == null) return false;
  return formula.toLowerCase().includes(needle.toLowerCase());
}

function asString(value: CellValue): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

const h2RiskClassifier: Rule = {
  id: "h2-classification-prompt",
  label: "H2 uses AI() to classify campaign risk as low, medium, or high",
  labelHe: "התא H2 משתמש ב-AI() לסיווג סיכון של קמפיין ל-low, medium, או high",
  answer:
    '=AI("Categorize this campaign\'s risk as low, medium, or high. Spend: " & F2 & " Revenue: " & G2)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H2 is empty. Use `=AI("Categorize this campaign\'s risk as low, medium, or high. Spend: " & F2 & " Revenue: " & G2)`. Constraining the output to a fixed list of words is what makes AI() useful in a column.',
        detailHe:
          'התא H2 ריק. משתמשים ב-`=AI("Categorize this campaign\'s risk as low, medium, or high. Spend: " & F2 & " Revenue: " & G2)`. הגבלת ה-output לרשימה קבועה של מילים היא מה שהופך את AI() לשימושי בעמודה.',
      };
    }
    if (!formulaContains(formula, "AI(")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Use the \`AI\` function. A literal classification typed by hand defeats the point of the column.`,
        detailHe: `התא H2 מכיל \`${formula}\`. משתמשים בפונקציה \`AI\`. סיווג ספרותי שהוקלד ידנית מבטל את המטרה של העמודה.`,
      };
    }
    if (!formulaContains(formula, "F2")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Reference \`F2\` (the Spend cell) so Gemini sees the actual spend value. Concatenate it into the prompt with \`&\`.`,
        detailHe: `התא H2 מכיל \`${formula}\`. מפנים ל-\`F2\` (תא ה-Spend) כדי ש-Gemini יראה את ערך ה-spend בפועל. משלבים אותו ב-prompt עם \`&\`.`,
      };
    }
    if (!formulaContains(formula, "G2")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Reference \`G2\` (the Revenue cell) so Gemini can reason about spend vs revenue together. Concatenate it into the prompt with \`&\`.`,
        detailHe: `התא H2 מכיל \`${formula}\`. מפנים ל-\`G2\` (תא ה-Revenue) כדי ש-Gemini יוכל להסיק על spend מול revenue ביחד. משלבים אותו ב-prompt עם \`&\`.`,
      };
    }
    const hasLow = rawFormulaContainsCi(formula, "low");
    const hasMedium = rawFormulaContainsCi(formula, "medium");
    const hasHigh = rawFormulaContainsCi(formula, "high");
    if (!hasLow || !hasMedium || !hasHigh) {
      const missing: string[] = [];
      if (!hasLow) missing.push("low");
      if (!hasMedium) missing.push("medium");
      if (!hasHigh) missing.push("high");
      return {
        passed: false,
        detail: `H2 contains \`${formula}\` but the prompt is missing the constrained-output words: ${missing.join(", ")}. Spell out the exact labels Gemini is allowed to return. Open-ended prompts return prose; constrained prompts return one word.`,
        detailHe: `התא H2 מכיל \`${formula}\` אבל ב-prompt חסרות מילות ה-output המוגבל: ${missing.join(", ")}. מאייתים את ה-labels המדויקים ש-Gemini מורשה להחזיר. prompts פתוחים מחזירים פרוזה, prompts מוגבלים מחזירים מילה אחת.`,
      };
    }
    const value = await sheet.cellValue("H2");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          "H2's formula is fine but the cell is empty. AI() returns text. Wait a few seconds for Gemini to respond, or wrap it in IFERROR to make the empty case visible.",
        detailHe:
          "הנוסחה ב-H2 תקינה אבל התא ריק. AI() מחזיר טקסט. ממתינים כמה שניות ל-Gemini, או עוטפים ב-IFERROR כדי שהמקרה הריק יראה.",
      };
    }
    return { passed: true };
  },
};

const h3Sentiment: Rule = {
  id: "h3-sentiment-prompt",
  label: "H3 asks Gemini for sentiment on the vertical name in C2",
  labelHe: "התא H3 מבקש מ-Gemini sentiment על שם ה-vertical ב-C2",
  answer: '=AI("Sentiment of this vertical name: " & C2)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H3 is empty. Use `=AI("Sentiment of this vertical name: " & C2)`. Sentiment is a classic AI() use case because the answer is one short word and the cost-per-row stays low.',
        detailHe:
          'התא H3 ריק. משתמשים ב-`=AI("Sentiment of this vertical name: " & C2)`. Sentiment הוא use case קלאסי ל-AI() כי התשובה היא מילה אחת קצרה והעלות לשורה נשארת נמוכה.',
      };
    }
    if (!formulaContains(formula, "AI(")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Use the \`AI\` function. A typed sentiment word isn't the lesson here, the lesson is the prompt.`,
        detailHe: `התא H3 מכיל \`${formula}\`. משתמשים בפונקציה \`AI\`. מילת sentiment שהוקלדה היא לא השיעור פה, השיעור הוא ה-prompt.`,
      };
    }
    if (!formulaContains(formula, "C2")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\`. Reference \`C2\` (the Vertical cell) so Gemini sees the actual vertical name, not a generic prompt.`,
        detailHe: `התא H3 מכיל \`${formula}\`. מפנים ל-\`C2\` (תא ה-Vertical) כדי ש-Gemini יראה את שם ה-vertical בפועל, לא prompt גנרי.`,
      };
    }
    if (!rawFormulaContainsCi(formula, "sentiment")) {
      return {
        passed: false,
        detail: `H3 contains \`${formula}\` but the prompt doesn't include the word "sentiment". Be explicit about what you're asking for. "Analyze this" returns wildly different things between calls.`,
        detailHe: `התא H3 מכיל \`${formula}\` אבל ב-prompt חסרה המילה "sentiment". יש להיות מפורש לגבי מה שואלים. "Analyze this" מחזיר דברים שונים לגמרי בין קריאות.`,
      };
    }
    const value = await sheet.cellValue("H3");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          "H3's formula is fine but the cell is empty. AI() returns text. Give Gemini a few seconds or wrap in IFERROR.",
        detailHe:
          "הנוסחה ב-H3 תקינה אבל התא ריק. AI() מחזיר טקסט. ממתינים כמה שניות ל-Gemini או עוטפים ב-IFERROR.",
      };
    }
    return { passed: true };
  },
};

const h4Defensive: Rule = {
  id: "h4-defensive-iferror",
  label: "H4 wraps AI() in IFERROR for production-grade defense",
  labelHe: "התא H4 עוטף AI() ב-IFERROR להגנה ברמת production",
  answer: '=IFERROR(AI("Categorize: " & C2), "fallback")',
  async run(sheet) {
    const formula = await sheet.cellFormula("H4");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H4 is empty. Use `=IFERROR(AI("Categorize: " & C2), "fallback")`. AI() can time out, hit the quota, or return an error. IFERROR keeps the column from spreading red `#ERROR!` cells across a dashboard.',
        detailHe:
          'התא H4 ריק. משתמשים ב-`=IFERROR(AI("Categorize: " & C2), "fallback")`. AI() יכול להיתקע ב-timeout, להגיע למכסה, או להחזיר שגיאה. IFERROR מונע מהעמודה להפיץ תאי `#ERROR!` אדומים על פני dashboard.',
      };
    }
    if (!formulaContains(formula, "IFERROR(")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. Wrap the AI() call in \`IFERROR(...)\` so failures are visible as a fallback string rather than \`#ERROR!\`. In production this is the difference between a quiet bad cell and a screaming bad dashboard.`,
        detailHe: `התא H4 מכיל \`${formula}\`. עוטפים את קריאת ה-AI() ב-\`IFERROR(...)\` כדי שכשלונות יראו כ-string חלופי במקום \`#ERROR!\`. ב-production זה ההבדל בין תא רע שקט ל-dashboard רע צועק.`,
      };
    }
    if (!formulaContains(formula, "AI(")) {
      return {
        passed: false,
        detail: `H4 contains \`${formula}\`. Inside the IFERROR, call the \`AI\` function. The whole point of the defensive wrap is to catch AI()'s failures.`,
        detailHe: `התא H4 מכיל \`${formula}\`. בתוך ה-IFERROR, קוראים לפונקציה \`AI\`. כל המטרה של העטיפה ההגנתית היא לתפוס את הכשלים של AI().`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "ai-02-ai-function",
  lessonSlug: "ai-in-sheets/02-ai-function",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Right-side labels in column I name each AI() prompt the learner writes.
      { a1: "I2", value: "Risk (low/medium/high)" },
      { a1: "I3", value: "Vertical sentiment" },
      { a1: "I4", value: "Defensive AI() with IFERROR" },
    ],
  },
  rules: [h2RiskClassifier, h3Sentiment, h4Defensive],
};
