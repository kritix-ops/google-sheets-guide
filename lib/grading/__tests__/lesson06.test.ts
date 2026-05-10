import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/06-aggregation/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const YOAV_COUNT = 2;
const YOAV_SPEND = 342.18 + 318.45;
const YOAV_REVENUE = 487.3 + 401.9;
const YOAV_GOOGLE_REVENUE = 487.3;

const baseFixtureCells = {
  B2: { value: "Yoav Cohen" },
  D2: { value: "Google" },
  E2: { value: 342.18 },
  F2: { value: 487.3 },
  B8: { value: "Yoav Cohen" },
  D8: { value: "Outbrain" },
  E8: { value: 318.45 },
  F8: { value: 401.9 },
};

const correctCells = {
  H1: { value: YOAV_COUNT, formula: '=COUNTIFS(B2:B13,"Yoav Cohen")' },
  H2: { value: YOAV_SPEND, formula: '=SUMIFS(E2:E13,B2:B13,"Yoav Cohen")' },
  H3: { value: YOAV_REVENUE, formula: '=SUMIFS(F2:F13,B2:B13,"Yoav Cohen")' },
  H4: {
    value: YOAV_GOOGLE_REVENUE,
    formula: '=SUMIFS(F2:F13,B2:B13,"Yoav Cohen",D2:D13,"Google")',
  },
};

describe("Track 1 Lesson 6: aggregation", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags COUNTIFS returning the wrong count", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H1: { value: 12, formula: "=COUNTA(B2:B13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-yoav-count");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("2");
  });

  it("flags SUMIFS missing the platform criterion", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H4: { value: YOAV_REVENUE, formula: '=SUMIFS(F2:F13,B2:B13,"Yoav Cohen")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h4 = result.feedback.checks.find(
      (c) => c.ruleId === "h4-yoav-google-revenue",
    );
    expect(h4?.passed).toBe(false);
    expect(h4?.detail).toContain("487");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-yoav-count");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
