import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/14-data-cleanup-recipes/assignment";
import { MESSY_CAMPAIGNS } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = MESSY_CAMPAIGNS.slice(1);

const TOTAL_NONEMPTY_DATES = ROWS.filter(
  (r) => r[0] !== "" && r[0] != null,
).length;

const UNIQUE_BUYERS = new Set(
  ROWS.map((r) => String(r[1] ?? "").trim().toLowerCase()),
).size;

const TYPO_COUNT = ROWS.filter((r) => r[2] === "Senior Living P").length;

const TOTAL_SPEND = ROWS.reduce((sum, r) => {
  const raw = r[4];
  if (typeof raw === "number") return sum + raw;
  const coerced = Number(raw);
  return Number.isFinite(coerced) ? sum + coerced : sum;
}, 0);

const correctCells = {
  I1: { value: TOTAL_NONEMPTY_DATES, formula: "=COUNTA(A2:A14)" },
  I2: {
    value: UNIQUE_BUYERS,
    formula: "=COUNTA(UNIQUE(LOWER(TRIM(B2:B14))))",
  },
  I3: { value: TYPO_COUNT, formula: '=COUNTIF(C2:C14,"Senior Living P")' },
  I4: {
    value: TOTAL_SPEND,
    formula: "=SUMPRODUCT(IFERROR(VALUE(E2:E14),0))",
  },
};

describe("Track 2 Lesson 14: Data cleanup recipes", () => {
  it("passes when all four cleanup formulas are correct", async () => {
    const reader = new InMemoryReader({
      sheets: { Raw: { ...correctCells } },
    });
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags I2 missing LOWER on the buyer column", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Raw: {
          ...correctCells,
          // Without LOWER, "YOAV COHEN", "Yoav Cohen", and "maya bar" all
          // count as separate buyers. The declared value here is irrelevant
          // (the formula-shape check fires first), but we keep it consistent.
          I2: {
            value: UNIQUE_BUYERS,
            formula: "=COUNTA(UNIQUE(TRIM(B2:B14)))",
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "i2-unique-buyers",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toMatch(/LOWER|UPPER|PROPER/);
  });

  it("flags I3 with the wrong typo string (still has the R)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Raw: {
          ...correctCells,
          // Searching for "Senior Living PR" matches the canonical rows, not
          // the typo row. On MESSY_CAMPAIGNS that yields 0 (the correctly
          // spelled vertical doesn't appear). The grader catches the value
          // mismatch and surfaces the expected count.
          I3: {
            value: 0,
            formula: '=COUNTIF(C2:C14,"Senior Living PR")',
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "i3-vertical-typo",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain(String(TYPO_COUNT));
  });

  it("flags I4 missing VALUE coercion (text-string row drops)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Raw: {
          ...correctCells,
          // Plain SUM would silently skip the "187.25" text-string row, so
          // the value comes out short by that amount.
          I4: {
            value: TOTAL_SPEND - 187.25,
            formula: "=SUM(E2:E14)",
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find((r) => r.ruleId === "i4-total-spend");
    expect(c?.passed).toBe(false);
    expect(c?.detail).toMatch(/VALUE/);
  });

  it("flags an empty I1", async () => {
    const reader = new InMemoryReader({
      sheets: { Raw: {} },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "i1-total-raw-count",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("I1 is empty");
  });
});
