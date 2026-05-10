import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/27-import-family/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  A1: {
    value: "Date",
    formula:
      '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F")',
  },
  A3: {
    value: "Date",
    formula:
      '=QUERY(IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F"), "SELECT Col2, Col5, Col6 WHERE Col2 = \'Yoav Cohen\'", 1)',
  },
  A5: {
    value: "Date",
    formula:
      '=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F"), "Source unavailable - check connection")',
  },
};

describe("Track 1 Lesson 27: IMPORT family", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Import: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags A1 not using IMPORTRANGE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Import: {
          ...correctCells,
          A1: { value: "Date", formula: '=IMPORTDATA("https://example.com/data.csv")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-basic-importrange",
    );
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("IMPORTRANGE");
  });

  it("flags A3 not wrapping IMPORTRANGE in QUERY", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Import: {
          ...correctCells,
          A3: {
            value: "Date",
            formula:
              '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a3 = result.feedback.checks.find(
      (c) => c.ruleId === "a3-query-importrange",
    );
    expect(a3?.passed).toBe(false);
    expect(a3?.detail).toContain("QUERY");
  });

  it("flags A5 not wrapping IMPORTRANGE in IFERROR", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Import: {
          ...correctCells,
          A5: {
            value: "Date",
            formula:
              '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/SOME_ID/edit", "Campaigns!A:F")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a5 = result.feedback.checks.find(
      (c) => c.ruleId === "a5-iferror-importrange",
    );
    expect(a5?.passed).toBe(false);
    expect(a5?.detail).toContain("IFERROR");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({ sheets: { Import: {} } });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-basic-importrange",
    );
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("A1 is empty");
  });
});
