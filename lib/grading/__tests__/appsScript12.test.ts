import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/12-libraries-and-deployments/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const CORRECT_MANIFEST = JSON.stringify(
  {
    timeZone: "America/New_York",
    dependencies: {
      libraries: [
        {
          userSymbol: "Shared",
          libraryId: "1abc...placeholder",
          version: "1",
          developmentMode: false,
        },
      ],
    },
  },
  null,
  2,
);

const CORRECT_LESSON =
  "function callSharedHelper() {\n" +
  '  return Shared.normalizeBuyer("Yoav Cohen");\n' +
  "}\n";

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-12-libraries-and-deployments",
    files: [
      {
        name: "appsscript",
        type: "JSON",
        source: CORRECT_MANIFEST,
        functions: [],
      },
      {
        name: "Lesson",
        type: "SERVER_JS",
        source: CORRECT_LESSON,
        functions: ["callSharedHelper"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: {
      Sheet1: {},
    },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 12: libraries and deployments", () => {
  it("passes all rules when manifest declares a library and source uses its userSymbol", async () => {
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
      (c) => c.ruleId === "manifest-has-library-entry",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags a manifest with no dependencies.libraries entry", async () => {
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
      (c) => c.ruleId === "manifest-has-library-entry",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("dependencies.libraries");
  });

  it("flags a manifest that isn't valid JSON", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "appsscript"
          ? {
              ...f,
              source:
                '{"timeZone":"America/New_York", "dependencies": { "libraries": [{ "userSymbol": "Shared", }] }',
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "manifest-has-library-entry",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("valid JSON");
  });

  it("flags a library entry missing libraryId", async () => {
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
                  libraries: [{ userSymbol: "Shared", version: "1" }],
                },
              }),
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "manifest-has-library-entry",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("libraryId");
  });

  it("flags a userSymbol that's still the placeholder", async () => {
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
                  libraries: [
                    {
                      userSymbol: "YOUR_SYMBOL",
                      libraryId: "1abc...",
                      version: "1",
                    },
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
      (c) => c.ruleId === "library-usersymbol-not-placeholder",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("placeholder");
  });

  it("flags `callSharedHelper` that doesn't call into the manifest's userSymbol", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source:
                'function callSharedHelper() {\n  return "Yoav Cohen";\n}\n',
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-callsharedhelper",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Shared.");
  });

  it("flags the `return null;` stub being left in place", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? { ...f, source: "function callSharedHelper() {\n  return null;\n}\n" }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-defines-callsharedhelper",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("null");
  });

  it("accepts a different userSymbol when the source uses the matching prefix", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) => {
        if (f.name === "appsscript") {
          return {
            ...f,
            source: JSON.stringify({
              timeZone: "America/New_York",
              dependencies: {
                libraries: [
                  {
                    userSymbol: "Utils",
                    libraryId: "1abc...",
                    version: "2",
                    developmentMode: false,
                  },
                ],
              },
            }),
          };
        }
        if (f.name === "Lesson") {
          return {
            ...f,
            source:
              "function callSharedHelper() {\n  return Utils.normalizeBuyer(\"Yoav Cohen\");\n}\n",
          };
        }
        return f;
      }),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
  });
});
