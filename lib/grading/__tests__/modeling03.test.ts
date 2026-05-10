import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/03-pivot-tables-in-depth/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

const BASE_FIXTURE: InMemoryFixture = {
  sheets: {
    Campaigns: {
      K1: {
        pivotTable: {
          source: "Campaigns!A1:G61",
          rows: [{ sourceColumn: 1, showTotals: true, label: null }],
          columns: [],
          values: [
            {
              summarize: "SUM",
              sourceColumn: 5,
              name: null,
              formula: null,
            },
            {
              summarize: "SUM",
              sourceColumn: 6,
              name: null,
              formula: null,
            },
            {
              summarize: "CUSTOM",
              sourceColumn: -1,
              name: "ROI",
              formula: "=('Revenue' - 'Spend') / 'Spend'",
            },
          ],
          filters: [
            {
              sourceColumn: 4,
              visibleValues: ["DE", "UK"],
              conditionType: null,
              conditionValues: [],
            },
          ],
          valueLayout: "VERTICAL",
        },
      },
    },
  },
};

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

describe("Track 2 Lesson 3: pivot tables in depth", () => {
  it("passes when the pivot is fully configured", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags when SUM Spend is missing (only Revenue and ROI present)", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.values = [
      { summarize: "SUM", sourceColumn: 6, name: null, formula: null },
      {
        summarize: "CUSTOM",
        sourceColumn: -1,
        name: "ROI",
        formula: "=('Revenue' - 'Spend') / 'Spend'",
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-sum-values",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("SUM of Spend is missing");
  });

  it("flags when the calculated field uses SUM instead of CUSTOM", async () => {
    const fixture = freshFixture();
    // Replace the CUSTOM-summarized ROI with a SUM-summarized column. Common
    // mistake: learner adds 'Revenue' as a third SUM value, calls it ROI.
    fixture.sheets.Campaigns.K1!.pivotTable!.values = [
      { summarize: "SUM", sourceColumn: 5, name: null, formula: null },
      { summarize: "SUM", sourceColumn: 6, name: null, formula: null },
      { summarize: "SUM", sourceColumn: 6, name: "ROI", formula: null },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-calculated-roi",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("No calculated field");
  });

  it("flags when the calculated field formula doesn't reference both columns", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.values[2] = {
      summarize: "CUSTOM",
      sourceColumn: -1,
      name: "ROI",
      // References Revenue but not Spend.
      formula: "='Revenue' / 100",
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-calculated-roi",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("'Revenue'");
    expect(r?.detail).toContain("'Spend'");
  });

  it("flags when the country filter is missing entirely", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.filters = [];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-country-filter",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("no Filters");
  });

  it("flags when the filter visibleValues are missing UK", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.filters = [
      {
        sourceColumn: 4,
        visibleValues: ["DE"],
        conditionType: null,
        conditionValues: [],
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-country-filter",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("UK");
  });

  it("flags when valueLayout is HORIZONTAL instead of VERTICAL", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.valueLayout = "HORIZONTAL";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-vertical-layout",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("HORIZONTAL");
  });

  it("accepts the alternate ROI formula =Revenue/Spend - 1", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.values[2] = {
      summarize: "CUSTOM",
      sourceColumn: -1,
      name: "ROI",
      formula: "='Revenue'/'Spend' - 1",
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });
});
