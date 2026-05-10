import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/17-comments-and-notes/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Campaigns",
  sheets: {
    Campaigns: {
      A1: {
        value: "Date",
        note: "Dates in UTC; convert to GMT+3 for the team office hours view.",
      },
      E1: {
        value: "Spend",
        note: "Pulled via IMPORTRANGE from Taboola export, refreshes hourly.",
      },
      G1: {
        value: "Revenue",
        note: "Net revenue after platform fees.",
      },
    },
  },
};

describe("Track 2 Lesson 17: comments and notes", () => {
  it("passes when all three notes are added correctly", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags E1 with no note at all", async () => {
    const fixture = freshFixture();
    delete fixture.sheets.Campaigns.E1.note;
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-e1-spend-source-note",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("no note");
  });

  it("flags E1 with a note that doesn't mention IMPORTRANGE", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.E1.note = "Spend in USD, refreshes hourly.";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-e1-spend-source-note",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("IMPORTRANGE");
  });

  it("flags G1 with a note that doesn't mention net", async () => {
    const fixture = freshFixture();
    fixture.sheets.Campaigns.G1.note =
      "Revenue from Taboola Backstage, refreshes hourly.";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-g1-revenue-definition-note",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("net");
  });

  it("accepts case-insensitive matches on the required substrings", async () => {
    const fixture = freshFixture();
    // Lowercase importrange and uppercase NET both pass; UTC stays as-is.
    fixture.sheets.Campaigns.E1.note =
      "pulled via importrange from taboola export, refreshes hourly.";
    fixture.sheets.Campaigns.G1.note = "NET revenue after platform fees.";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });
});
