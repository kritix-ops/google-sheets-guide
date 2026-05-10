import type { AssignmentSpec, Rule } from "@/lib/grading/types";

function normalizeFormula(formula: string | null): string | null {
  if (formula == null) return null;
  return formula.replace(/^\s*=\s*/, "").replace(/\s+/g, "").toUpperCase();
}

function formulaContains(actual: string | null, needle: string): boolean {
  const normalized = normalizeFormula(actual);
  if (normalized == null) return false;
  return normalized.includes(needle.toUpperCase());
}

// IMPORTRANGE pulls from a different workbook in real life. In a single-tab
// test the destination cell can't actually fetch anything, so the grader
// checks the formula SHAPE: function name, recognizable Sheets URL,
// bounded range, and (for B1) the defensive IFERROR wrapper.

const URL_PATTERN = "DOCS.GOOGLE.COM/SPREADSHEETS";

const importrangeBounded: Rule = {
  id: "a1-uses-importrange",
  label: "A1 uses IMPORTRANGE with a Sheets URL and a bounded range",
  labelHe: "התא A1 משתמש ב-IMPORTRANGE עם URL של Sheets וטווח חסום",
  answer:
    '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")',
  async run(sheet) {
    const formula = await sheet.cellFormula("A1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'A1 is empty. Use `=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")` with the example URL the lesson supplies. The second argument is the range spec.',
        detailHe:
          'התא A1 ריק. משתמשים ב-`=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")` עם ה-URL לדוגמה שהשיעור מספק. הארגומנט השני הוא ה-range spec.',
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. The function for pulling from another workbook is \`IMPORTRANGE\`.`,
        detailHe: `התא A1 מכיל \`${formula}\`. הפונקציה למשיכת נתונים מ-spreadsheet אחר היא \`IMPORTRANGE\`.`,
      };
    }
    if (!formulaContains(formula, URL_PATTERN)) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. The first argument must be a Google Sheets URL (\`https://docs.google.com/spreadsheets/d/...\`), not a bare ID or a shortened link.`,
        detailHe: `התא A1 מכיל \`${formula}\`. הארגומנט הראשון צריך להיות URL של Google Sheets (\`https://docs.google.com/spreadsheets/d/...\`), לא מזהה חשוף או קישור מקוצר.`,
      };
    }
    // Reject full-column patterns: A:G, A:Z, etc. The bound test is the
    // teaching moment of this lesson. The pattern looks for "X:Y" where X and
    // Y are letters and the second one is NOT followed by a digit (which
    // would be a bounded range like A1:G61).
    const normalized = normalizeFormula(formula) ?? "";
    const fullColMatch = /[A-Z]+:[A-Z]+(?![0-9])/.test(normalized);
    if (fullColMatch) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. The range spec uses a full-column reference. IMPORTRANGE without a bounded range pulls the entire source sheet, which is the slow and risky shape. Bound it to \`A1:G61\` (or whatever row count you actually need).`,
        detailHe: `התא A1 מכיל \`${formula}\`. ה-range spec משתמש ב-reference לעמודה מלאה. IMPORTRANGE בלי טווח חסום מושך את כל גיליון המקור, וזו הצורה האיטית והמסוכנת. חוסמים ל-\`A1:G61\` (או לכמות השורות שבאמת צריך).`,
      };
    }
    if (!formulaContains(formula, "A1:G61")) {
      return {
        passed: false,
        detail: `A1 contains \`${formula}\`. Use the bounded range \`Campaigns!A1:G61\` so you pull exactly the 60 data rows (plus header).`,
        detailHe: `התא A1 מכיל \`${formula}\`. משתמשים בטווח החסום \`Campaigns!A1:G61\` כדי למשוך בדיוק את 60 שורות הנתונים (כולל כותרת).`,
      };
    }
    return { passed: true };
  },
};

