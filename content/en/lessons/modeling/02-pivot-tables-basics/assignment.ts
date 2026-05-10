import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 2 grades a pivot table the learner builds via Data → Pivot table in
// the Sheets UI. CAMPAIGNS_LARGE seeds the Campaigns tab; the learner anchors
// a pivot at K1 on the same sheet (visually separated from the raw rectangle
// by an empty H column and several empty I/J columns).
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
  label: "K1 is the anchor of a pivot table sourced from Campaigns!A1:G61",
  labelHe: "התא K1 הוא העוגן של pivot table שמקורו ב-Campaigns!A1:G61",
  answer:
    "Insert → Pivot table → Existing sheet, K1 → Data range Campaigns!A1:G61",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) {
      return {
        passed: false,
        detail:
          "K1 is not the anchor of a pivot table. Insert → Pivot table, pick Existing sheet, put it at K1, and source from Campaigns!A1:G61. The pivot's top-left cell IS K1; you don't write a formula there.",
        detailHe:
          "התא K1 הוא לא העוגן של pivot table. Insert → Pivot table, בוחרים Existing sheet, ממקמים ב-K1, ומקור Campaigns!A1:G61. הפינה השמאלית-עליונה של ה-pivot היא K1 עצמה, לא כותבים שם נוסחה.",
      };
    }
    if (!rangeMatches(pt.source)) {
      return {
        passed: false,
        detail: `The pivot at K1 reads from \`${pt.source}\`. The lesson uses the bounded \`Campaigns!A1:G61\` so the pivot doesn't recompute against empty rows below.`,
        detailHe: `ה-pivot ב-K1 קורא מ-\`${pt.source}\`. השיעור משתמש בטווח החסום \`Campaigns!A1:G61\` כדי שה-pivot לא יחשב מחדש על שורות ריקות למטה.`,
      };
    }
    return { passed: true };
  },
};

const pivotRowsBuyer: Rule = {
  id: "k1-pivot-rows-buyer",
  label: "The pivot's Rows group is the Buyer column",
  labelHe: "הקבוצה Rows של ה-pivot היא עמודת ה-Buyer",
  answer: "Pivot editor → Rows → Add Buyer (column B)",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) {
      return {
        passed: false,
        detail: "No pivot at K1 yet: start with the K1 anchor task first.",
        detailHe: "אין pivot ב-K1 עדיין. מתחילים מהמשימה של עוגן K1 קודם.",
      };
    }
    if (pt.rows.length === 0) {
      return {
        passed: false,
        detail:
          "The pivot has no row groupings. In the Pivot editor on the right, click Rows → Add and pick Buyer.",
        detailHe:
          "ל-pivot אין קיבוצי שורות. ב-Pivot editor מימין, לוחצים על Rows → Add ובוחרים Buyer.",
      };
    }
    // Buyer is column B in the source = 0-indexed column 1.
    const hasBuyer = pt.rows.some((g) => g.sourceColumn === 1);
    if (!hasBuyer) {
      const cols = pt.rows.map((g) => g.sourceColumn).join(", ");
      return {
        passed: false,
        detail: `The pivot's Rows group(s) reference source column offset(s) ${cols}. Buyer is column B (offset 1). Remove the wrong group and add Buyer.`,
        detailHe: `קיבוצי השורות של ה-pivot מצביעים על column offset ${cols}. Buyer הוא עמודה B (offset 1). מסירים את הקבוצה הלא נכונה ומוסיפים Buyer.`,
      };
    }
    return { passed: true };
  },
};

const pivotColumnsPlatform: Rule = {
  id: "k1-pivot-columns-platform",
  label: "The pivot's Columns group is the Platform column",
  labelHe: "הקבוצה Columns של ה-pivot היא עמודת ה-Platform",
  answer: "Pivot editor → Columns → Add Platform (column D)",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) return { passed: false };
    if (pt.columns.length === 0) {
      return {
        passed: false,
        detail:
          "The pivot has no column groupings. Pivot editor → Columns → Add → Platform. Rows × Columns is what makes a pivot a pivot.",
        detailHe:
          "ל-pivot אין קיבוצי עמודות. Pivot editor → Columns → Add → Platform. Rows × Columns זה מה שהופך pivot ל-pivot.",
      };
    }
    // Platform is column D = 0-indexed 3.
    const hasPlatform = pt.columns.some((g) => g.sourceColumn === 3);
    if (!hasPlatform) {
      const cols = pt.columns.map((g) => g.sourceColumn).join(", ");
      return {
        passed: false,
        detail: `The pivot's Columns group(s) reference source column offset(s) ${cols}. Platform is column D (offset 3).`,
        detailHe: `קיבוצי העמודות של ה-pivot מצביעים על column offset ${cols}. Platform הוא עמודה D (offset 3).`,
      };
    }
    return { passed: true };
  },
};

const pivotValueSumRevenue: Rule = {
  id: "k1-pivot-value-sum-revenue",
  label: "The pivot has one Value: SUM of Revenue",
  labelHe: "ל-pivot יש Value אחד: SUM של Revenue",
  answer: "Pivot editor → Values → Add Revenue, summarize by SUM",
  async run(sheet) {
    const pt = await sheet.cellPivotTable("K1");
    if (pt == null) return { passed: false };
    if (pt.values.length === 0) {
      return {
        passed: false,
        detail:
          "The pivot has no Values. A pivot with rows and columns but no values is just an empty grid. Pivot editor → Values → Add → Revenue.",
        detailHe:
          "ל-pivot אין Values. pivot עם rows ו-columns בלי values הוא רק רשת ריקה. Pivot editor → Values → Add → Revenue.",
      };
    }
    // Revenue is column G = 0-indexed 6.
    const sumRevenue = pt.values.find(
      (v) => v.sourceColumn === 6 && v.summarize === "SUM",
    );
    if (!sumRevenue) {
      const summary = pt.values
        .map((v) => `${v.summarize}(col ${v.sourceColumn})`)
        .join(", ");
      return {
        passed: false,
        detail: `The pivot's Values are: ${summary}. Add one Value summarized by SUM over Revenue (column G, offset 6).`,
        detailHe: `Values של ה-pivot הם: ${summary}. מוסיפים Value אחד מסוכם ב-SUM על Revenue (עמודה G, offset 6).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-02-pivot-tables-basics",
  lessonSlug: "modeling/02-pivot-tables-basics",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      { a1: "I1", value: "→ Anchor a pivot table at K1." },
      { a1: "I2", value: "Source: Campaigns!A1:G61" },
      { a1: "I3", value: "Rows: Buyer" },
      { a1: "I4", value: "Columns: Platform" },
      { a1: "I5", value: "Values: SUM of Revenue" },
    ],
  },
  rules: [
    pivotAnchor,
    pivotRowsBuyer,
    pivotColumnsPlatform,
    pivotValueSumRevenue,
  ],
};
