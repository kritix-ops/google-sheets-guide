import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 4.3b (scale-03b) grades the canonical archive-and-link split. In a
// real workbook the Archive lives in a separate file and the Live workbook
// pulls from it via IMPORTRANGE. We can't provision two files inside a single
// tab test fixture, so the seed simulates the Archive as a second region on
// the same tab (columns M:S). The grader checks formula SHAPE for the
// IMPORTRANGE bridge (since the simulated URL can't actually resolve) and
// numeric outputs for the merged total and the parity check (which CAN be
// evaluated locally because both ranges live on this tab).
//
//   Seed layout on the Campaigns tab:
//     A1:G1     = column headers
//     A2:G31    = the "Live" half: first 30 campaign rows (current quarter)
//     M1:S1     = column headers (mirror of A1:G1) — the "Archive" region
//     M2:S31    = the "Archive" half: campaign rows 31..60 (older quarters)
//     I1:I3     = labels for the learner's summary block in column J:L
//
//   Learner writes:
//     J1 = =IMPORTRANGE(<example URL>, "Campaigns!M2:S31") — the bridge.
//     K1 = =SUM(F2:F31) + SUM(S2:S31) — the merged-view spend total.
//     L1 = =ROWS(A2:G31) + ROWS(M2:S31) — the parity row count (must equal 60).

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

const URL_PATTERN = "DOCS.GOOGLE.COM/SPREADSHEETS";

// Expected totals computed from the dataset so the rules stay correct if
// CAMPAIGNS_LARGE shifts. Columns: A:Date B:Buyer C:Vertical D:Platform
// E:Country F:Spend G:Revenue. 60 data rows + 1 header.
const ROWS = CAMPAIGNS_LARGE.slice(1);
const LIVE_ROWS = ROWS.slice(0, 30);
const ARCHIVE_ROWS = ROWS.slice(30, 60);
const TOTAL_ROW_COUNT = LIVE_ROWS.length + ARCHIVE_ROWS.length;
const LIVE_SPEND = LIVE_ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const ARCHIVE_SPEND = ARCHIVE_ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const MERGED_SPEND = LIVE_SPEND + ARCHIVE_SPEND;

