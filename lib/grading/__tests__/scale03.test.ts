import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/03-importrange-patterns/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const SOURCE_URL =
  "https://docs.google.com/spreadsheets/d/EXAMPLE_SOURCE_ID/edit";

const correctCells = {
  A1: {
    formula: `=IMPORTRANGE("${SOURCE_URL}", "Campaigns!A1:G61")`,
  },
  B1: {
    formula: `=IFERROR(IMPORTRANGE("${SOURCE_URL}", "Campaigns!A1:G61"), "data unavailable")`,
  },
  C1: { value: "Always bound IMPORTRANGE to known row counts" },
};

describe("Track 4 Lesson 3: IMPORTRANGE patterns", () => {
  it("passes when all three cells follow the canonical shape", async () => {
    const reader = new InMemoryReader({
      sheets: { Dashboard: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags an empty A1", async () => {
    const reader = new InMemoryReader({ sheets: { Dashboard: {} } });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-uses-importrange",
    );
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("A1 is empty");
  });

  it("flags a full-column range in A1", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          A1: { formula: `=IMPORTRANGE("${SOURCE_URL}", "Campaigns!A:G")` },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-uses-importrange",
    );
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("bounded");
  });

  it("flags a non-Sheets URL in A1", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          A1: {
            formula: '=IMPORTRANGE("https://example.com/sheet", "Campaigns!A1:G61")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find(
      (c) => c.ruleId === "a1-uses-importrange",
    );
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("docs.google.com");
  });

  it("flags B1 missing the IFERROR wrapper", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          B1: {
            formula: `=IMPORTRANGE("${SOURCE_URL}", "Campaigns!A1:G61")`,
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find(
      (c) => c.ruleId === "b1-wraps-with-iferror",
    );
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("IFERROR");
  });

  it("flags B1 wrapping with IFERROR but the inner call isn't IMPORTRANGE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          B1: { formula: '=IFERROR(VLOOKUP(A1, A:Z, 2, FALSE), "n/a")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const b1 = result.feedback.checks.find(
      (c) => c.ruleId === "b1-wraps-with-iferror",
    );
    expect(b1?.passed).toBe(false);
    expect(b1?.detail).toContain("IMPORTRANGE");
  });

  it("flags an empty C1 with the convention nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          C1: {},
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c1 = result.feedback.checks.find(
      (c) => c.ruleId === "c1-bounded-range-note",
    );
    expect(c1?.passed).toBe(false);
    expect(c1?.detail).toContain("C1 is empty");
  });

  it("flags C1 with a note that doesn't mention bound or range", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Dashboard: {
          ...correctCells,
          C1: { value: "remember to refresh" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const c1 = result.feedback.checks.find(
      (c) => c.ruleId === "c1-bounded-range-note",
    );
    expect(c1?.passed).toBe(false);
    expect(c1?.detail).toContain("bounding");
  });
});
