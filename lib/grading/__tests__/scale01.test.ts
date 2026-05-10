import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/01-cell-limit/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const FILLED_CELLS = ROWS.length * 7;
const ALLOCATED_CELLS = 26 * 1000;
const WASTED_CELLS = ALLOCATED_CELLS - FILLED_CELLS;

const correctCells = {
  J1: { value: FILLED_CELLS, formula: "=COUNTA(A2:G61)" },
  J2: { value: ALLOCATED_CELLS, formula: "=COLUMNS(A:Z)*ROWS(A1:A1000)" },
  J3: { value: WASTED_CELLS, formula: "=J2-J1" },
};

describe("Track 4 Lesson 1: cell limit audit", () => {
  it("passes all rules when the audit block is filled in correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags an empty J1 with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Campaigns: {} } });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-counts-filled-cells",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("J1 is empty");
  });

  it("flags when J1 uses something other than COUNTA", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // COUNT only counts numeric cells. On a campaign log the buyer,
          // vertical, platform, and country columns are text, so COUNT
          // misses them and the total falls well short.
          J1: { value: 180, formula: "=COUNT(A2:G61)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-counts-filled-cells",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("COUNTA");
  });

  it("flags when J2 is a raw literal without COLUMNS/ROWS", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J2: { value: ALLOCATED_CELLS, formula: "=26000" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-computes-allocated-cells",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("COLUMNS");
  });

  it("accepts a literal product like =26*1000 because COLUMNS/ROWS is the spirit but `=26*1000` shows the same intent", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J2: { value: ALLOCATED_CELLS, formula: "=26*1000" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-computes-allocated-cells",
    );
    // The grader requires COLUMNS or ROWS to be present; `=26*1000` is a
    // shortcut that hides the source of the numbers. It SHOULD fail.
    expect(j2?.passed).toBe(false);
  });

  it("flags when J3 recomputes instead of referencing J1 and J2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J3: {
            value: WASTED_CELLS,
            formula: "=COLUMNS(A:Z)*ROWS(A1:A1000)-COUNTA(A2:G61)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-computes-waste",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("J1");
    expect(j3?.detail).toContain("J2");
  });

  it("flags when J3 has the right formula but wrong values from corrupted J1/J2", async () => {
    // If the learner shrinks J1's range and J3 = J2-J1 picks up the wrong
    // total, the J3 rule itself still passes (the formula references J1/J2)
    // but the J1 rule fails. This test verifies the rules are independent.
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J1: { value: 100, formula: "=COUNTA(A2:G20)" },
          J3: { value: 25900, formula: "=J2-J1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-counts-filled-cells",
    );
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-computes-waste",
    );
    expect(j1?.passed).toBe(false);
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain(String(WASTED_CELLS));
  });
});
