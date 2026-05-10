import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 4 grades data validation rules the learner applies via Data → Data
// validation in the Sheets UI. The seed provisions a clean copy of
// CAMPAIGNS_LARGE on the "Campaigns" tab plus a fresh "Inputs" tab where the
// learner adds three validation patterns. The grader reads them back via the
// new cellValidation method on SheetReader.

const buyerDropdown: Rule = {
  id: "inputs-b1-buyer-list",
  label: "Inputs!B1 has a dropdown of approved buyers",
  labelHe: "התא Inputs!B1 מחזיק dropdown של media buyers מאושרים",
  answer:
    "Data → Data validation → Dropdown (from a range) → Campaigns!B2:B61, strict",
  async run(sheet) {
    const rule = await sheet.cellValidation("Inputs!B1");
    if (rule == null) {
      return {
        passed: false,
        detail:
          "Inputs!B1 has no data validation. Open Data → Data validation, set Criteria to Dropdown (from a range), point at Campaigns!B2:B61, and turn on Reject input so typos can't slip in.",
        detailHe:
          "אין data validation על Inputs!B1. פותחים את Data → Data validation, מגדירים Criteria ל-Dropdown (from a range), מצביעים על Campaigns!B2:B61, ומפעילים Reject input כדי שטעויות הקלדה לא יחמקו.",
      };
    }
    if (rule.type !== "ONE_OF_LIST" && rule.type !== "ONE_OF_RANGE") {
      return {
        passed: false,
        detail: `Inputs!B1 has a ${rule.type} validation rule. Use Dropdown (a list of values, ONE_OF_LIST, or a range, ONE_OF_RANGE) so the cell offers a controlled vocabulary.`,
        detailHe: `על Inputs!B1 יש validation מסוג ${rule.type}. משתמשים ב-Dropdown (רשימת ערכים, ONE_OF_LIST, או טווח, ONE_OF_RANGE) כדי שהתא יציע אוצר מילים מבוקר.`,
      };
    }
    if (!rule.strict) {
      return {
        passed: false,
        detail:
          "Inputs!B1 is set to Show warning, not Reject input. For an approved-buyers list you want strict mode: bad values are rejected, not just flagged.",
        detailHe:
          "התא Inputs!B1 מוגדר ל-Show warning, לא ל-Reject input. עבור רשימת media buyers מאושרים רוצים מצב strict: ערכים שגויים נדחים, לא רק מסומנים.",
      };
    }
    return { passed: true };
  },
};

const platformDropdown: Rule = {
  id: "inputs-b2-platform-list",
  label: "Inputs!B2 has an inline dropdown listing the 7 platforms",
  labelHe: "התא Inputs!B2 מחזיק dropdown inline של 7 הפלטפורמות",
  answer:
    'Data → Data validation → Dropdown → "Taboola","Outbrain","MediaGo","Poppin","Facebook","TikTok","Google", strict',
  async run(sheet) {
    const rule = await sheet.cellValidation("Inputs!B2");
    if (rule == null) {
      return {
        passed: false,
        detail:
          "Inputs!B2 has no data validation. Add an inline Dropdown listing all 7 platforms (Taboola, Outbrain, MediaGo, Poppin, Facebook, TikTok, Google) with Reject input on.",
        detailHe:
          "אין data validation על Inputs!B2. מוסיפים Dropdown inline שמפרט את כל 7 הפלטפורמות (Taboola, Outbrain, MediaGo, Poppin, Facebook, TikTok, Google) עם Reject input מופעל.",
      };
    }
    if (rule.type !== "ONE_OF_LIST") {
      return {
        passed: false,
        detail: `Inputs!B2 has a ${rule.type} rule. Use Dropdown (list of values): ONE_OF_LIST: with the seven platforms typed inline. ONE_OF_RANGE pulls from a sheet, which we don't want here.`,
        detailHe: `על Inputs!B2 יש כלל מסוג ${rule.type}. משתמשים ב-Dropdown (list of values), כלומר ONE_OF_LIST, עם שבע הפלטפורמות מוקלדות inline. ONE_OF_RANGE מושך מגיליון, וזה לא מה שרוצים פה.`,
      };
    }
    if (rule.values.length !== 7) {
      return {
        passed: false,
        detail: `Inputs!B2 lists ${rule.values.length} values. The team has 7 platforms; the dropdown should include all of them.`,
        detailHe: `התא Inputs!B2 מפרט ${rule.values.length} ערכים. לצוות יש 7 פלטפורמות, וה-dropdown צריך לכלול את כולן.`,
      };
    }
    const expected = new Set([
      "Taboola",
      "Outbrain",
      "MediaGo",
      "Poppin",
      "Facebook",
      "TikTok",
      "Google",
    ]);
    const actual = new Set(rule.values);
    for (const p of expected) {
      if (!actual.has(p)) {
        return {
          passed: false,
          detail: `Inputs!B2 is missing platform \`${p}\`. The full list: Taboola, Outbrain, MediaGo, Poppin, Facebook, TikTok, Google.`,
          detailHe: `חסר ב-Inputs!B2 הפלטפורמה \`${p}\`. הרשימה המלאה: Taboola, Outbrain, MediaGo, Poppin, Facebook, TikTok, Google.`,
        };
      }
    }
    return { passed: true };
  },
};

