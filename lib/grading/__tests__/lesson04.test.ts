import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/04-lookups/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  C2: { value: "Car Deals PR" },
  I2: { value: "Car Deals PR" },
  J2: { value: "Autos & Vehicles" },
  K2: { value: 0.38 },
  I3: { value: "Bathroom Remodeling PR" },
  J3: { value: "Home & Garden" },
  K3: { value: 0.51 },
  I4: { value: "Cruises PR" },
  J4: { value: "Travel & Transportation" },
  K4: { value: 0.62 },
  I5: { value: "Hearing Aids PR" },
  J5: { value: "Health" },
  K5: { value: 1.18 },
  I6: { value: "Online MBA PR" },
  J6: { value: "Jobs & Education" },
  K6: { value: 2.15 },
  I7: { value: "Dental Implants PR" },
  J7: { value: "Health" },
  K7: { value: 1.95 },
  I8: { value: "Solar Systems & Panels PR" },
  J8: { value: "Business & Industrial" },
  K8: { value: 1.05 },
  I9: { value: "Senior Living PR" },
  J9: { value: "People & Society" },
  K9: { value: 1.42 },
  I10: { value: "Pet Insurance PR" },
  J10: { value: "Finance" },
  K10: { value: 0.94 },
  I11: { value: "Cleaning Services PR" },
  J11: { value: "Home & Garden" },
  K11: { value: 0.42 },
};

const correctCells = {
  H2: { value: "Autos & Vehicles", formula: "=VLOOKUP(C2,I2:K11,2,FALSE)" },
  H3: { value: "Autos & Vehicles", formula: "=INDEX(J2:J11,MATCH(C2,I2:I11,0))" },
  H4: { value: "Autos & Vehicles", formula: "=XLOOKUP(C2,I2:I11,J2:J11)" },
  H5: { value: "Online MBA PR", formula: "=XLOOKUP(MAX(K2:K11),K2:K11,I2:I11)" },
};

describe("Track 1 Lesson 4: lookups", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells, ...correctCells } },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags VLOOKUP returning the wrong column", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H2: { value: "Car Deals PR", formula: "=VLOOKUP(C2,I2:K11,1,FALSE)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-vlookup-category",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("Autos & Vehicles");
  });

  it("flags INDEX without MATCH", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H3: { value: "Autos & Vehicles", formula: "=INDEX(J2:J11,1)" },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h3 = result.feedback.checks.find(
      (c) => c.ruleId === "h3-index-match-category",
    );
    expect(h3?.passed).toBe(false);
    expect(h3?.detail).toContain("INDEX and MATCH");
  });

  it("flags XLOOKUP returning the wrong vertical for highest CPC", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...correctCells,
          H5: {
            value: "Senior Living PR",
            formula: "=XLOOKUP(1.42,K2:K11,I2:I11)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h5 = result.feedback.checks.find(
      (c) => c.ruleId === "h5-xlookup-highest-cpc",
    );
    expect(h5?.passed).toBe(false);
    expect(h5?.detail).toContain("Online MBA PR");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h2 = result.feedback.checks.find(
      (c) => c.ruleId === "h2-vlookup-category",
    );
    expect(h2?.passed).toBe(false);
    expect(h2?.detail).toContain("H2 is empty");
  });
});
