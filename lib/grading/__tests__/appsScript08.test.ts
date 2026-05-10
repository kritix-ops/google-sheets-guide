import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/08-installable-triggers/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const CORRECT_LESSON_SOURCE =
  "function setupDailyRefresh() {\n" +
  '  ScriptApp.newTrigger("refreshAggregator")\n' +
  "    .timeBased()\n" +
  "    .everyDays(1)\n" +
  "    .atHour(6)\n" +
  "    .create();\n" +
  "}\n" +
  "\n" +
  "function refreshAggregator() {\n" +
  "  SpreadsheetApp.getActiveSpreadsheet()\n" +
  '    .getSheetByName("Campaigns")\n' +
  '    .getRange("J1")\n' +
  "    .setValue(new Date());\n" +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-08-installable-triggers",
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
        functions: ["setupDailyRefresh", "refreshAggregator"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      // The handler writes to J1 at fire time, but the grader checks
      // source only (the trigger can't be invoked from a fixture). J1
      // contents are not part of any rule.
      Campaigns: {},
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 8: installable triggers", () => {
  it("passes all rules on a correct setup-and-handler pair", async () => {
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
      (c) => c.ruleId === "script-defines-setupdailyrefresh",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags setupDailyRefresh missing .timeBased()", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function setupDailyRefresh() {\n" +
                '  ScriptApp.newTrigger("refreshAggregator").create();\n' +
                "}\n" +
                "function refreshAggregator() {\n" +
                '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue(new Date());\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-setupdailyrefresh",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("timeBased");
  });

  it("flags setupDailyRefresh missing the handler-name string", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function setupDailyRefresh() {\n" +
                "  ScriptApp.newTrigger(refreshAggregator)\n" +
                "    .timeBased()\n" +
                "    .everyDays(1)\n" +
                "    .atHour(6)\n" +
                "    .create();\n" +
                "}\n" +
                "function refreshAggregator() {\n" +
                '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue(new Date());\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-setupdailyrefresh",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("refreshAggregator");
  });

  it("flags setupDailyRefresh missing .create()", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function setupDailyRefresh() {\n" +
                '  ScriptApp.newTrigger("refreshAggregator")\n' +
                "    .timeBased()\n" +
                "    .everyDays(1)\n" +
                "    .atHour(6);\n" +
                "}\n" +
                "function refreshAggregator() {\n" +
                '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue(new Date());\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-setupdailyrefresh",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(".create()");
  });

  it("flags missing refreshAggregator handler", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function setupDailyRefresh() {\n" +
                '  ScriptApp.newTrigger("refreshAggregator")\n' +
                "    .timeBased()\n" +
                "    .everyDays(1)\n" +
                "    .atHour(6)\n" +
                "    .create();\n" +
                "}\n",
              functions: ["setupDailyRefresh"],
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-refreshaggregator",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("refreshAggregator");
  });

  it("flags refreshAggregator body that doesn't write or fetch anything", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function setupDailyRefresh() {\n" +
                '  ScriptApp.newTrigger("refreshAggregator")\n' +
                "    .timeBased()\n" +
                "    .everyDays(1)\n" +
                "    .atHour(6)\n" +
                "    .create();\n" +
                "}\n" +
                "function refreshAggregator() {\n" +
                "  // placeholder, never wrote the body\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const setupRule = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-setupdailyrefresh",
    );
    const handlerRule = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-refreshaggregator",
    );
    const fullAuthRule = result.feedback.checks.find(
      (c) => c.ruleId === "trigger-handler-uses-full-auth",
    );
    // setup is fine; the handler rule and the full-auth rule both flag.
    expect(setupRule?.passed).toBe(true);
    expect(handlerRule?.passed).toBe(false);
    expect(fullAuthRule?.passed).toBe(false);
    expect(fullAuthRule?.detail).toContain("productive");
  });

  it("accepts a handler body that uses UrlFetchApp instead of setValue", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function setupDailyRefresh() {\n" +
                '  ScriptApp.newTrigger("refreshAggregator")\n' +
                "    .timeBased()\n" +
                "    .everyDays(1)\n" +
                "    .atHour(6)\n" +
                "    .create();\n" +
                "}\n" +
                "function refreshAggregator() {\n" +
                "  // Pull from Taboola's reporting API instead of writing locally.\n" +
                '  const res = UrlFetchApp.fetch("https://backstage.taboola.com/...");\n' +
                '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue(res.getResponseCode());\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });
});
