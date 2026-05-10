import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/ai-in-sheets/02-ai-function/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  H2: {
    value: "medium",
    formula:
      '=AI("Categorize this campaign\'s risk as low, medium, or high. Spend: " & F2 & " Revenue: " & G2)',
  },
  H3: {
    value: "neutral",
    formula: '=AI("Sentiment of this vertical name: " & C2)',
  },
  H4: {
    value: "Autos & Vehicles",
    formula: '=IFERROR(AI("Categorize: " & C2), "fallback")',
  },
};

describe("Track 5 Lesson 2: the AI() function", () => {
  it("passes all rules when the column H prompts are written correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H2 when it doesn't call AI()", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H2: { value: "medium" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-classification-prompt",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });

  it("flags H2 when the prompt is unconstrained (no low/medium/high words)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H2: {
            value: "It looks risky.",
            formula: '=AI("How risky is this campaign? Spend: " & F2 & " Revenue: " & G2)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-classification-prompt",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toMatch(/low|medium|high/i);
  });

  it("flags H2 when it forgets to reference G2 (only spend, no revenue)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H2: {
            value: "low",
            formula: '=AI("Categorize as low, medium, or high: " & F2)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-classification-prompt",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("G2");
  });

  it("flags H3 when the sentiment keyword is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H3: {
            value: "fine",
            formula: '=AI("Tell me about this vertical: " & C2)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-sentiment-prompt",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("sentiment");
  });

  it("flags H3 when it doesn't reference C2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H3: {
            value: "neutral",
            formula: '=AI("Sentiment of car deals")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-sentiment-prompt",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("C2");
  });

  it("flags H4 when IFERROR wrap is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H4: {
            value: "Autos & Vehicles",
            formula: '=AI("Categorize: " & C2)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h4 = result.feedback.checks.find(
      (c) => c.ruleId === "h4-defensive-iferror",
    );
    expect(h4?.passed).toBe(false);
    expect(h4?.detail).toContain("IFERROR");
  });

  it("flags H4 when AI() is missing inside the IFERROR", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          H4: {
            value: "fallback",
            formula: '=IFERROR(C2, "fallback")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h4 = result.feedback.checks.find(
      (c) => c.ruleId === "h4-defensive-iferror",
    );
    expect(h4?.passed).toBe(false);
    expect(h4?.detail).toContain("AI");
  });
});
