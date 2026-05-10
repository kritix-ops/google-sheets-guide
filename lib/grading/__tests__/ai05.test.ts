import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/ai-in-sheets/05-ai-analysis/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  I1: {
    value:
      "2026-04-15 is the spike: spend jumped 36% over the previous day from a launch-day surge.",
    formula:
      '=AI("Identify the date with the highest spend spike and explain why it stands out", A2:F31)',
  },
  I2: {
    value:
      "Confirmed against the data: 2026-04-15 is the launch-day spike, not a tracking error.",
  },
  I3: {
    value:
      "AI flags candidates; domain knowledge and human review decide what they mean.",
  },
};

describe("Track 5 Lesson 5: AI-assisted analysis", () => {
  it("passes all rules when the analysis cells are populated correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Daily: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags I1 when AI() is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Daily: {
          ...correctCells,
          I1: { value: "2026-04-15 spike" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-analysis-prompt",
    );
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("AI");
  });

  it("flags I1 when the spike/outlier keyword is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Daily: {
          ...correctCells,
          I1: {
            value: "Looks fine.",
            formula: '=AI("Tell me about this data", A2:F31)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-analysis-prompt",
    );
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toMatch(/spike|outlier/i);
  });

  it("flags I1 when the formula doesn't reference the data range", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Daily: {
          ...correctCells,
          I1: {
            value: "Could be a spike somewhere.",
            formula: '=AI("Identify the spike in the data")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-analysis-prompt",
    );
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("daily-data");
  });

  it("flags I2 when the date and launch keyword are both missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Daily: {
          ...correctCells,
          I2: { value: "Confirmed it makes sense." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i2 = result.feedback.checks.find(
      (c) => c.ruleId === "a2-confirmed-finding",
    );
    expect(i2?.passed).toBe(false);
    expect(i2?.detail).toContain("2026-04-15");
  });

  it("accepts I2 with the launch word alone (no explicit date)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Daily: {
          ...correctCells,
          I2: { value: "The spike matches a known launch event that week." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i2 = result.feedback.checks.find(
      (c) => c.ruleId === "a2-confirmed-finding",
    );
    expect(i2?.passed).toBe(true);
  });

  it("flags I3 when neither domain-knowledge nor human-review phrase is present", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Daily: {
          ...correctCells,
          I3: { value: "AI is a useful tool." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i3 = result.feedback.checks.find(
      (c) => c.ruleId === "a3-critical-thinking",
    );
    expect(i3?.passed).toBe(false);
    expect(i3?.detail).toMatch(/domain knowledge|human review/i);
  });

  it("accepts I3 with human review even without domain knowledge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Daily: {
          ...correctCells,
          I3: { value: "Every AI finding goes through human review." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i3 = result.feedback.checks.find(
      (c) => c.ruleId === "a3-critical-thinking",
    );
    expect(i3?.passed).toBe(true);
  });
});
