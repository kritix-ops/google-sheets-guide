import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/14-filter-sort-unique/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H1: { value: "2026-05-01", formula: '=FILTER(A2:F13, B2:B13="Yoav Cohen")' },
  P1: { value: "2026-05-10", formula: "=SORT(A2:F13, 6, FALSE)" },
  X1: { value: "Car Deals PR", formula: "=UNIQUE(C2:C13)" },
};

describe("Track 1 Lesson 14: FILTER, SORT, UNIQUE", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H1 not using FILTER", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H1: { value: "Yoav Cohen", formula: "=B2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-filter-buyer");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("FILTER");
  });

  it("flags P1 not using SORT", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          P1: { value: "2026-05-01", formula: "=A2:F13" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const p1 = result.feedback.checks.find((c) => c.ruleId === "p1-sort-revenue");
    expect(p1?.passed).toBe(false);
    expect(p1?.detail).toContain("SORT");
  });

  it("flags X1 not using UNIQUE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          X1: { value: "Car Deals PR", formula: "=C2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const x1 = result.feedback.checks.find(
      (c) => c.ruleId === "x1-unique-verticals",
    );
    expect(x1?.passed).toBe(false);
    expect(x1?.detail).toContain("UNIQUE");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Campaigns: {} } });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-filter-buyer");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
