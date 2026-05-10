import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/04-connected-sheets-bigquery/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const TABOOLA_COUNT = ROWS.filter((r) => r[3] === "Taboola").length;

const correctCells = {
  J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F61)" },
  J2: { value: TABOOLA_COUNT, formula: '=COUNTIF(D2:D61, "Taboola")' },
  J3: { value: "BigQuery" },
};

describe("Track 4 Lesson 4: Connected Sheets and BigQuery", () => {
  it("passes when all three cells are filled correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns_BQ: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags an empty J1 with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Campaigns_BQ: {} } });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-sums-extract-spend",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("J1 is empty");
  });

  it("flags J1 using a full-column reference F:F", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns_BQ: {
          ...correctCells,
          J1: { value: TOTAL_SPEND, formula: "=SUM(F:F)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-sums-extract-spend",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("F:F");
  });

  it("flags J2 missing COUNTIF", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns_BQ: {
          ...correctCells,
          // Using SUMIF instead. Wrong function family for counting.
          J2: { value: 0, formula: '=SUMIF(D2:D61, "Taboola", F2:F61)' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-counts-taboola-rows",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("COUNTIF");
  });

  it("flags J2 using the wrong platform criterion", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns_BQ: {
          ...correctCells,
          // Counting Outbrain rows by mistake.
          J2: { value: 7, formula: '=COUNTIF(D2:D61, "Outbrain")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-counts-taboola-rows",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("Taboola");
  });

  it("flags J3 empty", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns_BQ: {
          ...correctCells,
          J3: {},
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-marks-source-as-bigquery",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("J3 is empty");
  });

  it("flags J3 with the wrong source label", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns_BQ: {
          ...correctCells,
          J3: { value: "Snowflake" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-marks-source-as-bigquery",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("BigQuery");
  });

  it("accepts J3 with extra context as long as it mentions BigQuery", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns_BQ: {
          ...correctCells,
          J3: { value: "BigQuery (campaigns_fact)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-marks-source-as-bigquery",
    );
    expect(j3?.passed).toBe(true);
  });
});
