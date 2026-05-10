import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/24-financial/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  D2: { value: 0.4241, formula: "=(B2-A2)/A2" },
  E2: { value: 1.4241, formula: "=B2/A2" },
  H2: { value: 267.95, formula: "=NPV(0.10, G3:G6) + G2" },
  H3: { value: 0.2186, formula: "=IRR(G2:G6)" },
};

describe("Track 1 Lesson 24: financial functions", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Finance: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags D2 returning the wrong ROI", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Finance: {
          ...correctCells,
          D2: { value: 1.4241, formula: "=B2/A2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const d2 = result.feedback.checks.find((c) => c.ruleId === "d2-roi");
    expect(d2?.passed).toBe(false);
    expect(d2?.detail).toContain("0.424");
  });

  it("flags E2 returning the wrong ROAS", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Finance: {
          ...correctCells,
          E2: { value: 0.4241, formula: "=(B2-A2)/A2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const e2 = result.feedback.checks.find((c) => c.ruleId === "e2-roas");
    expect(e2?.passed).toBe(false);
    expect(e2?.detail).toContain("1.424");
  });

  it("flags H2 not using NPV", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Finance: {
          ...correctCells,
          H2: { value: 267.95, formula: "=SUM(G2:G6)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-npv");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("NPV");
  });

  it("flags H2 including the period-0 outflow inside NPV by mistake", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Finance: {
          ...correctCells,
          H2: { value: 243.59, formula: "=NPV(0.10, G2:G6)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-npv");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("267.95");
  });

  it("flags H3 not using IRR", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Finance: {
          ...correctCells,
          H3: { value: 0.2186, formula: "=RATE(4, 400, -1000)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-irr");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("IRR");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Finance: {} } });

    const result = await runRules(assignment.rules, reader);
    const d2 = result.feedback.checks.find((c) => c.ruleId === "d2-roi");
    expect(d2?.passed).toBe(false);
    expect(d2?.detail).toContain("D2 is empty");
  });
});
