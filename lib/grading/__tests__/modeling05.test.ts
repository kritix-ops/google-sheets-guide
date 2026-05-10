import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/05-smart-chips/assignment";
import { runRules } from "../runRules";
import { InMemoryReader, type InMemoryFixture } from "../sheetReader";

function freshFixture(): InMemoryFixture {
  return JSON.parse(JSON.stringify(BASE_FIXTURE)) as InMemoryFixture;
}

const BASE_FIXTURE: InMemoryFixture = {
  defaultSheet: "Owners",
  sheets: {
    Campaigns: {},
    Owners: {
      A2: {
        value: "@",
        chips: [
          {
            startIndex: 0,
            kind: "person",
            email: "yoav.cohen@flexelent.com",
            uri: null,
            mimeType: null,
          },
        ],
      },
      A3: {
        value: "@",
        chips: [
          {
            startIndex: 0,
            kind: "person",
            email: "dina.dayan@flexelent.com",
            uri: null,
            mimeType: null,
          },
        ],
      },
      B2: {
        value: "@",
        chips: [
          {
            startIndex: 0,
            kind: "rich-link",
            email: null,
            uri: "https://docs.google.com/spreadsheets/d/1abcDEF",
            mimeType: "application/vnd.google-apps.spreadsheet",
          },
        ],
      },
    },
  },
};

describe("Track 2 Lesson 5: smart chips", () => {
  it("passes when all three chips are inserted correctly", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags A2 with no chips at all", async () => {
    const fixture = freshFixture();
    fixture.sheets.Owners.A2 = { value: "Yoav Cohen" };
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "owners-a2-yoav-person",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("no smart chip");
  });

  it("flags A2 with a rich-link chip instead of a person chip", async () => {
    const fixture = freshFixture();
    fixture.sheets.Owners.A2!.chips = [
      {
        startIndex: 0,
        kind: "rich-link",
        email: null,
        uri: "https://docs.google.com/spreadsheets/d/oops",
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "owners-a2-yoav-person",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("not a person chip");
  });

  it("flags A2 with a person chip but the wrong email", async () => {
    const fixture = freshFixture();
    fixture.sheets.Owners.A2!.chips = [
      {
        startIndex: 0,
        kind: "person",
        email: "someone.else@flexelent.com",
        uri: null,
        mimeType: null,
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "owners-a2-yoav-person",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("yoav.cohen@flexelent.com");
  });

  it("flags B2 with a person chip instead of a file chip", async () => {
    const fixture = freshFixture();
    fixture.sheets.Owners.B2!.chips = [
      {
        startIndex: 0,
        kind: "person",
        email: "yoav.cohen@flexelent.com",
        uri: null,
        mimeType: null,
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "owners-b2-file-chip",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("person chip");
  });

  it("flags B2 with a rich-link chip whose mimeType is not in the Drive family", async () => {
    const fixture = freshFixture();
    fixture.sheets.Owners.B2!.chips = [
      {
        startIndex: 0,
        kind: "rich-link",
        email: null,
        uri: "https://example.com/article",
        mimeType: "text/html",
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "owners-b2-file-chip",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("text/html");
  });

  it("matches person-chip emails case-insensitively", async () => {
    const fixture = freshFixture();
    fixture.sheets.Owners.A2!.chips = [
      {
        startIndex: 0,
        kind: "person",
        email: "YOAV.COHEN@flexelent.com",
        uri: null,
        mimeType: null,
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "owners-a2-yoav-person",
    );
    expect(c?.passed).toBe(true);
  });

  it("accepts any vnd.google-apps.* mimeType for the file chip (e.g. document, folder)", async () => {
    const fixture = freshFixture();
    fixture.sheets.Owners.B2!.chips = [
      {
        startIndex: 0,
        kind: "rich-link",
        email: null,
        uri: "https://docs.google.com/document/d/abcdoc",
        mimeType: "application/vnd.google-apps.document",
      },
    ];
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "owners-b2-file-chip",
    );
    expect(c?.passed).toBe(true);
  });
});
