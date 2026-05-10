import { describe, expect, it } from "vitest";

import {
  assignment,
  TEST_CONSTANTS,
} from "@/content/en/lessons/apps-script/16-quotas-and-batching/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const { F2_SPEND, F61_SPEND, J2_EXPECTED, J61_EXPECTED } = TEST_CONSTANTS;

const CORRECT_LESSON_SOURCE = `function refactorMe() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Campaigns");
  const spend = sheet.getRange("F2:F61").getValues();
  const ils = spend.map(row => [row[0] * 3.7]);
  sheet.getRange("J2:J61").setValues(ils);
}
`;

const PER_CELL_LESSON_SOURCE = `function refactorMe() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Campaigns");
  for (let row = 2; row <= 61; row++) {
    const spend = sheet.getRange(row, 6).getValue();
    sheet.getRange(row, 10).setValue(spend * 3.7);
  }
}
`;

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-16-quotas-and-batching",
    files: [
      {
        name: "appsscript",
        type: "JSON",
        source: '{"timeZone":"America/New_York"}',
        functions: [],
      },
      {
        name: "Lesson",
        type: "SERVER_JS",
        source: CORRECT_LESSON_SOURCE,
        functions: ["refactorMe"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        F2: { value: F2_SPEND },
        F61: { value: F61_SPEND },
        J2: { value: J2_EXPECTED },
        J61: { value: J61_EXPECTED },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 16: quotas and batching", () => {
  it("passes all rules when the refactor uses getValues/setValues and J2, J61 are populated", async () => {
    const reader = new InMemoryReader(correctFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags a missing bound Apps Script project", async () => {
    const fx = correctFixture();
    fx.scriptProject = undefined;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-refactored-to-batch",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags the unrefactored per-cell starter (loop + singular getValue/setValue)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? { ...f, source: PER_CELL_LESSON_SOURCE }
          : f,
      ),
    };
    // Even if the loop happens to produce the right values, the source still
    // exhibits the slow pattern and the rule has to flag it.
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-refactored-to-batch",
    );
    expect(r?.passed).toBe(false);
    // The starter never calls getValues (plural), so the rule trips on
    // that check first. Either signal is acceptable evidence that the
    // per-cell shape is being rejected.
    expect(r?.detail).toContain("getValues");
  });

  it("flags a refactor that left the per-cell loop in alongside a no-op batch call", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              // Adds the batch calls but doesn't delete the loop. Round-trip
              // count is unchanged; the rule should still flag.
              source: `function refactorMe() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Campaigns");
  const dummy = sheet.getRange("F2:F61").getValues();
  sheet.getRange("J2:J61").setValues(dummy.map(r => [r[0] * 3.7]));
  for (let row = 2; row <= 61; row++) {
    const spend = sheet.getRange(row, 6).getValue();
    sheet.getRange(row, 10).setValue(spend * 3.7);
  }
}
`,
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-refactored-to-batch",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("for");
  });

  it("flags a refactor that uses getValues but not setValues", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: `function refactorMe() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Campaigns");
  const spend = sheet.getRange("F2:F61").getValues();
  for (let i = 0; i < spend.length; i++) {
    sheet.getRange(i + 2, 10).setValue(spend[i][0] * 3.7);
  }
}
`,
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-refactored-to-batch",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("setValues");
  });

  it("flags J2 being empty (batch write never fired)", async () => {
    const fx = correctFixture();
    delete fx.sheets.Campaigns.J2;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j2-shows-converted-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("J2 is empty");
  });

  it("flags J2 holding the wrong value (mapped column index off)", async () => {
    const fx = correctFixture();
    // Learner multiplied the wrong field: value is way off.
    fx.sheets.Campaigns.J2 = { value: F2_SPEND };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j2-shows-converted-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(J2_EXPECTED.toFixed(2));
  });

  it("flags J61 empty when the batch covered only the first row", async () => {
    const fx = correctFixture();
    delete fx.sheets.Campaigns.J61;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j61-shows-converted-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("J61 is empty");
  });

  it("flags a missing top-level function declaration", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: "const refactorMe = () => null;\n",
              functions: [],
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-refactored-to-batch",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("top-level");
  });
});
