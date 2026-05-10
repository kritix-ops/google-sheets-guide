import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/07-protected-ranges/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Campaigns",
  sheets: {
    Campaigns: {},
  },
  sheetMeta: {
    Campaigns: {
      protectedRanges: [
        {
          range: "A1:G61",
          description: "Raw campaign log, do not hand-edit",
          warningOnly: false,
          editorEmails: ["info@flexelent.com"],
        },
        {
          range: "A1:G1",
          description: "Header row, schema is downstream",
          warningOnly: true,
          editorEmails: [],
        },
      ],
    },
  },
};

describe("Track 2 Lesson 7: protected ranges", () => {
  it("passes when both protections are correctly configured", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags the missing strict protection on the raw log", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns!.protectedRanges =
      fixture.sheetMeta!.Campaigns!.protectedRanges!.filter(
        (p) => p.range !== "A1:G61",
      );
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-raw-strict",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("No protected range");
  });

  it("flags the raw-log protection set to warning instead of strict", async () => {
    const fixture = freshFixture();
    const raw = fixture.sheetMeta!.Campaigns!.protectedRanges!.find(
      (p) => p.range === "A1:G61",
    )!;
    raw.warningOnly = true;
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-raw-strict",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("warning");
  });

  it("flags the missing warning-only protection on the header row", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns!.protectedRanges =
      fixture.sheetMeta!.Campaigns!.protectedRanges!.filter(
        (p) => p.range !== "A1:G1",
      );
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-header-warning",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("No protected range");
  });

  it("flags the header protection set to strict instead of warning", async () => {
    const fixture = freshFixture();
    const header = fixture.sheetMeta!.Campaigns!.protectedRanges!.find(
      (p) => p.range === "A1:G1",
    )!;
    header.warningOnly = false;
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-header-warning",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("strict");
  });

  it("flags descriptions that don't contain 'Raw' or 'header'", async () => {
    const fixture = freshFixture();
    const raw = fixture.sheetMeta!.Campaigns!.protectedRanges!.find(
      (p) => p.range === "A1:G61",
    )!;
    const header = fixture.sheetMeta!.Campaigns!.protectedRanges!.find(
      (p) => p.range === "A1:G1",
    )!;
    raw.description = "Don't edit";
    header.description = "Locked";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const rawCheck = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-raw-strict",
    );
    const headerCheck = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-header-warning",
    );
    expect(rawCheck?.passed).toBe(false);
    expect(rawCheck?.detail).toContain("Raw");
    expect(headerCheck?.passed).toBe(false);
    expect(headerCheck?.detail).toContain("header");
  });

  it("accepts case-insensitive description matches", async () => {
    const fixture = freshFixture();
    const raw = fixture.sheetMeta!.Campaigns!.protectedRanges!.find(
      (p) => p.range === "A1:G61",
    )!;
    const header = fixture.sheetMeta!.Campaigns!.protectedRanges!.find(
      (p) => p.range === "A1:G1",
    )!;
    raw.description = "RAW IMPORTRANGE PULL";
    header.description = "HEADER ROW";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
  });

  it("accepts ranges qualified with the Campaigns! prefix", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns!.protectedRanges = [
      {
        range: "Campaigns!A1:G61",
        description: "Raw log",
        warningOnly: false,
        editorEmails: [],
      },
      {
        range: "Campaigns!A1:G1",
        description: "Header row",
        warningOnly: true,
        editorEmails: [],
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
  });
});
