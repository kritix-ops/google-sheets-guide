import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/12-sharing-permissions/assignment";
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
  filePermissions: [
    {
      id: "owner-perm",
      type: "user",
      role: "owner",
      email: "info@flexelent.com",
      domain: null,
      expirationTime: null,
      displayName: "Yoav Cohen",
    },
    {
      id: "auditor-perm",
      type: "user",
      role: "commenter",
      email: "auditor@external.com",
      domain: null,
      expirationTime: "2026-12-31T23:59:59Z",
      displayName: null,
    },
    {
      id: "team-leads-perm",
      type: "user",
      role: "writer",
      email: "team-leads@flexelent.com",
      domain: null,
      expirationTime: null,
      displayName: "Team Leads",
    },
  ],
};

describe("Track 2 Lesson 12 - sharing and permissions", () => {
  it("passes when both shares are correctly configured", async () => {
    const reader = new InMemoryReader(freshFixture());
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags the auditor share when it is missing entirely", async () => {
    const fixture = freshFixture();
    fixture.filePermissions = fixture.filePermissions!.filter(
      (p) => p.email !== "auditor@external.com",
    );
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "permissions-auditor-commenter-expiring",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("No user permission");
    expect(c?.detail).toContain("auditor@external.com");
  });

  it("flags the auditor share when role is writer instead of commenter", async () => {
    const fixture = freshFixture();
    const auditor = fixture.filePermissions!.find(
      (p) => p.email === "auditor@external.com",
    )!;
    auditor.role = "writer";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "permissions-auditor-commenter-expiring",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("writer");
    expect(c?.detail).toContain("commenter");
  });

  it("flags the auditor share when it has no expirationTime", async () => {
    const fixture = freshFixture();
    const auditor = fixture.filePermissions!.find(
      (p) => p.email === "auditor@external.com",
    )!;
    auditor.expirationTime = null;
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "permissions-auditor-commenter-expiring",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("expiration");
  });

  it("flags the team-leads share when it is missing", async () => {
    const fixture = freshFixture();
    fixture.filePermissions = fixture.filePermissions!.filter(
      (p) => p.email !== "team-leads@flexelent.com",
    );
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "permissions-team-leads-writer",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("team-leads@flexelent.com");
  });

  it("matches the auditor email case-insensitively", async () => {
    const fixture = freshFixture();
    const auditor = fixture.filePermissions!.find(
      (p) => p.email === "auditor@external.com",
    )!;
    auditor.email = "AUDITOR@EXTERNAL.COM";
    const reader = new InMemoryReader(fixture);
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });
});
