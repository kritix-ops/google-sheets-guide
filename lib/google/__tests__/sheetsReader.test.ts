import type { sheets_v4 } from "googleapis";
import { describe, expect, it, vi } from "vitest";

import { GoogleSheetsReader } from "../sheetsReader";

type SpreadsheetsGetResponse = {
  data: {
    sheets?: Array<{
      properties?: { sheetId?: number; title?: string };
    }>;
    namedRanges?: Array<{
      name?: string;
    }>;
  };
};

type ValuesGetResponse = { data: { values?: unknown[][] } };

function makeSheetsMock(args: {
  metadata: SpreadsheetsGetResponse;
  valuesByRequest: Map<
    string,
    { unformatted?: ValuesGetResponse; formula?: ValuesGetResponse }
  >;
}) {
  const get = vi.fn(async () => args.metadata);
  const valuesGet = vi.fn(
    async (params: { range: string; valueRenderOption?: string }) => {
      const entry = args.valuesByRequest.get(params.range);
      if (!entry) {
        return { data: { values: [] } } as ValuesGetResponse;
      }
      return params.valueRenderOption === "FORMULA"
        ? entry.formula ?? { data: { values: [] } }
        : entry.unformatted ?? { data: { values: [] } };
    },
  );
  const sheets = {
    spreadsheets: {
      get,
      values: { get: valuesGet },
    },
  } as unknown as sheets_v4.Sheets;
  return { sheets, get, valuesGet };
}

describe("GoogleSheetsReader", () => {
  it("resolves a named range by passing the name to values.get", async () => {
    const { sheets, get, valuesGet } = makeSheetsMock({
      metadata: {
        data: {
          sheets: [{ properties: { sheetId: 0, title: "Scores" } }],
          namedRanges: [{ name: "scores" }],
        },
      },
      valuesByRequest: new Map([
        [
          "scores",
          {
            unformatted: {
              data: {
                values: [[10], [20], [30], [40], [50], [60], [70], [80], [90]],
              },
            },
          },
        ],
      ]),
    });

    const reader = new GoogleSheetsReader(sheets, "spreadsheet-id");
    expect(await reader.sheetTitles()).toEqual(["Scores"]);

    const named = await reader.namedRange("scores");
    expect(named).not.toBeNull();
    expect(named!.a1).toBe("scores");
    expect(named!.values).toHaveLength(9);
    expect(get).toHaveBeenCalledOnce();
    expect(
      valuesGet.mock.calls.some((c) => c[0].range === "scores"),
    ).toBe(true);
  });

  it("reads cell value and formula via FORMULA render option", async () => {
    const { sheets, valuesGet } = makeSheetsMock({
      metadata: { data: { sheets: [{ properties: { sheetId: 0, title: "Sheet1" } }] } },
      valuesByRequest: new Map([
        [
          "E2",
          {
            unformatted: { data: { values: [[64]] } },
            formula: { data: { values: [["=$B$5"]] } },
          },
        ],
      ]),
    });

    const reader = new GoogleSheetsReader(sheets, "id");
    expect(await reader.cellValue("E2")).toBe(64);
    expect(await reader.cellFormula("E2")).toBe("=$B$5");

    const calls = valuesGet.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.valueRenderOption === "UNFORMATTED_VALUE")).toBe(true);
    expect(calls.some((c) => c.valueRenderOption === "FORMULA")).toBe(true);
  });

  it("returns null formula for cells that hold a static value", async () => {
    const { sheets } = makeSheetsMock({
      metadata: { data: { sheets: [{ properties: { sheetId: 0, title: "Sheet1" } }] } },
      valuesByRequest: new Map([
        [
          "B5",
          {
            unformatted: { data: { values: [[64]] } },
            formula: { data: { values: [[64]] } },
          },
        ],
      ]),
    });
    const reader = new GoogleSheetsReader(sheets, "id");
    expect(await reader.cellFormula("B5")).toBeNull();
  });

  it("caches repeated reads of the same A1 string", async () => {
    const { sheets, valuesGet } = makeSheetsMock({
      metadata: { data: { sheets: [{ properties: { sheetId: 0, title: "Sheet1" } }] } },
      valuesByRequest: new Map([
        ["A1:B2", { unformatted: { data: { values: [[1, 2], [3, 4]] } } }],
      ]),
    });
    const reader = new GoogleSheetsReader(sheets, "id");
    await reader.rangeValues("A1:B2");
    await reader.rangeValues("A1:B2");
    await reader.rangeValues("A1:B2");
    const valueCalls = valuesGet.mock.calls.filter(
      (c) => c[0].valueRenderOption === "UNFORMATTED_VALUE",
    );
    expect(valueCalls).toHaveLength(1);
  });

  it("returns null for an unknown named range without an extra metadata fetch", async () => {
    const { sheets, get } = makeSheetsMock({
      metadata: { data: { sheets: [{ properties: { sheetId: 0, title: "Sheet1" } }] } },
      valuesByRequest: new Map(),
    });
    const reader = new GoogleSheetsReader(sheets, "id");
    expect(await reader.namedRange("does-not-exist")).toBeNull();
    expect(await reader.namedRange("does-not-exist-2")).toBeNull();
    expect(get).toHaveBeenCalledOnce();
  });

  it("works regardless of which sheet a named range lives on", async () => {
    const { sheets } = makeSheetsMock({
      metadata: {
        data: {
          sheets: [{ properties: { sheetId: 7, title: "Q4 Forecast" } }],
          namedRanges: [{ name: "rev" }],
        },
      },
      valuesByRequest: new Map([
        ["rev", { unformatted: { data: { values: [[42]] } } }],
      ]),
    });
    const reader = new GoogleSheetsReader(sheets, "id");
    const named = await reader.namedRange("rev");
    expect(named?.a1).toBe("rev");
    expect(named?.values).toEqual([[42]]);
  });
});
