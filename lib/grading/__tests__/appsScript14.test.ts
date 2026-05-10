import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/14-logging-and-errors/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const ROW2 = CAMPAIGNS_LARGE[1];
const F2_SPEND = typeof ROW2[5] === "number" ? ROW2[5] : 0;

const CORRECT_LESSON_SOURCE = `function processSpendSafely() {
  try {
    const spend = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName("Campaigns")
      .getRange("F2")
      .getValue();
    console.log("Read spend: " + spend);
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName("Campaigns")
      .getRange("J1")
      .setValue(spend * 1);
  } catch (e) {
    console.error("Failed to read spend: " + e.toString());
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName("Campaigns")
      .getRange("J1")
      .setValue("error");
  }
}
`;

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-14-logging-and-errors",
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
        functions: ["processSpendSafely"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        F2: { value: F2_SPEND },
        // Success path fired: J1 holds the spend as a number.
        J1: { value: F2_SPEND },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 14: logging and errors", () => {
  it("passes all rules when try/catch is in place and J1 holds the spend", async () => {
    const reader = new InMemoryReader(correctFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it('passes all rules when the catch path fires and J1 holds the string "error"', async () => {
    const fx = correctFixture();
    fx.sheets.Campaigns.J1 = { value: "error" };
    const reader = new InMemoryReader(fx);
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
      (c) => c.ruleId === "script-uses-trycatch",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags the stub body left empty (no try/catch)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: "function processSpendSafely() {\n  // empty\n}\n",
            }
          : f,
      ),
    };
    fx.sheets.Campaigns.J1 = { value: null };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-trycatch",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("try");
  });

  it("flags a try without any logging inside the catch", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              // try/catch present, but the catch block swallows silently.
              source:
                "function processSpendSafely() {\n  try {\n    const v = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Campaigns').getRange('F2').getValue();\n    console.log('Read spend: ' + v);\n    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Campaigns').getRange('J1').setValue(v * 1);\n  } catch (e) {\n    // silently eaten\n  }\n}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-trycatch",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("catch");
  });

  it("flags a missing console.log on the success path", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function processSpendSafely() {\n  try {\n    const v = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Campaigns').getRange('F2').getValue();\n    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Campaigns').getRange('J1').setValue(v * 1);\n  } catch (e) {\n    console.error('Failed: ' + e.toString());\n    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Campaigns').getRange('J1').setValue('error');\n  }\n}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-console-log",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("console.log");
  });

  it("flags J1 holding an unexpected value (not a number, not 'error')", async () => {
    const fx = correctFixture();
    // Learner wrote "done" instead of the spend or "error".
    fx.sheets.Campaigns.J1 = { value: "done" };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j1-shows-spend-or-error",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("done");
  });

  it("flags J1 being empty (function never ran or never wrote anything)", async () => {
    const fx = correctFixture();
    delete fx.sheets.Campaigns.J1;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j1-shows-spend-or-error",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("J1 is empty");
  });
});