const archivePullRule: Rule = {
  id: "j1-archive-importrange",
  label: "J1 pulls the Archive region via a bounded IMPORTRANGE",
  labelHe: "התא J1 מושך את אזור ה-Archive דרך IMPORTRANGE עם טווח חסום",
  answer:
    '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_ARCHIVE_ID/edit", "Campaigns!M2:S31")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J1 is empty. Use `=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_ARCHIVE_ID/edit", "Campaigns!M2:S31")` to set up the bridge from Live to Archive. The fixture simulates the Archive at `M2:S31` on the same tab; in a real split the URL would point at the separate Archive workbook and the range would be on a tab over there.',
        detailHe:
          'התא J1 ריק. משתמשים ב-`=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_ARCHIVE_ID/edit", "Campaigns!M2:S31")` כדי להקים את הגשר מ-Live ל-Archive. ה-fixture מדמה את ה-Archive ב-`M2:S31` באותו tab; בפיצול אמיתי ה-URL היה מצביע על קובץ ה-Archive הנפרד והטווח היה ב-tab שם.',
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The bridge between Live and Archive is built with \`IMPORTRANGE\`, not a regular cross-tab reference. Use the URL form so the formula survives renames (the file ID is in the URL).`,
        detailHe: `התא J1 מכיל \`${formula}\`. הגשר בין Live ל-Archive נבנה עם \`IMPORTRANGE\`, לא reference רגיל בין tabs. משתמשים בצורת ה-URL כדי שהנוסחה תשרוד שינויי שם (ה-file ID נמצא ב-URL).`,
      };
    }
    if (!formulaContains(formula, URL_PATTERN)) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The first argument must be a Google Sheets URL (\`https://docs.google.com/spreadsheets/d/.../edit\`), not a bare file ID or a shortened link. The IMPORTRANGE patterns lesson (4.3) explains why.`,
        detailHe: `התא J1 מכיל \`${formula}\`. הארגומנט הראשון צריך להיות URL של Google Sheets (\`https://docs.google.com/spreadsheets/d/.../edit\`), לא file ID חשוף או קישור מקוצר. שיעור IMPORTRANGE patterns (4.3) מסביר למה.`,
      };
    }
    const normalized = normalizeFormula(formula) ?? "";
    // Reject full-column patterns like "M:S" — IMPORTRANGE without a bounded
    // range silently inherits source growth and eats the cell budget.
    const fullColMatch = /[A-Z]+:[A-Z]+(?![0-9])/.test(normalized);
    if (fullColMatch) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The archive range uses a full-column reference. An unbounded IMPORTRANGE pulls the entire source tab, which is exactly the trap lesson 4.3 warns against and what makes splits go wrong six months later when the Archive grows. Bound it to \`M2:S31\` (or whatever row count you actually need).`,
        detailHe: `התא J1 מכיל \`${formula}\`. טווח ה-archive משתמש ב-reference לעמודה מלאה. IMPORTRANGE לא חסום מושך את כל ה-tab של המקור — בדיוק המלכודת ששיעור 4.3 מזהיר ממנה, וזה מה שגורם לפיצולים להתפרק שישה חודשים אחר כך כשה-Archive גדל. חוסמים ל-\`M2:S31\` (או לכמות השורות שבאמת צריך).`,
      };
    }
    if (!formulaContains(formula, "M2:S31")) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The Archive region in this fixture lives at \`M2:S31\` (30 rows × 7 columns, mirroring the Live half). Use the bounded range \`Campaigns!M2:S31\` so you pull exactly those rows.`,
        detailHe: `התא J1 מכיל \`${formula}\`. אזור ה-Archive ב-fixture הזה גר ב-\`M2:S31\` (30 שורות × 7 עמודות, במראה של ה-Live half). משתמשים בטווח החסום \`Campaigns!M2:S31\` כדי למשוך בדיוק את השורות האלה.`,
      };
    }
    return { passed: true };
  },
};

const mergedTotalRule: Rule = {
  id: "k1-merged-spend-total",
  label: "K1 combines Live spend with Archive spend for the merged total",
  labelHe: "התא K1 משלב את ה-spend של Live עם ה-spend של Archive לסכום ממוזג",
  answer: "=SUM(F2:F31)+SUM(S2:S31)",
  async run(sheet) {
    const formula = await sheet.cellFormula("K1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "K1 is empty. Write a formula that adds Live's spend (column F, rows 2..31) to Archive's spend (column S, rows 2..31). Something like `=SUM(F2:F31)+SUM(S2:S31)`. This is the shape a real Live-workbook dashboard uses to read across the split.",
        detailHe:
          "התא K1 ריק. כותבים נוסחה שמחברת את ה-spend של Live (עמודה F, שורות 2..31) ל-spend של Archive (עמודה S, שורות 2..31). משהו כמו `=SUM(F2:F31)+SUM(S2:S31)`. זו הצורה ש-dashboard של Live workbook אמיתי משתמש בה כדי לקרוא לרוחב הפיצול.",
      };
    }
    // The formula has to reach into both regions. We check that the live
    // spend column (F) AND the archive spend column (S) both appear.
    const refsLive = formulaContains(formula, "F2:F31") || formulaContains(formula, "F:F");
    const refsArchive = formulaContains(formula, "S2:S31") || formulaContains(formula, "S:S");
    if (!refsLive || !refsArchive) {
      return {
        passed: false,
        detail: `K1 contains \`${formula}\`. The merged total has to combine the Live spend column (F2:F31) with the Archive spend column (S2:S31). One sum that only reads from F is the pre-split total; one sum that only reads from S misses the current quarter. The point of the split is that the dashboard reads BOTH.`,
        detailHe: `התא K1 מכיל \`${formula}\`. הסכום הממוזג צריך לשלב את עמודת ה-spend של Live (F2:F31) עם עמודת ה-spend של Archive (S2:S31). סכום שקורא רק מ-F הוא הסכום שלפני הפיצול; סכום שקורא רק מ-S מפספס את הרבעון הנוכחי. כל הרעיון של הפיצול הוא שה-dashboard קורא משניהם.`,
      };
    }
    const value = await sheet.cellValue("K1");
    if (!approxEqual(value, MERGED_SPEND, 0.05)) {
      return {
        passed: false,
        detail: `K1 evaluates to \`${value}\` but should be approximately \`${MERGED_SPEND.toFixed(2)}\` (Live spend ${LIVE_SPEND.toFixed(2)} + Archive spend ${ARCHIVE_SPEND.toFixed(2)}). Check that both sums cover the full 30 rows on each side.`,
        detailHe: `התא K1 מתוצא ל-\`${value}\` אבל צריך להיות בערך \`${MERGED_SPEND.toFixed(2)}\` (Live spend ${LIVE_SPEND.toFixed(2)} + Archive spend ${ARCHIVE_SPEND.toFixed(2)}). יש לוודא ששני הסכומים מכסים את כל 30 השורות בכל צד.`,
      };
    }
    return { passed: true };
  },
};

