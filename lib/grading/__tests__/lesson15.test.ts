import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/15-split-join-textjoin/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  B1: { value: "Taboola", formula: '=SPLIT(A1, "_")' },
  B3: {
    value: "Yoav Cohen, Dina Dayan, Maya Bar",
    formula: '=TEXTJOIN(", ", TRUE, A3:A5)',
  },
  G1: { value: "Native", formula: "=FLATTEN(D1:F2)" },
};

describe("Track 1 Lesson 15: SPLIT, TEXTJOIN, FLATTEN", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Text: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags B1 not using SPLIT", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Text: {
          ...correctCells,
          B1: { value: "Taboola", formula: "=A1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find((c) => c.ruleId === "b1-split-code");
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("SPLIT");
  });

  it("flags SPLIT producing the wrong leading token", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Text: {
          ...correctCells,
          B1: { value: "Taboola_UsedCarsPR", formula: '=SPLIT(A1, "-")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find((c) => c.ruleId === "b1-split-code");
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("Taboola");
  });

  it("flags TEXTJOIN producing the wrong joined string", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Text: {
          ...correctCells,
          B3: {
            value: "Yoav Cohen|Dina Dayan|Maya Bar",
            formula: '=TEXTJOIN("|", TRUE, A3:A5)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b3 = result.feedback.checks.find(
      (c) => c.ruleId === "b3-textjoin-buyers",
    );
    expect(b3?.passed).toBe(false);
    expect(b3?.detail).toContain("Yoav Cohen, Dina Dayan, Maya Bar");
  });

  it("flags G1 not using FLATTEN", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Text: {
          ...correctCells,
          G1: { value: "Native", formula: "=D1" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find((c) => c.ruleId === "g1-flatten-grid");
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("FLATTEN");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Text: {} } });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find((c) => c.ruleId === "b1-split-code");
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("B1 is empty");
  });
});
