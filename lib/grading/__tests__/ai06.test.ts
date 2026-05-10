import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/ai-in-sheets/06-when-not-to-use/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const correctCells = {
  A1: {
    value:
      "Don't use AI() for audit-sensitive calculations: outputs are not reproducible and leave no audit trail.",
  },
  A2: {
    value:
      "Don't use AI() per row on large datasets: 50K rows means 50K paid calls and quota burn.",
  },
  A3: {
    value:
      "Don't send PII through AI() without checking your Workspace plan's data-handling terms first.",
  },
  A4: {
    value:
      "If a deterministic formula like SUBSTITUTE or REGEXEXTRACT works, use it instead of AI().",
  },
};

describe("Track 5 Lesson 6: when NOT to use AI in Sheets", () => {
  it("passes all rules when the decision framework is complete", async () => {
    const reader = new InMemoryReader({
      sheets: { Decisions: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags an empty A1 with the audit-and-reproducible nudge", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A1: { value: "" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find((c) => c.ruleId === "a1-audit-rule");
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toContain("audit");
  });

  it("flags A1 when audit is mentioned but neither reproducible nor trail", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A1: { value: "Avoid AI for audit-sensitive numbers." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a1 = result.feedback.checks.find((c) => c.ruleId === "a1-audit-rule");
    expect(a1?.passed).toBe(false);
    expect(a1?.detail).toMatch(/reproducible|trail/);
  });

  it("flags A2 when the row word is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A2: { value: "Don't use AI on large datasets; the cost adds up." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a2 = result.feedback.checks.find((c) => c.ruleId === "a2-volume-rule");
    expect(a2?.passed).toBe(false);
    expect(a2?.detail).toContain("row");
  });

  it("flags A2 when neither cost nor quota appears", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A2: { value: "Don't use AI on every row of a giant table." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a2 = result.feedback.checks.find((c) => c.ruleId === "a2-volume-rule");
    expect(a2?.passed).toBe(false);
    expect(a2?.detail).toMatch(/quota|cost/);
  });

  it("flags A3 when PII is not named explicitly", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A3: {
            value:
              "Don't send sensitive customer data through AI() without checking your Workspace plan.",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a3 = result.feedback.checks.find((c) => c.ruleId === "a3-pii-rule");
    expect(a3?.passed).toBe(false);
    expect(a3?.detail).toContain("PII");
  });

  it("flags A3 when none of privacy/Workspace/plan appears", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A3: { value: "Don't put PII into AI prompts; it's risky." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a3 = result.feedback.checks.find((c) => c.ruleId === "a3-pii-rule");
    expect(a3?.passed).toBe(false);
    expect(a3?.detail).toContain("privacy");
  });

  it("flags A4 when neither deterministic nor formula appears", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A4: { value: "Use SUBSTITUTE for simple string work, not AI." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a4 = result.feedback.checks.find(
      (c) => c.ruleId === "a4-deterministic-rule",
    );
    expect(a4?.passed).toBe(false);
    expect(a4?.detail).toContain("deterministic");
  });

  it("flags A4 when no specific candidate formula is named", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A4: { value: "If a deterministic formula works, use it instead of AI." },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a4 = result.feedback.checks.find(
      (c) => c.ruleId === "a4-deterministic-rule",
    );
    expect(a4?.passed).toBe(false);
    expect(a4?.detail).toContain("SUBSTITUTE");
  });

  it("accepts A4 with REGEXEXTRACT named even without SUBSTITUTE", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Decisions: {
          ...correctCells,
          A4: {
            value:
              "Use a deterministic formula like REGEXEXTRACT when the format is predictable.",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const a4 = result.feedback.checks.find(
      (c) => c.ruleId === "a4-deterministic-rule",
    );
    expect(a4?.passed).toBe(true);
  });
});
