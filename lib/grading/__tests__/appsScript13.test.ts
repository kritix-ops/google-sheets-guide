import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/13-web-apps/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const SPEND_COL = 5;
const TOTAL_SPEND = CAMPAIGNS_LARGE.slice(1).reduce<number>((sum, row) => {
  const v = row[SPEND_COL];
  return sum + (typeof v === "number" ? v : 0);
}, 0);

const CORRECT_SOURCE =
  "function doGet(e) {\n" +
  '  const spend = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
  "  return HtmlService.createHtmlOutput(`<h1>Total spend: $${spend}</h1>`);\n" +
  "}\n" +
  "\n" +
  "function doPost(e) {\n" +
  "  const payload = JSON.parse(e.postData.contents);\n" +
  '  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("K1").setValue(payload.value);\n' +
  "  return ContentService.createTextOutput(JSON.stringify({ ok: true }))\n" +
  "    .setMimeType(ContentService.MimeType.JSON);\n" +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-13-web-apps",
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
        functions: ["doGet", "doPost"],
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

describe("Track 3 Lesson 13: web apps from Apps Script", () => {
  it("passes all rules when doGet/doPost are implemented correctly", async () => {
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
      (c) => c.ruleId === "script-defines-doget",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags doGet stub left as `return null;`", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function doGet(e) {\n  return null;\n}\n\n" +
                "function doPost(e) {\n" +
                "  const payload = JSON.parse(e.postData.contents);\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("K1").setValue(payload.value);\n' +
                "  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-doget",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("null");
  });

  it("flags doGet that returns a raw string instead of an HtmlService/ContentService response", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function doGet(e) {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                "  return `<h1>${spend}</h1>`;\n" +
                "}\n\n" +
                "function doPost(e) {\n" +
                "  const payload = JSON.parse(e.postData.contents);\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("K1").setValue(payload.value);\n' +
                "  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-doget",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("HtmlService");
  });

  it("flags doPost missing the JSON.parse(e.postData.contents) line", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function doGet(e) {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                "  return HtmlService.createHtmlOutput(`<h1>${spend}</h1>`);\n" +
                "}\n\n" +
                "function doPost(e) {\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("K1").setValue(42);\n' +
                "  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-dopost",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("e.postData.contents");
  });

  it("flags doPost that writes to the wrong cell (not K1)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function doGet(e) {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                "  return HtmlService.createHtmlOutput(`<h1>${spend}</h1>`);\n" +
                "}\n\n" +
                "function doPost(e) {\n" +
                "  const payload = JSON.parse(e.postData.contents);\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("M1").setValue(payload.value);\n' +
                "  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-dopost",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("K1");
  });

  it("flags doPost returning ContentService text without setting JSON mime type", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function doGet(e) {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                "  return HtmlService.createHtmlOutput(`<h1>${spend}</h1>`);\n" +
                "}\n\n" +
                "function doPost(e) {\n" +
                "  const payload = JSON.parse(e.postData.contents);\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("K1").setValue(payload.value);\n' +
                "  return ContentService.createTextOutput(JSON.stringify({ ok: true }));\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-dopost",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("MIME type");
  });

  it("flags MailApp called synchronously inside doPost", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function doGet(e) {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                "  return HtmlService.createHtmlOutput(`<h1>${spend}</h1>`);\n" +
                "}\n\n" +
                "function doPost(e) {\n" +
                "  const payload = JSON.parse(e.postData.contents);\n" +
                '  SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("K1").setValue(payload.value);\n' +
                '  MailApp.sendEmail({ to: "info@flexelent.com", subject: "POST received", body: "ok" });\n' +
                "  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-not-using-restricted-services",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("MailApp");
  });
});
