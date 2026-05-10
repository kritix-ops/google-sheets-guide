import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/02-why-its-slow/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const ROW_COUNT = ROWS.length;

const correctCells = {
  J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F61)" },
  J2: { value: ROW_COUNT, formula: "=COUNTA(B2:B61)" },
  J3: { value: "2026-05-10" }, // hardcoded string, no formula
};

describe("Track 4 Lesson 2: why your sheet is slow", () => {
  it("passes when all three cells are refactored correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags when J1 still has the seeded =SUM(F:F)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J1: { value: TOTAL_SPEND, formula: "=SUM(F:F)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-bounded-sum");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("F:F");
    expect(j1?.detail).toContain("F2:F61");
  });

  it("accepts a wider bounded range like F2:F5000", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F5000)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-bounded-sum");
    expect(j1?.passed).toBe(true);
  });

  it("flags when J2 still has =COUNTA(B:B)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J2: { value: ROW_COUNT + 1, formula: "=COUNTA(B:B)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-bounded-counta",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("B:B");
  });

  it("flags when J3 still has =TODAY()", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J3: { value: "2026-05-10", formula: "=TODAY()-1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-not-volatile");
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("TODAY");
  });

  it("flags when J3 uses INDIRECT (also volatile)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J3: { value: "2026-05-10", formula: '=INDIRECT("A2")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-not-volatile");
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("INDIRECT");
  });

  it("accepts J3 as a reference to a date cell already in the sheet", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J3: { value: "2026-04-06", formula: "=A2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-not-volatile");
    expect(j3?.passed).toBe(true);
  });

  it("flags an empty J1 with the refactor nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J1: {},
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-bounded-sum");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("J1 is empty");
  });
});
