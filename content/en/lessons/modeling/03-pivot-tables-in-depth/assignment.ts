import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 3 grades a richer pivot than lesson 2: three values stacked vertically
// (SUM Spend, SUM Revenue, and a calculated ROI field), filtered to two
// countries (DE and UK) via the visibleValues form.
//
// Column offsets in the source A1:G61 (0-indexed):
//   0=Date  1=Buyer  2=Vertical  3=Platform  4=Country  5=Spend  6=Revenue

const SOURCE_RANGE_PARTS = [
  "Campaigns!A1:G61",
  "A1:G61", // accepts the unqualified form too
];

function rangeMatches(actual: string): boolean {
  return SOURCE_RANGE_PARTS.some((expected) => actual === expected);
}

const pivotAnchor: Rule = {
  id: "k1-pivot-anchor",
  label: "K1 is the anchor of a pivot table sourced from Campaigns!A1:G61, with Buyer on Rows",
  labelHe:
    "התא K1 הוא העוגן של pivot table שמקורו ב-Campaigns!A1:G61, עם Buyer ב-Rows",
  answer:
    "Insert → Pivot table → Existing sheet, K1 → Data range Campaigns!A1:G61. Pivot editor → Rows → Add Buyer.",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) {
      return {
        passed: false,
        detail:
          "K1 is not the anchor of a pivot table. Insert → Pivot table, pick Existing sheet, put it at K1, source Campaigns!A1:G61, then add Buyer to Rows.",
        detailHe:
          "התא K1 הוא לא העוגן של pivot table. Insert → Pivot table, בוחרים Existing sheet, ממקמים ב-K1, מקור Campaigns!A1:G61, ואז מוסיפים Buyer ל-Rows.",
      };
    }
    if (!rangeMatches(pt.source)) {
      return {
        passed: false,
        detail: `The pivot at K1 reads from \`${pt.source}\`. The lesson uses the bounded \`Campaigns!A1:G61\` so the pivot doesn't recompute against empty rows below.`,
        detailHe: `ה-pivot ב-K1 קורא מ-\`${pt.source}\`. השיעור משתמש בטווח החסום \`Campaigns!A1:G61\` כדי שה-pivot לא יחשב מחדש על שורות ריקות למטה.`,
      };
    }
    // Buyer is column B in the source = 0-indexed column 1.
    const hasBuyer = pt.rows.some((g) => g.sourceColumn === 1);
    if (!hasBuyer) {
      const cols = pt.rows.map((g) => g.sourceColumn).join(", ") || "none";
      return {
        passed: false,
        detail: `The pivot's Rows group(s) reference source column offset(s) ${cols}. Buyer is column B (offset 1). Pivot editor → Rows → Add → Buyer.`,
        detailHe: `קיבוצי השורות של ה-pivot מצביעים על column offset ${cols}. Buyer הוא עמודה B (offset 1). Pivot editor → Rows → Add → Buyer.`,
      };
    }
    return { passed: true };
  },
};

