import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/07-diagnosing-circular/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);

const correctCells = {
  J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F61)" },
  J2: { value: 101, formula: "=J3+1" },
  J3: { value: 100 },
};

describe("Track 4 Lesson 7: diagnosing circular references", () => {
  it("passes all rules when all three cycles are untangled correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags J1 still containing the self-reference", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J1: { value: "#REF!", formula: "=SUM(F2:F61)+J1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-no-self-reference",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("J1");
  });

  it("flags J1 evaluating to the wrong total", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Right shape (no self-ref) but wrong range.
          J1: { value: 1000, formula: "=SUM(F2:F4)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-no-self-reference",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain(TOTAL_SPEND.toFixed(2));
  });

  it("flags the two-cell cycle when both J2 and J3 still reference each other", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J2: { value: "#REF!", formula: "=J3+1" },
          J3: { value: "#REF!", formula: "=J2-1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-broken-cycle",
    );
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-hardcoded");
    expect(j2?.passed).toBe(false);
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("J2");
  });

  it("flags J3 still being a formula referencing J2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J3: { value: -100, formula: "=J2-201" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-hardcoded");
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("J2");
  });

  it("flags J2 when it no longer references J3 at all", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Learner hardcoded both cells. That breaks the structure of the
          // lesson; J2 was supposed to depend on J3.
          J2: { value: 42 },
          J3: { value: 41 },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-broken-cycle",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("J3");
  });

  it("accepts J3 as a different numeric value (the exact number doesn't matter)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J2: { value: 51, formula: "=J3+1" },
          J3: { value: 50 },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
  });

  it("flags J2 whose formula passes but value is inconsistent with J3", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Formula says +1, but the value is wildly off.
          J2: { value: 999, formula: "=J3+1" },
          J3: { value: 100 },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-broken-cycle",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("101");
  });
});
