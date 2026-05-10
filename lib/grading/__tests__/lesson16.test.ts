import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/16-regex/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  B1: {
    value: true,
    formula: '=REGEXMATCH(A1, "^[A-Za-z]+_[A-Za-z]+PR_[A-Za-z]+_\\d{4}-\\d{2}$")',
  },
  B2: { value: "Taboola", formula: '=REGEXEXTRACT(A1, "^([A-Za-z]+)_")' },
  B3: {
    value: "Taboola_UsedCarsPR_DesktopUS",
    formula: '=REGEXREPLACE(A1, "_\\d{4}-\\d{2}$", "")',
  },
};

describe("Track 1 Lesson 16: REGEX trio", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Regex: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags B1 not using REGEXMATCH", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Regex: {
          ...correctCells,
          B1: { value: true, formula: "=ISTEXT(A1)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find(
      (c) => c.ruleId === "b1-regexmatch-validate",
    );
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("REGEXMATCH");
  });

  it("flags REGEXMATCH returning FALSE because the pattern misses", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Regex: {
          ...correctCells,
          B1: { value: false, formula: '=REGEXMATCH(A1, "^Outbrain_")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find(
      (c) => c.ruleId === "b1-regexmatch-validate",
    );
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("TRUE");
  });

  it("flags REGEXEXTRACT pulling the wrong substring", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Regex: {
          ...correctCells,
          B2: { value: "UsedCarsPR", formula: '=REGEXEXTRACT(A1, "_([A-Za-z]+PR)_")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b2 = result.feedback.checks.find(
      (c) => c.ruleId === "b2-regexextract-platform",
    );
    expect(b2?.passed).toBe(false);
    expect(b2?.detail).toContain("Taboola");
  });

  it("flags REGEXREPLACE producing the wrong output", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Regex: {
          ...correctCells,
          B3: {
            value: "Taboola_UsedCarsPR_DesktopUS_",
            formula: '=REGEXREPLACE(A1, "\\d{4}-\\d{2}", "")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b3 = result.feedback.checks.find(
      (c) => c.ruleId === "b3-regexreplace-strip-date",
    );
    expect(b3?.passed).toBe(false);
    expect(b3?.detail).toContain("Taboola_UsedCarsPR_DesktopUS");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Regex: {} } });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find(
      (c) => c.ruleId === "b1-regexmatch-validate",
    );
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("B1 is empty");
  });
});
