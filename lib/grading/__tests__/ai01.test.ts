import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/ai-in-sheets/01-how-gemini-sees-sheets/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H1: {
    value: "This is a 60-row campaign log spanning April and May 2026.",
    formula: '=AI("Summarize the dataset in one sentence", A1:G61)',
  },
  H2: {
    value: "values, formulas, sheet structure, recent edits, charts, named ranges",
  },
  H3: {
    value:
      "Each AI() call is billed per Workspace plan; promo quotas through July 15 2026, then per-plan limits apply.",
  },
};

describe("Track 5 Lesson 1: how Gemini sees a spreadsheet", () => {
  it("passes all rules when the scratchpad is filled in correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags an empty H1 with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Campaigns: {} } });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-uses-ai-on-data");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });

  it("flags H1 when it's a literal note without AI()", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H1: { value: "A campaign log from April and May." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-uses-ai-on-data");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("AI");
  });

  it("flags H1 when it uses an unbounded A:G range", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H1: {
            value: "A 60-row campaign log.",
            formula: '=AI("Summarize the dataset in one sentence", A:G)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-uses-ai-on-data");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("A1:G61");
  });

  it("flags H2 when fewer than three visibility keywords are mentioned", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H2: { value: "values and charts" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-lists-visible-data");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("at least three");
  });

  it("accepts H2 with the canonical six-item list", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: { ...correctCells },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-lists-visible-data");
    expect(h2?.passed).toBe(true);
  });

  it("flags H3 when the Workspace word is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H3: { value: "Each call is billed per your plan." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-cost-note");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("Workspace");
  });

  it("flags H3 when the plan word is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H3: { value: "Workspace billing applies to every call." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-cost-note");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("plan");
  });
});
