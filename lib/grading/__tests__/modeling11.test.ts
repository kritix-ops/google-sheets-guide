import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/11-charts-for-reports/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Campaigns",
  sheets: {
    Campaigns: {},
  },
  sheetMeta: {
    Campaigns: {
      charts: [
        {
          chartId: 7777,
          family: "basic",
          basicChartType: "BAR",
          title: "Spend by Buyer, Q2 2026",
          anchorSheet: "Campaigns",
          anchorCell: "J1",
          seriesCount: 1,
          legendPosition: "NO_LEGEND",
        },
      ],
    },
  },
};

describe("Track 2 Lesson 11: charts for reports", () => {
  it("passes when the BAR chart has a quarter-tagged title and no legend", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags a COLUMN chart instead of a BAR chart", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.charts![0]!.basicChartType = "COLUMN";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-report-bar-chart",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("BAR");
  });

  it("flags a title that doesn't mention a quarter", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.charts![0]!.title = "Spend by Buyer";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-report-bar-chart-title-quarter",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("Q2");
  });

  it("flags legendPosition set to RIGHT_LEGEND instead of NO_LEGEND", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.charts![0]!.legendPosition = "RIGHT_LEGEND";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-report-bar-chart-no-legend",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("NO_LEGEND");
  });

  it("flags an empty charts array (nothing built yet)", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.charts = [];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const bar = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-report-bar-chart",
    );
    const title = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-report-bar-chart-title-quarter",
    );
    const legend = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-report-bar-chart-no-legend",
    );
    expect(bar?.passed).toBe(false);
    expect(bar?.detail).toContain("No charts found");
    expect(title?.passed).toBe(false);
    expect(legend?.passed).toBe(false);
  });
});
