import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/18-lambda/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  C2: { value: 1.5, formula: "=LAMBDA(s, r, (r-s)/s)(A2, B2)" },
  C4: { value: 3.5, formula: "=LET(roi, LAMBDA(s, r, (r-s)/s), roi(A2, B2) + roi(A3, B3))" },
  C6: { value: 1.25, formula: "=LAMBDA(s, r, fee, (r - fee - s)/s)(A2, B2, 25)" },
};

describe("Track 1 Lesson 18: LAMBDA", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Lambda: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags C2 not using LAMBDA", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lambda: {
          ...correctCells,
          C2: { value: 1.5, formula: "=(B2-A2)/A2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c2 = result.feedback.checks.find(
      (c) => c.ruleId === "c2-inline-lambda-roi",
    );
    expect(c2?.passed).toBe(false);
    expect(c2?.detail).toContain("LAMBDA");
  });

  it("flags C2 computing the wrong ROI value", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lambda: {
          ...correctCells,
          C2: { value: 2.5, formula: "=LAMBDA(s, r, r/s)(A2, B2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c2 = result.feedback.checks.find(
      (c) => c.ruleId === "c2-inline-lambda-roi",
    );
    expect(c2?.passed).toBe(false);
    expect(c2?.detail).toContain("1.5");
  });

  it("flags C4 missing LET", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lambda: {
          ...correctCells,
          C4: {
            value: 3.5,
            formula: "=LAMBDA(s, r, (r-s)/s)(A2, B2) + LAMBDA(s, r, (r-s)/s)(A3, B3)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c4 = result.feedback.checks.find(
      (c) => c.ruleId === "c4-let-named-lambda",
    );
    expect(c4?.passed).toBe(false);
    expect(c4?.detail).toContain("LET");
  });

  it("flags C6 not subtracting the fee correctly", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lambda: {
          ...correctCells,
          C6: { value: 1.5, formula: "=LAMBDA(s, r, fee, (r-s)/s)(A2, B2, 25)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c6 = result.feedback.checks.find(
      (c) => c.ruleId === "c6-lambda-with-fee",
    );
    expect(c6?.passed).toBe(false);
    expect(c6?.detail).toContain("1.25");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Lambda: {} } });

    const result = await runRules(assignment.rules, reader);
    const c2 = result.feedback.checks.find(
      (c) => c.ruleId === "c2-inline-lambda-roi",
    );
    expect(c2?.passed).toBe(false);
    expect(c2?.detail).toContain("C2 is empty");
  });
});
