import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/07-text-manipulation/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  B2: { value: "Yoav Cohen" },
  C2: { value: "Car Deals PR" },
};

const correctCells = {
  H2: { value: "Car Deals", formula: "=LEFT(C2,LEN(C2)-3)" },
  H3: { value: "Car", formula: '=LEFT(C2,FIND(" ",C2)-1)' },
  H4: { value: 10, formula: "=LEN(B2)" },
  H5: { value: "Yoav C.", formula: '=SUBSTITUTE(B2,"Cohen","C.")' },
};

describe("Track 1 Lesson 7: text manipulation", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags wrong PR-strip with hardcoded length", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H2: { value: "Used", formula: "=LEFT(C2,4)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-strip-pr");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("Car Deals");
  });

  it("flags FIND/LEFT missing one of them", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H3: { value: "Used", formula: "=LEFT(C2,4)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-first-word");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("FIND");
  });

  it("flags wrong substitution", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H5: { value: "Yoav cohen", formula: '=SUBSTITUTE(B2,"C","c")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h5 = result.feedback.checks.find((c) => c.ruleId === "h5-shorten-buyer");
    expect(h5?.passed).toBe(false);
    expect(h5?.detail).toContain("Yoav C.");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-strip-pr");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });
});
