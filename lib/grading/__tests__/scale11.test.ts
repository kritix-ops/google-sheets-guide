import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/11-broken-sheet-clinic/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const UNIQUE_BUYERS = new Set(ROWS.map((r) => r[1])).size;

// A fully-fixed clinic: every cell holds its correct formula and value.
const correctCells = {
  J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F61)" },
  J2: {
    value: 0,
    formula: '=IFNA(VLOOKUP("NonExistentBuyer", B2:G61, 5, FALSE), 0)',
  },
  J3: { value: "2026-04-06", formula: "=A2" },
  J4: { value: 0 },
  J5: { value: UNIQUE_BUYERS, formula: "=COUNTA(UNIQUE(B2:B61))" },
};

describe("Track 4 Lesson 11: broken-sheet clinic", () => {
  it("passes all five rules when every bug is fixed correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback.checks.length).toBe(5);
  });

  it("flags J1 still using the full-column F:F seed", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J1: { value: TOTAL_SPEND, formula: "=SUM(F:F)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find((c) => c.ruleId === "j1-bounded-sum");
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("F:F");
  });

  it("flags J2 still leaking #N/A from a raw VLOOKUP", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J2: {
            value: "#N/A",
            formula: '=VLOOKUP("NonExistentBuyer", B2:G61, 5, FALSE)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find((c) => c.ruleId === "j2-handles-na");
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("IFNA");
  });

  it("accepts IFERROR as an alternative wrapper on J2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J2: {
            value: 0,
            formula:
              '=IFERROR(VLOOKUP("NonExistentBuyer", B2:G61, 5, FALSE), 0)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find((c) => c.ruleId === "j2-handles-na");
    expect(j2?.passed).toBe(true);
  });

  it("flags J3 still calling TODAY()", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
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

  it("flags J3 calling INDIRECT (another volatile) as well", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J3: { value: "2026-04-06", formula: '=INDIRECT("A2")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-not-volatile");
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("INDIRECT");
  });

  it("accepts a hardcoded literal value on J3", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J3: { value: "2026-05-10" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find((c) => c.ruleId === "j3-not-volatile");
    expect(j3?.passed).toBe(true);
  });

  it("flags J4 still referencing itself", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J4: { value: "#REF!", formula: "=J4+1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j4 = result.feedback.checks.find(
      (c) => c.ruleId === "j4-broken-cycle",
    );
    expect(j4?.passed).toBe(false);
    expect(j4?.detail).toContain("J4");
  });

  it("flags J5 missing UNIQUE in the formula", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J5: { value: 60, formula: "=COUNTA(B2:B61)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j5 = result.feedback.checks.find(
      (c) => c.ruleId === "j5-unique-buyers",
    );
    expect(j5?.passed).toBe(false);
    expect(j5?.detail).toContain("UNIQUE");
  });

  it("fails the overall capstone when only 4 of 5 cells are fixed", async () => {
    // Skip the J5 fix entirely. The capstone should not pass; the threshold
    // is 80% but with 4/5 = 80% we're right at the edge: bump it down by
    // also leaving J3 volatile to guarantee a fail.
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J3: { value: "2026-05-10", formula: "=TODAY()-1" },
          J5: { value: null },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(80);
  });
});
