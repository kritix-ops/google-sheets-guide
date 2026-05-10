import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/ai-in-sheets/04-build-and-edit/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const TOTAL_REVENUE = ROWS.reduce(
  (s, r) => s + (typeof r[6] === "number" ? r[6] : 0),
  0,
);

const correctCells = {
  I1: { value: "Total Spend" },
  J1: { value: TOTAL_SPEND },
  I2: { value: "Total Revenue" },
  J2: { value: TOTAL_REVENUE },
  K1: {
    value:
      "Review the proposal cell by cell before applying. Spot-check formulas and totals.",
  },
  L1: {
    value:
      "Add a scorecard above the campaign log showing total spend and total revenue.",
  },
};

describe("Track 5 Lesson 4: build and edit with Gemini", () => {
  it("passes all rules when the scorecard, prompt, and review note are correct", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags L1 when the prompt is missing the scorecard/dashboard verb", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          L1: { value: "Add total spend and total revenue above the log" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const l1 = result.feedback.checks.find((c) => c.ruleId === "l1-build-prompt");
    expect(l1?.passed).toBe(false);
    expect(l1?.detail).toContain("scorecard");
  });

  it("flags L1 when the prompt omits spend and revenue", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          L1: { value: "Build a scorecard for the campaign log" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const l1 = result.feedback.checks.find((c) => c.ruleId === "l1-build-prompt");
    expect(l1?.passed).toBe(false);
    expect(l1?.detail).toContain("spend");
  });

  it("flags the scorecard when I1 has a slight label mismatch", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          I1: { value: "Spend Total" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const ij = result.feedback.checks.find(
      (c) => c.ruleId === "i-j-scorecard-populated",
    );
    expect(ij?.passed).toBe(false);
    expect(ij?.detail).toContain("Total Spend");
  });

  it("flags the scorecard when J1 shows the wrong total spend", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J1: { value: 12345.67 },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const ij = result.feedback.checks.find(
      (c) => c.ruleId === "i-j-scorecard-populated",
    );
    expect(ij?.passed).toBe(false);
    expect(ij?.detail).toContain(TOTAL_SPEND.toFixed(2));
  });

  it("flags the scorecard when J2 shows the wrong total revenue", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J2: { value: 999.99 },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const ij = result.feedback.checks.find(
      (c) => c.ruleId === "i-j-scorecard-populated",
    );
    expect(ij?.passed).toBe(false);
    expect(ij?.detail).toContain(TOTAL_REVENUE.toFixed(2));
  });

  it("flags K1 when the review-before-applying phrase is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          K1: { value: "Review the proposal carefully." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const k1 = result.feedback.checks.find(
      (c) => c.ruleId === "k1-review-discipline",
    );
    expect(k1?.passed).toBe(false);
    expect(k1?.detail).toContain("before applying");
  });

  it("flags K1 when neither review nor verify appears", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          K1: { value: "Look at the proposal before applying" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const k1 = result.feedback.checks.find(
      (c) => c.ruleId === "k1-review-discipline",
    );
    expect(k1?.passed).toBe(false);
    expect(k1?.detail).toContain("review");
  });
});
