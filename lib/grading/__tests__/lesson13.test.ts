import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/13-query-in-depth/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H1: {
    value: "Buyer",
    formula: '=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B ORDER BY SUM(F) DESC", 1)',
  },
  K1: {
    value: "Buyer",
    formula: '=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B PIVOT D", 1)',
  },
  N1: {
    value: "Vertical",
    formula:
      "=QUERY(A1:F13, \"SELECT C, SUM(F) GROUP BY C ORDER BY SUM(F) DESC LABEL SUM(F) 'Total Revenue'\", 1)",
  },
};

describe("Track 1 Lesson 13: QUERY in depth", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H1 missing GROUP BY", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H1: { value: "Buyer", formula: '=QUERY(A1:F13, "SELECT B, F", 1)' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-sum-by-buyer");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("GROUP");
  });

  it("flags K1 missing PIVOT clause", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          K1: {
            value: "Buyer",
            formula: '=QUERY(A1:F13, "SELECT B, SUM(F) GROUP BY B", 1)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const k1 = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-buyer-platform",
    );
    expect(k1?.passed).toBe(false);
    expect(k1?.detail).toContain("PIVOT");
  });

  it("flags N1 missing LABEL clause", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          N1: {
            value: "Vertical",
            formula: '=QUERY(A1:F13, "SELECT C, SUM(F) GROUP BY C", 1)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const n1 = result.feedback.checks.find(
      (c) => c.ruleId === "n1-vertical-totals-label",
    );
    expect(n1?.passed).toBe(false);
    expect(n1?.detail).toContain("LABEL");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Campaigns: {} } });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-sum-by-buyer");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
