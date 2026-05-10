import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/01-editor-and-project/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-01-editor-and-project",
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
        source:
          "function projectName() {\n" +
          "  return SpreadsheetApp.getActiveSpreadsheet().getName();\n" +
          "}\n",
        functions: ["projectName"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Sheet1: {
        A1: { value: "Yoav's lesson workbook", formula: "=projectName()" },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 1: editor and project", () => {
  it("passes all rules on a correct implementation", async () => {
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
      (c) => c.ruleId === "script-defines-projectname",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags the stub body still returning null", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? { ...f, source: "function projectName() {\n  return null;\n}\n" }
          : f,
      ),
    };
    fx.sheets.Sheet1.A1 = { value: null, formula: "=projectName()" };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-projectname",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("null");
  });

  it("flags a body that doesn't reach for the spreadsheet's name", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              // Hardcoded string: works for the cell, fails the lesson.
              source: 'function projectName() {\n  return "my workbook";\n}\n',
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-projectname",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("SpreadsheetApp");
  });

  it("flags A1 being empty", async () => {
    const fx = correctFixture();
    delete fx.sheets.Sheet1.A1;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "a1-calls-projectname",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("A1 is empty");
  });

  it("flags A1 holding a literal string instead of the formula", async () => {
    const fx = correctFixture();
    fx.sheets.Sheet1.A1 = { value: "Yoav's lesson workbook" };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "a1-calls-projectname",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("empty");
  });

  it("flags A1 returning null (function returns null)", async () => {
    const fx = correctFixture();
    fx.sheets.Sheet1.A1 = { value: null, formula: "=projectName()" };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "a1-calls-projectname",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("null");
  });
});
