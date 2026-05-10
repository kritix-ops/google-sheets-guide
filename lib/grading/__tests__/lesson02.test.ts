import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/02-coming-from-excel/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  A1: { value: "Date" },
  B1: { value: "Buyer" },
  C1: { value: "Vertical" },
  D1: { value: "Platform" },
  E1: { value: "Spend" },
  F1: { value: "Revenue" },
  // Row 2: Yoav Cohen, Car Deals PR, Google
  B2: { value: "Yoav Cohen" },
  C2: { value: "Car Deals PR" },
  E2: { value: 342.18 },
  F2: { value: 487.3 },
  // Row 3: Dina Dayan, Bathroom Remodeling PR, Taboola
  B3: { value: "Dina Dayan" },
  C3: { value: "Bathroom Remodeling PR" },
  E3: { value: 215.5 },
  F3: { value: 198.4 },
  // Row 4: Maya Bar, Cruises PR, Outbrain
  B4: { value: "Maya Bar" },
  C4: { value: "Cruises PR" },
  E4: { value: 512.0 },
  F4: { value: 1124.6 },
  // Row 5: Eitan Kohen, Hearing Aids PR, Taboola
  B5: { value: "Eitan Kohen" },
  C5: { value: "Hearing Aids PR" },
  E5: { value: 187.25 },
  F5: { value: 245.8 },
  // Row 6: Roni Levi, Online MBA PR, Facebook
  B6: { value: "Roni Levi" },
  C6: { value: "Online MBA PR" },
  E6: { value: 432.7 },
  F6: { value: 380.2 },
  // Row 7: Ben Nahum, Dental Implants PR, Google
  B7: { value: "Ben Nahum" },
  C7: { value: "Dental Implants PR" },
  E7: { value: 605.1 },
  F7: { value: 588.4 },
  // Row 8: Yoav Cohen, Solar Systems & Panels PR, Outbrain
  B8: { value: "Yoav Cohen" },
  C8: { value: "Solar Systems & Panels PR" },
  E8: { value: 318.45 },
  F8: { value: 401.9 },
  // Row 9: Dina Dayan, Senior Living PR, Google
  B9: { value: "Dina Dayan" },
  C9: { value: "Senior Living PR" },
  E9: { value: 296.4 },
  F9: { value: 412.15 },
  // Row 10: Maya Bar, Pet Insurance PR, MediaGo
  B10: { value: "Maya Bar" },
  C10: { value: "Pet Insurance PR" },
  E10: { value: 224.6 },
  F10: { value: 461.2 },
  // Row 11: Gal Vered, Cleaning Services PR, TikTok
  B11: { value: "Gal Vered" },
  C11: { value: "Cleaning Services PR" },
  E11: { value: 178.9 },
  F11: { value: 322.05 },
  // Row 12: Shira Hadad, Roofing Services PR, Poppin
  B12: { value: "Shira Hadad" },
  C12: { value: "Roofing Services PR" },
  E12: { value: 142.3 },
  F12: { value: 89.5 },
  // Row 13: Ben Nahum, Reverse Mortgage PR, Google
  B13: { value: "Ben Nahum" },
  C13: { value: "Reverse Mortgage PR" },
  E13: { value: 478.3 },
  F13: { value: 982.7 },
};

// ARRAYFORMULA(F2:F13-E2:E13) spills profit rows 1..12 starting at G1.
const correctG: Record<string, { value: number }> = {
  G1: { value: 487.3 - 342.18 },
  G2: { value: 198.4 - 215.5 },
  G3: { value: 1124.6 - 512.0 },
  G4: { value: 245.8 - 187.25 },
  G5: { value: 380.2 - 432.7 },
  G6: { value: 588.4 - 605.1 },
  G7: { value: 401.9 - 318.45 },
  G8: { value: 412.15 - 296.4 },
  G9: { value: 461.2 - 224.6 },
  G10: { value: 322.05 - 178.9 },
  G11: { value: 89.5 - 142.3 },
  G12: { value: 982.7 - 478.3 },
};

// QUERY result: revenue >= 400 sorted by revenue descending.
const correctI: Record<string, { value: string | number }> = {
  I1: { value: "Maya Bar" },
  J1: { value: "Cruises PR" },
  K1: { value: 1124.6 },
  I2: { value: "Ben Nahum" },
  J2: { value: "Reverse Mortgage PR" },
  K2: { value: 982.7 },
  I3: { value: "Ben Nahum" },
  J3: { value: "Dental Implants PR" },
  K3: { value: 588.4 },
  I4: { value: "Yoav Cohen" },
  J4: { value: "Car Deals PR" },
  K4: { value: 487.3 },
  I5: { value: "Maya Bar" },
  J5: { value: "Pet Insurance PR" },
  K5: { value: 461.2 },
  I6: { value: "Dina Dayan" },
  J6: { value: "Senior Living PR" },
  K6: { value: 412.15 },
  I7: { value: "Yoav Cohen" },
  J7: { value: "Solar Systems & Panels PR" },
  K7: { value: 401.9 },
};

describe("Track 1 Lesson 2: coming from Excel", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctG,
          G1: { ...correctG.G1, formula: "=ARRAYFORMULA(F2:F13-E2:E13)" },
          ...correctI,
          I1: { ...correctI.I1, formula: '=QUERY(A2:F13,"SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")' },
          H1: { value: 487.3, formula: '=XLOOKUP("Yoav Cohen",B2:B13,F2:F13)' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags a missing ARRAYFORMULA wrapper", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          G1: { value: 145.12, formula: "=F2-E2" },
          ...correctI,
          I1: { ...correctI.I1, formula: '=QUERY(A2:F13,"SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")' },
          H1: { value: 487.3, formula: '=XLOOKUP("Yoav Cohen",B2:B13,F2:F13)' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find(
      (c) => c.ruleId === "g1-arrayformula-profit",
    );
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("ARRAYFORMULA");
  });

  it("flags an XLOOKUP that returns the wrong value", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctG,
          G1: { ...correctG.G1, formula: "=ARRAYFORMULA(F2:F13-E2:E13)" },
          ...correctI,
          I1: { ...correctI.I1, formula: '=QUERY(A2:F13,"SELECT B, C, F WHERE F >= 400 ORDER BY F DESC")' },
          H1: { value: 401.9, formula: '=XLOOKUP("Yoav Cohen",B2:B13,F2:F13,,,2)' },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find(
      (c) => c.ruleId === "h1-xlookup-yoav",
    );
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("487.3");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const g1 = result.feedback.checks.find(
      (c) => c.ruleId === "g1-arrayformula-profit",
    );
    expect(g1?.passed).toBe(false);
    expect(g1?.detail).toContain("G1 is empty");
  });
});
