import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/scale/06-diagnosing-ref-na/assignment";
import { CAMPAIGNS_LARGE } from "@/content/datasets/adtech";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const ROWS = CAMPAIGNS_LARGE.slice(1);
const TOTAL_SPEND = ROWS.reduce(
  (s, r) => s + (typeof r[5] === "number" ? r[5] : 0),
  0,
);
const YOAV_FIRST_SPEND = ROWS.find((r) => r[1] === "Yoav Cohen")![5] as number;

const correctCells = {
  J1: { value: TOTAL_SPEND, formula: "=SUM(F2:F61)" },
  J2: {
    value: "not found",
    formula: '=IFNA(VLOOKUP("MissingBuyer", B:C, 2, FALSE), "not found")',
  },
  J3: {
    value: YOAV_FIRST_SPEND,
    formula: '=XLOOKUP("Yoav Cohen", B2:B61, F2:F61, "buyer not in log")',
  },
};

describe("Track 4 Lesson 6: diagnosing #REF! and #N/A", () => {
  it("passes all rules when all three fixes are applied correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags the broken #REF! formula still in J1", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Learner hasn't touched J1; the broken formula is still there.
          J1: { value: "#REF!", formula: "=SUM(#REF!:F61)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-fixed-ref-error",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain("#REF!");
  });

  it("flags J1 with a SUM over the wrong range", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Wrong range, only sums the first three spends.
          J1: { value: 1310.3, formula: "=SUM(F2:F4)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j1 = result.feedback.checks.find(
      (c) => c.ruleId === "j1-fixed-ref-error",
    );
    expect(j1?.passed).toBe(false);
    expect(j1?.detail).toContain(TOTAL_SPEND.toFixed(2));
  });

  it("flags J2 still surfacing #N/A because IFNA is missing", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // Bare VLOOKUP, no wrapper.
          J2: {
            value: "#N/A",
            formula: '=VLOOKUP("MissingBuyer", B:C, 2, FALSE)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-wraps-with-ifna",
    );
    expect(j2?.passed).toBe(false);
    expect(j2?.detail).toContain("IFNA");
  });

  it("accepts IFERROR as an alternative wrapper for J2", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J2: {
            value: "missing",
            formula: '=IFERROR(VLOOKUP("MissingBuyer", B:C, 2, FALSE), "missing")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j2 = result.feedback.checks.find(
      (c) => c.ruleId === "j2-wraps-with-ifna",
    );
    expect(j2?.passed).toBe(true);
  });

  it("flags J3 when the learner uses VLOOKUP instead of XLOOKUP", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // VLOOKUP can wrap with IFNA but it doesn't have the inline 4th
          // argument fallback the lesson is teaching.
          J3: {
            value: YOAV_FIRST_SPEND,
            formula:
              '=IFNA(VLOOKUP("Yoav Cohen", B:F, 5, FALSE), "buyer not in log")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-defensive-xlookup",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("XLOOKUP");
  });

  it("flags J3 with XLOOKUP but no inline fallback", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          // No quoted fallback string, no fourth argument.
          J3: {
            value: YOAV_FIRST_SPEND,
            formula: '=XLOOKUP(B2, B2:B61, F2:F61)',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-defensive-xlookup",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain("fourth");
  });

  it("flags J3 evaluating to the wrong spend", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          ...correctCells,
          J3: {
            value: 99.9,
            formula:
              '=XLOOKUP("Yoav Cohen", B2:B61, F2:F61, "buyer not in log")',
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const j3 = result.feedback.checks.find(
      (c) => c.ruleId === "j3-defensive-xlookup",
    );
    expect(j3?.passed).toBe(false);
    expect(j3?.detail).toContain(String(YOAV_FIRST_SPEND));
  });
});
