import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/01-workbook-structure/assignment";
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
const PORTFOLIO_ROI = (TOTAL_REVENUE - TOTAL_SPEND) / TOTAL_SPEND;
const UNIQUE_BUYERS = new Set(ROWS.map((r) => r[1])).size;

const correctCells = {
  J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F61)" },
  J2: { value: TOTAL_REVENUE, formula: "=SUM(G2:G61)" },
  J3: { value: PORTFOLIO_ROI, formula: "=(J2-J1)/J1" },
  J4: { value: UNIQUE_BUYERS, formula: "=COUNTA(UNIQUE(B2:B61))" },
};

describe("Track 2 Lesson 1: workbook structure", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags a full-column F:F reference with the bounded-range nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J1: { value: TOTAL_SPEND, formula: "=SUM(F:F)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-total-spend");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("F:F");
    expect(j1?.detail).toContain("F2:F61");
  });

  it("flags ROI that re-computes the SUMs instead of referencing J1/J2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J3: {
            value: PORTFOLIO_ROI,
            formula: "=(SUM(G2:G61)-SUM(F2:F61))/SUM(F2:F61)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-portfolio-roi");
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("J1");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Sheet1: {} } });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-total-spend");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("J1 is empty");
  });

  it("flags missing UNIQUE in the formula", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J4: { value: 60, formula: "=COUNTA(B2:B61)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j4 = result.feedback.checks.find((c) => c.ruleId === "j4-unique-buyers");
    expect(j4?.passed).toBe(false);
    expect(j4?.detail).toContain("UNIQUE");
  });

  it("flags a UNIQUE count with the wrong scoped range", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          // Apply UNIQUE only to the first 4 buyers, get a smaller count.
          J4: { value: 4, formula: "=COUNTA(UNIQUE(B2:B5))" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j4 = result.feedback.checks.find((c) => c.ruleId === "j4-unique-buyers");
    expect(j4?.passed).toBe(false);
    expect(j4?.detail).toContain(String(UNIQUE_BUYERS));
  });
});
