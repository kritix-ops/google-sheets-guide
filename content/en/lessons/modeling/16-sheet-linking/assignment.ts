import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 16 grades three different HYPERLINK patterns the learner writes
// against a seeded CAMPAIGNS_LARGE tab. The fixture has 60 rows of campaign
// data; column J is empty for the link block. The grader checks formula
// shape only (not the rendered link target), because the same lesson covers
// external links, internal cross-tab links, and conditional links, each of
// which would resolve to a different scalar value at runtime.

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContainsAll(actual: string | null, needles: string[]): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return needles.every((n) => normalized.includes(n.toUpperCase()));
}

const externalLink: Rule = {
  id: "j1-external-hyperlink",
  label: "J1 is an external HYPERLINK to a Google Sheet",
  labelHe: "התא J1 הוא HYPERLINK חיצוני ל-Google Sheet",
  answer:
    '=HYPERLINK("https://docs.google.com/spreadsheets/d/EXAMPLE", "Source spreadsheet")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J1 is empty. Use `=HYPERLINK("https://docs.google.com/spreadsheets/d/EXAMPLE", "Source spreadsheet")` to point at any spreadsheet. The first argument is the URL; the second is the label the cell shows.',
        detailHe:
          'התא J1 ריק. משתמשים ב-`=HYPERLINK("https://docs.google.com/spreadsheets/d/EXAMPLE", "Source spreadsheet")` כדי להצביע על spreadsheet כלשהו. הארגומנט הראשון הוא ה-URL, השני הוא ה-label שהתא מציג.',
      };
    }
    if (!formulaContainsAll(formula, ["HYPERLINK"])) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. Use the \`HYPERLINK\` function so the cell renders as a clickable link, not as raw URL text.`,
        detailHe: `התא J1 מכיל \`${formula}\`. משתמשים בפונקציה \`HYPERLINK\` כדי שהתא יוצג כקישור שאפשר ללחוץ עליו, לא כטקסט URL גולמי.`,
      };
    }
    if (!formulaContainsAll(formula, ["DOCS.GOOGLE.COM"])) {
      return {
        passed: false,
        detail: `J1 contains \`${formula}\`. The URL must point at \`docs.google.com\`. That is the host every Google Sheets, Doc, and Slides URL starts with. Anything else fails the "external sheet" check.`,
        detailHe: `התא J1 מכיל \`${formula}\`. ה-URL חייב להצביע על \`docs.google.com\`, זה ה-host שכל URL של Google Sheets, Doc, או Slides מתחיל בו. כל דבר אחר נכשל בבדיקת "גיליון חיצוני".`,
      };
    }
    return { passed: true };
  },
};

const internalAnchor: Rule = {
  id: "j2-internal-gid-anchor",
  label: "J2 jumps within the workbook via #gid= anchor",
  labelHe: "התא J2 קופץ בתוך ה-spreadsheet דרך עוגן #gid=",
  answer: '=HYPERLINK("#gid=0&range=A1", "Top of this sheet")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J2");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J2 is empty. Use `=HYPERLINK("#gid=0&range=A1", "Top of this sheet")` to jump within this same workbook. The `#gid=` prefix is the canonical Sheets internal anchor; everything after it tells Sheets which tab and cell to scroll to.',
        detailHe:
          'התא J2 ריק. משתמשים ב-`=HYPERLINK("#gid=0&range=A1", "Top of this sheet")` כדי לקפוץ בתוך אותו spreadsheet. הקידומת `#gid=` היא העוגן הפנימי הסטנדרטי של Sheets, מה שאחריה אומר ל-Sheets לאיזה גיליון ולאיזה תא לגלול.',
      };
    }
    if (!formulaContainsAll(formula, ["HYPERLINK"])) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. Wrap the anchor in \`HYPERLINK\` so the cell becomes a clickable jump, not a literal text fragment.`,
        detailHe: `התא J2 מכיל \`${formula}\`. עוטפים את העוגן ב-\`HYPERLINK\` כדי שהתא יהפוך לקפיצה שאפשר ללחוץ עליה, לא לטקסט מילולי.`,
      };
    }
    if (!formulaContainsAll(formula, ["#GID="])) {
      return {
        passed: false,
        detail: `J2 contains \`${formula}\`. The internal-anchor form is \`#gid=NUMBER&range=A1\`. Without \`#gid=\` the link either resolves to an external URL or does nothing at all.`,
        detailHe: `התא J2 מכיל \`${formula}\`. הצורה של עוגן פנימי היא \`#gid=NUMBER&range=A1\`. בלי \`#gid=\` הקישור מתפרש כ-URL חיצוני או לא עושה כלום.`,
      };
    }
    return { passed: true };
  },
};

const conditionalLink: Rule = {
  id: "j3-conditional-hyperlink",
  label: "J3 is a conditional HYPERLINK that fires only when revenue > spend",
  labelHe: "התא J3 הוא HYPERLINK מותנה שמופעל רק כש-revenue > spend",
  answer:
    '=IF(G2>F2, HYPERLINK("https://example.com/details/"&A2, "Review winning row"), "")',
  async run(sheet) {
    const formula = await sheet.cellFormula("J3");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'J3 is empty. Use `=IF(G2>F2, HYPERLINK("https://example.com/details/"&A2, "Review winning row"), "")` so the link only renders for rows where revenue exceeds spend. Losing rows show as blank, no clickable bait.',
        detailHe:
          'התא J3 ריק. משתמשים ב-`=IF(G2>F2, HYPERLINK("https://example.com/details/"&A2, "Review winning row"), "")` כדי שהקישור יוצג רק בשורות שבהן ה-revenue עולה על ה-spend. שורות מפסידות נשארות ריקות, בלי פיתוי קליק.',
      };
    }
    if (!formulaContainsAll(formula, ["HYPERLINK"])) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Even with a conditional, the active branch must call \`HYPERLINK\` so the cell renders clickable.`,
        detailHe: `התא J3 מכיל \`${formula}\`. גם עם תנאי, הענף הפעיל חייב לקרוא ל-\`HYPERLINK\` כדי שהתא יוצג ככזה שאפשר ללחוץ עליו.`,
      };
    }
    if (!formulaContainsAll(formula, ["IF"])) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Wrap the link in \`IF(...)\` so it only appears for the winning rows. An unconditional \`HYPERLINK\` defeats the point of the column.`,
        detailHe: `התא J3 מכיל \`${formula}\`. עוטפים את הקישור ב-\`IF(...)\` כדי שיופיע רק בשורות הרווחיות. \`HYPERLINK\` לא מותנה הורס את המטרה של העמודה.`,
      };
    }
    if (!formulaContainsAll(formula, ["G2", "F2"])) {
      return {
        passed: false,
        detail: `J3 contains \`${formula}\`. Compare \`G2\` (revenue) against \`F2\` (spend). The layout in CAMPAIGNS_LARGE puts spend in column F and revenue in column G.`,
        detailHe: `התא J3 מכיל \`${formula}\`. משווים את \`G2\` (revenue) מול \`F2\` (spend), המבנה של CAMPAIGNS_LARGE שם את ה-spend בעמודה F ואת ה-revenue בעמודה G.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-16-sheet-linking",
  lessonSlug: "modeling/16-sheet-linking",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Link-block labels in column I, separated from the campaign block by
      // the natural visual gap (the campaign columns end at G).
      { a1: "I1", value: "External link → source spreadsheet" },
      { a1: "I2", value: "Internal link → top of this tab" },
      { a1: "I3", value: "Conditional link → details for winning rows" },
    ],
  },
  rules: [externalLink, internalAnchor, conditionalLink],
};
