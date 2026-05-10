import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/09-slow-apps-script/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);

const REFACTORED_SOURCE = `function slowAggregate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");
  console.time("read");
  const values = sheet.getRange("F2:F61").getValues();
  console.timeEnd("read");
  let total = 0;
  for (let row = 0; row < values.length; row++) {
    total += values[row][0];
  }
  sheet.getRange("J1").setValue(total);
}
`;

const SLOW_SOURCE = `function slowAggregate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");
  let total = 0;
  for (let row = 2; row <= 61; row++) {
    total += sheet.getRange(row, 6).getValue();
  }
  sheet.getRange("J1").setValue(total);
}
`;

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: scale-09-slow-apps-script",
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
        source: REFACTORED_SOURCE,
        functions: ["slowAggregate"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        J1: { value: TOTAL_SPEND },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 4 Lesson 9: diagnosing slow Apps Script", () => {
  it("passes all rules when the refactor uses batch reads, console.time, and writes the total", async () => {
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
      (c) => c.ruleId === "script-uses-batch-getvalues",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags the original per-cell getValue() loop being left in place", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson" ? { ...f, source: SLOW_SOURCE } : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-batch-getvalues",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("getValues");
  });

  it("flags a refactor that uses getValues but still has a leftover getValue() call", async () => {
    const fx = correctFixture();
    // The learner pulled the values via batch but forgot to remove an old
    // singular-getValue debug line. Rule should still call out the leftover.
    const mixedSource = `function slowAggregate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");
  console.time("read");
  const values = sheet.getRange("F2:F61").getValues();
  const sanity = sheet.getRange("F2").getValue();
  console.timeEnd("read");
  let total = 0;
  for (let row = 0; row < values.length; row++) {
    total += values[row][0];
  }
  sheet.getRange("J1").setValue(total);
}
`;
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? { ...f, source: mixedSource, functions: ["slowAggregate"] }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-batch-getvalues",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("singular");
  });

  it("flags a missing console.time / console.timeEnd pair", async () => {
    const fx = correctFixture();
    const noProfilingSource = `function slowAggregate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");
  const values = sheet.getRange("F2:F61").getValues();
  let total = 0;
  for (let row = 0; row < values.length; row++) {
    total += values[row][0];
  }
  sheet.getRange("J1").setValue(total);
}
`;
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? { ...f, source: noProfilingSource, functions: ["slowAggregate"] }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-console-time",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("console.time");
  });

  it("flags an unmatched console.time (no timeEnd)", async () => {
    const fx = correctFixture();
    const unmatchedSource = `function slowAggregate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");
  console.time("read");
  const values = sheet.getRange("F2:F61").getValues();
  let total = 0;
  for (let row = 0; row < values.length; row++) {
    total += values[row][0];
  }
  sheet.getRange("J1").setValue(total);
}
`;
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? { ...f, source: unmatchedSource, functions: ["slowAggregate"] }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-console-time",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("timeEnd");
  });

  it("flags J1 empty when the function never ran", async () => {
    const fx = correctFixture();
    delete fx.sheets.Campaigns.J1;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find((c) => c.ruleId === "j1-shows-total");
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("J1 is empty");
  });

  it("flags J1 holding the wrong total", async () => {
    const fx = correctFixture();
    fx.sheets.Campaigns.J1 = { value: 0 };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find((c) => c.ruleId === "j1-shows-total");
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(TOTAL_SPEND.toFixed(2));
  });
});
