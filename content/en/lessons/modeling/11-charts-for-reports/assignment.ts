import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 11 grades a single report-ready bar chart the learner inserts on the
// Campaigns tab. The grader reads charts back via SheetReader.charts and
// checks the three report conventions covered in the lesson: a BAR chart (so
// the buyer names sit on the long axis where they read cleanly), a title that
// names the time period (so the chart self-documents when it lands in a
// Slides deck), and NO_LEGEND (because a single-series bar chart with a
// legend just wastes pixels in an export).

const QUARTER_TOKENS = ["Q1", "Q2", "Q3", "Q4"] as const;

function titleMentionsAnyQuarter(title: string | null): boolean {
  if (title == null) return false;
  const upper = title.toUpperCase();
  return QUARTER_TOKENS.some((q) => upper.includes(q));
}

const reportBarChart: Rule = {
  id: "campaigns-report-bar-chart",
  label: "Campaigns has a BAR chart for the report",
  labelHe: "בגיליון Campaigns יש BAR chart לדוח",
  answer:
    "Insert → Chart → Chart type → Bar chart over Campaigns!B1:B61 + F1:F61 (Buyer + Spend), anchor J1",
  async run(sheet) {
    const charts = await sheet.charts("Campaigns");
    if (charts.length === 0) {
      return {
        passed: false,
        detail:
          "No charts found on Campaigns. Select Campaigns!B1:B61 plus F1:F61, then Insert → Chart and switch Chart type to Bar chart so the buyer names sit on the long axis.",
        detailHe:
          "לא נמצאו charts בגיליון Campaigns. בוחרים את Campaigns!B1:B61 יחד עם F1:F61, ואז Insert → Chart ומשנים את Chart type ל-Bar chart כדי שהשמות של ה-media buyers ישבו על הציר הארוך.",
      };
    }
    const bar = charts.find(
      (c) => c.family === "basic" && c.basicChartType === "BAR",
    );
    if (!bar) {
      const types = charts
        .map((c) => c.basicChartType ?? c.family)
        .filter(Boolean)
        .join(", ");
      return {
        passed: false,
        detail: `No BAR chart on Campaigns; existing chart types: ${types || "(none recognized)"}. For a report, bar (horizontal) reads buyer names better than column (vertical). Insert → Chart → Chart type → Bar chart.`,
        detailHe: `אין BAR chart בגיליון Campaigns; סוגי charts קיימים: ${types || "(לא מזוהים)"}. בדוח, bar (אופקי) קורא שמות media buyers טוב יותר מ-column (אנכי). Insert → Chart → Chart type → Bar chart.`,
      };
    }
    return { passed: true };
  },
};

const reportChartTitleQuarter: Rule = {
  id: "campaigns-report-bar-chart-title-quarter",
  label: "Report chart title names the quarter (e.g. 'Q2 2026')",
  labelHe: "כותרת ה-chart לדוח מציינת את הרבעון (לדוגמה 'Q2 2026')",
  answer:
    'Double-click the chart → Chart & axis titles → Chart title → "Spend by Buyer, Q2 2026"',
  async run(sheet) {
    const charts = await sheet.charts("Campaigns");
    const bar = charts.find(
      (c) => c.family === "basic" && c.basicChartType === "BAR",
    );
    if (!bar) {
      return {
        passed: false,
        detail:
          "No BAR chart on Campaigns yet; once the chart exists, give it a title that names the quarter (e.g. `Spend by Buyer, Q2 2026`).",
        detailHe:
          "עדיין אין BAR chart בגיליון Campaigns; ברגע שה-chart קיים, נותנים לו כותרת שמציינת את הרבעון (לדוגמה `Spend by Buyer, Q2 2026`).",
      };
    }
    if (!titleMentionsAnyQuarter(bar.title)) {
      const got = bar.title ?? "(untitled)";
      return {
        passed: false,
        detail: `The bar chart's title is \`${got}\`. Report charts need the time period baked into the title so they self-document on a slide. Edit the title to include \`Q1\`, \`Q2\`, \`Q3\`, or \`Q4\` (e.g. \`Spend by Buyer, Q2 2026\`).`,
        detailHe: `כותרת ה-BAR chart היא \`${got}\`. כותרות של charts לדוחות צריכות לכלול את תקופת הזמן כדי שה-chart יסביר את עצמו על שקופית. עורכים את הכותרת כך שתכלול \`Q1\`, \`Q2\`, \`Q3\` או \`Q4\` (לדוגמה \`Spend by Buyer, Q2 2026\`).`,
      };
    }
    return { passed: true };
  },
};

const reportChartNoLegend: Rule = {
  id: "campaigns-report-bar-chart-no-legend",
  label: "Report chart legend is set to None (NO_LEGEND)",
  labelHe: "ה-legend של ה-chart לדוח מוגדר ל-None (NO_LEGEND)",
  answer:
    "Double-click the chart → Customize → Legend → Position: None",
  async run(sheet) {
    const charts = await sheet.charts("Campaigns");
    const bar = charts.find(
      (c) => c.family === "basic" && c.basicChartType === "BAR",
    );
    if (!bar) {
      return {
        passed: false,
        detail:
          "No BAR chart on Campaigns yet; once the chart exists, set its Legend → Position to None so the export doesn't carry an empty `Spend` swatch.",
        detailHe:
          "עדיין אין BAR chart בגיליון Campaigns; ברגע שה-chart קיים, מגדירים את Legend → Position ל-None כדי שהייצוא לא יסחוב איתו תווית `Spend` ריקה.",
      };
    }
    if (bar.legendPosition !== "NO_LEGEND") {
      const got = bar.legendPosition ?? "(unset)";
      return {
        passed: false,
        detail: `The bar chart's legend position is \`${got}\`. With one series the legend just repeats the title; the team convention for single-series report charts is \`NO_LEGEND\`. Double-click the chart → Customize → Legend → Position: None.`,
        detailHe: `מיקום ה-legend של ה-BAR chart הוא \`${got}\`. עם סדרה אחת ה-legend רק חוזר על הכותרת; מוסכמת הצוות ל-charts לדוחות עם סדרה יחידה היא \`NO_LEGEND\`. דאבל-קליק על ה-chart → Customize → Legend → Position: None.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-11-charts-for-reports",
  lessonSlug: "modeling/11-charts-for-reports",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Quick instructions seeded off to the right of the data so they're
      // visible the moment the learner opens the tab.
      { a1: "J1", value: "→ Build one report-ready BAR chart here:" },
      { a1: "J2", value: "1) Chart type: Bar (horizontal). Source: Buyer (B) + Spend (F)." },
      { a1: "J3", value: "2) Title names the quarter, e.g. `Spend by Buyer, Q2 2026`." },
      { a1: "J4", value: "3) Customize → Legend → Position: None (single series, no legend)." },
      { a1: "J5", value: "Grader checks the bar chart type, the quarter in the title, and the legend." },
    ],
  },
  rules: [reportBarChart, reportChartTitleQuarter, reportChartNoLegend],
};
