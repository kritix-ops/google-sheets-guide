import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/04-data-validation/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Inputs",
  sheets: {
    Campaigns: {},
    Inputs: {
      B1: {
        validation: {
          type: "ONE_OF_RANGE",
          values: ["Campaigns!B2:B61"],
          customFormula: null,
          inputMessage: null,
          strict: true,
        },
      },
      B2: {
        validation: {
          type: "ONE_OF_LIST",
          values: [
            "Taboola",
            "Outbrain",
            "MediaGo",
            "Poppin",
            "Facebook",
            "TikTok",
            "Google",
          ],
          customFormula: null,
          inputMessage: null,
          strict: true,
        },
      },
      B3: {
        validation: {
          type: "CUSTOM_FORMULA",
          values: [],
          customFormula: "=B3>0",
          inputMessage: null,
          strict: true,
        },
      },
    },
  },
};

describe("Track 2 Lesson 4: data validation", () => {
  it("passes when all three rules are set up correctly", async () => {
    // structuredClone keeps the readonly fixture from leaking type errors.
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags B1 missing validation", async () => {
    const fixture = freshFixture();
    delete fixture.sheets.Inputs.B1.validation;
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "inputs-b1-buyer-list",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("no data validation");
  });

  it("flags B1 set to warning instead of strict", async () => {
    const fixture = freshFixture();
    fixture.sheets.Inputs.B1.validation!.strict = false;
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "inputs-b1-buyer-list",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("strict");
  });

  it("flags B2 missing one of the seven platforms", async () => {
    const fixture = freshFixture();
    fixture.sheets.Inputs.B2.validation!.values = [
      "Taboola",
      "Outbrain",
      "MediaGo",
      "Poppin",
      "Facebook",
      "TikTok",
      // missing Google
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "inputs-b2-platform-list",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("6 values");
  });

  it("flags B2 with the wrong platform name", async () => {
    const fixture = freshFixture();
    fixture.sheets.Inputs.B2.validation!.values = [
      "Taboola",
      "Outbrain",
      "MediaGo",
      "Poppin",
      "Facebook",
      "TikTok",
      "Yahoo", // wrong
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "inputs-b2-platform-list",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("Google");
  });

  it("flags B3 using NUMBER_GREATER instead of CUSTOM_FORMULA", async () => {
    const fixture = freshFixture();
    fixture.sheets.Inputs.B3.validation = {
      type: "NUMBER_GREATER",
      values: ["0"],
      customFormula: null,
      inputMessage: null,
      strict: true,
    };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "inputs-b3-custom-spend",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("Custom formula");
  });

  it("flags B3 with a custom formula that doesn't reference B3", async () => {
    const fixture = freshFixture();
    fixture.sheets.Inputs.B3.validation!.customFormula = "=A1>0";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "inputs-b3-custom-spend",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("B3");
  });
});
