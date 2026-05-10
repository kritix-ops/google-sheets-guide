import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/04-spreadsheetapp/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const TOTAL_SPEND = CAMPAIGNS_LARGE.slice(1).reduce<number>((sum, row) => {
  const v = row[5];
  return sum + (typeof v === "number" ? v : 0);
}, 0);

const CORRECT_SOURCE =
  "function recomputeSpend() {\n" +
  "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
  "  const values = sheet.getRange(\"F2:F61\").getValues();\n" +
  "  let total = 0;\n" +
  "  for (const row of values) total += row[0];\n" +
  "  sheet.getRange(\"J1\").setValue(total);\n" +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-04-spreadsheetapp",
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
        source: CORRECT_SOURCE,
        functions: ["recomputeSpend"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        // Simulate the post-run state: the learner clicked Run, the function
        // read F2:F61, summed, and wrote the total to J1.
        J1: { value: TOTAL_SPEND },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 4: SpreadsheetApp", () => {
  it("passes all rules when the function batches the read and writes J1", async () => {
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
      (c) => c.ruleId === "script-defines-recomputespend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags the `return null;` stub being left in place", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: "function recomputeSpend() {\n  return null;\n}\n",
            }
          : f,
      ),
    };
    // If the learner never edited the body, J1 was never written to.
    fx.sheets.Campaigns.J1 = { value: null };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-recomputespend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("still returns");
  });

  it("flags a function that has no getRange call at all", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              // A learner who tried to do everything via formulas and forgot
              // they're inside Apps Script.
              source:
                "function recomputeSpend() {\n  let x = 0;\n  return x;\n}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-recomputespend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("getRange");
  });

  it("flags the per-cell `getValue()`-in-a-loop anti-pattern", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function recomputeSpend() {\n" +
                "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
                "  let total = 0;\n" +
                "  for (let i = 2; i <= 61; i++) {\n" +
                "    total += sheet.getRange(i, 6).getValue();\n" +
                "  }\n" +
                "  sheet.getRange(\"J1\").setValue(total);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    // The function passes rule 1 (it has getRange + getValue... wait, no:
    // rule 1 requires `getValues`. So rule 1 fires first with a getValues
    // message, and rule 3 also fires.
    const r1 = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-recomputespend",
    );
    expect(r1?.passed).toBe(false);
    expect(r1?.detail).toContain("getValues");
    const r3 = result.feedback.checks.find(
      (c) => c.ruleId === "source-uses-batch-getvalues",
    );
    expect(r3?.passed).toBe(false);
    expect(r3?.detail).toContain("getValue");
  });

  it("flags J1 left empty (function declared but never run)", async () => {
    const fx = correctFixture();
    fx.sheets.Campaigns.J1 = { value: null };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j1-shows-total-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("empty");
  });

  it("flags J1 holding the wrong total (learner summed the wrong column)", async () => {
    const fx = correctFixture();
    // Learner accidentally summed row[1] instead of row[0]; the 2D-array trap.
    fx.sheets.Campaigns.J1 = { value: 0 };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j1-shows-total-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(TOTAL_SPEND.toFixed(2));
  });

  it("flags a function that reads in batch but never writes back", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function recomputeSpend() {\n" +
                "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
                "  const values = sheet.getRange(\"F2:F61\").getValues();\n" +
                "  let total = 0;\n" +
                "  for (const row of values) total += row[0];\n" +
                "  // forgot to write back to J1\n" +
                "}\n",
            }
          : f,
      ),
    };
    fx.sheets.Campaigns.J1 = { value: null };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-recomputespend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("setValue");
  });
});
