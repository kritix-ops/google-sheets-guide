import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/05-menus-and-dialogs/assignment";
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
  "function addReportsMenu() {\n" +
  "  SpreadsheetApp.getUi()\n" +
  "    .createMenu(\"Reports\")\n" +
  "    .addItem(\"Show spend total\", \"alertSpend\")\n" +
  "    .addToUi();\n" +
  "}\n" +
  "\n" +
  "function alertSpend() {\n" +
  "  const total = SpreadsheetApp.getActiveSpreadsheet()\n" +
  "    .getSheetByName(\"Campaigns\")\n" +
  "    .getRange(\"J1\")\n" +
  "    .getValue();\n" +
  "  SpreadsheetApp.getUi().alert(\"Total spend: \" + total);\n" +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-05-menus-and-dialogs",
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
        functions: ["addReportsMenu", "alertSpend"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        // Seeded by the provisioner. `alertSpend` reads this value.
        J1: { value: TOTAL_SPEND },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 5: menus and dialogs", () => {
  it("passes all rules when both functions are wired correctly", async () => {
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
      (c) => c.ruleId === "script-defines-addreportsmenu",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags addReportsMenu missing the addItem chain", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function addReportsMenu() {\n" +
                "  SpreadsheetApp.getUi().createMenu(\"Reports\").addToUi();\n" +
                "}\n" +
                "function alertSpend() {\n" +
                "  SpreadsheetApp.getUi().alert(\"Total spend: \" + SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\").getRange(\"J1\").getValue());\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-addreportsmenu",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("addItem");
  });

  it("flags addReportsMenu that builds a menu but never calls addToUi", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function addReportsMenu() {\n" +
                "  SpreadsheetApp.getUi().createMenu(\"Reports\").addItem(\"Show spend total\", \"alertSpend\");\n" +
                "}\n" +
                "function alertSpend() {\n" +
                "  SpreadsheetApp.getUi().alert(\"Total spend: \" + SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\").getRange(\"J1\").getValue());\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-addreportsmenu",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("addToUi");
  });

  it("flags addItem pointing at the wrong (typo'd) function name", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              // Classic typo: "alertspend" lowercase, would silently fail
              // at click time on a real workbook.
              source:
                "function addReportsMenu() {\n" +
                "  SpreadsheetApp.getUi().createMenu(\"Reports\").addItem(\"Show spend total\", \"alertspend\").addToUi();\n" +
                "}\n" +
                "function alertSpend() {\n" +
                "  SpreadsheetApp.getUi().alert(\"Total spend: \" + SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\").getRange(\"J1\").getValue());\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-addreportsmenu",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("alertSpend");
  });

  it("flags alertSpend missing entirely", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function addReportsMenu() {\n" +
                "  SpreadsheetApp.getUi().createMenu(\"Reports\").addItem(\"Show spend total\", \"alertSpend\").addToUi();\n" +
                "}\n",
              functions: ["addReportsMenu"],
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-alertspend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("alertSpend");
  });

  it("flags alertSpend that doesn't call ui.alert", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function addReportsMenu() {\n" +
                "  SpreadsheetApp.getUi().createMenu(\"Reports\").addItem(\"Show spend total\", \"alertSpend\").addToUi();\n" +
                "}\n" +
                "function alertSpend() {\n" +
                "  const value = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\").getRange(\"J1\").getValue();\n" +
                "  console.log(value);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-alertspend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("alert");
  });

  it("flags alertSpend that hardcodes the total instead of reading J1", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function addReportsMenu() {\n" +
                "  SpreadsheetApp.getUi().createMenu(\"Reports\").addItem(\"Show spend total\", \"alertSpend\").addToUi();\n" +
                "}\n" +
                "function alertSpend() {\n" +
                "  SpreadsheetApp.getUi().alert(\"Total spend: 12345\");\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-alertspend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("J1");
  });

  it("flags a J1 seed that drifted from the dataset total", async () => {
    const fx = correctFixture();
    fx.sheets.Campaigns.J1 = { value: 0 };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j1-prepopulated-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(TOTAL_SPEND.toFixed(2));
  });
});
