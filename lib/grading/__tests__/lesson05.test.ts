import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/05-conditional-logic/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  D2: { value: "Google" },
  E2: { value: 342.18 },
  F2: { value: 487.3 },
};

const correctCells = {
  H2: {
    value: "Profitable",
    formula:
      '=IFS(F2/E2>=2,"Star",F2/E2>=1.2,"Profitable",F2/E2>=0.9,"Break-even",TRUE,"Loss")',
  },
  H3: {
    value: "Search",
    formula:
      '=SWITCH(D2,"Taboola","Native","Outbrain","Native","MediaGo","Native","Poppin","Native","Facebook","Social","TikTok","Social","Google","Search","Other")',
  },
  H4: {
    value: "Scale candidate",
    formula: '=IF(AND(F2>E2,E2>=200),"Scale candidate","Other")',
  },
};

describe("Track 1 Lesson 5: conditional logic", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags using nested IF instead of IFS", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H2: {
            value: "Profitable",
            formula:
              '=IF(F2/E2>=2,"Star",IF(F2/E2>=1.2,"Profitable",IF(F2/E2>=0.9,"Break-even","Loss")))',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-ifs-roi");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("IFS");
  });

  it("flags SWITCH returning the wrong category", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H3: {
            value: "Social",
            formula: '=SWITCH(D2,"Taboola","Social","Other")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-switch-platform",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("Search");
  });

  it("flags an IF without AND", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H4: { value: "Scale candidate", formula: '=IF(F2>E2,"Scale candidate","Other")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h4 = result.feedback.checks.find(
      (c) => c.ruleId === "h4-if-and-scale",
    );
    expect(h4?.passed).toBe(false);
    expect(h4?.detail).toContain("AND");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-ifs-roi");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });
});