const parityCheckRule: Rule = {
  id: "l1-parity-row-count",
  label: "L1 verifies the parity check: Live rows + Archive rows = original total",
  labelHe: "התא L1 מאמת את בדיקת ההתאמה: שורות Live + שורות Archive = הסך המקורי",
  answer: "=ROWS(A2:G31)+ROWS(M2:S31)",
  async run(sheet) {
    const formula = await sheet.cellFormula("L1");
    if (formula == null) {
      return {
        passed: false,
        detail: `L1 is empty. Write \`=ROWS(A2:G31)+ROWS(M2:S31)\` — Live row count plus Archive row count. The result must equal \`${TOTAL_ROW_COUNT}\` (the original pre-split row count). This is the parity check from step 5 of the migration playbook; without it, a split that drops or double-counts rows ships unnoticed.`,
        detailHe: `התא L1 ריק. כותבים \`=ROWS(A2:G31)+ROWS(M2:S31)\` — סך השורות של Live ועוד סך השורות של Archive. התוצאה חייבת להיות \`${TOTAL_ROW_COUNT}\` (סך השורות המקורי לפני הפיצול). זו בדיקת ההתאמה משלב 5 ב-playbook של ההגירה; בלעדיה, פיצול שמפיל או סופר פעמיים שורות נשלח בלי שאף אחד שם לב.`,
      };
    }
    // Accept either ROWS(...) form, COUNTA-based row counts, or any expression
    // that arithmetic-combines two row counts. Reject formulas that hard-code
    // numbers (which defeats the audit trail) or that reference only one
    // region.
    const normalized = normalizeFormula(formula) ?? "";
    const usesRowFunction =
      normalized.includes("ROWS") || normalized.includes("COUNTA") || normalized.includes("COUNT");
    if (!usesRowFunction) {
      return {
        passed: false,
        detail: `L1 contains \`${formula}\`. Build the parity check from \`ROWS\` (or \`COUNTA\`) so the audit trail is obvious. A hard-coded \`=60\` would pass numerically but tells the next reader nothing about where the number came from.`,
        detailHe: `התא L1 מכיל \`${formula}\`. בונים את בדיקת ההתאמה מ-\`ROWS\` (או \`COUNTA\`) כדי שיהיה ברור מאיפה המספר. \`=60\` קשיח יעבור מספרית אבל לא יגיד שום דבר לקורא הבא על מאיפה המספר הגיע.`,
      };
    }
    const refsLive =
      formulaContains(formula, "A2:G31") ||
      formulaContains(formula, "A2:A31") ||
      formulaContains(formula, "B2:B31");
    const refsArchive =
      formulaContains(formula, "M2:S31") ||
      formulaContains(formula, "M2:M31") ||
      formulaContains(formula, "N2:N31");
    if (!refsLive || !refsArchive) {
      return {
        passed: false,
        detail: `L1 contains \`${formula}\`. The parity check must count BOTH regions. Reference the Live block (e.g. \`A2:G31\`) AND the Archive block (e.g. \`M2:S31\`). Counting only one side does not prove the split preserved every row.`,
        detailHe: `התא L1 מכיל \`${formula}\`. בדיקת ההתאמה חייבת לספור את שני האזורים. מפנים לבלוק של Live (למשל \`A2:G31\`) וגם לבלוק של Archive (למשל \`M2:S31\`). ספירה של צד אחד לא מוכיחה שהפיצול שמר על כל שורה.`,
      };
    }
    const value = await sheet.cellValue("L1");
    if (value !== TOTAL_ROW_COUNT) {
      return {
        passed: false,
        detail: `L1 evaluates to \`${value}\` but should be \`${TOTAL_ROW_COUNT}\` (Live ${LIVE_ROWS.length} rows + Archive ${ARCHIVE_ROWS.length} rows). If the number is short, one of the ROWS ranges is undercounting; if it's over, you may be double-counting headers.`,
        detailHe: `התא L1 מתוצא ל-\`${value}\` אבל צריך להיות \`${TOTAL_ROW_COUNT}\` (Live ${LIVE_ROWS.length} שורות + Archive ${ARCHIVE_ROWS.length} שורות). אם המספר חסר, אחד מטווחי ה-ROWS סופר חסר; אם הוא יותר, ייתכן שאתה סופר כותרות פעמיים.`,
      };
    }
    return { passed: true };
  },
};

