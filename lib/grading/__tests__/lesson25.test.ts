import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/25-cross-sheet-indirect/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  I1: { value: 3933.78, formula: '=SUM(INDIRECT("E2:E13"))' },
  I2: { value: 3933.78, formula: '=SUM(INDIRECT(H2 & ":" & H3))' },
  I3: {
    value: "Invalid range",
    formula: '=IFERROR(SUM(INDIRECT(H4)), "Invalid range")',
  },
};

describe("Track 1 Lesson 25: cross-sheet INDIRECT", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Data: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags I1 not using INDIRECT", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Data: {
          ...correctCells,
          I1: { value: 3933.78, formula: "=SUM(E2:E13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find((c) => c.ruleId === "i1-indirect-sum");
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("INDIRECT");
  });

  it("flags I1 returning a wildly wrong sum", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Data: {
          ...correctCells,
          I1: { value: 100, formula: '=SUM(INDIRECT("E2:E3"))' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find((c) => c.ruleId === "i1-indirect-sum");
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("3933.78");
  });

  it("flags I2 not concatenating the range bounds", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Data: {
          ...correctCells,
          I2: { value: 3933.78, formula: '=SUM(INDIRECT("E2:E13"))' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i2 = result.feedback.checks.find(
      (c) => c.ruleId === "i2-dynamic-indirect",
    );
    expect(i2?.passed).toBe(false);
    expect(i2?.detail).toContain("&");
  });

  it("flags I3 not wrapping in IFERROR", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Data: {
          ...correctCells,
          I3: { value: 3933.78, formula: "=SUM(INDIRECT(H4))" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i3 = result.feedback.checks.find(
      (c) => c.ruleId === "i3-iferror-indirect",
    );
    expect(i3?.passed).toBe(false);
    expect(i3?.detail).toContain("IFERROR");
  });

  it("flags I3 not actually triggering the fallback", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Data: {
          ...correctCells,
          I3: { value: 3933.78, formula: '=IFERROR(SUM(INDIRECT("E2:E13")), "Invalid range")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i3 = result.feedback.checks.find(
      (c) => c.ruleId === "i3-iferror-indirect",
    );
    expect(i3?.passed).toBe(false);
    expect(i3?.detail).toContain("fallback");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Data: {} } });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find((c) => c.ruleId === "i1-indirect-sum");
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("I1 is empty");
  });
});
