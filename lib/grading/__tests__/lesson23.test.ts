import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/23-statistical/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H1: { value: 307.425, formula: "=MEDIAN(E2:E13)" },
  H2: { value: 982.7, formula: "=PERCENTILE(F2:F13, 0.9)" },
  H3: { value: 0.83, formula: "=CORREL(E2:E13, F2:F13)" },
};

describe("Track 1 Lesson 23: statistical functions", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Stats: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H1 not using MEDIAN", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Stats: {
          ...correctCells,
          H1: { value: 327.815, formula: "=AVERAGE(E2:E13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-median-spend");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("MEDIAN");
  });

  it("flags H1 evaluating to a wildly wrong median", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Stats: {
          ...correctCells,
          H1: { value: 100, formula: "=MEDIAN(A2:A13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-median-spend");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("307");
  });

  it("flags H2 not using PERCENTILE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Stats: {
          ...correctCells,
          H2: { value: 982.7, formula: "=LARGE(F2:F13, 2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-percentile-revenue",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("PERCENTILE");
  });

  it("flags H3 not using CORREL", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Stats: {
          ...correctCells,
          H3: { value: 0.83, formula: "=COVAR(E2:E13, F2:F13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-correl-spend-revenue",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("CORREL");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Stats: {} } });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-median-spend");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
