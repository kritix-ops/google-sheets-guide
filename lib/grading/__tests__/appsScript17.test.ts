import { describe, expect, it } from "vitest";

import {
  assignment,
  TEST_CONSTANTS,
} from "@/content/en/lessons/apps-script/17-advanced-sheets-service/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const { TOTAL_SPEND } = TEST_CONSTANTS;

const CORRECT_LESSON_SOURCE = `function batchUpdateUsingAdvancedService() {
  const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  const response = Sheets.Spreadsheets.values.get(
    spreadsheetId,
    "Campaigns!F2:G61"
  );
  const rows = response.values || [];
  let total = 0;
  rows.forEach(row => { total += Number(row[0] || 0); });
  Sheets.Spreadsheets.values.update(
    { values: [[total]] },
    spreadsheetId,
    "Campaigns!J1",
    { valueInputOption: "RAW" }
  );
}
`;

const CORRECT_MANIFEST_SOURCE = JSON.stringify(
  {
    timeZone: "America/New_York",
    dependencies: {
      enabledAdvancedServices: [
        { userSymbol: "Sheets", serviceId: "sheets", version: "v4" },
      ],
    },
  },
  null,
  2,
);

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-17-advanced-sheets-service",
    files: [
      {
        name: "appsscript",
        type: "JSON",
        source: CORRECT_MANIFEST_SOURCE,
        functions: [],
      },
      {
        name: "Lesson",
        type: "SERVER_JS",
        source: CORRECT_LESSON_SOURCE,
        functions: ["batchUpdateUsingAdvancedService"],
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

describe("Track 3 Lesson 17: advanced Sheets service", () => {
  it("passes all rules when the manifest enables Sheets and the function writes the total to J1", async () => {
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
      (c) => c.ruleId === "manifest-has-sheets-advanced-service",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags a manifest with no dependencies block", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "appsscript"
          ? { ...f, source: '{"timeZone":"America/New_York"}' }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "manifest-has-sheets-advanced-service",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("dependencies");
  });

  it("flags a manifest with dependencies but no Sheets entry", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "appsscript"
          ? {
              ...f,
              source: JSON.stringify({
                timeZone: "America/New_York",
                dependencies: {
                  enabledAdvancedServices: [
                    { userSymbol: "Drive", serviceId: "drive", version: "v3" },
                  ],
                },
              }),
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "manifest-has-sheets-advanced-service",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("sheets");
  });

  it("flags a manifest whose source isn't valid JSON", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "appsscript"
          ? { ...f, source: '{"timeZone":"America/New_York"' /* missing } */ }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "manifest-has-sheets-advanced-service",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("JSON");
  });

  it("flags a body that uses SpreadsheetApp instead of the advanced service", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: `function batchUpdateUsingAdvancedService() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Campaigns");
  const values = sheet.getRange("F2:F61").getValues();
  let total = 0;
  values.forEach(r => { total += Number(r[0] || 0); });
  sheet.getRange("J1").setValue(total);
}
`,
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-advanced-service",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Sheets");
  });

  it("flags J1 holding the wrong total (off-by-one or wrong column)", async () => {
    const fx = correctFixture();
    // Learner summed revenue instead of spend, getting a much higher number.
    fx.sheets.Campaigns.J1 = { value: TOTAL_SPEND * 2 };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j1-shows-total-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(TOTAL_SPEND.toFixed(2));
  });

  it("flags J1 being empty (update call never landed)", async () => {
    const fx = correctFixture();
    delete fx.sheets.Campaigns.J1;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "j1-shows-total-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("J1 is empty");
  });

  it("flags a missing top-level function declaration", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "const batchUpdateUsingAdvancedService = () => null;\n",
              functions: [],
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-advanced-service",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("top-level");
  });
});
