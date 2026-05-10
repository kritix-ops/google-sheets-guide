import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/09-charts-choosing/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Trend",
  sheets: {
    Trend: {},
  },
  sheetMeta: {
    Trend: {
      charts: [
        {
          chartId: 1001,
          family: "basic",
          basicChartType: "LINE",
          title: "Daily Revenue",
          anchorSheet: "Trend",
          anchorCell: "H1",
          seriesCount: 1,
          legendPosition: "BOTTOM_LEGEND",
        },
        {
          chartId: 1002,
          family: "basic",
          basicChartType: "COLUMN",
          title: "Daily Conversions",
          anchorSheet: "Trend",
          anchorCell: "H20",
          seriesCount: 1,
          legendPosition: "BOTTOM_LEGEND",
        },
      ],
    },
  },
};

describe("Track 2 Lesson 9: charts: choosing the right chart type", () => {
  it("passes when both charts are present with correct types, titles, and anchors", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags a missing LINE chart when only the COLUMN chart exists", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Trend.charts =
      fixture.sheetMeta!.Trend.charts!.filter(
        (c) => c.basicChartType !== "LINE",
      );
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-revenue-line",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("LINE");
  });

  it("flags a LINE chart whose title doesn't mention Revenue", async () => {
    const fixture = freshFixture();
    const line = fixture.sheetMeta!.Trend.charts!.find(
      (c) => c.basicChartType === "LINE",
    )!;
    line.title = "Untitled Chart";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-revenue-line",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("Revenue");
  });

  it("flags a BAR chart when the lesson asked for COLUMN", async () => {
    const fixture = freshFixture();
    const column = fixture.sheetMeta!.Trend.charts!.find(
      (c) => c.basicChartType === "COLUMN",
    )!;
    column.basicChartType = "BAR";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-conversions-column",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("COLUMN");
  });

  it("flags both charts missing when the chart array is empty", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Trend.charts = [];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(false);
    const line = result.feedback.checks.find(
      (r) => r.ruleId === "trend-revenue-line",
    );
    const column = result.feedback.checks.find(
      (r) => r.ruleId === "trend-conversions-column",
    );
    expect(line?.passed).toBe(false);
    expect(line?.detail).toContain("No charts found");
    expect(column?.passed).toBe(false);
    expect(column?.detail).toContain("No COLUMN chart");
  });

  it("flags a LINE chart anchored in the wrong column", async () => {
    const fixture = freshFixture();
    const line = fixture.sheetMeta!.Trend.charts!.find(
      (c) => c.basicChartType === "LINE",
    )!;
    line.anchorCell = "A50";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "trend-revenue-line",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("column H");
  });
});
