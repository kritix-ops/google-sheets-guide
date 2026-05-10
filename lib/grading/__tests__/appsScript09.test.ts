import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/09-sidebars-and-dialogs/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const CORRECT_LESSON_SOURCE =
  "function showReportsSidebar() {\n" +
  '  const html = HtmlService.createHtmlOutputFromFile("Reports")\n' +
  '    .setTitle("Reports");\n' +
  "  SpreadsheetApp.getUi().showSidebar(html);\n" +
  "}\n";

const CORRECT_REPORTS_HTML =
  "<!DOCTYPE html>\n" +
  "<html>\n" +
  '  <head><base target="_top"></head>\n' +
  "  <body>\n" +
  "    <h2>Spend report</h2>\n" +
  '    <p>Today\'s total spend: <span id="spend">...</span></p>\n' +
  "  </body>\n" +
  "</html>\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-09-sidebars-and-dialogs",
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
        functions: ["showReportsSidebar"],
      },
      {
        name: "Reports",
        type: "HTML",
        source: CORRECT_REPORTS_HTML,
        functions: [],
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

describe("Track 3 Lesson 9: sidebars and dialogs", () => {
  it("passes all rules when Lesson.gs and Reports.html are correct", async () => {
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
      (c) => c.ruleId === "script-defines-showreportssidebar",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags showReportsSidebar missing createHtmlOutputFromFile", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function showReportsSidebar() {\n" +
                '  SpreadsheetApp.getUi().alert("Reports");\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-showreportssidebar",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("createHtmlOutputFromFile");
  });

  it("flags showReportsSidebar that builds the output but never opens it", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function showReportsSidebar() {\n" +
                '  const html = HtmlService.createHtmlOutputFromFile("Reports").setTitle("Reports");\n' +
                "  return html;\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-showreportssidebar",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("showSidebar");
  });

  it("flags using the reserved \"Sidebar\" file name", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function showReportsSidebar() {\n" +
                '  const html = HtmlService.createHtmlOutputFromFile("Sidebar").setTitle("Reports");\n' +
                "  SpreadsheetApp.getUi().showSidebar(html);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-not-using-reserved-name",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Sidebar");
  });

  it("flags a missing Reports HTML file", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.filter((f: AppsScriptFile) => f.name !== "Reports"),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "reports-html-exists",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Reports");
  });

  it("flags Reports.html still containing the stub placeholder", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Reports"
          ? {
              ...f,
              source:
                "<!DOCTYPE html>\n" +
                "<html>\n" +
                '  <head><base target="_top"></head>\n' +
                "  <body>\n" +
                "    <h2>Reports</h2>\n" +
                "    <p>Replace me.</p>\n" +
                "  </body>\n" +
                "</html>\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "reports-html-exists",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toMatch(/spend|Replace me/);
  });

  it("flags Reports.html missing a heading", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Reports"
          ? {
              ...f,
              source:
                "<!DOCTYPE html>\n" +
                "<html>\n" +
                '  <head><base target="_top"></head>\n' +
                "  <body>\n" +
                "    <p>Spend report content goes here.</p>\n" +
                "  </body>\n" +
                "</html>\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "reports-html-exists",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("heading");
  });
});
