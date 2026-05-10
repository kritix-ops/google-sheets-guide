import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/15-number-formatting/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Campaigns",
  sheets: {
    Campaigns: {
      F2: {
        numberFormat: {
          type: "CURRENCY",
          pattern: "$#,##0.00",
        },
      },
      G2: {
        numberFormat: {
          type: "NUMBER",
          pattern: "#,##0.00;[Red]-#,##0.00",
        },
      },
      H2: {
        formula: "=G2/F2-1",
        numberFormat: {
          type: "PERCENT",
          pattern: "0.00%",
        },
      },
    },
  },
};

describe("Track 2 Lesson 15: number formatting", () => {
  it("passes when all three cells are formatted correctly", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags F2 with NUMBER type instead of CURRENCY", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.F2.numberFormat = {
      type: "NUMBER",
      pattern: "#,##0.00",
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-f-currency",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("CURRENCY");
  });

  it("flags F2 with CURRENCY type but no $ in the pattern", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.F2.numberFormat = {
      type: "CURRENCY",
      pattern: "#,##0.00",
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-f-currency",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("$");
  });

  it("flags G2 with CURRENCY type instead of NUMBER", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.G2.numberFormat = {
      type: "CURRENCY",
      pattern: "$#,##0.00;[Red]-$#,##0.00",
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-g-red-negatives",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("NUMBER");
  });

  it("flags G2 with NUMBER type but no [Red] modifier", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.G2.numberFormat = {
      type: "NUMBER",
      pattern: "#,##0.00;-#,##0.00",
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-g-red-negatives",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("[Red]");
  });

  it("flags H2 with NUMBER type instead of PERCENT", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.H2.numberFormat = {
      type: "NUMBER",
      pattern: "0.00",
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-h-roi-percent",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("PERCENT");
  });
});
