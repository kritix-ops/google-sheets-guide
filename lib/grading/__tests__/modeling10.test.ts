import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/10-charts-customization/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Trend",
  sheets: {
    Campaigns: {},
    Trend: {},
  },
  sheetMeta: {
    Trend: {
      charts: [
        {
          chartId: 4242,
          family: "basic",
          basicChartType: "COMBO",
          title: "April performance trend",
          anchorSheet: "Trend",
          anchorCell: "K1",
          seriesCount: 4,
          legendPosition: "BOTTOM_LEGEND",
        },
      ],
    },
  },
};

describe("Track 2 Lesson 10: chart customization", () => {
  it("passes when the COMBO chart has 4 series, a performance title, and a bottom legend", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags the chart when it's a plain LINE chart instead of COMBO", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Trend!.charts![0]!.basicChartType = "LINE";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-chart-combo",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("COMBO");
  });

  it("flags the chart when only 2 series are plotted", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Trend!.charts![0]!.seriesCount = 2;
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-chart-series-count",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("2 series");
  });

  it("flags the chart when the legend is on the right instead of the bottom", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Trend!.charts![0]!.legendPosition = "RIGHT_LEGEND";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-chart-legend-bottom",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("Bottom");
  });

  it("flags the chart when the title doesn't contain 'performance'", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Trend!.charts![0]!.title = "April daily totals";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-chart-title-performance",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("performance");
  });

  it("flags the chart when no chart is present on the Trend tab", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Trend!.charts = [];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-chart-combo",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("No chart");
  });
});
