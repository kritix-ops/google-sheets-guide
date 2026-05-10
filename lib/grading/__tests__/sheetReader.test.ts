import { describe, expect, it } from "vitest";

import { InMemoryReader } from "../sheetReader";

describe("InMemoryReader", () => {
  it("reads cell values and formulas using the default sheet", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          A1: { value: "Name" },
          B1: { value: "Score" },
          B5: { value: 87, formula: "=SUM(B2:B4)" },
        },
      },
    });

    expect(await reader.cellValue("A1")).toBe("Name");
    expect(await reader.cellValue("B5")).toBe(87);
    expect(await reader.cellFormula("B5")).toBe("=SUM(B2:B4)");
    expect(await reader.cellFormula("A1")).toBeNull();
    expect(await reader.cellValue("Z99")).toBeNull();
  });

  it("returns rectangular value and formula ranges", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          A1: { value: 1 },
          B1: { value: 2 },
          A2: { value: 3 },
          B2: { value: 4, formula: "=A2+1" },
        },
      },
    });

    expect(await reader.rangeValues("A1:B2")).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(await reader.rangeFormulas("A1:B2")).toEqual([
      [null, null],
      [null, "=A2+1"],
    ]);
  });

  it("resolves named ranges", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          B2: { value: 10 },
          B3: { value: 20 },
          B4: { value: 30 },
        },
      },
      namedRanges: {
        scores: { sheet: "Sheet1", range: "B2:B4" },
      },
    });

    const named = await reader.namedRange("scores");
    expect(named).not.toBeNull();
    expect(named!.a1).toBe("Sheet1!B2:B4");
    expect(named!.values).toEqual([[10], [20], [30]]);

    expect(await reader.namedRange("missing")).toBeNull();
  });

  it("supports explicit sheet prefixes in references", async () => {
    const reader = new InMemoryReader({
      defaultSheet: "Main",
      sheets: {
        Main: { A1: { value: "main" } },
        Side: { A1: { value: "side" } },
      },
    });

    expect(await reader.cellValue("A1")).toBe("main");
    expect(await reader.cellValue("Side!A1")).toBe("side");
    expect(await reader.cellValue("'Side'!A1")).toBe("side");
  });

  it("throws when the fixture has no sheets", () => {
    expect(() => new InMemoryReader({ sheets: {} })).toThrow();
  });
});
