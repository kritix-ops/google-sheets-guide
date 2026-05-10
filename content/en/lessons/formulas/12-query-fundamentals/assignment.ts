import { CAMPAIGNS, dataToCells } from "@/content/datasets/adtech";
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

function approxEqual(a: number, b: number, eps = 0.05): boolean {
  return Math.abs(a - b) < eps;
}

// Compute expected QUERY results dynamically from the dataset so the rules
// stay correct when the data changes. Columns: B=Buyer (1), C=Vertical (2),
// E=Spend (4), F=Revenue (5).
const FIRST_DATA_ROW = CAMPAIGNS[1]!;
const FIRST_BUYER = FIRST_DATA_ROW[1] as string;
const FIRST_VERTICAL = FIRST_DATA_ROW[2] as string;

const HIGH_REVENUE_ROWS: Array<[string, string, number]> = CAMPAIGNS.slice(1)
  .filter((r) => typeof r[5] === "number" && (r[5] as number) > 400)
  .map(
    (r): [string, string, number] => [
      r[1] as string,
      r[2] as string,
      r[5] as number,
    ],
  )
  .sort((a, b) => b[2] - a[2]);

const FIRST_BUYER_HIGH_REVENUE: Array<[string, string, number]> = CAMPAIGNS
  .slice(1)
  .filter(
    (r) =>
      r[1] === FIRST_BUYER &&
      typeof r[5] === "number" &&
      (r[5] as number) > 400,
  )
  .map(
    (r): [string, string, number] => [
      r[1] as string,
      r[2] as string,
      r[5] as number,
    ],
  );

const querySelect: Rule = {
  id: "h1-query-select",
  label: "H1 projects Buyer, Vertical, Revenue with QUERY SELECT",
  labelHe: "התא H1 מקרין Buyer, Vertical, Revenue באמצעות QUERY SELECT",
  answer: '=QUERY(A1:F13, "SELECT B, C, F", 1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("H1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'H1 is empty. Use `=QUERY(A1:F13, "SELECT B, C, F", 1)` to project the three columns.',
        detailHe:
          'התא H1 ריק. משתמשים ב-`=QUERY(A1:F13, "SELECT B, C, F", 1)` כדי להקרין את שלוש העמודות.',
      };
    }
    if (!formulaContains(formula, "QUERY")) {
      return {
        passed: false,
        detail: `H1 contains \`${formula}\`. Use the \`QUERY\` function with a SELECT clause.`,
        detailHe: `התא H1 מכיל \`${formula}\`. משתמשים בפונקציית \`QUERY\` עם פסוקית SELECT.`,
      };
    }
    const result = await sheet.rangeValues("H1:J3");
    const expectedRow0 = ["Buyer", "Vertical", "Revenue"];
    for (let c = 0; c < 3; c++) {
      const actual = String(result[0]?.[c] ?? "").toLowerCase();
      const exp = expectedRow0[c]!.toLowerCase();
      if (!actual.includes(exp)) {
        return {
          passed: false,
          detail: `Header row should contain ${expectedRow0[c]}. Pass \`1\` as the third argument so QUERY preserves the header.`,
          detailHe: `שורת הכותרת צריכה להכיל ${expectedRow0[c]}. מעבירים \`1\` כארגומנט השלישי כדי ש-QUERY ישמר את הכותרת.`,
        };
      }
    }
    if (result[1]?.[0] !== FIRST_BUYER || result[1]?.[1] !== FIRST_VERTICAL) {
      return {
        passed: false,
        detail: `First data row should be ${FIRST_BUYER}, ${FIRST_VERTICAL}. Check the SELECT clause and the third argument.`,
        detailHe: `שורת הנתונים הראשונה צריכה להיות ${FIRST_BUYER}, ${FIRST_VERTICAL}. בודקים את פסוקית ה-SELECT ואת הארגומנט השלישי.`,
      };
    }
    return { passed: true };
  },
};

