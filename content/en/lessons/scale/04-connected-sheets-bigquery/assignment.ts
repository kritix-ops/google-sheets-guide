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

// CAMPAIGNS_LARGE schema: A:Date B:Buyer C:Vertical D:Platform E:Country
// F:Spend G:Revenue. The lesson stands in for a Connected Sheets extract
// from BigQuery: in real life the data tab is special (read-only, refreshed
// from a SQL query) and dashboard cells reference it via Campaigns_BQ!F2:F61.
// The seed places the data on a tab named Campaigns_BQ so the references
// match what the learner would write in production.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const TABOOLA_COUNT = ROWS.filter((r) => r[3] === "Taboola").length;

const extractTotalSpend: Rule = {
  id: "j1-sums-extract-spend",
  label: "J1 sums Spend from the Campaigns_BQ extract",
  labelHe: "התא J1 מסכם Spend מה-extract של Campaigns_BQ",
  answer: "=SUM(F2:F61)",
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "J1 is empty. Use `=SUM(F2:F61)` to total Spend from the extract. In a production workbook this would be `=SUM(Campaigns_BQ!F2:F61)` pointing at the dedicated extract tab; here the data lives on the active tab.",
        detailHe:
          "התא J1 ריק. משתמשים ב-`=SUM(F2:F61)` כדי לסכם Spend מה-extract. ב-spreadsheet בייצור זה היה `=SUM(Campaigns_BQ!F2:F61)` שמצביע על גיליון ה-extract הייעודי, פה הנתונים יושבים על הגיליון הפעיל.",
      };
    }
    if (!formulaContains(formula, "SUM")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use the \`SUM\` function on the Spend column.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים בפונקציית \`SUM\` על עמודת ה-Spend.`,
      };
    }
    if (formulaContains(formula, "F:F")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Bound the range to \`F2:F61\` instead of using \`F:F\`. The extract tab is a real tab with a real cell budget; full-column refs hurt just as much here as anywhere else.`,
        detailHe: `התא J1 מכיל \`${formula}\`. חוסמים את הטווח ל-\`F2:F61\` במקום \`F:F\`. גיליון ה-extract הוא גיליון אמיתי עם תקציב תאים אמיתי, references לעמודה מלאה כואבים פה כמו בכל מקום אחר.`,
      };
    }
    const value = await sheet.cellValue("J1");
    if (!approxEqual(value, TOTAL_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `J1 evaluates to \`${value}\` but should be ≈ \`${TOTAL_SPEND.toFixed(2)}\` (sum of all 60 spend values in the extract).`,
        detailHe: `התא J1 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${TOTAL_SPEND.toFixed(2)}\` (סך 60 ערכי ה-spend ב-extract).`,
      };
    }
    return { passed: true };
  },
};

const taboolaCountByPlatform: Rule = {
  id: "j2-counts-taboola-rows",
  label: "J2 counts Taboola rows with COUNTIF on the Platform column",
  labelHe: "התא J2 סופר שורות Taboola עם COUNTIF על עמודת ה-Platform",
  answer: '=COUNTIF(D2:D61, "Taboola")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J2 is empty. Use `=COUNTIF(D2:D61, "Taboola")` to count campaigns on the Taboola platform.',
        detailHe:
          'התא J2 ריק. משתמשים ב-`=COUNTIF(D2:D61, "Taboola")` כדי לספור קמפיינים על פלטפורמת Taboola.',
      };
    }
    if (!formulaContains(formula, "COUNTIF")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Use \`COUNTIF\` with the Platform column and the criterion \`"Taboola"\`.`,
        detailHe: `התא J2 מכיל \`${formula}\`. משתמשים ב-\`COUNTIF\` על עמודת ה-Platform עם הקריטריון \`"Taboola"\`.`,
      };
    }
    if (!formulaContains(formula, "TABOOLA")) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. The criterion needs to be the literal platform name \`"Taboola"\`.`,
        detailHe: `התא J2 מכיל \`${formula}\`. הקריטריון צריך להיות שם הפלטפורמה המפורש \`"Taboola"\`.`,
      };
    }
    const value = await sheet.cellValue("J2");
    if (value !== TABOOLA_COUNT) {
      return {
        passed: false,
        detail: `J2 evaluates to \`${value}\` but should be \`${TABOOLA_COUNT}\` (the count of Taboola rows in the extract). Check the range covers \`D2:D61\` and the criterion is \`"Taboola"\` exactly.`,
        detailHe: `התא J2 מתוצא ל-\`${value}\` אבל צריך להיות \`${TABOOLA_COUNT}\` (מספר שורות Taboola ב-extract). יש לבדוק שהטווח מכסה את \`D2:D61\` ושהקריטריון הוא בדיוק \`"Taboola"\`.`,
      };
    }
    return { passed: true };
  },
};

const sourceMarker: Rule = {
  id: "j3-marks-source-as-bigquery",
  label: "J3 marks the data source as BigQuery",
  labelHe: "התא J3 מסמן את מקור הנתונים כ-BigQuery",
  answer: "BigQuery",
  async run(sheet) {
    const value = await sheet.cellValue("J3");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "J3 is empty. Type `BigQuery` so anyone looking at the dashboard knows the upstream connector type. This matters when something is stale: a Connected Sheets refresh is different from an IMPORTRANGE refresh.",
        detailHe:
          "התא J3 ריק. מקלידים `BigQuery` כדי שכל מי שמסתכל ב-dashboard ידע מה סוג ה-connector במעלה הזרם. זה משנה כשמשהו לא מעודכן: רענון של Connected Sheets שונה מרענון של IMPORTRANGE.",
      };
    }
    const text = String(value);
    if (!text.toLowerCase().includes("bigquery")) {
      return {
        passed: false,
        detail: `J3 contains \`${value}\`. The connector type the dashboard pulls from is \`BigQuery\`. Use that exact label so the audit trail is searchable.`,
        detailHe: `התא J3 מכיל \`${value}\`. סוג ה-connector שה-dashboard מושך ממנו הוא \`BigQuery\`. משתמשים בתווית המדויקת הזו כדי שמסלול הביקורת יהיה ניתן לחיפוש.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-04-connected-sheets-bigquery",
  lessonSlug: "scale/04-connected-sheets-bigquery",
  templateSheetId: null,
  seed: {
    // Name the tab Campaigns_BQ to mimic what the Connected Sheets extract
    // tab would be called in production. In real life the dashboard would
    // live on a separate tab and reference Campaigns_BQ!F2:F61; the
    // single-tab fixture here collapses both into one surface, and the
    // lesson explains it.
    tabTitle: "Campaigns_BQ",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Summary block labels in column I, separated from the extract by an
      // empty H column. Learner fills column J.
      { a1: "I1", value: "Total Spend (from extract)" },
      { a1: "I2", value: "Taboola row count" },
      { a1: "I3", value: "Data source connector" },
    ],
  },
  rules: [extractTotalSpend, taboolaCountByPlatform, sourceMarker],
};
