import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/19-lambda-helpers/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H2: { value: 0.4241, formula: "=MAP(E2:E13, F2:F13, LAMBDA(s, r, (r-s)/s))" },
  I1: {
    value: 2615.3,
    formula: "=REDUCE(0, E2:E13, LAMBDA(a, s, IF(s>300, a+s, a)))",
  },
  J2: { value: 342.18, formula: "=SCAN(0, E2:E13, LAMBDA(a, s, a+s))" },
};

describe("Track 1 Lesson 19: MAP/REDUCE/SCAN", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Helpers: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H2 missing MAP", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Helpers: {
          ...correctCells,
          H2: { value: 0.4241, formula: "=(F2-E2)/E2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-map-roi");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("MAP");
  });

  it("flags H2 missing LAMBDA", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Helpers: {
          ...correctCells,
          H2: { value: 0.4241, formula: "=MAP(E2:E13, F2:F13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-map-roi");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("LAMBDA");
  });

  it("flags I1 missing REDUCE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Helpers: {
          ...correctCells,
          I1: { value: 2615.3, formula: '=SUMIF(E2:E13, ">300")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find(
      (c) => c.ruleId === "i1-reduce-filtered-sum",
    );
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("REDUCE");
  });

  it("flags J2 missing SCAN", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Helpers: {
          ...correctCells,
          J2: { value: 3933.78, formula: "=SUM(E2:E13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-scan-cumulative-spend",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("SCAN");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Helpers: {} } });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-map-roi");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });
});
