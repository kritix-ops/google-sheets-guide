import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/ai-in-sheets/03-fill-with-gemini/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H2: { value: "Car Deals PR" },
  H5: { value: "Hearing Aids PR" },
  H10: { value: "Senior Living PR" },
  J1: {
    value: "Standardize each vertical name to Title Case and ensure it ends with PR",
  },
};

describe("Track 5 Lesson 3: Fill with Gemini", () => {
  it("passes all rules when the cleanup column and prompt are filled in correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Cleanup: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags an empty cleanup column with the canonical-form nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Cleanup: {
          J1: correctCells.J1,
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h = result.feedback.checks.find((c) => c.ruleId === "h-row-cleanups");
    expect(h?.passed).toBe(false);
    expect(h?.detail).toContain("PR");
  });

  it("flags when the typo row (H10) was not corrected to 'Senior Living PR'", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Cleanup: {
          ...correctCells,
          H10: { value: "Senior Living P" }, // typo left in
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h = result.feedback.checks.find((c) => c.ruleId === "h-row-cleanups");
    expect(h?.passed).toBe(false);
    expect(h?.detail).toContain("Senior Living PR");
  });

  it("accepts canonical values regardless of casing differences in the cell", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Cleanup: {
          ...correctCells,
          H2: { value: "car deals pr" }, // lowercase; eqIgnoreCase forgives this
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h = result.feedback.checks.find((c) => c.ruleId === "h-row-cleanups");
    expect(h?.passed).toBe(true);
  });

  it("flags J1 when the prompt is missing the 'standardize' / 'normalize' verb", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Cleanup: {
          ...correctCells,
          J1: { value: "Clean these vertical names so they end with PR" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-fill-prompt");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("standardize");
  });

  it("flags J1 when the prompt omits the 'PR' suffix anchor", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Cleanup: {
          ...correctCells,
          J1: { value: "Standardize each vertical name to Title Case" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-fill-prompt");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("PR");
  });

  it("flags H2 when a formula is used (Fill-with-Gemini writes values, not formulas)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Cleanup: {
          ...correctCells,
          H2: { value: "Car Deals PR", formula: '=C2' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const noFormula = result.feedback.checks.find(
      (c) => c.ruleId === "h-no-formulas",
    );
    expect(noFormula?.passed).toBe(false);
    expect(noFormula?.detail).toContain("literal values");
  });

  it("flags J1 when the prompt is missing the word 'vertical'", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Cleanup: {
          ...correctCells,
          J1: { value: "Standardize each name to Title Case ending in PR" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-fill-prompt");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("vertical");
  });
});
