import { CAMPAIGNS_TIMESERIES } from "@/content/datasets/adtech";
import type {
  AssignmentSpec,
  Rule,
  SheetSeedCell,
} from "@/lib/grading/types";

// Lesson 5 grades a three-cell analysis block built on top of a simulated
// TimesFM forecast. The single tab "Forecast" carries two regions: the
// historical daily-spend log on the left (A1:B31, drawn from
// CAMPAIGNS_TIMESERIES) and the forecasted next-7-days block in the middle
// (D1:E8). The learner fills H1..H3 with the three answers.
//
// In the real Connected Sheets + TimesFM workflow these would be two tabs
// (a Daily_Spend source and a Forecast result tab that TimesFM materializes).
// We collapse them onto one tab here so the assignment provisions in a single
// tab the way the rest of Track 4 does. The lesson body covers the multi-tab
// workflow in prose.

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function approxEqual(a: unknown, b: number, eps = 0.01): boolean {
  if (typeof a !== "number") return false;
  return Math.abs(a - b) < eps;
}

// Historical block: CAMPAIGNS_TIMESERIES Date + Spend columns. 30 data rows
// land at B2:B31; B31 is the last observed actual.
const TIMESERIES_ROWS = CAMPAIGNS_TIMESERIES.slice(1);
const LAST_ACTUAL = (() => {
  const last = TIMESERIES_ROWS[TIMESERIES_ROWS.length - 1]?.[1];
  return typeof last === "number" ? last : 0;
})();

// Simulated TimesFM 7-day forecast: a fixed daily ramp on top of the last
// observed actual. Deterministic so the grader expected-values stay in sync
// with the seed. The first prediction sits at E2.
const FORECAST_DATES = [
  "2026-05-01",
  "2026-05-02",
  "2026-05-03",
  "2026-05-04",
  "2026-05-05",
  "2026-05-06",
  "2026-05-07",
];
const FORECAST_VALUES = FORECAST_DATES.map((_, i) => LAST_ACTUAL + (i + 1) * 60);
const FIRST_FORECAST = FORECAST_VALUES[0]!;
const EXPECTED_DELTA = (FIRST_FORECAST - LAST_ACTUAL) / LAST_ACTUAL;

const pullsForecast: Rule = {
  id: "h1-pulls-forecast",
  label: "H1 pulls the next-day forecasted spend from the Forecast block",
  labelHe: "התא H1 מושך את ה-spend החזוי ליום הבא מבלוק ה-Forecast",
  answer: "=E2",
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H1 is empty. The first TimesFM prediction sits at `E2` (the Forecast block runs D1:E8). Use `=E2` so a fresh forecast refresh flows through without an edit.",
        detailHe:
          "התא H1 ריק. התחזית הראשונה של TimesFM יושבת ב-`E2` (בלוק ה-Forecast רץ על D1:E8). משתמשים ב-`=E2` כדי שרענון של תחזית חדשה יזרום בלי לגעת בנוסחה.",
      };
    }
    const normalized = normalizeFormula(formula);
    if (normalized == null || !/E2\b/.test(normalized)) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. The first forecasted day lives at \`E2\`. Reference that cell directly so a TimesFM rerun (which overwrites the Forecast block) updates the analysis automatically.`,
        detailHe: `התא H1 מכיל \`${formula}\`. היום הראשון בתחזית יושב ב-\`E2\`. מפנים ישירות לתא הזה כדי שריצה מחדש של TimesFM (שדורסת את בלוק ה-Forecast) תעדכן את הניתוח אוטומטית.`,
      };
    }
    const value = await sheet.cellValue("H1");
    if (!approxEqual(value, FIRST_FORECAST, 0.01)) {
      return {
        passed: false,
        detail: `H1 evaluates to \`${value}\` but should be \`${FIRST_FORECAST.toFixed(2)}\` (the first day in the Forecast block). Check that the formula points at \`E2\`, not a row inside the historical block.`,
        detailHe: `התא H1 מתוצא ל-\`${value}\` אבל צריך להיות \`${FIRST_FORECAST.toFixed(2)}\` (היום הראשון בבלוק ה-Forecast). יש לוודא שהנוסחה מצביעה על \`E2\`, לא על שורה בתוך הבלוק ההיסטורי.`,
      };
    }
    return { passed: true };
  },
};

