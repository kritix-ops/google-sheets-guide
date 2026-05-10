import { MESSY_CAMPAIGNS, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, CellValue } from "@/lib/grading/types";

function asString(value: CellValue): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

function eqIgnoreCase(a: string | null, b: string): boolean {
  if (a == null) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// MESSY_CAMPAIGNS has 12 dirty rows + 1 header. The learner produces a cleaned
// vertical name in column H, one cell per row, simulating Fill-with-Gemini's
// proposal. The grader spot-checks three specific rows to confirm the
// canonical form. Row-by-row source values (MESSY_CAMPAIGNS column C):
//   row 2:  "Car Deals PR"           → H2 = "Car Deals PR"     (already clean)
//   row 5:  "Hearing Aids PR"        → H5 = "Hearing Aids PR"  (already clean)
//   row 10: "Senior Living P"        → H10 = "Senior Living PR" (typo fix)
// Three rows that cover the spectrum: two pass-through cleans plus one
// genuine typo fix. The PR suffix and Title Case are the team conventions.
const ROW_EXPECTATIONS: Record<string, string> = {
  H2: "Car Deals PR",
  H5: "Hearing Aids PR",
  H10: "Senior Living PR",
};

const hRowCleanups: Rule = {
  id: "h-row-cleanups",
  label:
    "Column H carries the cleaned, canonical vertical names for rows 2, 5, and 10",
  labelHe:
    "עמודה H נושאת את שמות ה-vertical המנורמלים והקנוניים עבור שורות 2, 5, ו-10",
  answer: 'H2 = "Car Deals PR", H5 = "Hearing Aids PR", H10 = "Senior Living PR"',
  async run(sheet) {
    const failures: string[] = [];
    const failuresHe: string[] = [];
    for (const [cell, expected] of Object.entries(ROW_EXPECTATIONS)) {
      const value = await sheet.cellValue(cell);
      const str = asString(value);
      if (!eqIgnoreCase(str, expected)) {
        failures.push(`${cell} should be \`${expected}\` (got \`${str ?? "empty"}\`)`);
        failuresHe.push(`${cell} צריך להיות \`${expected}\` (התקבל \`${str ?? "ריק"}\`)`);
      }
    }
    if (failures.length > 0) {
      return {
        passed: false,
        detail: `Fill-with-Gemini's job is to normalize each messy vertical into the canonical form ending in " PR". ${failures.join("; ")}. The PR suffix is the team convention; the casing is Title Case.`,
        detailHe: `המשימה של Fill-with-Gemini היא לנרמל כל vertical מבולגן לצורה הקנונית שמסתיימת ב-" PR". ${failuresHe.join("; ")}. הסיומת PR היא קונבנציית הצוות, הקסטינג הוא Title Case.`,
      };
    }
    return { passed: true };
  },
};

const j1FillPrompt: Rule = {
  id: "j1-fill-prompt",
  label:
    'J1 captures the Fill-with-Gemini prompt: standardize/normalize verticals into "... PR" form',
  labelHe:
    'התא J1 לוכד את ה-prompt של Fill-with-Gemini: לנרמל verticals לצורת "... PR"',
  answer:
    '"Standardize each vertical name to Title Case and ensure it ends with PR"',
  async run(sheet) {
    const value = await sheet.cellValue("J1");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'J1 is empty. Write the prompt you would type into Fill with Gemini. Example: `Standardize each vertical name to Title Case and ensure it ends with PR`. The prompt must contain `standardize` or `normalize`, the word `vertical`, and the suffix `PR`.',
        detailHe:
          'התא J1 ריק. כותבים את ה-prompt שהייתם מקלידים ב-Fill with Gemini. דוגמה: `Standardize each vertical name to Title Case and ensure it ends with PR`. ה-prompt חייב להכיל `standardize` או `normalize`, את המילה `vertical`, ואת הסיומת `PR`.',
      };
    }
    const lower = str.toLowerCase();
    const hasNormalizeOrStandardize =
      lower.includes("standardize") || lower.includes("normalize");
    const hasVertical = lower.includes("vertical");
    // PR is the team's uppercase suffix and is a brittle substring (it appears
    // inside "prompt", "promote", etc.). Require either the literal uppercase
    // `PR` token or the lowercase form bounded by spaces/punctuation.
    const hasPr =
      /\bPR\b/.test(str) || /\bpr\b/.test(lower);
    if (!hasNormalizeOrStandardize || !hasVertical || !hasPr) {
      const missing: string[] = [];
      if (!hasNormalizeOrStandardize) missing.push("`standardize` or `normalize`");
      if (!hasVertical) missing.push("`vertical`");
      if (!hasPr) missing.push("`PR`");
      return {
        passed: false,
        detail: `J1 reads \`${str}\` and is missing: ${missing.join(", ")}. A Fill-with-Gemini prompt is judged on specificity. "Clean these up" gets random results; "Standardize each vertical name to Title Case and ensure it ends with PR" produces consistent output.`,
        detailHe: `התא J1 מכיל \`${str}\` וחסר: ${missing.join(", ")}. prompt של Fill-with-Gemini נשפט על specificity. "תנקה את זה" מקבל תוצאות אקראיות, "Standardize each vertical name to Title Case and ensure it ends with PR" מייצר output עקבי.`,
      };
    }
    return { passed: true };
  },
};

const hNoFormulas: Rule = {
  id: "h-no-formulas",
  label:
    "Column H holds literal values (Fill with Gemini does not produce formulas)",
  labelHe:
    "עמודה H מחזיקה ערכים ספרותיים (Fill with Gemini לא מייצר נוסחאות)",
  answer: "H2 is a literal value with no formula",
  async run(sheet) {
    const formula = await sheet.cellFormula("H2");
    if (formula != null) {
      return {
        passed: false,
        detail: `H2 contains a formula (\`${formula}\`) but Fill with Gemini's apply writes literal values, not formulas. The point of this lesson is to feel what the apply produces: cells you can sort, copy, audit. Replace the formula with a literal value (\`Car Deals PR\`).`,
        detailHe: `התא H2 מכיל נוסחה (\`${formula}\`) אבל apply של Fill with Gemini כותב ערכים ספרותיים, לא נוסחאות. כל המטרה של השיעור הזה היא להרגיש מה ה-apply מייצר: תאים שאפשר למיין, להעתיק, לבצע audit. מחליפים את הנוסחה בערך ספרותי (\`Car Deals PR\`).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "ai-03-fill-with-gemini",
  lessonSlug: "ai-in-sheets/03-fill-with-gemini",
  templateSheetId: null,
  seed: {
    tabTitle: "Cleanup",
    cells: [
      ...dataToCells(MESSY_CAMPAIGNS),
      { a1: "H1", value: "Cleaned vertical" },
      { a1: "I1", value: "Fill-with-Gemini prompt" },
    ],
  },
  rules: [hRowCleanups, j1FillPrompt, hNoFormulas],
};
