import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

const USD_TO_ILS_RATE = 3.7;

// CAMPAIGNS_LARGE columns: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. Pull row 2's spend and revenue so the rules know what
// `=usdToILS(F2, $K$1)` should evaluate to. If the dataset shifts, the
// expected numbers shift with it.
const ROW2 = CAMPAIGNS_LARGE[1];
const F2_SPEND_USD = typeof ROW2[5] === "number" ? ROW2[5] : 0;
const G2_REVENUE_USD = typeof ROW2[6] === "number" ? ROW2[6] : 0;
const F2_SPEND_ILS = F2_SPEND_USD * USD_TO_ILS_RATE;
const G2_REVENUE_ILS = G2_REVENUE_USD * USD_TO_ILS_RATE;

function approxEqual(a: unknown, b: number, eps = 0.05): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

function formulaCallsFunction(
  formula: string | null,
  name: string,
): boolean {
  if (formula == null) return false;
  // Apps Script function names are case-insensitive in cells, so normalize.
  const pattern = new RegExp(`\\b${name}\\b`, "i");
  return pattern.test(formula);
}

const STARTER_LESSON_GS = `/**
 * Convert a US dollar amount to ILS at a given rate.
 *
 * @param {number} usd  The amount in US dollars.
 * @param {number} rate The USD-to-ILS exchange rate.
 * @return {number} The amount converted to ILS.
 * @customfunction
 */
function usdToILS(usd, rate) {
  // TODO: return the converted amount. The expression is one line.
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1: the bound Apps Script project defines `usdToILS` and the body
// actually multiplies the two arguments. The body check guards against
// learners who declare the function but leave the `return null;` stub.
const definesUsdToIls: Rule = {
  id: "script-defines-usdtoils",
  label: "Lesson.gs defines a `usdToILS(usd, rate)` custom function",
  labelHe: "הקובץ Lesson.gs מגדיר custom function בשם `usdToILS(usd, rate)`",
  answer:
    "function usdToILS(usd, rate) {\n  return usd * rate;\n}",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found. Open the sheet and choose Extensions → Apps Script to launch the editor, then re-run grading.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר. פותחים את ה-spreadsheet ובוחרים Extensions → Apps Script כדי להפעיל את העורך, ואז מריצים grading שוב.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail:
          "The starter file `Lesson.gs` is missing from the bound project. If you renamed it, rename it back to `Lesson` (no extension in the Apps Script file picker).",
        detailHe:
          "קובץ ה-starter `Lesson.gs` חסר בפרויקט המקושר. אם שיניתם לו שם, מחזירים אותו ל-`Lesson` (בלי סיומת בבורר הקבצים של Apps Script).",
      };
    }
    if (!lesson.functions.includes("usdToILS")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function usdToILS(...)\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}. Case matters: a cell calling \`=usdToILS(...)\` only finds a function declared with exactly that name.`,
        detailHe: `ל-Lesson.gs חסר \`function usdToILS(...)\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}. אותיות גדולות וקטנות חשובות: תא שקורא \`=usdToILS(...)\` ימצא רק function שמוכרזת בדיוק עם השם הזה.`,
      };
    }
    // Source-level body check: the literal `usd * rate` (in either argument
    // order) tells us the stub was actually filled in. A learner could pass
    // this rule with `return rate * usd;` too.
    const stripped = lesson.source.replace(/\s+/g, "");
    const bodyMultipliesArgs =
      stripped.includes("returnusd*rate") || stripped.includes("returnrate*usd");
    if (!bodyMultipliesArgs) {
      return {
        passed: false,
        detail:
          "`usdToILS` is declared but its body doesn't multiply the two arguments. Replace `return null;` with `return usd * rate;`.",
        detailHe:
          "`usdToILS` מוכרזת אבל הגוף שלה לא מכפיל את שני הארגומנטים. מחליפים את `return null;` ב-`return usd * rate;`.",
      };
    }
    return { passed: true };
  },
};

