import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/09-error-handling/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  A1: { value: "Buyer" },
  B1: { value: "Spend" },
  C1: { value: "Revenue" },
  A2: { value: "Yoav Cohen" },
  B2: { value: 0 },
  C2: { value: 0 },
  E1: { value: "Vertical lookup" },
  F1: { value: "Category" },
  E2: { value: "Used Cars PR" },
  F2: { value: "Automotive" },
  I1: { value: "Test errors" },
  I2: { value: "#N/A" },
  I3: { value: "OK" },
  I4: { value: "#N/A" },
};

const correctCells = {
  H1: { value: "no spend", formula: '=IFERROR(C2/B2,"no spend")' },
  H2: {
    value: "Uncategorized",
    formula: '=IFNA(VLOOKUP(F2,E2:F2,2,FALSE),"Uncategorized")',
  },
  H3: {
    value: "Add to backlog",
    formula:
      '=IF(ISNA(VLOOKUP(F2,E2:F2,2,FALSE)),"Add to backlog","Already known")',
  },
  H4: { value: 2, formula: '=COUNTIF(I2:I4,"#N/A")' },
};

describe("Track 1 Lesson 9: error handling", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags using IFERROR where IFNA was expected", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H2: {
            value: "Uncategorized",
            formula: '=IFERROR(VLOOKUP(F2,E2:F2,2,FALSE),"Uncategorized")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-ifna-vertical");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("IFNA");
  });

  it("flags missing IFERROR around the ROI division", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H1: { value: "#DIV/0!", formula: "=C2/B2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-iferror-roi");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("IFERROR");
  });

  it("flags COUNTIF with the wrong criterion", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H4: { value: 3, formula: "=COUNTA(I2:I4)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h4 = result.feedback.checks.find((c) => c.ruleId === "h4-count-errors");
    expect(h4?.passed).toBe(false);
    expect(h4?.detail).toContain("COUNTIF");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-iferror-roi");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
