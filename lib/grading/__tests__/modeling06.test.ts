import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/06-conditional-formatting/assignment";
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
      conditionalFormats: [
        {
          ranges: ["F2:F61"],
          variant: "boolean",
          conditionType: "NUMBER_GREATER",
          conditionValues: ["500"],
        },
        {
          ranges: ["G2:G61"],
          variant: "boolean",
          conditionType: "CUSTOM_FORMULA",
          conditionValues: ["=G2>F2"],
        },
      ],
    },
  },
};

describe("Track 2 Lesson 6: conditional formatting", () => {
  it("passes when both rules are correctly configured", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags a missing rule on F2:F61", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.conditionalFormats =
      fixture.sheetMeta!.Campaigns.conditionalFormats!.filter(
        (r) => !r.ranges.includes("F2:F61"),
      );
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-f-high-spend",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("F2:F61");
  });

  it("flags wrong condition type on F2:F61 (NUMBER_LESS)", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.conditionalFormats![0]!.conditionType =
      "NUMBER_LESS";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-f-high-spend",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("NUMBER_GREATER");
  });

  it("flags wrong threshold value on F2:F61", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.conditionalFormats![0]!.conditionValues = [
      "300",
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-f-high-spend",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("500");
  });

  it("flags a missing rule on G2:G61", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.conditionalFormats =
      fixture.sheetMeta!.Campaigns.conditionalFormats!.filter(
        (r) => !r.ranges.includes("G2:G61"),
      );
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-g-profitable",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("G2:G61");
  });

  it("flags a custom formula on G2:G61 that doesn't reference both G2 and F2", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.conditionalFormats![1]!.conditionValues = [
      "=G2>500",
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-g-profitable",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("F2");
  });
});
