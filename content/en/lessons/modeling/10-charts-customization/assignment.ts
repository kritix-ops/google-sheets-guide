import { CAMPAIGNS_TIMESERIES, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 10 grades a customized COMBO chart the learner builds via Insert →
// Chart on a "Trend" tab seeded from CAMPAIGNS_TIMESERIES. The grader reads
// the chart back via SheetReader.charts("Trend") and checks four properties
// exposed on the slim ChartSpec: basicChartType, seriesCount, legendPosition,
// and title. Anchor cell and other layout details are not graded. The grader
// only verifies the shape that signals "this is the customized multi-axis
// trend the lesson asked for".

const TREND_SHEET = "Trend";

const comboChartType: Rule = {
  id: "trend-chart-combo",
  label: "Trend!K1 holds a COMBO chart (the multi-axis pattern)",
  labelHe: "התא Trend!K1 מחזיק COMBO chart (התבנית הרב-צירית)",
  answer:
    "Insert → Chart → Setup → Chart type: Combo chart, anchored at Trend!K1",
  async run(sheet) {
    const charts = await sheet.charts(TREND_SHEET);
    if (charts.length === 0) {
      return {
        passed: false,
        detail:
          "No chart found on the Trend tab. Insert a chart there (Insert → Chart) and set Chart type to Combo chart so you can mix lines and columns on per-series basis.",
        detailHe:
          "לא נמצא chart על גיליון Trend. מכניסים chart שם (Insert → Chart) ומגדירים Chart type ל-Combo chart, כדי שאפשר יהיה לערבב lines ו-columns ברמת כל סדרה.",
      };
    }
    const combo = charts.find(
      (c) => c.family === "basic" && c.basicChartType === "COMBO",
    );
    if (!combo) {
      const first = charts[0]!;
      return {
        passed: false,
        detail: `Trend has a chart of type ${first.basicChartType ?? first.family}, not COMBO. The lesson needs a Combo chart because it's the only basic type that lets you assign different chart shapes (line vs columns) to different series, which is what makes the multi-metric trend readable.`,
        detailHe: `על Trend יש chart מסוג ${first.basicChartType ?? first.family}, לא COMBO. השיעור דורש Combo chart, כי זה הסוג הבסיסי היחיד שמאפשר לשייך צורות chart שונות (line מול columns) לסדרות שונות, וזה מה שהופך את ה-trend הרב-מטרי לקריא.`,
      };
    }
    return { passed: true };
  },
};

const comboSeriesCount: Rule = {
  id: "trend-chart-series-count",
  label: "The COMBO chart plots at least 3 metrics (Spend, Revenue, plus one more)",
  labelHe:
    "ה-COMBO chart משרטט לפחות 3 מטריקות (Spend, Revenue, ועוד אחת)",
  answer:
    "Chart editor → Setup → Series: include at least three of Spend, Revenue, Clicks, Conversions",
  async run(sheet) {
    const charts = await sheet.charts(TREND_SHEET);
    const combo = charts.find(
      (c) => c.family === "basic" && c.basicChartType === "COMBO",
    );
    if (!combo) {
      return {
        passed: false,
        detail:
          "Can't count series until the chart is a Combo chart. Fix the chart type first, then add at least three series from Spend, Revenue, Clicks, Conversions.",
        detailHe:
          "אי אפשר לספור סדרות לפני שה-chart הוא Combo chart. מתקנים קודם את סוג ה-chart, ואז מוסיפים לפחות שלוש סדרות מתוך Spend, Revenue, Clicks, Conversions.",
      };
    }
    if (combo.seriesCount < 3) {
      return {
        passed: false,
        detail: `The Combo chart plots ${combo.seriesCount} series. A two-series combo doesn't tell a multi-metric story. Add Spend, Revenue, plus at least one of Clicks or Conversions so the chart actually earns its multi-axis layout.`,
        detailHe: `ה-Combo chart משרטט ${combo.seriesCount} סדרות. combo בן שתי סדרות לא מספר סיפור רב-מטרי. מוסיפים Spend, Revenue, ועוד לפחות אחת מתוך Clicks או Conversions כדי שה-chart באמת ינצל את המבנה הרב-צירי שלו.`,
      };
    }
    return { passed: true };
  },
};

const comboLegendPosition: Rule = {
  id: "trend-chart-legend-bottom",
  label: "The COMBO chart's legend sits at the bottom (BOTTOM_LEGEND)",
  labelHe: "ה-legend של ה-COMBO chart יושב בתחתית (BOTTOM_LEGEND)",
  answer:
    "Chart editor → Customize → Legend → Position: Bottom (BOTTOM_LEGEND)",
  async run(sheet) {
    const charts = await sheet.charts(TREND_SHEET);
    const combo = charts.find(
      (c) => c.family === "basic" && c.basicChartType === "COMBO",
    );
    if (!combo) {
      return {
        passed: false,
        detail:
          "Can't check legend position until the chart is a Combo chart. Fix the chart type first, then set Customize → Legend → Position to Bottom.",
        detailHe:
          "אי אפשר לבדוק מיקום legend לפני שה-chart הוא Combo chart. מתקנים קודם את סוג ה-chart, ואז מגדירים את Customize → Legend → Position ל-Bottom.",
      };
    }
    if (combo.legendPosition !== "BOTTOM_LEGEND") {
      return {
        passed: false,
        detail: `The Combo chart's legend is set to ${combo.legendPosition ?? "none"}. Switch it to Bottom (BOTTOM_LEGEND) in Customize → Legend → Position. The team default is Bottom because charts get embedded in wide-but-short report frames where a right legend eats the plot area.`,
        detailHe: `ה-legend של ה-Combo chart מוגדר ל-${combo.legendPosition ?? "none"}. עוברים ל-Bottom (BOTTOM_LEGEND) ב-Customize → Legend → Position. ברירת המחדל של הצוות היא Bottom, כי charts מוטמעים במסגרות דוח רחבות-נמוכות שבהן legend מימין אוכל את שטח השרטוט.`,
      };
    }
    return { passed: true };
  },
};

const comboTitle: Rule = {
  id: "trend-chart-title-performance",
  label: 'The chart title contains the word "performance" (case-insensitive)',
  labelHe: 'כותרת ה-chart מכילה את המילה "performance" (לא תלוי רישיות)',
  answer:
    'Chart editor → Customize → Chart & axis titles → Chart title: e.g. "April performance trend"',
  async run(sheet) {
    const charts = await sheet.charts(TREND_SHEET);
    const combo = charts.find(
      (c) => c.family === "basic" && c.basicChartType === "COMBO",
    );
    if (!combo) {
      return {
        passed: false,
        detail:
          "Can't check the title until the chart is a Combo chart. Fix the chart type first, then set a title that contains the word 'performance' in Customize → Chart & axis titles.",
        detailHe:
          "אי אפשר לבדוק כותרת לפני שה-chart הוא Combo chart. מתקנים קודם את סוג ה-chart, ואז מגדירים כותרת שמכילה את המילה 'performance' ב-Customize → Chart & axis titles.",
      };
    }
    if (combo.title == null || combo.title.trim().length === 0) {
      return {
        passed: false,
        detail:
          "The Combo chart has no title. A chart without a title leaves the viewer guessing what they're looking at. Add a title that contains the word 'performance' (e.g. 'April performance trend').",
        detailHe:
          "ל-Combo chart אין כותרת. chart בלי כותרת משאיר את הצופה לנחש על מה הוא מסתכל. מוסיפים כותרת שמכילה את המילה 'performance' (למשל 'April performance trend').",
      };
    }
    if (!combo.title.toLowerCase().includes("performance")) {
      return {
        passed: false,
        detail: `The Combo chart's title is "${combo.title}". The lesson asks for a title that includes the word "performance" (case-insensitive) so the chart's purpose is obvious to the reader. Examples: "April performance trend", "Daily campaign performance".`,
        detailHe: `כותרת ה-Combo chart היא "${combo.title}". השיעור דורש כותרת שמכילה את המילה "performance" (לא תלוי רישיות), כדי שמטרת ה-chart תהיה ברורה לקורא. דוגמאות: "April performance trend", "Daily campaign performance".`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-10-charts-customization",
  lessonSlug: "modeling/10-charts-customization",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_TIMESERIES),
      // The Trend tab gets created by the learner. The hint column on the
      // seeded tab lists the four properties the grader will check.
      { a1: "L1", value: "→ Create a tab named 'Trend', paste this data there, then build:" },
      { a1: "L2", value: "K1: a COMBO chart" },
      { a1: "L3", value: "with at least 3 series (Spend, Revenue, plus Clicks or Conversions)" },
      { a1: "L4", value: "title containing 'performance'" },
      { a1: "L5", value: "legend position: Bottom" },
    ],
  },
  rules: [comboChartType, comboSeriesCount, comboLegendPosition, comboTitle],
};
