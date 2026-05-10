import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 15 grades number formats the learner applies via Format → Number in
// the Sheets UI on the Campaigns tab. The seed provisions a clean copy of
// CAMPAIGNS_LARGE; the learner formats Spend (F) as currency, Revenue (G) as a
// custom format that paints negatives red, and adds an ROI column in H
// formatted as percent. The grader reads the formats back via the
// cellNumberFormat method on SheetReader. Format is per-cell, so the grader
// inspects one representative cell from each region (F2, G2, H2).

const spendCurrency: Rule = {
  id: "campaigns-f-currency",
  label: "Campaigns!F2:F61 (Spend) is formatted as currency",
  labelHe: "Campaigns!F2:F61 (Spend) מעוצבת כ-currency",
  answer:
    "Format → Number → Currency, applied to F2:F61 (type CURRENCY, pattern includes $)",
  async run(sheet) {
    const fmt = await sheet.cellNumberFormat("Campaigns!F2");
    if (fmt == null) {
      return {
        passed: false,
        detail:
          "Campaigns!F2 has no number format. Select F2:F61, open Format → Number → Currency, so the Spend column shows the currency sign and two decimals like real money.",
        detailHe:
          "אין פורמט מספר על Campaigns!F2. בוחרים F2:F61, פותחים Format → Number → Currency, כך שעמודת ה-Spend תציג את סימן המטבע ושני עשרוניים כמו כסף אמיתי.",
      };
    }
    if (fmt.type !== "CURRENCY") {
      return {
        passed: false,
        detail: `Campaigns!F2 has number-format type \`${fmt.type}\`, but the Spend column should be \`CURRENCY\`. Use Format → Number → Currency, not the plain Number preset; the column is money and should read as money.`,
        detailHe: `על Campaigns!F2 יש פורמט מסוג \`${fmt.type}\`, אבל עמודת ה-Spend צריכה להיות \`CURRENCY\`. משתמשים ב-Format → Number → Currency, לא ב-preset של Number רגיל. העמודה היא כסף וצריכה להיקרא ככסף.`,
      };
    }
    if (!fmt.pattern.includes("$")) {
      return {
        passed: false,
        detail: `Campaigns!F2 has CURRENCY type but its pattern \`${fmt.pattern}\` does not include \`$\`. Use a pattern with the dollar sign (e.g. \`$#,##0.00\`) so the Spend column always reads as USD regardless of the spreadsheet locale.`,
        detailHe: `על Campaigns!F2 יש סוג CURRENCY אבל ה-pattern \`${fmt.pattern}\` לא כולל \`$\`. משתמשים ב-pattern עם סימן הדולר (לדוגמה \`$#,##0.00\`) כך שעמודת ה-Spend תמיד תיקרא כ-USD בלי קשר ל-locale של ה-spreadsheet.`,
      };
    }
    return { passed: true };
  },
};

const revenueRedNegatives: Rule = {
  id: "campaigns-g-red-negatives",
  label:
    "Campaigns!G2:G61 (Revenue) uses a custom NUMBER format that paints negatives red",
  labelHe:
    "Campaigns!G2:G61 (Revenue) משתמשת בפורמט NUMBER מותאם שצובע שליליים באדום",
  answer:
    "Format → Number → Custom number format → `#,##0.00;[Red]-#,##0.00`, applied to G2:G61",
  async run(sheet) {
    const fmt = await sheet.cellNumberFormat("Campaigns!G2");
    if (fmt == null) {
      return {
        passed: false,
        detail:
          "Campaigns!G2 has no number format. Select G2:G61, open Format → Number → Custom number format, and enter `#,##0.00;[Red]-#,##0.00` so negative revenue rows light up red without a conditional-format rule.",
        detailHe:
          "אין פורמט מספר על Campaigns!G2. בוחרים G2:G61, פותחים Format → Number → Custom number format, ומקלידים `#,##0.00;[Red]-#,##0.00` כך ששורות revenue שליליות יידלקו באדום בלי כלל conditional formatting.",
      };
    }
    if (fmt.type !== "NUMBER") {
      return {
        passed: false,
        detail: `Campaigns!G2 has number-format type \`${fmt.type}\`, but the negatives-red pattern belongs to the \`NUMBER\` family. The pattern is "a number with red-for-negative styling", not money or a percent. Switch to Format → Number → Custom number format and re-enter the pattern.`,
        detailHe: `על Campaigns!G2 יש פורמט מסוג \`${fmt.type}\`, אבל ה-pattern של שליליים-אדומים שייך למשפחת \`NUMBER\`. ה-pattern הוא "מספר עם סטיילינג של אדום-לשלילי", לא כסף ולא אחוז. עוברים ל-Format → Number → Custom number format ומקלידים מחדש את ה-pattern.`,
      };
    }
    if (!fmt.pattern.includes(";")) {
      return {
        passed: false,
        detail: `Campaigns!G2's pattern \`${fmt.pattern}\` has only one section. The negatives-red pattern needs two sections separated by \`;\` (e.g. \`#,##0.00;[Red]-#,##0.00\`): the first describes positive numbers, the second describes negatives.`,
        detailHe: `ל-pattern של Campaigns!G2 (\`${fmt.pattern}\`) יש section אחד בלבד. ה-pattern של שליליים-אדומים צריך שני sections מופרדים ב-\`;\` (לדוגמה \`#,##0.00;[Red]-#,##0.00\`): הראשון מתאר מספרים חיוביים, השני מתאר שליליים.`,
      };
    }
    if (!/red/i.test(fmt.pattern)) {
      return {
        passed: false,
        detail: `Campaigns!G2's pattern \`${fmt.pattern}\` does not include \`[Red]\`. Add the \`[Red]\` color modifier in front of the negative section so losses paint themselves: \`#,##0.00;[Red]-#,##0.00\`.`,
        detailHe: `ה-pattern של Campaigns!G2 (\`${fmt.pattern}\`) לא כולל \`[Red]\`. מוסיפים את ה-color modifier \`[Red]\` לפני ה-section של השלילי כך שהפסדים יצבעו את עצמם: \`#,##0.00;[Red]-#,##0.00\`.`,
      };
    }
    return { passed: true };
  },
};

