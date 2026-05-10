import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/10-workspace-integrations/assignment";
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
  "function emailSpendReport() {\n" +
  '  const spend = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
  "  MailApp.sendEmail({\n" +
  '    to: "info@flexelent.com",\n' +
  '    subject: "Daily spend report",\n' +
  "    body: `Total spend today: $${spend}`,\n" +
  "  });\n" +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-10-workspace-integrations",
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
        functions: ["emailSpendReport"],
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

describe("Track 3 Lesson 10: workspace integrations (Drive, Calendar, Gmail)", () => {
  it("passes all rules when the function reads J1 and calls MailApp.sendEmail", async () => {
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
      (c) => c.ruleId === "script-defines-emailspendreport",
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
              source: "function emailSpendReport() {\n  return null;\n}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-emailspendreport",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("null");
  });

  it("flags a body that mails without reading the sheet", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function emailSpendReport() {\n" +
                '  MailApp.sendEmail({ to: "info@flexelent.com", subject: "Daily spend report", body: "static body" });\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-emailspendreport",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("SpreadsheetApp");
  });

  it("flags a body that reads the sheet but never calls a mail service", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function emailSpendReport() {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                "  Logger.log(spend);\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-emailspendreport",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("MailApp.sendEmail");
  });

  it("accepts GmailApp.sendEmail as an equivalent to MailApp.sendEmail", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function emailSpendReport() {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                '  GmailApp.sendEmail("info@flexelent.com", "Daily spend report", `Total: $${spend}`);\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    // The "defines" rule passes: GmailApp.sendEmail counts as a mail
    // service. The recipient / subject rules might fail since they look
    // for the options-bag form; that's expected and is what the lesson
    // body asks for.
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-emailspendreport",
    );
    expect(r?.passed).toBe(true);
  });

  it("flags a missing recipient email address", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function emailSpendReport() {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                '  MailApp.sendEmail({ to: "TODO-add-recipient", subject: "Daily spend report", body: `Total: $${spend}` });\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "email-includes-recipient",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("email address");
  });

  it("flags an empty subject line", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function emailSpendReport() {\n" +
                '  const spend = SpreadsheetApp.getActive().getSheetByName("Campaigns").getRange("J1").getValue();\n' +
                '  MailApp.sendEmail({ to: "info@flexelent.com", subject: "", body: `Total: $${spend}` });\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "email-includes-subject",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("subject");
  });
});
