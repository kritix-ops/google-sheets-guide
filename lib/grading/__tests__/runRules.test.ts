import { describe, expect, it } from "vitest";

import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { Rule } from "../types";

const emptyReader = new InMemoryReader({ sheets: { Sheet1: {} } });

const passingRule = (id: string, weight?: number): Rule => ({
  id,
  label: `pass ${id}`,
  weight,
  async run() {
    return { passed: true };
  },
});

const failingRule = (id: string, detail?: string): Rule => ({
  id,
  label: `fail ${id}`,
  async run() {
    return { passed: false, detail };
  },
});

describe("runRules", () => {
  it("scores 100 and passes when all rules pass", async () => {
    const result = await runRules(
      [passingRule("a"), passingRule("b"), passingRule("c")],
      emptyReader,
    );
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.gradedBy).toBe("rules");
    expect(result.feedback.checks).toHaveLength(3);
    expect(result.feedback.checks.every((c) => c.passed)).toBe(true);
    expect(result.feedback.summary).toContain("All 3 checks passed");
  });

  it("computes a weighted score with mixed pass/fail", async () => {
    const result = await runRules(
      [passingRule("a", 3), failingRule("b", "B was wrong"), passingRule("c", 1)],
      emptyReader,
    );
    expect(result.score).toBe(80);
    expect(result.passed).toBe(true);
    expect(result.feedback.checks[1].detail).toBe("B was wrong");
  });

  it("fails when score is below the pass threshold", async () => {
    const result = await runRules(
      [passingRule("a"), failingRule("b"), failingRule("c")],
      emptyReader,
    );
    expect(result.score).toBeLessThan(80);
    expect(result.passed).toBe(false);
    expect(result.feedback.summary).toContain("2 of 3 checks need attention");
  });

  it("treats a thrown rule as failed and captures the error", async () => {
    const blowingUp: Rule = {
      id: "throws",
      label: "this one throws",
      async run() {
        throw new Error("disk on fire");
      },
    };
    const result = await runRules(
      [passingRule("ok"), blowingUp],
      emptyReader,
    );
    const errored = result.feedback.checks.find((c) => c.ruleId === "throws");
    expect(errored?.passed).toBe(false);
    expect(errored?.detail).toContain("Rule errored");
    expect(errored?.detail).toContain("disk on fire");
  });

  it("returns score 0 and not-passed when there are no rules", async () => {
    const result = await runRules([], emptyReader);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.feedback.summary).toBe("No rules ran.");
  });

  it("respects a custom passThreshold", async () => {
    const result = await runRules(
      [passingRule("a"), failingRule("b")],
      emptyReader,
      { passThreshold: 0.5 },
    );
    expect(result.score).toBe(50);
    expect(result.passed).toBe(true);
  });
});
