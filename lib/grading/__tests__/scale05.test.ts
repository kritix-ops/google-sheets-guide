import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/05-timesfm-forecasting/assignment";
import { CAMPAIGNS_TIMESERIES } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const TIMESERIES_ROWS = CAMPAIGNS_TIMESERIES.slice(1);
const LAST_ACTUAL = TIMESERIES_ROWS[TIMESERIES_ROWS.length - 1]![1] as number;
const FIRST_FORECAST = LAST_ACTUAL + 60;
const EXPECTED_DELTA = (FIRST_FORECAST - LAST_ACTUAL) / LAST_ACTUAL;

const correctCells = {
  H1: { value: FIRST_FORECAST, formula: "=E2" },
  H2: { value: EXPECTED_DELTA, formula: "=(E2-B31)/B31" },
  H3: { value: "TimesFM" },
};

describe("Track 4 Lesson 5: TimesFM forecasting analysis", () => {
  it("passes all rules when the three answers are filled in correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Forecast: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags an empty H1 with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Forecast: {} } });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find(
      (c) => c.ruleId === "h1-pulls-forecast",
    );
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });

  it("flags H1 pointing at a historical row instead of the forecast block", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Forecast: {
          ...correctCells,
          // Points at B31 (last actual) instead of E2 (first forecast).
          H1: { value: LAST_ACTUAL, formula: "=B31" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find(
      (c) => c.ruleId === "h1-pulls-forecast",
    );
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("E2");
  });

  it("flags H2 when it skips the forecast reference and uses a literal", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Forecast: {
          ...correctCells,
          // Hardcoded forecast value defeats the point: the cell will go stale
          // the moment TimesFM is rerun.
          H2: {
            value: EXPECTED_DELTA,
            formula: `=(${FIRST_FORECAST}-B31)/B31`,
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-computes-delta",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("E2");
  });

  it("flags H2 with an incorrect value even when the formula shape is right", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Forecast: {
          ...correctCells,
          // Right formula, but the value the grader reads from the cell is
          // wrong (simulating a stale evaluation).
          H2: { value: 0.99, formula: "=(E2-B31)/B31" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-computes-delta",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain(EXPECTED_DELTA.toFixed(4));
  });

  it("flags H3 when the model label is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Forecast: {
          ...correctCells,
          H3: { value: "" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-marks-model");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("H3 is empty");
  });

  it("flags H3 when the label names a different model", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Forecast: {
          ...correctCells,
          H3: { value: "ARIMA" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-marks-model");
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("TimesFM");
  });

  it("accepts H3 with TimesFM embedded in a longer string", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Forecast: {
          ...correctCells,
          H3: { value: "TimesFM (BigQuery ML)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find((c) => c.ruleId === "h3-marks-model");
    expect(h3?.passed).toBe(true);
  });
});