const computesDelta: Rule = {
  id: "h2-computes-delta",
  label: "H2 computes the % delta between the forecast and the last actual",
  labelHe: "התא H2 מחשב את הפער באחוזים בין התחזית לבין ה-actual האחרון",
  answer: "=(E2-B31)/B31",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          "H2 is empty. The last observed actual is at `B31` (the 30th data row of the Daily Spend block). Use `=(E2-B31)/B31` to compute the percent change against the next forecasted day. Format the cell as a percent afterward.",
        detailHe:
          "התא H2 ריק. ה-actual האחרון יושב ב-`B31` (השורה ה-30 של בלוק ה-Daily Spend). משתמשים ב-`=(E2-B31)/B31` כדי לחשב את אחוז השינוי מול היום החזוי הראשון. אחר כך מפרמטים את התא כאחוז.",
      };
    }
    const normalized = normalizeFormula(formula);
    const hasForecastRef = normalized != null && /E2\b/.test(normalized);
    const hasActualRef = normalized != null && /B31\b/.test(normalized);
    if (!hasForecastRef || !hasActualRef) {
      return {
        passed: false,
        detail: `H2 contains \`${formula}\`. Reference both \`E2\` (the next-day forecast) and \`B31\` (the last observed actual). Hardcoded numbers go stale the moment the data refreshes.`,
        detailHe: `התא H2 מכיל \`${formula}\`. מפנים גם ל-\`E2\` (תחזית היום הבא) וגם ל-\`B31\` (ה-actual האחרון שנצפה). מספרים קשיחים מתיישנים ברגע שהנתונים מתרעננים.`,
      };
    }
    const value = await sheet.cellValue("H2");
    if (!approxEqual(value, EXPECTED_DELTA, 0.001)) {
      return {
        passed: false,
        detail: `H2 evaluates to \`${value}\` but should be ≈ \`${EXPECTED_DELTA.toFixed(4)}\` ((forecast - actual) / actual). The shape is the same as a ROI cell: difference divided by the baseline.`,
        detailHe: `התא H2 מתוצא ל-\`${value}\` אבל צריך להיות ≈ \`${EXPECTED_DELTA.toFixed(4)}\` ((תחזית - actual) / actual). הצורה זהה לתא ROI: הפרש חלקי ה-baseline.`,
      };
    }
    return { passed: true };
  },
};

const marksModel: Rule = {
  id: "h3-marks-model",
  label: "H3 marks the model used as TimesFM",
  labelHe: "התא H3 מסמן שהמודל בשימוש הוא TimesFM",
  answer: "TimesFM",
  async run(sheet) {
    const value = await sheet.cellValue("H3");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          "H3 is empty. Type the literal string `TimesFM` so anyone reading the audit later sees which model generated the forecast block. Models change every quarter; the column that names them is the one piece of metadata you cannot reconstruct from the numbers.",
        detailHe:
          "התא H3 ריק. מקלידים את המחרוזת `TimesFM` כדי שמי שיקרא את הביקורת אחר כך יראה איזה מודל יצר את בלוק התחזית. מודלים משתנים בכל רבעון, השם שלהם הוא ה-metadata היחיד שלא ניתן לשחזר מהמספרים.",
      };
    }
    if (typeof value !== "string") {
      return {
        passed: false,
        detail: `H3 holds \`${value}\` (a ${typeof value}). The cell should be the literal text \`TimesFM\`, not a number or a formula result.`,
        detailHe: `התא H3 מכיל \`${value}\` (מסוג ${typeof value}). התא צריך להיות הטקסט המילולי \`TimesFM\`, לא מספר או תוצאה של נוסחה.`,
      };
    }
    if (!value.toLowerCase().includes("timesfm")) {
      return {
        passed: false,
        detail: `H3 holds \`${value}\`. The text needs to contain \`TimesFM\` (case-insensitive). That is the name of the foundation model BigQuery ML invokes from Connected Sheets.`,
        detailHe: `התא H3 מכיל \`${value}\`. הטקסט צריך להכיל \`TimesFM\` (ללא תלות באותיות גדולות וקטנות). זה השם של ה-foundation model ש-BigQuery ML מפעיל מ-Connected Sheets.`,
      };
    }
    return { passed: true };
  },
};

// Seed cells: historical Daily Spend (A:B), Forecast block (D:E), labels (G).
const seedCells: SheetSeedCell[] = [];

// Historical block header.
seedCells.push({ a1: "A1", value: "Date" });
seedCells.push({ a1: "B1", value: "Spend" });
// Historical data rows.
for (let i = 0; i < TIMESERIES_ROWS.length; i++) {
  const row = TIMESERIES_ROWS[i]!;
  const sheetRow = i + 2;
  seedCells.push({ a1: `A${sheetRow}`, value: row[0] as string });
  seedCells.push({ a1: `B${sheetRow}`, value: row[1] as number });
}

// Forecast block header.
seedCells.push({ a1: "D1", value: "Forecast Date" });
seedCells.push({ a1: "E1", value: "Predicted Spend" });
// Forecast data rows.
for (let i = 0; i < FORECAST_DATES.length; i++) {
  const sheetRow = i + 2;
  seedCells.push({ a1: `D${sheetRow}`, value: FORECAST_DATES[i]! });
  seedCells.push({ a1: `E${sheetRow}`, value: FORECAST_VALUES[i]! });
}

// Analysis labels in column G; learner fills column H.
seedCells.push({ a1: "G1", value: "Next-day forecasted spend" });
seedCells.push({ a1: "G2", value: "% delta vs last actual" });
seedCells.push({ a1: "G3", value: "Model used" });

export const assignment: AssignmentSpec = {
  id: "scale-05-timesfm-forecasting",
  lessonSlug: "scale/05-timesfm-forecasting",
  templateSheetId: null,
  seed: {
    tabTitle: "Forecast",
    cells: seedCells,
  },
  rules: [pullsForecast, computesDelta, marksModel],
};
