import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/16-sheet-linking/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

// HYPERLINK evaluates to its label, not its URL, so the value field on each
// fixture cell is the label string the learner would see. The grader only
// inspects the formula text, so the value choice is cosmetic.
const correctCells = {
  J1: {
    value: "Source spreadsheet",
    formula:
      '=HYPERLINK("https://docs.google.com/spreadsheets/d/EXAMPLE", "Source spreadsheet")',
  },
  J2: {
    value: "Top of this sheet",
    formula: '=HYPERLINK("#gid=0&range=A1", "Top of this sheet")',
  },
  J3: {
    value: "Review winning row",
    formula:
      '=IF(G2>F2, HYPERLINK("https://example.com/details/"&A2, "Review winning row"), "")',
  },
};

describe("Track 2 Lesson 16: Sheet linking with HYPERLINK", () => {
  it("passes when all three link formulas are correct", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags J1 missing the HYPERLINK function", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Wrong: a bare URL string is not a clickable cell: the URL just
          // sits there as text.
          J1: {
            value: "https://docs.google.com/spreadsheets/d/EXAMPLE",
            formula: '="https://docs.google.com/spreadsheets/d/EXAMPLE"',
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j1-external-hyperlink",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("HYPERLINK");
  });

  it("flags J2 using an external URL instead of the #gid= internal anchor", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Wrong: this is a valid HYPERLINK but it leaves the workbook.
          // Internal navigation needs the `#gid=` form.
          J2: {
            value: "Top of this sheet",
            formula:
              '=HYPERLINK("https://example.com/top", "Top of this sheet")',
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j2-internal-gid-anchor",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("#gid=");
  });

  it("flags J3 with an unconditional HYPERLINK (no IF wrapper)", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Wrong: every row gets the link, including losing rows. The point
          // of the column is to flag winners only.
          J3: {
            value: "Review winning row",
            formula:
              '=HYPERLINK("https://example.com/details/"&A2, "Review winning row")',
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j3-conditional-hyperlink",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toMatch(/IF/);
  });

  it("flags an empty J1 with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: {} },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j1-external-hyperlink",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("J1 is empty");
  });
});
