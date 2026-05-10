import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, CellValue } from "@/lib/grading/types";

function asString(value: CellValue): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

// Compute the expected totals from CAMPAIGNS_LARGE so the scorecard rule
// stays in sync with the dataset. Same column layout as modeling-01:
// A:Date B:Buyer C:Vertical D:Platform E:Country F:Spend G:Revenue.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const TOTAL_REVENUE = ROWS.reduce(
  (s, r) => s + (typeof r[6] === "number" ? r[6] : 0),
  0,
);

const l1BuildPrompt: Rule = {
  id: "l1-build-prompt",
  label:
    "L1 captures the build prompt: ask Gemini for a scorecard/dashboard with spend or revenue",
  labelHe:
    "התא L1 לוכד את ה-build prompt: מבקש מ-Gemini scorecard או dashboard עם spend או revenue",
  answer:
    '"Add a scorecard above the campaign log showing total spend and total revenue"',
  async run(sheet) {
    const value = await sheet.cellValue("L1");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'L1 is empty. Write the natural-language prompt you typed into the Gemini side panel. Example: `Add a scorecard above the campaign log showing total spend and total revenue`. The prompt must contain `scorecard` or `dashboard`, and `spend` or `revenue`.',
        detailHe:
          'התא L1 ריק. כותבים את ה-prompt בשפה טבעית שהקלדתם ב-side panel של Gemini. דוגמה: `Add a scorecard above the campaign log showing total spend and total revenue`. ה-prompt חייב להכיל `scorecard` או `dashboard`, ו-`spend` או `revenue`.',
      };
    }
    const lower = str.toLowerCase();
    const hasScorecardOrDashboard =
      lower.includes("scorecard") || lower.includes("dashboard");
    const hasSpendOrRevenue =
      lower.includes("spend") || lower.includes("revenue");
    if (!hasScorecardOrDashboard || !hasSpendOrRevenue) {
      const missing: string[] = [];
      if (!hasScorecardOrDashboard) missing.push("`scorecard` or `dashboard`");
      if (!hasSpendOrRevenue) missing.push("`spend` or `revenue`");
      return {
        passed: false,
        detail: `L1 reads \`${str}\` and is missing: ${missing.join(", ")}. Build prompts have to name the output type (scorecard, dashboard, pivot, chart) and the field. "Make a thing about this data" returns whatever Gemini feels like.`,
        detailHe: `התא L1 מכיל \`${str}\` וחסר: ${missing.join(", ")}. build prompts חייבים לציין את סוג ה-output (scorecard, dashboard, pivot, chart) ואת השדה. "תעשה משהו על הנתונים האלה" מחזיר מה ש-Gemini בא לו.`,
      };
    }
    return { passed: true };
  },
};

const ijScorecard: Rule = {
  id: "i-j-scorecard-populated",
  label:
    "Scorecard I1:J2 carries the Total Spend / Total Revenue labels and values",
  labelHe:
    "ה-scorecard ב-I1:J2 נושא את ה-labels והערכים של Total Spend / Total Revenue",
  answer: `I1 = "Total Spend", J1 = ${TOTAL_SPEND.toFixed(2)}, I2 = "Total Revenue", J2 = ${TOTAL_REVENUE.toFixed(2)}`,
  async run(sheet) {
    const i1 = asString(await sheet.cellValue("I1"));
    const i2 = asString(await sheet.cellValue("I2"));
    const j1 = await sheet.cellValue("J1");
    const j2 = await sheet.cellValue("J2");

    if (i1 == null || i1.trim().toLowerCase() !== "total spend") {
      return {
        passed: false,
        detail: `I1 is \`${i1 ?? "empty"}\`. The scorecard's first label should be exactly \`Total Spend\`. Labels match the column name; that's the team convention.`,
        detailHe: `התא I1 הוא \`${i1 ?? "ריק"}\`. ה-label הראשון של ה-scorecard צריך להיות בדיוק \`Total Spend\`. labels תואמים את שם העמודה, זו קונבנציית הצוות.`,
      };
    }
    if (!approxEqual(j1, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 is \`${j1}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (sum of all 60 Spend values). Before applying Gemini's scorecard, verify the totals against your own SUM.`,
        detailHe: `התא J1 הוא \`${j1}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סך 60 ערכי Spend). לפני שעושים apply ל-scorecard של Gemini, מאמתים את הסכומים מול SUM משלכם.`,
      };
    }
    if (i2 == null || i2.trim().toLowerCase() !== "total revenue") {
      return {
        passed: false,
        detail: `I2 is \`${i2 ?? "empty"}\`. The scorecard's second label should be exactly \`Total Revenue\`.`,
        detailHe: `התא I2 הוא \`${i2 ?? "ריק"}\`. ה-label השני של ה-scorecard צריך להיות בדיוק \`Total Revenue\`.`,
      };
    }
    if (!approxEqual(j2, TOTAL_REVENUE, 0.05)) {
      return {
        passed: false,
        detail: `J2 is \`${j2}\` but should be ≈ \`${TOTAL_REVENUE.toFixed(2)}\` (sum of all 60 Revenue values).`,
        detailHe: `התא J2 הוא \`${j2}\` אבל צריך להיות ≈ \`${TOTAL_REVENUE.toFixed(2)}\` (סך 60 ערכי Revenue).`,
      };
    }
    return { passed: true };
  },
};

const k1ReviewDiscipline: Rule = {
  id: "k1-review-discipline",
  label:
    "K1 records the review discipline: verify Gemini's proposal before applying",
  labelHe:
    "התא K1 מתעד את משמעת הסקירה: לאמת את ההצעה של Gemini לפני apply",
  answer: '"Review the proposal cell by cell before applying"',
  async run(sheet) {
    const value = await sheet.cellValue("K1");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'K1 is empty. Write the discipline note: the review step that Gemini\'s side panel makes available before you commit. Example: `Review the proposal cell by cell before applying`. The note must contain `review` or `verify`, and `before applying`.',
        detailHe:
          'התא K1 ריק. כותבים את תזכורת המשמעת: שלב הסקירה ש-side panel של Gemini מאפשר לפני commit. דוגמה: `Review the proposal cell by cell before applying`. התזכורת חייבת להכיל `review` או `verify`, וגם `before applying`.',
      };
    }
    const lower = str.toLowerCase();
    const hasReviewOrVerify =
      lower.includes("review") || lower.includes("verify");
    const hasBeforeApplying = lower.includes("before applying");
    if (!hasReviewOrVerify || !hasBeforeApplying) {
      const missing: string[] = [];
      if (!hasReviewOrVerify) missing.push("`review` or `verify`");
      if (!hasBeforeApplying) missing.push("`before applying`");
      return {
        passed: false,
        detail: `K1 reads \`${str}\` and is missing: ${missing.join(", ")}. The discipline is review-and-then-apply, not apply-and-then-find-out.`,
        detailHe: `התא K1 מכיל \`${str}\` וחסר: ${missing.join(", ")}. המשמעת היא review-and-then-apply, לא apply-and-then-find-out.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "ai-04-build-and-edit",
  lessonSlug: "ai-in-sheets/04-build-and-edit",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Right-side scratchpad to capture the prompt and the review discipline.
      // I1:J2 hold the scorecard, K1 holds the discipline, L1 holds the prompt.
    ],
  },
  rules: [l1BuildPrompt, ijScorecard, k1ReviewDiscipline],
};
