import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/06-macros/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const CORRECT_SOURCE =
  "function formatSpendColumn() {\n" +
  "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
  "  sheet.getRange(\"F2:F61\").setNumberFormat(\"$#,##0.00\");\n" +
  "  sheet.setFrozenRows(1);\n" +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-06-macros",
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
        functions: ["formatSpendColumn"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        // Simulate the post-run state: the learner ran formatSpendColumn,
        // which applied the currency format to F2. The fixture only needs
        // F2's format set; the rule reads from there.
        F2: {
          value: 412.5,
          numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
        },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 6: macros", () => {
  it("passes all rules when the macro sets the format and freezes the header", async () => {
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
      (c) => c.ruleId === "script-defines-formatspendcolumn",
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
          ? { ...f, source: "function formatSpendColumn() {\n  return null;\n}\n" }
          : f,
      ),
    };
    // The macro never actually ran, so F2 doesn't have the currency format.
    fx.sheets.Campaigns.F2 = { value: 412.5 };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-formatspendcolumn",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("still returns");
  });

  it("flags a macro that sets the number format but never freezes the header", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function formatSpendColumn() {\n" +
                "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
                "  sheet.getRange(\"F2:F61\").setNumberFormat(\"$#,##0.00\");\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r1 = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-formatspendcolumn",
    );
    expect(r1?.passed).toBe(false);
    expect(r1?.detail).toContain("setFrozenRows");
    const r3 = result.feedback.checks.find(
      (c) => c.ruleId === "script-freezes-header",
    );
    expect(r3?.passed).toBe(false);
  });

  it("flags a macro that freezes the wrong number of rows", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function formatSpendColumn() {\n" +
                "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
                "  sheet.getRange(\"F2:F61\").setNumberFormat(\"$#,##0.00\");\n" +
                "  sheet.setFrozenRows(2);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-freezes-header",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("setFrozenRows(1)");
  });

  it("flags a macro that targets the wrong range", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function formatSpendColumn() {\n" +
                "  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(\"Campaigns\");\n" +
                "  sheet.getRange(\"A1\").setNumberFormat(\"$#,##0.00\");\n" +
                "  sheet.setFrozenRows(1);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-formatspendcolumn",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("F2:F61");
  });

  it("flags F2 still carrying the default (no) number format", async () => {
    const fx = correctFixture();
    // The function source is correct but the learner never ran it, so F2
    // has no number format applied yet.
    fx.sheets.Campaigns.F2 = { value: 412.5 };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "f2-has-currency-format",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("number format");
  });

  it("flags F2 having a non-currency format (learner picked percent by mistake)", async () => {
    const fx = correctFixture();
    fx.sheets.Campaigns.F2 = {
      value: 412.5,
      numberFormat: { type: "PERCENT", pattern: "0.00%" },
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "f2-has-currency-format",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("PERCENT");
  });
});