const pivotSumValues: Rule = {
  id: "k1-pivot-sum-values",
  label: "Values include SUM of Spend and SUM of Revenue",
  labelHe: "ה-Values כוללים SUM של Spend ו-SUM של Revenue",
  answer:
    "Pivot editor → Values → Add Spend (summarize SUM), then Add Revenue (summarize SUM)",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) {
      return {
        passed: false,
        detail: "No pivot at K1 yet. Start with the K1 anchor task first.",
        detailHe: "אין pivot ב-K1 עדיין. מתחילים מהמשימה של עוגן K1 קודם.",
      };
    }
    // Spend is column F = 0-indexed 5; Revenue is column G = 0-indexed 6.
    const hasSumSpend = pt.values.some(
      (v) => v.summarize === "SUM" && v.sourceColumn === 5,
    );
    const hasSumRevenue = pt.values.some(
      (v) => v.summarize === "SUM" && v.sourceColumn === 6,
    );
    if (!hasSumSpend && !hasSumRevenue) {
      return {
        passed: false,
        detail:
          "The pivot has no SUM Spend and no SUM Revenue values. Pivot editor → Values → Add → Spend (SUM), then Add → Revenue (SUM).",
        detailHe:
          "ל-pivot אין SUM Spend ואין SUM Revenue. Pivot editor → Values → Add → Spend (SUM), ואז Add → Revenue (SUM).",
      };
    }
    if (!hasSumSpend) {
      return {
        passed: false,
        detail:
          "SUM of Spend is missing. Pivot editor → Values → Add → Spend, summarize by SUM. Spend is column F (offset 5).",
        detailHe:
          "חסר SUM של Spend. Pivot editor → Values → Add → Spend, summarize ב-SUM. Spend הוא עמודה F (offset 5).",
      };
    }
    if (!hasSumRevenue) {
      return {
        passed: false,
        detail:
          "SUM of Revenue is missing. Pivot editor → Values → Add → Revenue, summarize by SUM. Revenue is column G (offset 6).",
        detailHe:
          "חסר SUM של Revenue. Pivot editor → Values → Add → Revenue, summarize ב-SUM. Revenue הוא עמודה G (offset 6).",
      };
    }
    return { passed: true };
  },
};

const pivotCalculatedRoi: Rule = {
  id: "k1-pivot-calculated-roi",
  label:
    "A calculated field computes ROI from 'Revenue' and 'Spend' (summarize CUSTOM)",
  labelHe:
    "calculated field מחשב ROI מתוך 'Revenue' ו-'Spend' (summarize CUSTOM)",
  answer:
    "Pivot editor → Values → Add → Calculated field. Formula: =('Revenue' - 'Spend') / 'Spend'  (or  ='Revenue'/'Spend' - 1)",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) return { passed: false };
    const customs = pt.values.filter((v) => v.summarize === "CUSTOM");
    if (customs.length === 0) {
      // Surface the case where the learner used a SUM column instead of a
      // calculated field. Common shortcut and worth calling out.
      return {
        passed: false,
        detail:
          "No calculated field on the pivot. ROI is a ratio, not a column to SUM. Pivot editor → Values → Add → Calculated field, then write `=('Revenue' - 'Spend') / 'Spend'` (or `='Revenue'/'Spend' - 1`). Single-quoted column names are case-sensitive.",
        detailHe:
          "אין calculated field ב-pivot. ROI הוא יחס, לא עמודה ל-SUM. Pivot editor → Values → Add → Calculated field, ואז כותבים `=('Revenue' - 'Spend') / 'Spend'` (או `='Revenue'/'Spend' - 1`). שמות עמודות בגרשיים יחידים, case-sensitive.",
      };
    }
    const ok = customs.find((v) => {
      const f = v.formula ?? "";
      return f.includes("'Revenue'") && f.includes("'Spend'");
    });
    if (!ok) {
      const seen = customs
        .map((v) => `\`${v.formula ?? "(no formula)"}\``)
        .join(", ");
      return {
        passed: false,
        detail: `A calculated field exists, but its formula doesn't reference both \`'Revenue'\` and \`'Spend'\`. Saw: ${seen}. The names must be single-quoted and match the source headers exactly (case-sensitive).`,
        detailHe: `קיים calculated field, אבל הנוסחה שלו לא מפנה גם ל-\`'Revenue'\` וגם ל-\`'Spend'\`. ראינו: ${seen}. השמות חייבים להיות בגרשיים יחידים ולהתאים לכותרות המקור בדיוק (case-sensitive).`,
      };
    }
    return { passed: true };
  },
};

