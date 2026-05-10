import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/08-filter-views/assignment";
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
      filterViewTitles: ["Yoav only", "Profitable only"],
    },
  },
};

describe("Track 2 Lesson 8: filter views", () => {
  it("passes when both filter view titles are present with exact casing", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it('flags "Yoav only" missing while "Profitable only" exists', async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.filterViewTitles = ["Profitable only"];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const yoav = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-yoav-only",
    );
    const profitable = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-profitable-only",
    );
    expect(yoav?.passed).toBe(false);
    expect(yoav?.detail).toContain("Yoav only");
    expect(profitable?.passed).toBe(true);
  });

  it('flags "Profitable only" missing while "Yoav only" exists', async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.filterViewTitles = ["Yoav only"];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const yoav = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-yoav-only",
    );
    const profitable = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-profitable-only",
    );
    expect(yoav?.passed).toBe(true);
    expect(profitable?.passed).toBe(false);
    expect(profitable?.detail).toContain("Profitable only");
  });

  it("flags both views missing when no filter views exist on Campaigns", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.filterViewTitles = [];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const yoav = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-yoav-only",
    );
    const profitable = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-profitable-only",
    );
    expect(yoav?.passed).toBe(false);
    expect(yoav?.detail).toContain("No filter views");
    expect(profitable?.passed).toBe(false);
    expect(profitable?.detail).toContain("No filter views");
  });

  it("flags lowercase casing as wrong (team convention is Title Case)", async () => {
    const fixture = freshFixture();
    fixture.sheetMeta!.Campaigns.filterViewTitles = [
      "yoav only",
      "profitable only",
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const yoav = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-yoav-only",
    );
    const profitable = result.feedback.checks.find(
      (r) => r.ruleId === "campaigns-filter-view-profitable-only",
    );
    expect(yoav?.passed).toBe(false);
    expect(yoav?.detail).toContain("Title Case");
    expect(profitable?.passed).toBe(false);
    expect(profitable?.detail).toContain("Title Case");
  });
});
