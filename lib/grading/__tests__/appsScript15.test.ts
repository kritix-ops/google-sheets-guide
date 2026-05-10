import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/apps-script/15-properties-and-cache/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";
import type { InMemoryFixture } from "../sheetReader";
import type { AppsScriptFile, AppsScriptProject } from "../types";

const CORRECT_LESSON_SOURCE = `function getOrFetchRate() {
  const cache = CacheService.getDocumentCache();
  const cached = cache.get("usdIlsRate");
  if (cached !== null) return Number(cached);

  const props = PropertiesService.getDocumentProperties();
  const stored = props.getProperty("usdIlsRate");
  if (stored !== null) {
    cache.put("usdIlsRate", stored, 3600);
    return Number(stored);
  }

  return 3.7;
}
`;

function correctProject(): AppsScriptProject {
  return {
    scriptId: "script-test",
    title: "Sheets Guide: apps-script-15-properties-and-cache",
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
        functions: ["getOrFetchRate"],
      },
    ],
  };
}

function correctFixture(): InMemoryFixture {
  return {
    sheets: { Campaigns: {} },
    scriptProject: correctProject(),
  };
}

describe("Track 3 Lesson 15: properties and cache", () => {
  it("passes all rules when the three-tier pattern is implemented", async () => {
    const reader = new InMemoryReader(correctFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("passes when the learner uses script-scope cache and properties instead of document-scope", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: `function getOrFetchRate() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("usdIlsRate");
  if (cached !== null) return Number(cached);
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty("usdIlsRate");
  if (stored !== null) {
    cache.put("usdIlsRate", stored, 3600);
    return Number(stored);
  }
  return 3.7;
}
`,
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
  });

  it("flags a missing bound Apps Script project", async () => {
    const fx = correctFixture();
    fx.scriptProject = undefined;
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-cacheservice",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("Apps Script");
  });

  it("flags the stub body left empty (no CacheService at all)", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: "function getOrFetchRate() {\n  return 3.7;\n}\n",
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-cacheservice",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("CacheService");
  });

  it("flags a body that uses CacheService but skips PropertiesService", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: `function getOrFetchRate() {
  const cache = CacheService.getDocumentCache();
  const cached = cache.get("usdIlsRate");
  if (cached !== null) return Number(cached);
  return 3.7;
}
`,
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-propertiesservice",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("PropertiesService");
  });

  it("flags a body that uses both stores but never falls back to 3.7", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: `function getOrFetchRate() {
  const cache = CacheService.getDocumentCache();
  const cached = cache.get("usdIlsRate");
  if (cached !== null) return Number(cached);
  const props = PropertiesService.getDocumentProperties();
  const stored = props.getProperty("usdIlsRate");
  return stored !== null ? Number(stored) : null;
}
`,
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-falls-back-to-default",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("3.7");
  });

  it("flags a body that touches CacheService but never calls cache.get", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: `function getOrFetchRate() {
  const cache = CacheService.getDocumentCache();
  const props = PropertiesService.getDocumentProperties();
  const stored = props.getProperty("usdIlsRate");
  if (stored !== null) return Number(stored);
  return 3.7;
}
`,
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-cacheservice",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("cache");
  });

  it("flags a missing top-level function declaration", async () => {
    const fx = correctFixture();
    fx.scriptProject = {
      ...correctProject(),
      files: correctProject().files.map((f: AppsScriptFile) =>
        f.name === "Lesson"
          ? {
              ...f,
              source: "const getOrFetchRate = () => 3.7;\n",
              functions: [],
            }
          : f,
      ),
    };
    const reader = new InMemoryReader(fx);
    const result = await runRules(assignment.rules, reader);
    const r = result.feedback.checks.find(
      (c) => c.ruleId === "script-uses-cacheservice",
    );
    expect(r?.passed).toBe(false);
    expect(r?.detail).toContain("top-level");
  });
});
