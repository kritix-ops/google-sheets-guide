import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/08-dates-and-time/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  A1: { value: "Task" },
  B1: { value: "Cell" },
};

const correctCells = {
  H1: { value: 46143, formula: "=DATE(2026,5,1)" },
  H2: { value: 46173, formula: "=EOMONTH(DATE(2026,5,1),0)" },
  H3: { value: 21, formula: "=NETWORKDAYS(DATE(2026,5,1),DATE(2026,5,31))" },
  H4: { value: 16, formula: '=DATEDIF(DATE(2025,1,1),DATE(2026,5,1),"M")' },
};

describe("Track 1 Lesson 8: dates and time", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags wrong DATE serial", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H1: { value: 46144, formula: "=DATE(2026,5,2)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-period-start");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("46143");
  });

  it("flags EOMONTH without DATE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H2: { value: 46173, formula: '=EOMONTH("2026-05-01",0)' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find((c) => c.ruleId === "h2-billing-close");
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("DATE");
  });

  it("flags NETWORKDAYS returning the wrong count", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H3: { value: 31, formula: "=NETWORKDAYS(DATE(2026,5,1),DATE(2026,5,31))" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-ad-days");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("21");
  });

  it("flags DATEDIF with wrong unit", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H4: { value: 1, formula: '=DATEDIF(DATE(2025,1,1),DATE(2026,5,1),"Y")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h4 = result.feedback.checks.find((c) => c.ruleId === "h4-buyer-tenure");
    expect(h4?.passed).toBe(false);
    expect(h4?.detail).toContain("16");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-period-start");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