const iferrorWrap: Rule = {
  id: "b1-wraps-with-iferror",
  label: "B1 wraps IMPORTRANGE with IFERROR for the defensive fallback",
  labelHe: "התא B1 עוטף את IMPORTRANGE ב-IFERROR לחיזוק הגנתי",
  answer:
    '=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "data unavailable")',
  async run(sheet) {
    const formula = await sheet.cellFormula("B1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'B1 is empty. Write `=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "data unavailable")` so the dashboard shows a clean fallback instead of `#REF!` the next time the source is renamed, deleted, or has its permissions revoked.',
        detailHe:
          'התא B1 ריק. כותבים `=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "data unavailable")` כדי שה-dashboard יציג fallback נקי במקום `#REF!` בפעם הבאה שהמקור משנה שם, נמחק, או נשללת ממנו הרשאה.',
      };
    }
    if (!formulaContains(formula, "IFERROR")) {
      return {
        passed: false,
        detail: `B1 contains \`${formula}\`. Wrap the IMPORTRANGE call with \`IFERROR(..., "data unavailable")\` so a broken source doesn't break the dashboard.`,
        detailHe: `התא B1 מכיל \`${formula}\`. עוטפים את הקריאה ל-IMPORTRANGE ב-\`IFERROR(..., "data unavailable")\` כדי שמקור שבור לא ישבור את ה-dashboard.`,
      };
    }
    if (!formulaContains(formula, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `B1 contains \`${formula}\`. The IFERROR has to wrap an \`IMPORTRANGE\` call. The defensive pattern is \`=IFERROR(IMPORTRANGE(...), "fallback")\`.`,
        detailHe: `התא B1 מכיל \`${formula}\`. ה-IFERROR צריך לעטוף קריאה ל-\`IMPORTRANGE\`. הדפוס ההגנתי הוא \`=IFERROR(IMPORTRANGE(...), "fallback")\`.`,
      };
    }
    return { passed: true };
  },
};

const conventionNote: Rule = {
  id: "c1-bounded-range-note",
  label: "C1 documents the team convention about bounded ranges",
  labelHe: "התא C1 מתעד את מוסכמת הצוות לגבי טווחים חסומים",
  answer: "Always bound IMPORTRANGE to known row counts",
  async run(sheet) {
    const value = await sheet.cellValue("C1");
    if (value == null || value === "") {
      return {
        passed: false,
        detail:
          'C1 is empty. Type a short note that captures the team rule, something like `Always bound IMPORTRANGE to known row counts`. A label like this saves the next person who opens this dashboard from making the same unbounded-range mistake.',
        detailHe:
          'התא C1 ריק. מקלידים הערה קצרה שתופסת את מוסכמת הצוות, משהו כמו `Always bound IMPORTRANGE to known row counts`. תווית כזו חוסכת לבא שיפתח את ה-dashboard לעשות את אותה טעות של טווח לא חסום.',
      };
    }
    const text = String(value).toLowerCase();
    if (!text.includes("bound") && !text.includes("range")) {
      return {
        passed: false,
        detail: `C1 contains \`${value}\`. The note should mention bounding or ranges so it actually points at the rule. Try \`Always bound IMPORTRANGE to known row counts\`.`,
        detailHe: `התא C1 מכיל \`${value}\`. ההערה צריכה להזכיר חסימה או טווחים כדי שהיא באמת תצביע על הכלל. מנסים \`Always bound IMPORTRANGE to known row counts\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "scale-03-importrange-patterns",
  lessonSlug: "scale/03-importrange-patterns",
  templateSheetId: null,
  seed: {
    tabTitle: "Dashboard",
    cells: [
      // Dashboard labels in column D, leaving A:C for the learner's work.
      // The "source" Campaigns workbook is imaginary: in the real workflow
      // the URL points at a different file entirely. The grader checks the
      // formula shape, not a resolved value.
      { a1: "D1", value: "Primary pull (A1)" },
      { a1: "D2", value: "Defensive pull with IFERROR (B1)" },
      { a1: "D3", value: "Team convention (C1)" },
    ],
  },
  rules: [importrangeBounded, iferrorWrap, conventionNote],
};
