import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/07-simple-triggers/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const CORRECT_ONEDIT_SOURCE =
  "function onEdit(e) {\n" +
  "  const range = e.range;\n" +
  '  if (range.getSheet().getName() !== "Campaigns") return;\n' +
  "  if (range.getColumn() !== 6) return;\n" +
  '  range.getSheet().getRange(range.getRow(), 10).setValue("updated");\n' +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-07-simple-triggers",
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
        source: CORRECT_ONEDIT_SOURCE,
        functions: ["onEdit"],
      },
    ],
  };
}

// CAMPAIGNS_LARGE row 2 (the header) is row 1 in A1; F2 is the first
// real spend row. The fixture mirrors the post-edit state: the learner
// just touched F2 and the trigger filled J2 with "updated".
const ROW2 = CAMPAIGNS_LARGE[1];
const F2_SPEND = typeof ROW2[5] === "number" ? ROW2[5] : 0;

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        F2: { value: F2_SPEND },
        J2: { value: "updated" },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 7: simple triggers", () => {
  it("passes all rules when onEdit is correct and J2 holds the marker", async () => {
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
      (c) => c.ruleId === "script-defines-onedit",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags an empty onEdit body (no e.range read)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? { ...f, source: "function onEdit(e) {\n  // empty\n}\n" }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-onedit",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("e.range");
  });

  it("flags onEdit missing the Campaigns sheet-name check", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function onEdit(e) {\n" +
                "  const range = e.range;\n" +
                "  if (range.getColumn() !== 6) return;\n" +
                '  range.getSheet().getRange(range.getRow(), 10).setValue("updated");\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-onedit",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Campaigns");
  });

  it("flags onEdit missing the column F check", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function onEdit(e) {\n" +
                "  const range = e.range;\n" +
                '  if (range.getSheet().getName() !== "Campaigns") return;\n' +
                '  range.getSheet().getRange(range.getRow(), 10).setValue("updated");\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-onedit",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("column F");
  });

  it("flags J2 still empty after the edit", async () => {
    const fx = correctFixture();
    delete fx.sheets.Campaigns.J2;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j2-marker-after-edit",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("J2 is empty");
  });

  it("flags J2 holding a different string than the literal marker", async () => {
    const fx = correctFixture();
    // Learner wrote setValue(new Date()) or setValue("edited") instead.
    fx.sheets.Campaigns.J2 = { value: "edited" };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j2-marker-after-edit",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("updated");
  });

  it("flags an onEdit body that calls MailApp.sendEmail (simple triggers fail silently)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function onEdit(e) {\n" +
                "  const range = e.range;\n" +
                '  if (range.getSheet().getName() !== "Campaigns") return;\n' +
                "  if (range.getColumn() !== 6) return;\n" +
                '  MailApp.sendEmail("team@example.com", "Spend touched", "");\n' +
                '  range.getSheet().getRange(range.getRow(), 10).setValue("updated");\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "simple-trigger-no-restricted-services",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("MailApp");
  });

  it("flags an onEdit body that calls UrlFetchApp.fetch", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function onEdit(e) {\n" +
                "  const range = e.range;\n" +
                '  if (range.getSheet().getName() !== "Campaigns") return;\n' +
                "  if (range.getColumn() !== 6) return;\n" +
                '  UrlFetchApp.fetch("https://hooks.slack.com/x");\n' +
                '  range.getSheet().getRange(range.getRow(), 10).setValue("updated");\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "simple-trigger-no-restricted-services",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("UrlFetchApp");
  });
});