const customSpendValidation: Rule = {
  id: "inputs-b3-custom-spend",
  label: "Inputs!B3 has a custom-formula rule that requires Spend > 0",
  labelHe: "התא Inputs!B3 מחזיק כלל custom-formula שדורש Spend > 0",
  answer: "Data → Data validation → Custom formula → =B3>0, strict",
  async run(sheet) {
    const rule = await sheet.cellValidation("Inputs!B3");
    if (rule == null) {
      return {
        passed: false,
        detail:
          "Inputs!B3 has no data validation. Add a Custom formula rule of `=B3>0` so a typo or zero spend gets rejected at entry. This is the validation pattern for any numeric input that must be positive.",
        detailHe:
          "אין data validation על Inputs!B3. מוסיפים כלל Custom formula של `=B3>0` כדי שטעות הקלדה או spend אפס יידחו בהקלדה. זאת תבנית ה-validation לכל קלט מספרי שחייב להיות חיובי.",
      };
    }
    if (rule.type !== "CUSTOM_FORMULA") {
      return {
        passed: false,
        detail: `Inputs!B3 has a ${rule.type} rule. Use Custom formula (CUSTOM_FORMULA) here. NUMBER_GREATER would also work, but the lesson is about the Custom formula pattern because that's what scales when the rule grows.`,
        detailHe: `על Inputs!B3 יש כלל מסוג ${rule.type}. משתמשים ב-Custom formula (CUSTOM_FORMULA) פה. NUMBER_GREATER גם היה עובד, אבל השיעור על תבנית ה-Custom formula כי היא זו שמתאימה כשהכלל גדל.`,
      };
    }
    if (rule.customFormula == null) {
      return {
        passed: false,
        detail:
          "Inputs!B3 has a Custom formula rule but no formula attached. Type `=B3>0` in the formula field.",
        detailHe:
          "על Inputs!B3 יש כלל Custom formula אבל בלי נוסחה מצורפת. מקלידים `=B3>0` בשדה הנוסחה.",
      };
    }
    const f = rule.customFormula.replace(/\s/g, "").toUpperCase();
    if (!f.includes("B3") || !f.includes(">0")) {
      return {
        passed: false,
        detail: `Inputs!B3's custom formula is \`${rule.customFormula}\`. It should reference B3 and require it be > 0 (e.g. \`=B3>0\`).`,
        detailHe: `נוסחת ה-custom formula של Inputs!B3 היא \`${rule.customFormula}\`. היא צריכה להפנות ל-B3 ולדרוש שיהיה > 0 (לדוגמה \`=B3>0\`).`,
      };
    }
    if (!rule.strict) {
      return {
        passed: false,
        detail:
          "Inputs!B3 is set to Show warning. For numeric guards switch to Reject input: a warning that gets ignored at 5 PM ends up in the data anyway.",
        detailHe:
          "התא Inputs!B3 מוגדר ל-Show warning. עבור הגנות מספריות עוברים ל-Reject input. אזהרה שמתעלמים ממנה ב-5 בערב מוצאת את עצמה בנתונים בכל מקרה.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-04-data-validation",
  lessonSlug: "modeling/04-data-validation",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // The Inputs tab labels are seeded via the sheetTitles workaround:
      // we only get one tab in the seed, so the learner creates an "Inputs"
      // tab as part of the assignment and adds the validation rules there.
      // The seeded labels live on the same Campaigns tab as a quick reference
      // the learner copies over.
      { a1: "L1", value: "→ Create a tab named 'Inputs', then add:" },
      { a1: "L2", value: "B1: dropdown of approved buyers (range Campaigns!B2:B61)" },
      { a1: "L3", value: "B2: inline dropdown listing the 7 platforms" },
      { a1: "L4", value: "B3: custom-formula rule requiring Spend > 0" },
    ],
  },
  rules: [buyerDropdown, platformDropdown, customSpendValidation],
};
