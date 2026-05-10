import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/11-external-apis/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const CORRECT_SOURCE =
  "function fetchTaboolaSummary() {\n" +
  "  const response = UrlFetchApp.fetch(\n" +
  '    "https://example.com/api/taboola/summary",\n' +
  "    {\n" +
  '      headers: { Authorization: "Bearer demo-token" },\n' +
  "      muteHttpExceptions: true,\n" +
  "    }\n" +
  "  );\n" +
  "  const data = JSON.parse(response.getContentText());\n" +
  '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").setValue(data.total_spend);\n' +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-11-external-apis",
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
        functions: ["fetchTaboolaSummary"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {},
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 11: external APIs from Apps Script", () => {
  it("passes all rules on a complete fetch + parse + setValue body", async () => {
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
      (c) => c.ruleId === "script-defines-fetchtaboolasummary",
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
              source: "function fetchTaboolaSummary() {\n  return null;\n}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-fetchtaboolasummary",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("null");
  });

  it("flags a body that doesn't call UrlFetchApp.fetch", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function fetchTaboolaSummary() {\n" +
                "  const data = { total_spend: 32418.2 };\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").setValue(data.total_spend);\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-fetchtaboolasummary",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("UrlFetchApp.fetch");
  });

  it("flags a fetch call that omits the Authorization header", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function fetchTaboolaSummary() {\n" +
                '  const response = UrlFetchApp.fetch("https://example.com/api/taboola/summary", { muteHttpExceptions: true });\n' +
                "  const data = JSON.parse(response.getContentText());\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").setValue(data.total_spend);\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-fetchtaboolasummary",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Authorization");
  });

  it("flags a fetch without JSON.parse on the response", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function fetchTaboolaSummary() {\n" +
                '  const response = UrlFetchApp.fetch("https://example.com/api/taboola/summary", { headers: { Authorization: "Bearer demo-token" }, muteHttpExceptions: true });\n' +
                "  const body = response.getContentText();\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").setValue(body);\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-parses-json-response",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("JSON.parse");
  });

  it("flags JSON.parse called directly on the response object (forgot getContentText)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function fetchTaboolaSummary() {\n" +
                '  const response = UrlFetchApp.fetch("https://example.com/api/taboola/summary", { headers: { Authorization: "Bearer demo-token" }, muteHttpExceptions: true });\n' +
                "  const data = JSON.parse(response);\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").setValue(data.total_spend);\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-parses-json-response",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("getContentText");
  });

  it("flags a body that fetches and parses but never writes to J1", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function fetchTaboolaSummary() {\n" +
                '  const response = UrlFetchApp.fetch("https://example.com/api/taboola/summary", { headers: { Authorization: "Bearer demo-token" }, muteHttpExceptions: true });\n' +
                "  const data = JSON.parse(response.getContentText());\n" +
                "  Logger.log(data.total_spend);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-writes-to-j1",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("setValue");
  });
});
