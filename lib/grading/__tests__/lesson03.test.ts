import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/03-math-text-date-logical/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const TOTAL_SPEND =
  342.18 + 215.5 + 512.0 + 187.25 + 432.7 + 605.1 + 318.45 + 296.4 + 224.6 + 178.9 + 142.3 + 478.3;

const baseFixtureCells = {
  A1: { value: "Date" },
  B1: { value: "Buyer" },
  E1: { value: "Spend" },
  F1: { value: "Revenue" },
  B2: { value: "Yoav Cohen" },
  E2: { value: 342.18 },
  F2: { value: 487.3 },
  E3: { value: 215.5 },
  E4: { value: 512.0 },
  E5: { value: 187.25 },
  E6: { value: 432.7 },
  E7: { value: 605.1 },
  E8: { value: 318.45 },
  E9: { value: 296.4 },
  E10: { value: 224.6 },
  E11: { value: 178.9 },
  E12: { value: 142.3 },
  E13: { value: 478.3 },
};

const correctCells = {
  H1: { value: TOTAL_SPEND, formula: "=SUM(E2:E13)" },
  H2: { value: "YOAV COHEN", formula: "=UPPER(B2)" },
  H3: { value: 364, formula: "=DATE(2026,12,31)-DATE(2026,1,1)" },
  H4: { value: "Profitable", formula: '=IF(F2>E2,"Profitable","Loss")' },
};

describe("Track 1 Lesson 3: math, text, date, logical", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags wrong SUM range with a teaching message", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H1: { value: 0, formula: "=SUM(E2:E2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-sum-spend");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("3933");
  });

  it("flags wrong UPPER target", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H2: { value: "USED CARS PR", formula: "=UPPER(C2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-upper-buyer");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("YOAV COHEN");
  });

  it("flags reversed date math", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H3: { value: -364, formula: "=DATE(2026,1,1)-DATE(2026,12,31)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-date-range");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("364");
  });

  it("flags an IF that reports the wrong branch", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H4: { value: "Loss", formula: '=IF(F2<E2,"Profitable","Loss")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h4 = result.feedback.checks.find(
      (c) => c.ruleId === "h4-if-profitable",
    );
    expect(h4?.passed).toBe(false);
    expect(h4?.detail).toContain("Profitable");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-sum-spend");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });

  it("tolerates whitespace and case variation in formulas", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          H1: { value: TOTAL_SPEND, formula: "= sum( e2:e13 )" },
          H2: { value: "YOAV COHEN", formula: "= upper( b2 )" },
          H3: { value: 364, formula: "= date(2026, 12, 31) - date(2026, 1, 1)" },
          H4: { value: "Profitable", formula: '= if( f2 > e2, "Profitable", "Loss" )' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
  });
});
