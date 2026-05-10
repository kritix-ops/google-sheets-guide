import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/17-tables/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H1: { value: 3933.78, formula: "=SUM(Campaigns[Spend])" },
  H2: {
    value: 889.2,
    formula: '=SUMIFS(Campaigns[Revenue], Campaigns[Buyer], "Yoav Cohen")',
  },
  H3: { value: 1, formula: '=COUNTIF(Campaigns[Vertical], "Car Deals PR")' },
};

describe("Track 1 Lesson 17: structured table references", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H1 using a plain range instead of Campaigns[Spend]", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H1: { value: 3933.78, formula: "=SUM(E2:E13)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find(
      (c) => c.ruleId === "h1-sum-spend-table",
    );
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("Campaigns[Spend]");
  });

  it("flags H2 not using SUMIFS", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H2: { value: 889.2, formula: "=SUM(Campaigns[Revenue])" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-sumifs-buyer-table",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("SUMIFS");
  });

  it("flags H2 referencing a plain range instead of Campaigns[Buyer]", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H2: {
            value: 889.2,
            formula: '=SUMIFS(Campaigns[Revenue], B2:B13, "Yoav Cohen")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-sumifs-buyer-table",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("Campaigns[Buyer]");
  });

  it("flags H3 not using a structured reference", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H3: { value: 1, formula: '=COUNTIF(C2:C13, "Car Deals PR")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-countif-vertical-table",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("Campaigns[Vertical]");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Campaigns: {} } });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find(
      (c) => c.ruleId === "h1-sum-spend-table",
    );
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
