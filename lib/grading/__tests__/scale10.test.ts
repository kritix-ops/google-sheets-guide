import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/10-recovery-and-versions/assignment";
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
  J3: { value: "PreMonthEnd-2026-04" },
  J5: {
    value:
      "Open File > Version history, find the right named version, then Restore this version.",
  },
};

describe("Track 4 Lesson 10: recovery and versions", () => {
  it("passes all rules when the learner restores the SUM and writes the convention and recovery flow", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags J1 still holding the seeded `0` with no formula", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J1: { value: 0 },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-restored-total-spend",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("J1 is empty");
  });

  it("flags a full-column F:F SUM with the bounded-range nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J1: { value: TOTAL_SPEND, formula: "=SUM(F:F)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-restored-total-spend",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("F2:F61");
  });

  it("flags J3 empty with the convention nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J3: { value: "" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-naming-convention",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("PreMonthEnd");
  });

  it("flags J3 holding a non-matching label", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J3: { value: "before pivot 2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-naming-convention",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("PreMonthEnd");
  });

  it("accepts the lowercase-with-hyphens form of the convention", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J3: { value: "pre-month-end-2026-04" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-naming-convention",
    );
    expect(j3?.passed).toBe(true);
  });

  it("flags J5 missing the `version history` half of the recovery flow", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J5: { value: "Click Restore this version on the right version." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j5 = result.feedback.checks.find(
      (c) => c.ruleId === "j5-recovery-process",
    );
    expect(j5?.passed).toBe(false);
    expect(j5?.detail).toContain("version history");
  });

  it("flags J5 missing the `restore` action", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...correctCells,
          J5: {
            value:
              "Open File > Version history and look for the right named version.",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j5 = result.feedback.checks.find(
      (c) => c.ruleId === "j5-recovery-process",
    );
    expect(j5?.passed).toBe(false);
    expect(j5?.detail).toContain("restore");
  });
});
