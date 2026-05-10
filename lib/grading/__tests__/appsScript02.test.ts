import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/02-execution-model/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const PER_DAY = 20000;
const PER_MINUTE = 600;
const EXPECTED = `${PER_DAY} per day, ${PER_MINUTE} per minute`;

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-02-execution-model",
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
          "function quotaSummary(perDay, perMinute) {\n" +
          "  return `${perDay} per day, ${perMinute} per minute`;\n" +
          "}\n",
        functions: ["quotaSummary"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Sheet1: {
        A1: { value: EXPECTED, formula: `=quotaSummary(${PER_DAY}, ${PER_MINUTE})` },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 2: execution model", () => {
  it("passes all rules on a correct implementation", async () => {
    const reader = new InMemoryReader(correctFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags a body that concatenates with + instead of using a template literal", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function quotaSummary(perDay, perMinute) {\n" +
                '  return perDay + " per day, " + perMinute + " per minute";\n' +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-quotasummary",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("template literal");
  });

  it("flags a template literal that hardcodes the numbers instead of interpolating", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                "function quotaSummary(perDay, perMinute) {\n" +
                "  return `20000 per day, 600 per minute`;\n" +
                "}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-quotasummary",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("interpolating");
  });

  it("flags A1 calling the function with different numbers", async () => {
    const fx = correctFixture();
    fx.sheets.Sheet1.A1 = {
      value: "100 per day, 60 per minute",
      formula: "=quotaSummary(100, 60)",
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "a1-calls-quotasummary",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(String(PER_DAY));
  });

  it("flags A1 missing whitespace in the composed string", async () => {
    const fx = correctFixture();
    // Buggy template literal: missing space after the comma. Formula args
    // are right, but the function body produces the wrong string.
    fx.sheets.Sheet1.A1 = {
      value: `${PER_DAY} per day,${PER_MINUTE} per minute`,
      formula: `=quotaSummary(${PER_DAY}, ${PER_MINUTE})`,
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "a1-calls-quotasummary",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("exactly");
  });
});
