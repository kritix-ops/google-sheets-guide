import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/08-diagnosing-broken-importrange/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  A1: {
    value: "(imported data)",
    formula:
      '=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "source unavailable")',
  },
  B1: {
    value: "(imported data)",
    formula:
      '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")',
  },
  C1: {
    value: "(imported data)",
    formula:
      '=IF(ISERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")), "fetch failed", IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"))',
  },
};

describe("Track 4 Lesson 8: diagnosing broken IMPORTRANGE", () => {
  it("passes all rules when all three formulas are repaired correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Dashboard: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags A1 when the broken MISSING_SHEET_ID is still in the URL", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          A1: {
            value: "(error)",
            formula:
              '=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/MISSING_SHEET_ID/edit", "Campaigns!A1:G61"), "source unavailable")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-error-handled",
    );
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("MISSING_SHEET_ID");
  });

  it("flags A1 when IFERROR is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          A1: {
            value: "(imported)",
            formula:
              '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-error-handled",
    );
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("IFERROR");
  });

  it("flags B1 when the typo `Campaign!` is still in the range string", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          B1: {
            value: "#REF!",
            formula:
              '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaign!A1:G61")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find(
      (c) => c.ruleId === "b1-sheet-name-corrected",
    );
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("Campaigns!");
  });

  it("accepts B1 with the corrected sheet name (no error wrapper required)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          B1: {
            value: "(imported)",
            formula:
              '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find(
      (c) => c.ruleId === "b1-sheet-name-corrected",
    );
    expect(b1?.passed).toBe(true);
  });

  it("flags C1 when ISERROR / IFERROR is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          C1: {
            value: "(imported)",
            formula:
              '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c1 = result.feedback.checks.find(
      (c) => c.ruleId === "c1-defensive-pattern",
    );
    expect(c1?.passed).toBe(false);
    expect(c1?.detail).toContain("ISERROR");
  });

  it("accepts the short IFERROR-only defensive form for C1", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          C1: {
            value: "(imported)",
            formula:
              '=IFERROR(IMPORTRANGE("https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit", "Campaigns!A1:G61"), "fetch failed")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c1 = result.feedback.checks.find(
      (c) => c.ruleId === "c1-defensive-pattern",
    );
    expect(c1?.passed).toBe(true);
  });

  it("flags an empty Dashboard with the type-this-formula nudge on every cell", async () => {
    const reader = new InMemoryReader({ sheets: { Dashboard: {} } });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(false);
    for (const check of result.feedback.checks) {
      expect(check.passed).toBe(false);
      expect(check.detail).toBeTruthy();
    }
  });
});
