import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/28-performance/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H2: { value: 376.4, formula: "=ARRAYFORMULA(E2:E13 * 1.1)" },
  I1: { value: 3933.78, formula: "=SUM(E2:E13)" },
  J1: {
    value: 0.4476,
    formula:
      "=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), (revenue - spend) / spend)",
  },
};

describe("Track 1 Lesson 28: performance patterns", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Performance: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H2 not using ARRAYFORMULA or MAP", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Performance: {
          ...correctCells,
          H2: { value: 376.4, formula: "=E2*1.1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-arrayformula-markup",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("ARRAYFORMULA");
  });

  it("accepts MAP+LAMBDA as an alternative for H2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Performance: {
          ...correctCells,
          H2: { value: 376.4, formula: "=MAP(E2:E13, LAMBDA(x, x*1.1))" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-arrayformula-markup",
    );
    expect(h2?.passed).toBe(true);
  });

  it("flags I1 using a full-column E:E reference", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Performance: {
          ...correctCells,
          I1: { value: 3933.78, formula: "=SUM(E:E)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find(
      (c) => c.ruleId === "i1-bounded-range",
    );
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("E2:E13");
  });

  it("flags J1 not using LET", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Performance: {
          ...correctCells,
          J1: {
            value: 0.4476,
            formula: "=(SUM(F2:F13) - SUM(E2:E13)) / SUM(E2:E13)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-let-compute-once",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("LET");
  });

  it("flags J1 evaluating to the wrong ROI", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Performance: {
          ...correctCells,
          J1: {
            value: 1.4476,
            formula: "=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), revenue / spend)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-let-compute-once",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("0.448");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Performance: {} } });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-arrayformula-markup",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });
});
