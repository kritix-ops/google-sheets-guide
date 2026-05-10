import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/modeling/13-forms-sheets-pipeline/assignment";
import { FORM_RESPONSES } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = FORM_RESPONSES.slice(1);
const TOTAL = ROWS.length;
const UNIQUE_EMAILS = new Set(
  ROWS.map((r) => String(r[1] ?? "").trim().toLowerCase()),
).size;
const NEWSLETTER_YES = ROWS.filter((r) => r[6] === "Yes").length;
const NATIVE_EMEA = ROWS.filter((r) => r[3] === "Native EMEA").length;

const correctCells = {
  J1: { value: TOTAL, formula: "=COUNTA(A2:A21)" },
  J2: {
    value: UNIQUE_EMAILS,
    formula: "=COUNTA(UNIQUE(LOWER(TRIM(B2:B21))))",
  },
  J3: { value: NEWSLETTER_YES, formula: '=COUNTIF(G2:G21,"Yes")' },
  J4: { value: NATIVE_EMEA, formula: '=COUNTIF(D2:D21,"Native EMEA")' },
};

describe("Track 2 Lesson 13: Forms → Sheets pipeline", () => {
  it("passes when all four cleanup formulas are correct", async () => {
    const reader = new InMemoryReader({
      sheets: { "Form Responses 1": { ...correctCells } },
    });
    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags J2 missing LOWER on the email column", async () => {
    const reader = new InMemoryReader({
      sheets: {
        "Form Responses 1": {
          ...correctCells,
          // Wrong: dedupes case-sensitively, so DINA.DAYAN and dina.dayan
          // count as two people. UNIQUE_EMAILS + 1 would be the result on
          // the real dataset; we just need value=null since cellValue
          // isn't computed by the in-memory reader (the value field is the
          // declared value).
          J2: {
            value: UNIQUE_EMAILS,
            formula: "=COUNTA(UNIQUE(B2:B21))",
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j2-unique-people",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toMatch(/LOWER|PROPER/);
  });

  it("flags J2 missing TRIM", async () => {
    const reader = new InMemoryReader({
      sheets: {
        "Form Responses 1": {
          ...correctCells,
          J2: {
            value: UNIQUE_EMAILS,
            formula: "=COUNTA(UNIQUE(LOWER(B2:B21)))",
          },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j2-unique-people",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("TRIM");
  });

  it("flags J3 with wrong COUNTIF result", async () => {
    const reader = new InMemoryReader({
      sheets: {
        "Form Responses 1": {
          ...correctCells,
          J3: { value: NEWSLETTER_YES - 5, formula: '=COUNTIF(G2:G21,"yes")' },
        },
      },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find(
      (r) => r.ruleId === "j3-newsletter-yes",
    );
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain(String(NEWSLETTER_YES));
  });

  it("flags an empty input", async () => {
    const reader = new InMemoryReader({
      sheets: { "Form Responses 1": {} },
    });
    const result = await runRules(assignment.rules, reader);
    const c = result.feedback.checks.find((r) => r.ruleId === "j1-total-responses");
    expect(c?.passed).toBe(false);
    expect(c?.detail).toContain("J1 is empty");
  });
});
