import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/20-let/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H2: {
    value: 0.4241,
    formula: "=LET(spend, E2, revenue, F2, (revenue-spend)/spend)",
  },
  H3: {
    value: "Hold",
    formula:
      '=LET(roi, (F2-E2)/E2, IF(roi>0.5, "Scale", IF(roi>0, "Hold", IF(roi>-0.2, "Watch", "Kill"))))',
  },
  H5: {
    value: "Strong period",
    formula:
      '=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), profit, revenue - spend, roi, profit / spend, IF(roi > 0.3, "Strong period", "Weak period"))',
  },
};

describe("Track 1 Lesson 20: LET", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Let: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H2 missing LET", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Let: {
          ...correctCells,
          H2: { value: 0.4241, formula: "=(F2-E2)/E2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-let-roi");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("LET");
  });

  it("flags H3 returning the wrong bucket label", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Let: {
          ...correctCells,
          H3: {
            value: "Scale",
            formula:
              '=LET(roi, (F2-E2)/E2, IF(roi>0.1, "Scale", IF(roi>0, "Hold", IF(roi>-0.2, "Watch", "Kill"))))',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-let-bucket");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("Hold");
  });

  it("flags H5 missing the SUM bindings", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Let: {
          ...correctCells,
          H5: {
            value: "Strong period",
            formula:
              '=LET(spend, E2, revenue, F2, profit, revenue - spend, roi, profit / spend, IF(roi > 0.3, "Strong period", "Weak period"))',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h5 = result.feedback.checks.find(
      (c) => c.ruleId === "h5-let-portfolio",
    );
    expect(h5?.passed).toBe(false);
    expect(h5?.detail).toContain("SUM");
  });

  it("flags H5 evaluating to an unexpected verdict string", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Let: {
          ...correctCells,
          H5: {
            value: "Unknown",
            formula:
              '=LET(spend, SUM(E2:E13), revenue, SUM(F2:F13), profit, revenue - spend, roi, profit / spend, "Unknown")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h5 = result.feedback.checks.find(
      (c) => c.ruleId === "h5-let-portfolio",
    );
    expect(h5?.passed).toBe(false);
    expect(h5?.detail).toContain("Strong period");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Let: {} } });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-let-roi");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });
});
