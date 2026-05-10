import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/02-pivot-tables-basics/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  sheets: {
    Campaigns: {
      K1: {
        pivotTable: {
          source: "Campaigns!A1:G61",
          rows: [{ sourceColumn: 1, showTotals: true, label: null }],
          columns: [{ sourceColumn: 3, showTotals: true, label: null }],
          values: [
            {
              summarize: "SUM",
              sourceColumn: 6,
              name: null,
              formula: null,
            },
          ],
          filters: [],
          valueLayout: "HORIZONTAL",
        },
      },
    },
  },
};

describe("Track 2 Lesson 2: pivot tables basics", () => {
  it("passes when the pivot is fully configured", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags when K1 is not an anchor at all", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { K1: { value: "just text" } } },
    });
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find((c) => c.ruleId === "k1-pivot-anchor");
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("not the anchor");
  });

  it("flags when the pivot source uses a full-column reference", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.source = "Campaigns!A:G";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find((c) => c.ruleId === "k1-pivot-anchor");
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("A1:G61");
  });

  it("flags when Rows references the wrong source column", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.rows = [
      { sourceColumn: 2, showTotals: true, label: null }, // Vertical, not Buyer
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-rows-buyer",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("offset 1");
  });

  it("flags when Columns is empty", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.columns = [];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-columns-platform",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("no column groupings");
  });

  it("flags when Values uses AVERAGE instead of SUM", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.values = [
      { summarize: "AVERAGE", sourceColumn: 6, name: null, formula: null },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-value-sum-revenue",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("AVERAGE");
  });

  it("flags when Values references the wrong column", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.K1!.pivotTable!.values = [
      { summarize: "SUM", sourceColumn: 5, name: null, formula: null }, // Spend, not Revenue
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "k1-pivot-value-sum-revenue",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("offset 6");
  });
});
