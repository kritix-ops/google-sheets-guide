import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/21-named-functions/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H2: { value: 0.4241, formula: "=ROI(E2, F2)" },
  H3: { value: 0.4476, formula: "=ROI(SUM(E2:E13), SUM(F2:F13))" },
};

describe("Track 1 Lesson 21: named functions", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { NamedFn: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H2 not calling the named ROI function", async () => {
    const reader = new InMemoryReader({
      sheets: {
        NamedFn: {
          ...correctCells,
          H2: { value: 0.4241, formula: "=(F2-E2)/E2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-roi-named-row");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("ROI");
  });

  it("flags H2 calling ROI with wrong arguments", async () => {
    const reader = new InMemoryReader({
      sheets: {
        NamedFn: {
          ...correctCells,
          H2: { value: -0.298, formula: "=ROI(F2, E2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-roi-named-row");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("0.424");
  });

  it("flags H3 not summing the spend column", async () => {
    const reader = new InMemoryReader({
      sheets: {
        NamedFn: {
          ...correctCells,
          H3: { value: 0.4476, formula: "=ROI(E2, F2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-roi-named-portfolio",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("SUM(E2:E13)");
  });

  it("flags H3 not calling the named function at all", async () => {
    const reader = new InMemoryReader({
      sheets: {
        NamedFn: {
          ...correctCells,
          H3: {
            value: 0.4476,
            formula: "=(SUM(F2:F13)-SUM(E2:E13))/SUM(E2:E13)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-roi-named-portfolio",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("ROI");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { NamedFn: {} } });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-roi-named-row");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });
});
