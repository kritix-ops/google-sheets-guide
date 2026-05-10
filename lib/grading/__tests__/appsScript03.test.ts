import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/03-custom-functions/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const USD_TO_ILS_RATE = 3.7;
const ROW2 = CAMPAIGNS_LARGE[1];
const F2_SPEND_USD = typeof ROW2[5] === "number" ? ROW2[5] : 0;
const G2_REVENUE_USD = typeof ROW2[6] === "number" ? ROW2[6] : 0;
const F2_SPEND_ILS = F2_SPEND_USD * USD_TO_ILS_RATE;
const G2_REVENUE_ILS = G2_REVENUE_USD * USD_TO_ILS_RATE;

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-03-custom-functions",
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
        source: "function usdToILS(usd, rate) {\n  return usd * rate;\n}\n",
        functions: ["usdToILS"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Campaigns: {
        F2: { value: F2_SPEND_USD },
        G2: { value: G2_REVENUE_USD },
        K1: { value: USD_TO_ILS_RATE },
        H2: { value: F2_SPEND_ILS, formula: "=usdToILS(F2, $K$1)" },
        I2: { value: G2_REVENUE_ILS, formula: "=usdToILS(G2, $K$1)" },
      },
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 3: custom functions", () => {
  it("passes all rules when the function is implemented and both cells call it", async () => {
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
      (c) => c.ruleId === "script-defines-usdtoils",
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
          ? { ...f, source: "function usdToILS(usd, rate) {\n  return null;\n}\n" }
          : f,
      ),
    };
    // The cells still evaluate to the right number when the runtime uses the
    // function correctly, but a learner who never edited the stub has H2/I2
    // showing nothing. Set the cell values to null to mirror that.
    fx.sheets.Campaigns.H2 = { value: null, formula: "=usdToILS(F2, $K$1)" };
    fx.sheets.Campaigns.I2 = { value: null, formula: "=usdToILS(G2, $K$1)" };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-usdtoils",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("doesn't multiply");
  });

  it("flags a function declared as an arrow expression (not callable from cells)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: "const usdToILS = (usd, rate) => usd * rate;\n",
              // Apps Script's FunctionSet only lists top-level function
              // declarations; an arrow expression on a `const` doesn't show
              // up: which is exactly the failure we want the rule to catch.
              functions: [],
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-usdtoils",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("top-level");
  });

  it("flags H2 missing the custom-function call", async () => {
    const fx = correctFixture();
    // Learner did the math inline instead of calling usdToILS.
    fx.sheets.Campaigns.H2 = { value: F2_SPEND_ILS, formula: "=F2 * $K$1" };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "h2-calls-usdtoils-on-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("usdToILS");
  });

  it("flags H2 using a non-locked K1 reference", async () => {
    const fx = correctFixture();
    fx.sheets.Campaigns.H2 = {
      value: F2_SPEND_ILS,
      formula: "=usdToILS(F2, K2)",
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "h2-calls-usdtoils-on-spend",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("$K$1");
  });

  it("flags I2 empty with the type-this-formula nudge", async () => {
    const fx = correctFixture();
    delete fx.sheets.Campaigns.I2;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "i2-calls-usdtoils-on-revenue",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("I2 is empty");
  });

  it("flags I2 returning the wrong ILS value", async () => {
    const fx = correctFixture();
    // Learner accidentally pointed at H2 (spend in ILS) instead of G2
    // (revenue in USD). Formula looks right; the number doesn't.
    fx.sheets.Campaigns.I2 = {
      value: F2_SPEND_ILS,
      formula: "=usdToILS(G2, $K$1)",
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "i2-calls-usdtoils-on-revenue",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain(G2_REVENUE_ILS.toFixed(2));
  });
});
