import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/22-advanced-lookups/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  G1: {
    value: 1124.6,
    formula: '=INDEX(B2:D5, MATCH("Maya Bar", A2:A5, 0), MATCH("Cruises PR", B1:D1, 0))',
  },
  G2: {
    value: 487.3,
    formula: "=VLOOKUP($A2, $A$2:$F$13, MATCH($G$1, $A$1:$F$1, 0), FALSE)",
  },
  G3: { value: "T2", formula: '=XLOOKUP(3400, J2:J5, K2:K5, "n/a", -1)' },
};

describe("Track 1 Lesson 22: advanced lookups", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Lookups: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags G1 not using INDEX+MATCH", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lookups: {
          ...correctCells,
          G1: { value: 1124.6, formula: "=C4" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find(
      (c) => c.ruleId === "g1-two-way-lookup",
    );
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("INDEX");
  });

  it("flags G1 returning the wrong cell value", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lookups: {
          ...correctCells,
          G1: {
            value: 487.3,
            formula:
              '=INDEX(B2:D5, MATCH("Yoav Cohen", A2:A5, 0), MATCH("Car Deals PR", B1:D1, 0))',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find(
      (c) => c.ruleId === "g1-two-way-lookup",
    );
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("1124.6");
  });

  it("flags G2 not combining VLOOKUP with MATCH", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lookups: {
          ...correctCells,
          G2: {
            value: 487.3,
            formula: "=VLOOKUP($A2, $A$2:$F$13, 6, FALSE)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const g2 = result.feedback.checks.find(
      (c) => c.ruleId === "g2-dynamic-column-vlookup",
    );
    expect(g2?.passed).toBe(false);
    expect(g2?.detail).toContain("MATCH");
  });

  it("flags G3 returning the wrong tier", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Lookups: {
          ...correctCells,
          G3: { value: "T3", formula: '=XLOOKUP(3400, J2:J5, K2:K5, "n/a")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const g3 = result.feedback.checks.find((c) => c.ruleId === "g3-tier-xlookup");
    expect(g3?.passed).toBe(false);
    expect(g3?.detail).toContain("T2");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Lookups: {} } });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find(
      (c) => c.ruleId === "g1-two-way-lookup",
    );
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("G1 is empty");
  });
});
