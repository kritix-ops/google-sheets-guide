import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/10-arrayformula-basics/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

// Row order matches CAMPAIGNS: rows 2-13 are
//   Yoav/Google, Dina/Taboola, Maya/Outbrain, Eitan/Taboola, Roni/Facebook,
//   Ben/Google, Yoav/Outbrain, Dina/Google, Maya/MediaGo, Gal/TikTok,
//   Shira/Poppin, Ben/Google.
const profitValues = [
  487.3 - 342.18,
  198.4 - 215.5,
  1124.6 - 512.0,
  245.8 - 187.25,
  380.2 - 432.7,
  588.4 - 605.1,
  401.9 - 318.45,
  412.15 - 296.4,
  461.2 - 224.6,
  322.05 - 178.9,
  89.5 - 142.3,
  982.7 - 478.3,
];

const baseFixtureCells = {
  E2: { value: 342.18 },
  F2: { value: 487.3 },
  E3: { value: 215.5 },
  F3: { value: 198.4 },
  E4: { value: 512.0 },
  F4: { value: 1124.6 },
  E5: { value: 187.25 },
  F5: { value: 245.8 },
  E6: { value: 432.7 },
  F6: { value: 380.2 },
  E7: { value: 605.1 },
  F7: { value: 588.4 },
  E8: { value: 318.45 },
  F8: { value: 401.9 },
  E9: { value: 296.4 },
  F9: { value: 412.15 },
  E10: { value: 224.6 },
  F10: { value: 461.2 },
  E11: { value: 178.9 },
  F11: { value: 322.05 },
  E12: { value: 142.3 },
  F12: { value: 89.5 },
  E13: { value: 478.3 },
  F13: { value: 982.7 },
};

function buildSpilledCells(prefix: string, values: (number | string)[]) {
  return Object.fromEntries(
    values.map((v, i) => [`${prefix}${i + 1}`, { value: v }]),
  );
}

const correctG = buildSpilledCells("G", profitValues);
const correctI = buildSpilledCells("I", profitValues);
const correctK = buildSpilledCells(
  "K",
  profitValues.map((v) => (v > 0 ? "Profit" : "Loss")),
);

const correctCells = {
  ...correctG,
  G1: { ...correctG.G1, formula: "=ARRAYFORMULA(F2:F13-E2:E13)" },
  ...correctI,
  I1: { ...correctI.I1, formula: '=ARRAYFORMULA(IF(E2:E="","",F2:F-E2:E))' },
  ...correctK,
  K1: { ...correctK.K1, formula: '=ARRAYFORMULA(IF(F2:F13-E2:E13>0,"Profit","Loss"))' },
};

describe("Track 1 Lesson 10: ARRAYFORMULA basics", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags missing ARRAYFORMULA wrapper", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          G1: { value: profitValues[0]!, formula: "=F2-E2" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find(
      (c) => c.ruleId === "g1-fixed-profit",
    );
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("ARRAYFORMULA");
  });

  it("flags open-ended formula missing the IF guard", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          I1: { ...correctI.I1, formula: "=ARRAYFORMULA(F2:F-E2:E)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const i1 = result.feedback.checks.find(
      (c) => c.ruleId === "i1-open-ended-profit",
    );
    expect(i1?.passed).toBe(false);
    expect(i1?.detail).toContain("IF");
  });

  it("flags status column without ARRAYFORMULA", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          K1: { value: "Profit", formula: '=IF(F2-E2>0,"Profit","Loss")' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const k1 = result.feedback.checks.find(
      (c) => c.ruleId === "k1-status-column",
    );
    expect(k1?.passed).toBe(false);
    expect(k1?.detail).toContain("ARRAYFORMULA");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find(
      (c) => c.ruleId === "g1-fixed-profit",
    );
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("G1 is empty");
  });
});
