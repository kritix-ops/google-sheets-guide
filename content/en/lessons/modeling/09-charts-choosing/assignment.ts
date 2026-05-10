import { CAMPAIGNS_TIMESERIES, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 9 grades two charts the learner inserts via Insert → Chart on a
// `Trend` tab seeded with CAMPAIGNS_TIMESERIES. The grader reads the embedded
// chart specs back via SheetReader.charts("Trend") and checks family,
// basicChartType, title, and anchor for each one.

function isAnchoredNear(
  anchorCell: string | null,
  expectedColumn: string,
): boolean {
  if (anchorCell == null) return false;
  // Accept any cell in the expected column (e.g. "H1", "H2"). Real charts
  // rarely land exactly on the cell the learner picked because the Sheets UI
  // snaps anchors when the chart is moved or resized.
  const match = anchorCell.match(/^([A-Z]+)\d+$/i);
  if (!match) return false;
  return match[1]!.toUpperCase() === expectedColumn.toUpperCase();
}

const revenueLineChart: Rule = {
  id: "trend-revenue-line",
  label: "Trend tab has a LINE chart of Revenue over time, anchored at H1",
  labelHe:
    "בגיליון Trend יש LINE chart של revenue לאורך הזמן, מעוגן ב-H1",
  answer:
    "Insert → Chart → Line chart over Trend!A1:C31 (Date + Revenue), title contains 'Revenue', anchor H1",
  async run(sheet) {
    const charts = await sheet.charts("Trend");
    if (charts.length === 0) {
      return {
        passed: false,
        detail:
          "No charts found on the Trend tab. Insert → Chart while a cell on Trend is selected, pick Line chart, and use Date as the X-axis with Revenue as the series.",
        detailHe:
          "לא נמצאו charts בגיליון Trend. בוחרים תא בגיליון Trend, Insert → Chart, סוג Line, ציר X הוא Date והסדרה היא Revenue.",
      };
    }
    const lineCharts = charts.filter(
      (c) => c.family === "basic" && c.basicChartType === "LINE",
    );
    if (lineCharts.length === 0) {
      const types = charts
        .map((c) => c.basicChartType ?? c.family)
        .filter(Boolean)
        .join(", ");
      return {
        passed: false,
        detail: `No LINE chart found on Trend; the lesson asks for a Revenue trend line. Existing chart types on the tab: ${types || "(none recognized)"}. Insert → Chart → Chart type → Line chart.`,
        detailHe: `לא נמצא LINE chart בגיליון Trend, והשיעור מבקש קו של revenue לאורך הזמן. סוגי ה-charts הקיימים בגיליון: ${types || "(לא מזוהים)"}. Insert → Chart → Chart type → Line chart.`,
      };
    }
    const titled = lineCharts.find((c) =>
      (c.title ?? "").toLowerCase().includes("revenue"),
    );
    if (!titled) {
      const existingTitles = lineCharts
        .map((c) => c.title ?? "(untitled)")
        .join(" | ");
      return {
        passed: false,
        detail: `A LINE chart exists on Trend, but its title doesn't mention Revenue (got: ${existingTitles}). Double-click the chart, open the Setup panel, and set the title to something like \`Daily Revenue\` so the chart's purpose is obvious at a glance.`,
        detailHe: `יש LINE chart בגיליון Trend, אבל הכותרת לא מזכירה revenue (קיבלנו: ${existingTitles}). דאבל-קליק על ה-chart, פותחים את ה-Setup ומגדירים כותרת כמו \`Daily Revenue\` כדי שמטרת ה-chart תהיה ברורה במבט אחד.`,
      };
    }
    if (!isAnchoredNear(titled.anchorCell, "H")) {
      return {
        passed: false,
        detail: `The Revenue line chart is anchored at \`${titled.anchorCell ?? "(unknown)"}\` instead of column H. Drag the chart so its top-left corner sits in column H (around \`H1\`), keeping it next to the data but out of the way of new rows.`,
        detailHe: `ה-LINE chart של revenue מעוגן ב-\`${titled.anchorCell ?? "(לא ידוע)"}\` במקום בעמודה H. גוררים את ה-chart כך שהפינה השמאלית העליונה שלו בעמודה H (בערך \`H1\`), צמוד לנתונים ומחוץ לדרך של שורות חדשות.`,
      };
    }
    return { passed: true };
  },
};

const conversionsColumnChart: Rule = {
  id: "trend-conversions-column",
  label:
    "Trend tab has a COLUMN chart of daily Conversions, anchored at H20",
  labelHe:
    "בגיליון Trend יש COLUMN chart של conversions יומיים, מעוגן ב-H20",
  answer:
    "Insert → Chart → Column chart over Trend!A1:A31 + F1:F31 (Date + Conversions), title contains 'Conversion', anchor H20",
  async run(sheet) {
    const charts = await sheet.charts("Trend");
    const columnCharts = charts.filter(
      (c) => c.family === "basic" && c.basicChartType === "COLUMN",
    );
    if (columnCharts.length === 0) {
      const types = charts
        .map((c) => c.basicChartType ?? c.family)
        .filter(Boolean)
        .join(", ");
      return {
        passed: false,
        detail: `No COLUMN chart found on Trend; the lesson asks for a daily Conversions comparison. Existing chart types on the tab: ${types || "(none)"}. Insert → Chart → Chart type → Column chart. Note: BAR is horizontal, COLUMN is vertical: the lesson wants COLUMN.`,
        detailHe: `לא נמצא COLUMN chart בגיליון Trend, והשיעור מבקש השוואת conversions יומיים. סוגי charts קיימים בגיליון: ${types || "(אין)"}. Insert → Chart → Chart type → Column chart. שימו לב: BAR אופקי, COLUMN אנכי, והשיעור מבקש COLUMN.`,
      };
    }
    const titled = columnCharts.find((c) =>
      (c.title ?? "").toLowerCase().includes("conversion"),
    );
    if (!titled) {
      const existingTitles = columnCharts
        .map((c) => c.title ?? "(untitled)")
        .join(" | ");
      return {
        passed: false,
        detail: `A COLUMN chart exists on Trend, but its title doesn't mention Conversion (got: ${existingTitles}). Set a title like \`Daily Conversions\` so a stranger reading the dashboard knows what the bars mean.`,
        detailHe: `יש COLUMN chart בגיליון Trend, אבל הכותרת לא מזכירה conversion (קיבלנו: ${existingTitles}). מגדירים כותרת כמו \`Daily Conversions\` כדי שמי שיפתח את ה-dashboard ידע מיד מה הברים מייצגים.`,
      };
    }
    if (!isAnchoredNear(titled.anchorCell, "H")) {
      return {
        passed: false,
        detail: `The Conversions column chart is anchored at \`${titled.anchorCell ?? "(unknown)"}\` instead of column H. Drag it so its top-left corner sits in column H, below the Revenue chart (around \`H20\`).`,
        detailHe: `ה-COLUMN chart של conversions מעוגן ב-\`${titled.anchorCell ?? "(לא ידוע)"}\` במקום בעמודה H. גוררים אותו כך שהפינה השמאלית העליונה בעמודה H, מתחת ל-chart של revenue (בערך \`H20\`).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-09-charts-choosing",
  lessonSlug: "modeling/09-charts-choosing",
  templateSheetId: null,
  seed: {
    tabTitle: "Trend",
    cells: [
      ...dataToCells(CAMPAIGNS_TIMESERIES),
      // Quick instructions seeded off to the right so they're visible when the
      // learner first opens the tab.
      { a1: "H1", value: "→ Insert two charts on this tab:" },
      { a1: "H2", value: "1) LINE chart of Revenue (column C) over Date (column A). Anchor H1." },
      { a1: "H3", value: "2) COLUMN chart of Conversions (column F) by Date (column A). Anchor H20." },
      { a1: "H4", value: "Title each chart clearly. The grader checks family, type, title, and anchor." },
    ],
  },
  rules: [revenueLineChart, conversionsColumnChart],
};