// Rule 2: H2 calls the custom function on F2 with the rate in $K$1.
// The cell-value check uses the dataset's actual F2 spend so the rule
// catches an arrow-function declaration or a typo'd function name that
// still happens to return a number.
const h2CallsCustomFn: Rule = {
  id: "h2-calls-usdtoils-on-spend",
  label: "H2 calls `=usdToILS(F2, $K$1)` to convert F2 spend into ILS",
  labelHe: "התא H2 קורא `=usdToILS(F2, $K$1)` כדי להמיר את ה-spend ב-F2 ל-ILS",
  answer: "=usdToILS(F2, $K$1)",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. Type `=usdToILS(F2, $K$1)` to convert F2's USD spend into ILS using the rate in K1. The `$` signs lock K1 so you can fill the formula down the column without it shifting to K2, K3, etc.",
        detailHe:
          "H2 ריק. מקלידים `=usdToILS(F2, $K$1)` כדי להמיר את ה-spend ב-USD מ-F2 ל-ILS לפי השער ב-K1. סימני ה-`$` נועלים את K1 כדי שאפשר יהיה לגרור את הנוסחה למטה בעמודה בלי שתזוז ל-K2, K3 וכן הלאה.",
      };
    }
    if (!formulaCallsFunction(formula, "usdToILS")) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Call your custom function: \`=usdToILS(F2, $K$1)\`. Custom functions appear in cells under the JS function name.`,
        detailHe: `H2 מכיל \`${formula}\`. קוראים ל-custom function שלכם: \`=usdToILS(F2, $K$1)\`. Custom functions מופיעות בתאים תחת שם ה-function ב-JS.`,
      };
    }
    if (!/F2/i.test(formula) || !/K\$?1/i.test(formula)) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. The first argument should be \`F2\` (the spend cell) and the second should be \`$K$1\` (the rate, locked so it doesn't shift when filled down).`,
        detailHe: `H2 מכיל \`${formula}\`. הארגומנט הראשון צריך להיות \`F2\` (תא ה-spend) והשני \`$K$1\` (השער, נעול כדי שלא יזוז כשמגררים למטה).`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (!approxEqual(value, F2_SPEND_ILS, 0.05)) {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be ≈ \`${F2_SPEND_ILS.toFixed(2)}\` (\`${F2_SPEND_USD}\` USD × \`${USD_TO_ILS_RATE}\` ILS/USD). If the value is blank, your \`usdToILS\` body is still returning \`null\`.`,
        detailHe: `H2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${F2_SPEND_ILS.toFixed(2)}\` (\`${F2_SPEND_USD}\` USD × \`${USD_TO_ILS_RATE}\` ILS/USD). אם הערך ריק, גוף ה-\`usdToILS\` שלכם עדיין מחזיר \`null\`.`,
      };
    }
    return { passed: true };
  },
};

// Rule 3: I2 does the same conversion on revenue. Pair this rule with H2
// because the lesson's whole point is reuse: one custom function called
// from two columns without duplicating math.
const i2CallsCustomFn: Rule = {
  id: "i2-calls-usdtoils-on-revenue",
  label: "I2 calls `=usdToILS(G2, $K$1)` to convert G2 revenue into ILS",
  labelHe: "התא I2 קורא `=usdToILS(G2, $K$1)` כדי להמיר את ה-revenue ב-G2 ל-ILS",
  answer: "=usdToILS(G2, $K$1)",
  async run(sheet) {
    const formula = await sheet.cellFormula("I2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "I2 is empty. Type `=usdToILS(G2, $K$1)` to convert G2's USD revenue into ILS. Same function as H2: that's the point of writing a custom function once.",
        detailHe:
          "I2 ריק. מקלידים `=usdToILS(G2, $K$1)` כדי להמיר את ה-revenue ב-USD מ-G2 ל-ILS. אותה function כמו ב-H2, זה כל הרעיון של לכתוב custom function פעם אחת.",
      };
    }
    if (!formulaCallsFunction(formula, "usdToILS")) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. Reuse \`usdToILS\` instead of typing the math inline: \`=usdToILS(G2, $K$1)\`.`,
        detailHe: `I2 מכיל \`${formula}\`. משתמשים שוב ב-\`usdToILS\` במקום לכתוב את החישוב inline: \`=usdToILS(G2, $K$1)\`.`,
      };
    }
    if (!/G2/i.test(formula) || !/K\$?1/i.test(formula)) {
      return {
        passed: false,
        detail: `I2 contains \`${formula}\`. The first argument should be \`G2\` (the revenue cell) and the second should be \`$K$1\`.`,
        detailHe: `I2 מכיל \`${formula}\`. הארגומנט הראשון צריך להיות \`G2\` (תא ה-revenue) והשני \`$K$1\`.`,
      };
    }
    const value = await sheet.cellValue("I2");
    if (!approxEqual(value, G2_REVENUE_ILS, 0.05)) {
      return {
        passed: false,
        detail: `I2 evaluates to \`${value}\` but should be ≈ \`${G2_REVENUE_ILS.toFixed(2)}\` (\`${G2_REVENUE_USD}\` USD × \`${USD_TO_ILS_RATE}\` ILS/USD).`,
        detailHe: `I2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${G2_REVENUE_ILS.toFixed(2)}\` (\`${G2_REVENUE_USD}\` USD × \`${USD_TO_ILS_RATE}\` ILS/USD).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-03-custom-functions",
  lessonSlug: "apps-script/03-custom-functions",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Output column headers and the rate cell. The rate sits in K1
      // because columns H and I are reserved for the learner's
      // conversions and the J column is left empty as a visual gutter.
      { a1: "H1", value: "Spend (ILS)" },
      { a1: "I1", value: "Revenue (ILS)" },
      { a1: "K1", value: USD_TO_ILS_RATE },
      { a1: "L1", value: "USD → ILS rate" },
    ],
  },
  seedScript,
  rules: [definesUsdToIls, h2CallsCustomFn, i2CallsCustomFn],
};
