import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/11-sequence-randarray/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  A1: { value: "Task" },
};

const monthEnds = [
  46053, 46081, 46112, 46142, 46173, 46203, 46234, 46265, 46295, 46326, 46356,
  46387,
];

function buildCorrectCells() {
  const cells: Record<string, { value: number; formula?: string }> = {};
  for (let i = 0; i < 12; i++) {
    cells[`H${i + 1}`] = { value: i + 1 };
    cells[`N${i + 1}`] = { value: monthEnds[i]! };
  }
  cells.H1 = { ...cells.H1!, formula: "=SEQUENCE(12)" };
  cells.N1 = {
    ...cells.N1!,
    formula: "=ARRAYFORMULA(EOMONTH(DATE(2026,1,1),SEQUENCE(12)-1))",
  };
  cells.I1 = { value: 10, formula: "=SEQUENCE(1,5,10,5)" };
  cells.J1 = { value: 15 };
  cells.K1 = { value: 20 };
  cells.L1 = { value: 25 };
  cells.M1 = { value: 30 };
  return cells;
}

describe("Track 1 Lesson 11: dynamic array generators", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...buildCorrectCells() } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags missing SEQUENCE function", async () => {
    const cells = buildCorrectCells();
    cells.H1 = { value: 1, formula: "=1" };
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...cells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find(
      (c) => c.ruleId === "h1-vertical-sequence",
    );
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("SEQUENCE");
  });

  it("flags wrong horizontal sequence values", async () => {
    const cells = buildCorrectCells();
    cells.J1 = { value: 11, formula: "=SEQUENCE(1,5,10,1)" };
    cells.K1 = { value: 12 };
    cells.L1 = { value: 13 };
    cells.M1 = { value: 14 };
    cells.I1 = { value: 10, formula: "=SEQUENCE(1,5,10,1)" };
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...cells } },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find(
      (c) => c.ruleId === "i1-stepped-sequence",
    );
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("15");
  });

  it("flags missing EOMONTH+SEQUENCE for month-ends", async () => {
    const cells = buildCorrectCells();
    cells.N1 = { value: 46053, formula: "=DATE(2026,1,31)" };
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...cells } },
    });

    const result = await runRules(assignment.rules, reader);
    const n1 = result.feedback.checks.find(
      (c) => c.ruleId === "n1-month-ends",
    );
    expect(n1?.passed).toBe(false);
    expect(n1?.detail).toContain("EOMONTH");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find(
      (c) => c.ruleId === "h1-vertical-sequence",
    );
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
