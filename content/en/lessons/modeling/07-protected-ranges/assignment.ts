import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, ProtectedRange, Rule } from "@/lib/grading/types";

// Lesson 7 grades two protected ranges the learner adds via Data → Protect
// sheets and ranges in the Sheets UI. The seed provisions a clean copy of
// CAMPAIGNS_LARGE on the "Campaigns" tab. The learner wraps the raw log in a
// strict protection (A1:G61) and the header row in a warning-only protection
// (A1:G1). The grader reads the protections back via SheetReader's
// protectedRanges("Campaigns") and asserts on range, description, and mode.

function descriptionContains(
  protection: ProtectedRange,
  needle: string,
): boolean {
  const desc = protection.description ?? "";
  return desc.toLowerCase().includes(needle.toLowerCase());
}

function rangeMatches(protection: ProtectedRange, expected: string): boolean {
  // Allow some slack on the sheet-qualifier prefix and on whitespace; the
  // learner may save the protection as "A1:G61" or "Campaigns!A1:G61"
  // depending on how the side panel resolves the range.
  const normalize = (s: string) =>
    s.replace(/\s+/g, "").replace(/^Campaigns!/i, "").toUpperCase();
  return normalize(protection.range) === normalize(expected);
}

const rawLogProtection: Rule = {
  id: "campaigns-raw-strict",
  label: "Campaigns!A1:G61 has a strict protection covering the raw log",
  labelHe:
    "על Campaigns!A1:G61 יש הגנת strict שמכסה את לוג ה-raw",
  answer:
    "Data → Protect sheets and ranges → A1:G61, description includes 'Raw', Restrict who can edit this range",
  async run(sheet) {
    const protections = await sheet.protectedRanges("Campaigns");
    const match = protections.find((p) => rangeMatches(p, "A1:G61"));
    if (!match) {
      return {
        passed: false,
        detail:
          "No protected range found at Campaigns!A1:G61. Open Data → Protect sheets and ranges, add a range protection over A1:G61, and pick Restrict who can edit this range. The raw log is downstream of IMPORTRANGE in the real workbook, so a hand-edit corrupts every dashboard.",
        detailHe:
          "אין טווח מוגן על Campaigns!A1:G61. פותחים את Data → Protect sheets and ranges, מוסיפים הגנת טווח על A1:G61, ובוחרים Restrict who can edit this range. לוג ה-raw הוא במורד הזרם של IMPORTRANGE ב-spreadsheet האמיתי, כך שעריכה ידנית מקלקלת כל dashboard.",
      };
    }
    if (!descriptionContains(match, "raw")) {
      return {
        passed: false,
        detail: `The A1:G61 protection's description is \`${
          match.description ?? "(empty)"
        }\`. Include the word \`Raw\` so the next person to inherit the workbook understands what they're locked out of (e.g. \`Raw campaign log, do not hand-edit\`).`,
        detailHe: `התיאור של הגנת A1:G61 הוא \`${
          match.description ?? "(ריק)"
        }\`. כוללים את המילה \`Raw\` כדי שהאדם הבא שיירש את ה-spreadsheet יבין ממה הוא נעול בחוץ (לדוגמה \`Raw campaign log, do not hand-edit\`).`,
      };
    }
    if (match.warningOnly) {
      return {
        passed: false,
        detail:
          "The A1:G61 protection is set to warning mode. For the raw log, switch to Restrict who can edit this range (strict). A warning that gets clicked through at 5 PM ends up in the data anyway, and there's no upside to letting raw data be hand-edited.",
        detailHe:
          "הגנת A1:G61 מוגדרת למצב warning. עבור לוג ה-raw עוברים ל-Restrict who can edit this range (strict). אזהרה שלוחצים דרכה ב-5 בערב מוצאת את עצמה בנתונים בכל מקרה, ואין יתרון לאפשר עריכה ידנית של נתוני raw.",
      };
    }
    return { passed: true };
  },
};

const headerProtection: Rule = {
  id: "campaigns-header-warning",
  label: "Campaigns!A1:G1 has a warning-only protection on the header row",
  labelHe:
    "על Campaigns!A1:G1 יש הגנת warning-only על שורת הכותרת",
  answer:
    "Data → Protect sheets and ranges → A1:G1, description includes 'header', Show a warning when editing this range",
  async run(sheet) {
    const protections = await sheet.protectedRanges("Campaigns");
    const match = protections.find((p) => rangeMatches(p, "A1:G1"));
    if (!match) {
      return {
        passed: false,
        detail:
          "No protected range found at Campaigns!A1:G1. Add a second protection covering just the header row and set it to Show a warning when editing this range. Headers feed every downstream pivot and chart that addresses columns by name; a typo there silently breaks the whole graph.",
        detailHe:
          "אין טווח מוגן על Campaigns!A1:G1. מוסיפים הגנה שנייה שמכסה רק את שורת הכותרת ומגדירים אותה ל-Show a warning when editing this range. הכותרות מזינות כל pivot ו-chart במורד הזרם שניגש לעמודות לפי שם, וטעות הקלדה שם שוברת בשקט את כל הגרף.",
      };
    }
    if (!descriptionContains(match, "header")) {
      return {
        passed: false,
        detail: `The A1:G1 protection's description is \`${
          match.description ?? "(empty)"
        }\`. Include the word \`header\` so the rule explains itself (e.g. \`Header row, schema is downstream\`).`,
        detailHe: `התיאור של הגנת A1:G1 הוא \`${
          match.description ?? "(ריק)"
        }\`. כוללים את המילה \`header\` כדי שהכלל יסביר את עצמו (לדוגמה \`Header row, schema is downstream\`).`,
      };
    }
    if (!match.warningOnly) {
      return {
        passed: false,
        detail:
          "The A1:G1 protection is set to strict mode. For the header row, switch to Show a warning when editing this range. Strict on the header locks the team out of fixing a typo; warning gives them a single confirm dialog as a speed bump.",
        detailHe:
          "הגנת A1:G1 מוגדרת למצב strict. עבור שורת הכותרת עוברים ל-Show a warning when editing this range. strict על הכותרת חוסם את הצוות מתיקון טעות הקלדה, warning נותן להם דיאלוג אישור יחיד כאבן מהירות.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-07-protected-ranges",
  lessonSlug: "modeling/07-protected-ranges",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Reference instructions placed outside the raw log so the learner has
      // a quick on-sheet reminder of what to add via Data → Protect sheets
      // and ranges. These cells aren't graded; the rules read protectedRanges.
      { a1: "I1", value: "→ Open Data → Protect sheets and ranges, then add:" },
      { a1: "I2", value: "1) A1:G61 strict, description includes 'Raw'" },
      { a1: "I3", value: "2) A1:G1 warning, description includes 'header'" },
    ],
  },
  rules: [rawLogProtection, headerProtection],
};
