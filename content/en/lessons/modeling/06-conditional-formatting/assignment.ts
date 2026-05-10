import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 6 grades two conditional-formatting rules the learner adds via
// Format → Conditional formatting in the Sheets UI on the Campaigns tab. The
// grader reads them back via SheetReader.conditionalFormats("Campaigns").

const SPEND_RANGE = "F2:F61";
const REVENUE_RANGE = "G2:G61";

function rangesInclude(ranges: string[], target: string): boolean {
  const norm = target.replace(/\s+/g, "").toUpperCase();
  return ranges.some((r) => r.replace(/\s+/g, "").toUpperCase() === norm);
}

const highSpendRule: Rule = {
  id: "campaigns-f-high-spend",
  label: "Campaigns!F2:F61 highlights rows where Spend > 500",
  labelHe: "Campaigns!F2:F61 מסמן שורות שבהן Spend גדול מ-500",
  answer:
    "Format → Conditional formatting → Single color → Format cells if: Greater than → 500, applied to F2:F61",
  async run(sheet) {
    const rules = await sheet.conditionalFormats("Campaigns");
    const onSpend = rules.filter((r) => rangesInclude(r.ranges, SPEND_RANGE));
    if (onSpend.length === 0) {
      return {
        passed: false,
        detail:
          "No conditional-format rule found on `F2:F61`. Open Format → Conditional formatting, set the range to `F2:F61`, and add a Single color rule of `Greater than` 500 so high-spend rows pop.",
        detailHe:
          "לא נמצא כלל conditional formatting על `F2:F61`. פותחים את Format → Conditional formatting, מגדירים את הטווח ל-`F2:F61`, ומוסיפים כלל Single color של `Greater than` 500 כדי ששורות עם spend גבוה יבלטו.",
      };
    }
    const greaterRule = onSpend.find(
      (r) => r.conditionType === "NUMBER_GREATER",
    );
    if (greaterRule == null) {
      const actual = onSpend[0]!.conditionType ?? "(gradient)";
      return {
        passed: false,
        detail: `The rule on \`F2:F61\` uses condition type \`${actual}\` but should be \`NUMBER_GREATER\` (the "Greater than" option in the dialog).`,
        detailHe: `הכלל על \`F2:F61\` משתמש בסוג תנאי \`${actual}\` אבל צריך להיות \`NUMBER_GREATER\` (האופציה "Greater than" בדיאלוג).`,
      };
    }
    const value = greaterRule.conditionValues[0];
    if (value == null) {
      return {
        passed: false,
        detail:
          "The `Greater than` rule on `F2:F61` has no threshold value. Type `500` in the value field so only rows with Spend over 500 get highlighted.",
        detailHe:
          "לכלל ה-`Greater than` על `F2:F61` אין ערך סף. מקלידים `500` בשדה הערך כך שרק שורות עם spend מעל 500 יסומנו.",
      };
    }
    const numeric = Number(String(value).replace(/[^0-9.\-]/g, ""));
    if (numeric !== 500) {
      return {
        passed: false,
        detail: `The threshold on \`F2:F61\` is \`${value}\` but should be \`500\`. The lesson highlights rows where Spend exceeds 500.`,
        detailHe: `ערך הסף על \`F2:F61\` הוא \`${value}\` אבל צריך להיות \`500\`. השיעור מדגיש שורות שבהן Spend עובר את 500.`,
      };
    }
    return { passed: true };
  },
};

const profitableRule: Rule = {
  id: "campaigns-g-profitable",
  label: "Campaigns!G2:G61 turns green when Revenue beats Spend per row",
  labelHe: "Campaigns!G2:G61 הופך לירוק כש-Revenue עוקף את ה-Spend בשורה",
  answer:
    "Format → Conditional formatting → Single color → Custom formula is → =G2>F2, applied to G2:G61",
  async run(sheet) {
    const rules = await sheet.conditionalFormats("Campaigns");
    const onRevenue = rules.filter((r) =>
      rangesInclude(r.ranges, REVENUE_RANGE),
    );
    if (onRevenue.length === 0) {
      return {
        passed: false,
        detail:
          "No conditional-format rule found on `G2:G61`. Add a Custom formula rule of `=G2>F2` so profitable rows are green and unprofitable rows are not.",
        detailHe:
          "לא נמצא כלל conditional formatting על `G2:G61`. מוסיפים כלל Custom formula של `=G2>F2` כך ששורות רווחיות יהיו ירוקות ושורות לא רווחיות לא.",
      };
    }
    const customRule = onRevenue.find(
      (r) => r.conditionType === "CUSTOM_FORMULA",
    );
    if (customRule == null) {
      const actual = onRevenue[0]!.conditionType ?? "(gradient)";
      return {
        passed: false,
        detail: `The rule on \`G2:G61\` uses condition type \`${actual}\` but should be \`CUSTOM_FORMULA\` (the "Custom formula is" option). A per-row comparison can't be expressed with the simpler condition types.`,
        detailHe: `הכלל על \`G2:G61\` משתמש בסוג תנאי \`${actual}\` אבל צריך להיות \`CUSTOM_FORMULA\` (האופציה "Custom formula is"). השוואה לפי שורה לא ניתנת לביטוי עם סוגי תנאי פשוטים יותר.`,
      };
    }
    const formula = customRule.conditionValues[0] ?? "";
    const normalized = formula.replace(/\s/g, "").toUpperCase();
    if (!normalized.includes("G2") || !normalized.includes("F2")) {
      return {
        passed: false,
        detail: `The custom formula on \`G2:G61\` is \`${formula}\`. It should reference both \`G2\` (revenue) and \`F2\` (spend) so each row is compared against its own pair, e.g. \`=G2>F2\`.`,
        detailHe: `נוסחת ה-custom formula על \`G2:G61\` היא \`${formula}\`. היא צריכה להפנות גם ל-\`G2\` (revenue) וגם ל-\`F2\` (spend) כדי שכל שורה תושווה לזוג שלה, למשל \`=G2>F2\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-06-conditional-formatting",
  lessonSlug: "modeling/06-conditional-formatting",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Quick-reference labels next to the data, in column I, so the learner
      // can see the two rules to add without leaving the sheet.
      { a1: "I1", value: "→ Add two conditional-format rules:" },
      { a1: "I2", value: "F2:F61 = Greater than 500 (high spend)" },
      { a1: "I3", value: "G2:G61 = Custom formula =G2>F2 (profitable row)" },
    ],
  },
  rules: [highSpendRule, profitableRule],
};