const roiPercent: Rule = {
  id: "campaigns-h-roi-percent",
  label: "Campaigns!H2:H61 holds an ROI formula formatted as percent",
  labelHe: "Campaigns!H2:H61 מחזיקה נוסחת ROI מעוצבת כאחוז",
  answer:
    "H2 = `=G2/F2-1`, filled down to H61, formatted via Format → Number → Percent (type PERCENT, pattern includes %)",
  async run(sheet) {
    const fmt = await sheet.cellNumberFormat("Campaigns!H2");
    if (fmt == null) {
      return {
        passed: false,
        detail:
          "Campaigns!H2 has no number format. Add an ROI column: type `ROI` in H1, write `=G2/F2-1` in H2 and fill down to H61, then format H2:H61 via Format → Number → Percent so the ratio reads as a percentage.",
        detailHe:
          "אין פורמט מספר על Campaigns!H2. מוסיפים עמודת ROI: מקלידים `ROI` ב-H1, כותבים `=G2/F2-1` ב-H2 וממלאים למטה עד H61, ואז מעצבים את H2:H61 דרך Format → Number → Percent כך שהיחס ייקרא כאחוז.",
      };
    }
    if (fmt.type !== "PERCENT") {
      return {
        passed: false,
        detail: `Campaigns!H2 has number-format type \`${fmt.type}\`, but the ROI column should be \`PERCENT\`. A ROI of 0.247 displayed as \`0.247\` is unreadable; displayed as \`24.70%\` it is the only thing the buyer needs. Use Format → Number → Percent.`,
        detailHe: `על Campaigns!H2 יש פורמט מסוג \`${fmt.type}\`, אבל עמודת ה-ROI צריכה להיות \`PERCENT\`. ROI של 0.247 שמוצג כ-\`0.247\` לא קריא, אבל אם מוצג כ-\`24.70%\` הוא הדבר היחיד שה-media buyer צריך. משתמשים ב-Format → Number → Percent.`,
      };
    }
    if (!fmt.pattern.includes("%")) {
      return {
        passed: false,
        detail: `Campaigns!H2 has PERCENT type but its pattern \`${fmt.pattern}\` does not include \`%\`. The percent symbol belongs in the pattern (e.g. \`0.00%\`) so the cell renders the percent sign.`,
        detailHe: `על Campaigns!H2 יש סוג PERCENT אבל ה-pattern \`${fmt.pattern}\` לא כולל \`%\`. סימן האחוז שייך ל-pattern (לדוגמה \`0.00%\`) כך שהתא ירנדר את סימן האחוז.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-15-number-formatting",
  lessonSlug: "modeling/15-number-formatting",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Quick-reference labels next to the data, in column J, so the learner
      // can see the three formats to apply without leaving the sheet.
      { a1: "J1", value: "→ Apply three number formats:" },
      { a1: "J2", value: "F2:F61 = Currency ($#,##0.00)" },
      { a1: "J3", value: "G2:G61 = Custom #,##0.00;[Red]-#,##0.00" },
      { a1: "J4", value: "H1=ROI, H2==G2/F2-1 (fill down), H2:H61 = Percent" },
    ],
  },
  rules: [spendCurrency, revenueRedNegatives, roiPercent],
};
