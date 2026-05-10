import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/26-sparkline/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  I2: { value: 0, formula: "=SPARKLINE(B2:H2)" },
  I3: {
    value: 0,
    formula:
      '=SPARKLINE(B3:H3, {"charttype","line";"color","#4285F4";"linewidth",2})',
  },
  I4: {
    value: 0,
    formula:
      '=SPARKLINE(B4:H4 - 500, {"charttype","winloss";"color1","green";"negcolor","red"})',
  },
};

describe("Track 1 Lesson 26: SPARKLINE", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sparklines: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags I2 not using SPARKLINE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sparklines: {
          ...correctCells,
          I2: { value: 0, formula: "=AVERAGE(B2:H2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i2 = result.feedback.checks.find(
      (c) => c.ruleId === "i2-sparkline-basic",
    );
    expect(i2?.passed).toBe(false);
    expect(i2?.detail).toContain("SPARKLINE");
  });

  it("flags I2 referencing the wrong data range", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sparklines: {
          ...correctCells,
          I2: { value: 0, formula: "=SPARKLINE(B2:H4)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i2 = result.feedback.checks.find(
      (c) => c.ruleId === "i2-sparkline-basic",
    );
    expect(i2?.passed).toBe(false);
    expect(i2?.detail).toContain("B2:H2");
  });

  it("flags I3 missing the color option", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sparklines: {
          ...correctCells,
          I3: { value: 0, formula: "=SPARKLINE(B3:H3)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i3 = result.feedback.checks.find(
      (c) => c.ruleId === "i3-sparkline-styled",
    );
    expect(i3?.passed).toBe(false);
    expect(i3?.detail).toContain("color");
  });

  it("flags I4 missing the winloss charttype", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sparklines: {
          ...correctCells,
          I4: {
            value: 0,
            formula: '=SPARKLINE(B4:H4, {"charttype","column"})',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i4 = result.feedback.checks.find(
      (c) => c.ruleId === "i4-sparkline-winloss",
    );
    expect(i4?.passed).toBe(false);
    expect(i4?.detail).toContain("winloss");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Sparklines: {} } });

    const result = await runRules(assignment.rules, reader);
    const i2 = result.feedback.checks.find(
      (c) => c.ruleId === "i2-sparkline-basic",
    );
    expect(i2?.passed).toBe(false);
    expect(i2?.detail).toContain("I2 is empty");
  });
});
