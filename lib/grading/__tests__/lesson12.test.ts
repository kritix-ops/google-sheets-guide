import { describe, expect, it } from "vitest";

import { assignment } from "@/content/en/lessons/formulas/12-query-fundamentals/assignment";
import { runRules } from "../runRules";
import { InMemoryReader } from "../sheetReader";

const baseFixtureCells = {
  A1: { value: "Date" },
  B1: { value: "Buyer" },
  C1: { value: "Vertical" },
  D1: { value: "Platform" },
  E1: { value: "Spend" },
  F1: { value: "Revenue" },
  B2: { value: "Yoav Cohen" },
  C2: { value: "Car Deals PR" },
  F2: { value: 487.3 },
};

function buildHCells(): Record<string, { value: string | number; formula?: string }> {
  return {
    H1: { value: "Buyer", formula: '=QUERY(A1:F13,"SELECT B, C, F",1)' },
    I1: { value: "Vertical" },
    J1: { value: "Revenue" },
    H2: { value: "Yoav Cohen" },
    I2: { value: "Car Deals PR" },
    J2: { value: 487.3 },
  };
}

function buildKCells(): Record<string, { value: string | number; formula?: string }> {
  const rows = [
    ["Maya Bar", "Cruises PR", 1124.6],
    ["Ben Nahum", "Reverse Mortgage PR", 982.7],
    ["Ben Nahum", "Dental Implants PR", 588.4],
    ["Yoav Cohen", "Car Deals PR", 487.3],
    ["Maya Bar", "Pet Insurance PR", 461.2],
    ["Dina Dayan", "Senior Living PR", 412.15],
    ["Yoav Cohen", "Solar Systems & Panels PR", 401.9],
  ];
  const cells: Record<string, { value: string | number; formula?: string }> = {
    K1: {
      value: "Buyer",
      formula: '=QUERY(A1:F13,"SELECT B, C, F WHERE F > 400 ORDER BY F DESC",1)',
    },
    L1: { value: "Vertical" },
    M1: { value: "Revenue" },
  };
  rows.forEach((row, i) => {
    cells[`K${i + 2}`] = { value: row[0]! as string };
    cells[`L${i + 2}`] = { value: row[1]! as string };
    cells[`M${i + 2}`] = { value: row[2]! as number };
  });
  return cells;
}

function buildNCells(): Record<string, { value: string | number; formula?: string }> {
  const rows = [
    ["Yoav Cohen", "Car Deals PR", 487.3],
    ["Yoav Cohen", "Solar Systems & Panels PR", 401.9],
  ];
  const cells: Record<string, { value: string | number; formula?: string }> = {
    N1: {
      value: "Buyer",
      formula: "=QUERY(A1:F13,\"SELECT B, C, F WHERE B = 'Yoav Cohen' AND F > 400\",1)",
    },
    O1: { value: "Vertical" },
    P1: { value: "Revenue" },
  };
  rows.forEach((row, i) => {
    cells[`N${i + 2}`] = { value: row[0]! as string };
    cells[`O${i + 2}`] = { value: row[1]! as string };
    cells[`P${i + 2}`] = { value: row[2]! as number };
  });
  return cells;
}

describe("Track 1 Lesson 12: QUERY fundamentals", () => {
  it("passes all rules when the learner does the assignment correctly", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...buildHCells(),
          ...buildKCells(),
          ...buildNCells(),
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it("flags H1 not being a QUERY", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...buildHCells(),
          H1: { value: "Buyer", formula: "=B1" },
          ...buildKCells(),
          ...buildNCells(),
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-query-select");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("QUERY");
  });

  it("flags multi-criteria query missing AND", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          ...baseFixtureCells,
          ...buildHCells(),
          ...buildKCells(),
          ...buildNCells(),
          N1: {
            value: "Buyer",
            formula: "=QUERY(A1:F13,\"SELECT B, C, F WHERE B = 'Yoav Cohen'\",1)",
          },
        },
      },
    });

    const result = await runRules(assignment.rules, reader);
    const n1 = result.feedback.checks.find(
      (c) => c.ruleId === "n1-query-multi-criteria",
    );
    expect(n1?.passed).toBe(false);
    expect(n1?.detail).toContain("AND");
  });

  it("flags an empty input with the type-this-formula nudge", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { ...baseFixtureCells } },
    });

    const result = await runRules(assignment.rules, reader);
    const h1 = result.feedback.checks.find((c) => c.ruleId === "h1-query-select");
    expect(h1?.passed).toBe(false);
    expect(h1?.detail).toContain("H1 is empty");
  });
});
