import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/01-grid-model/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  A1: { value: "Date" },
  B1: { value: "Buyer" },
  C1: { value: "Vertical" },
  D1: { value: "Platform" },
  E1: { value: "Spend" },
  F1: { value: "Revenue" },
  A5: { value: "2026-05-03" },
  B5: { value: "Eitan Kohen" },
  C5: { value: "Hearing Aids PR" },
  D5: { value: "Taboola" },
  E5: { value: 187.25 },
  F5: { value: 245.8 },
  E2: { value: 342.18 },
  E3: { value: 215.5 },
  E4: { value: 512.0 },
  E6: { value: 432.7 },
  E7: { value: 605.1 },
  E8: { value: 318.45 },
  E9: { value: 296.4 },
  E10: { value: 224.6 },
  E11: { value: 178.9 },
  E12: { value: 142.3 },
  E13: { value: 478.3 },
};

describe("Track 1 Lesson 1: the grid model", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          H1: { formula: "=E5", value: 187.25 },
          H2: { formula: "=$E$5", value: 187.25 },
          H3: { formula: "=E$5", value: 187.25 },
        },
      },
      namedRanges: { spend: { sheet: "Sheet1", range: "E2:E13" } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags missing absolute references and explains the fix", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          H1: { formula: "=E5", value: 187.25 },
          H2: { formula: "=E5", value: 187.25 },
          H3: { formula: "=E5", value: 187.25 },
        },
      },
      namedRanges: { spend: { sheet: "Sheet1", range: "E2:E13" } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(false);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-absolute-ref");
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-mixed-ref");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("$");
    expect(h3?.passed).toBe(false);
  });

  it("flags a missing named range and tells the learner where to create it", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          H1: { formula: "=E5", value: 187.25 },
          H2: { formula: "=$E$5", value: 187.25 },
          H3: { formula: "=E$5", value: 187.25 },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const named = result.feedback.checks.find(
      (c) => c.ruleId === "spend-named-range",
    );
    expect(named?.passed).toBe(false);
    expect(named?.detail).toContain("Data → Named ranges");
  });

  it("tolerates whitespace and case variation in formulas", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          H1: { formula: "= e5", value: 187.25 },
          H2: { formula: "=$e$5", value: 187.25 },
          H3: { formula: "=E$5", value: 187.25 },
        },
      },
      namedRanges: { spend: { sheet: "Sheet1", range: "E2:E13" } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
  });

  it("flags an empty H1 with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          H2: { formula: "=$E$5", value: 187.25 },
          H3: { formula: "=E$5", value: 187.25 },
        },
      },
      namedRanges: { spend: { sheet: "Sheet1", range: "E2:E13" } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-relative-ref");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