const queryWhereOrderBy: Rule = {
  id: "k1-query-where-orderby",
  label: "K1 filters revenue > 400 sorted descending",
  labelHe: "התא K1 מסנן revenue > 400 ממוין יורד",
  answer: '=QUERY(A1:F13, "SELECT B, C, F WHERE F > 400 ORDER BY F DESC", 1)',
  async run(sheet) {
    const formula = await sheet.cellFormula("K1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          'K1 is empty. Use `=QUERY(A1:F13, "SELECT B, C, F WHERE F > 400 ORDER BY F DESC", 1)` to filter and sort.',
        detailHe:
          'התא K1 ריק. משתמשים ב-`=QUERY(A1:F13, "SELECT B, C, F WHERE F > 400 ORDER BY F DESC", 1)` כדי לסנן ולמיין.',
      };
    }
    if (!formulaContains(formula, "QUERY")) {
      return {
        passed: false,
        detail: `K1 contains \`${formula}\`. Use \`QUERY\` with WHERE and ORDER BY clauses.`,
        detailHe: `התא K1 מכיל \`${formula}\`. משתמשים ב-\`QUERY\` עם פסוקיות WHERE ו-ORDER BY.`,
      };
    }
    const result = await sheet.rangeValues(
      `K1:M${HIGH_REVENUE_ROWS.length + 1}`,
    );
    for (let i = 0; i < HIGH_REVENUE_ROWS.length; i++) {
      const expected = HIGH_REVENUE_ROWS[i]!;
      const buyer = result[i + 1]?.[0];
      const vertical = result[i + 1]?.[1];
      const revenue = result[i + 1]?.[2];
      const expRev = expected[2];
      if (
        buyer !== expected[0] ||
        vertical !== expected[1] ||
        typeof revenue !== "number" ||
        !approxEqual(revenue, expRev, 0.05)
      ) {
        return {
          passed: false,
          detail: `Row ${i + 1} of the QUERY result should be \`${expected[0]}, ${expected[1]}, ${expRev}\` but is \`${buyer ?? "?"}, ${vertical ?? "?"}, ${revenue ?? "?"}\`. Filter F > 400, order F DESC.`,
          detailHe: `שורה ${i + 1} בתוצאת ה-QUERY צריכה להיות \`${expected[0]}, ${expected[1]}, ${expRev}\` אבל היא \`${buyer ?? "?"}, ${vertical ?? "?"}, ${revenue ?? "?"}\`. לסנן F > 400, למיין F DESC.`,
        };
      }
    }
    return { passed: true };
  },
};

const queryMultipleCriteria: Rule = {
  id: "n1-query-multi-criteria",
  label: "N1 filters Yoav's campaigns with revenue > 400",
  labelHe: "התא N1 מסנן את הקמפיינים של Yoav עם revenue > 400",
  answer: `=QUERY(A1:F13, "SELECT B, C, F WHERE B = '${FIRST_BUYER}' AND F > 400", 1)`,
  async run(sheet) {
    const formula = await sheet.cellFormula("N1");
    if (formula == null) {
      return {
        passed: false,
        detail:
          `N1 is empty. Use \`=QUERY(A1:F13, "SELECT B, C, F WHERE B = '${FIRST_BUYER}' AND F > 400", 1)\` for the multi-criterion filter.`,
        detailHe:
          `התא N1 ריק. משתמשים ב-\`=QUERY(A1:F13, "SELECT B, C, F WHERE B = '${FIRST_BUYER}' AND F > 400", 1)\` עבור סינון מרובה תנאים.`,
      };
    }
    if (!formulaContains(formula, "QUERY") || !formulaContains(formula, "AND")) {
      return {
        passed: false,
        detail: `N1 contains \`${formula}\`. Use a QUERY with AND combining buyer and revenue conditions.`,
        detailHe: `התא N1 מכיל \`${formula}\`. משתמשים ב-QUERY עם AND שמשלב את תנאי ה-media buyer וה-revenue.`,
      };
    }
    const result = await sheet.rangeValues(
      `N1:P${FIRST_BUYER_HIGH_REVENUE.length + 1}`,
    );
    for (let i = 0; i < FIRST_BUYER_HIGH_REVENUE.length; i++) {
      const expected = FIRST_BUYER_HIGH_REVENUE[i]!;
      const buyer = result[i + 1]?.[0];
      const vertical = result[i + 1]?.[1];
      const revenue = result[i + 1]?.[2];
      const expRev = expected[2];
      if (
        buyer !== expected[0] ||
        vertical !== expected[1] ||
        typeof revenue !== "number" ||
        !approxEqual(revenue, expRev, 0.05)
      ) {
        return {
          passed: false,
          detail: `Row ${i + 1} should be \`${expected[0]}, ${expected[1]}, ${expRev}\` but is \`${buyer ?? "?"}, ${vertical ?? "?"}, ${revenue ?? "?"}\`.`,
          detailHe: `שורה ${i + 1} צריכה להיות \`${expected[0]}, ${expected[1]}, ${expRev}\` אבל היא \`${buyer ?? "?"}, ${vertical ?? "?"}, ${revenue ?? "?"}\`.`,
        };
      }
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "formulas-12-query-fundamentals",
  lessonSlug: "formulas/12-query-fundamentals",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: dataToCells(CAMPAIGNS),
  },
  rules: [querySelect, queryWhereOrderBy, queryMultipleCriteria],
};