// Build the seed cells. The Live region carries rows 1..30 in columns A:G.
// The Archive region carries rows 31..60 in columns M:S with its own header
// row at M1:S1. The summary block lives in I1:I3 / J1:L1.
const liveCells = (() => {
  const out: { a1: string; value: string | number | boolean | null }[] = [];
  const COLS = ["A", "B", "C", "D", "E", "F", "G"];
  // Headers at A1:G1.
  CAMPAIGNS_LARGE[0].forEach((h, c) => {
    out.push({ a1: `${COLS[c]}1`, value: h });
  });
  // Live rows at A2:G31.
  LIVE_ROWS.forEach((row, i) => {
    row.forEach((cell, c) => {
      out.push({ a1: `${COLS[c]}${i + 2}`, value: cell });
    });
  });
  return out;
})();

const archiveCells = (() => {
  const out: { a1: string; value: string | number | boolean | null }[] = [];
  const COLS = ["M", "N", "O", "P", "Q", "R", "S"];
  // Headers at M1:S1, mirroring A1:G1.
  CAMPAIGNS_LARGE[0].forEach((h, c) => {
    out.push({ a1: `${COLS[c]}1`, value: h });
  });
  // Archive rows at M2:S31.
  ARCHIVE_ROWS.forEach((row, i) => {
    row.forEach((cell, c) => {
      out.push({ a1: `${COLS[c]}${i + 2}`, value: cell });
    });
  });
  return out;
})();

export const assignment: AssignmentSpec = {
  id: "scale-03b-splitting-workbook",
  lessonSlug: "scale/03b-splitting-workbook",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...liveCells,
      ...archiveCells,
      // Summary block labels in column I; learner fills J1, K1, L1.
      { a1: "I1", value: "Archive pull (J1)" },
      { a1: "I2", value: "Merged spend total (K1)" },
      { a1: "I3", value: "Parity row count (L1)" },
    ],
  },
  rules: [archivePullRule, mergedTotalRule, parityCheckRule],
};
