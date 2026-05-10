import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/18-performance-hygiene/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = Number(
  ROWS.reduce((sum, r) => sum + Number(r[5] ?? 0), 0).toFixed(2),
);
const TOTAL_REVENUE = Number(
  ROWS.reduce((sum, r) => sum + Number(r[6] ?? 0), 0).toFixed(2),
);
const PORTFOLIO_ROI = (TOTAL_REVENUE - TOTAL_SPEND) / TOTAL_SPEND;

const correctCells = {
  J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F61)" },
  J2: {
    value: TOTAL_REVENUE,
    formula: "=LET(n, COUNTA(A2:A1000), SUM(G2:INDEX(G:G, n+1)))",
  },
  J3: { value: PORTFOLIO_ROI, formula: "=(J2-J1)/J1" },
};

describe("Track 2 Lesson 18: Workbook performance hygiene", () => {
  it("passes when all three summary formulas demonstrate the right discipline", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags J1 with a full-column SUM(F:F) reference", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // The math is right but F:F is the anti-pattern this lesson teaches
          // against. The grader rejects full-column references on principle.
          J1: { value: TOTAL_SPEND, formula: "=SUM(F:F)" },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j1-total-spend-bounded",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toMatch(/full-column|F:F/);
  });

  it("flags J2 missing LET (correct math, wrong pattern)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Computes the right total but skips LET, so it doesn't demonstrate
          // the dynamic-bound discipline the lesson teaches. The hardcoded
          // upper bound breaks the moment a 61st data row is appended.
          J2: { value: TOTAL_REVENUE, formula: "=SUM(G2:G61)" },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j2-total-revenue-dynamic-bound",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("LET");
  });

  it("flags J2 with LET but no COUNTA (hardcoded row count)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Has LET but the row count is hardcoded, defeating the whole point
          // of the pattern. New rows from IMPORTRANGE wouldn't be picked up.
          J2: {
            value: TOTAL_REVENUE,
            formula: "=LET(n, 60, SUM(G2:INDEX(G:G, n+1)))",
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j2-total-revenue-dynamic-bound",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("COUNTA");
  });

  it("flags J3 that recomputes the SUM instead of referencing J1 and J2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Mathematically correct but misses the "compute once, reference
          // many" discipline. Should reuse J1 and J2 directly.
          J3: {
            value: PORTFOLIO_ROI,
            formula: "=(SUM(G2:G61)-SUM(F2:F61))/SUM(F2:F61)",
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j3-portfolio-roi-reuses-cells",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toMatch(/SUM|reuse|J1|J2/);
  });
});