const pivotCountryFilter: Rule = {
  id: "k1-pivot-country-filter",
  label: "A Filter on Country restricts the pivot to DE and UK",
  labelHe: "filter על Country מצמצם את ה-pivot ל-DE ו-UK בלבד",
  answer:
    "Pivot editor → Filters → Add → Country. Filter by values: keep DE and UK checked, uncheck the rest.",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) return { passed: false };
    if (pt.filters.length === 0) {
      return {
        passed: false,
        detail:
          "The pivot has no Filters. Pivot editor → Filters → Add → Country, then use \"Filter by values\" and keep only DE and UK checked.",
        detailHe:
          "ל-pivot אין Filters. Pivot editor → Filters → Add → Country, ואז משתמשים ב-\"Filter by values\" ומשאירים מסומנים רק DE ו-UK.",
      };
    }
    // Country is column E = 0-indexed 4.
    const countryFilter = pt.filters.find((f) => f.sourceColumn === 4);
    if (!countryFilter) {
      const cols = pt.filters.map((f) => f.sourceColumn).join(", ");
      return {
        passed: false,
        detail: `The pivot has filter(s) on source column offset(s) ${cols}, but none on Country (offset 4). Add a Filter on Country.`,
        detailHe: `ל-pivot יש filter על column offset ${cols}, אבל אין על Country (offset 4). מוסיפים filter על Country.`,
      };
    }
    const visible = countryFilter.visibleValues;
    const missing = ["DE", "UK"].filter((v) => !visible.includes(v));
    if (missing.length > 0) {
      return {
        passed: false,
        detail: `The Country filter's visible values are [${visible.join(", ") || "(empty)"}]. The lesson keeps DE and UK only. Missing: ${missing.join(", ")}. Use "Filter by values" and tick DE and UK.`,
        detailHe: `הערכים הגלויים של filter ה-Country הם [${visible.join(", ") || "(ריק)"}]. השיעור משאיר DE ו-UK בלבד, חסרים: ${missing.join(", ")}. משתמשים ב-"Filter by values" ומסמנים DE ו-UK.`,
      };
    }
    return { passed: true };
  },
};

const pivotVerticalLayout: Rule = {
  id: "k1-pivot-vertical-layout",
  label: "Value layout is VERTICAL (values stack as rows, not columns)",
  labelHe: "Value layout הוא VERTICAL (ה-values נערמים כשורות, לא כעמודות)",
  answer:
    "Pivot editor → Values → switch the layout toggle to \"As rows\" (VERTICAL).",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) return { passed: false };
    if (pt.valueLayout !== "VERTICAL") {
      return {
        passed: false,
        detail: `The pivot's value layout is \`${pt.valueLayout}\`. With three values (SUM Spend, SUM Revenue, ROI), HORIZONTAL spreads them across columns and the pivot widens fast. In the Pivot editor, switch the Values layout to "As rows" so they stack vertically.`,
        detailHe: `value layout של ה-pivot הוא \`${pt.valueLayout}\`. עם שלושה values (SUM Spend, SUM Revenue, ROI), HORIZONTAL פורש אותם על פני עמודות וה-pivot מתרחב מהר. ב-Pivot editor, מחליפים את ה-Values layout ל-"As rows" כדי שיערמו אנכית.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-03-pivot-tables-in-depth",
  lessonSlug: "modeling/03-pivot-tables-in-depth",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      { a1: "I1", value: "→ Anchor a pivot table at K1." },
      { a1: "I2", value: "Source: Campaigns!A1:G61   Rows: Buyer" },
      { a1: "I3", value: "Values: SUM Spend, SUM Revenue, ROI (calculated)" },
      { a1: "I4", value: "ROI formula: =('Revenue' - 'Spend') / 'Spend'" },
      { a1: "I5", value: "Filter: Country in {DE, UK}" },
      { a1: "I6", value: "Layout: values As rows (VERTICAL)" },
    ],
  },
  rules: [
    pivotAnchor,
    pivotSumValues,
    pivotCalculatedRoi,
    pivotCountryFilter,
    pivotVerticalLayout,
  ],
};
