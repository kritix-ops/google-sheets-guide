import { describe, expect, it } from "vitest";

import { InMemoryReader } from "../sheetReader";

describe("InMemoryReader metadata extensions", () => {
  it("returns null for cells with no validation, format, or note", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { A1: { value: 42 } } },
    });
    expect(await reader.cellValidation("A1")).toBe(null);
    expect(await reader.cellNumberFormat("A1")).toBe(null);
    expect(await reader.cellNote("A1")).toBe(null);
  });

  it("returns the data validation rule when one is set", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          B5: {
            value: "Approved",
            validation: {
              type: "ONE_OF_LIST",
              values: ["Approved", "Pending", "Rejected"],
              customFormula: null,
              inputMessage: null,
              strict: true,
            },
          },
        },
      },
    });
    const rule = await reader.cellValidation("B5");
    expect(rule).not.toBe(null);
    expect(rule?.type).toBe("ONE_OF_LIST");
    expect(rule?.values).toEqual(["Approved", "Pending", "Rejected"]);
    expect(rule?.strict).toBe(true);
  });

  it("returns the number format on currency cells", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          C3: {
            value: 1234.5,
            numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
          },
        },
      },
    });
    const fmt = await reader.cellNumberFormat("C3");
    expect(fmt?.type).toBe("CURRENCY");
    expect(fmt?.pattern).toBe("$#,##0.00");
  });

  it("returns cell notes when set", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          D7: { value: "Yoav", note: "Promoted to senior media buyer 2025-Q4." },
        },
      },
    });
    expect(await reader.cellNote("D7")).toContain("senior media buyer");
  });

  it("returns conditional format rules per sheet", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: {} },
      sheetMeta: {
        Campaigns: {
          conditionalFormats: [
            {
              ranges: ["Campaigns!F2:F61"],
              variant: "boolean",
              conditionType: "NUMBER_GREATER",
              conditionValues: ["500"],
            },
            {
              ranges: ["Campaigns!G2:G61"],
              variant: "gradient",
              conditionType: null,
              conditionValues: [],
            },
          ],
        },
      },
    });
    const rules = await reader.conditionalFormats("Campaigns");
    expect(rules).toHaveLength(2);
    expect(rules[0]?.variant).toBe("boolean");
    expect(rules[0]?.conditionType).toBe("NUMBER_GREATER");
    expect(rules[1]?.variant).toBe("gradient");
  });

  it("returns protected ranges per sheet", async () => {
    const reader = new InMemoryReader({
      sheets: { Raw: {} },
      sheetMeta: {
        Raw: {
          protectedRanges: [
            {
              range: "Raw!A:G",
              description: "Raw data is read-only",
              warningOnly: false,
              editorEmails: ["info@flexelent.com"],
            },
          ],
        },
      },
    });
    const ranges = await reader.protectedRanges("Raw");
    expect(ranges).toHaveLength(1);
    expect(ranges[0]?.warningOnly).toBe(false);
    expect(ranges[0]?.editorEmails).toContain("info@flexelent.com");
  });

  it("returns filter view titles per sheet", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: {} },
      sheetMeta: {
        Campaigns: {
          filterViewTitles: ["Yoav only", "Profitable only"],
        },
      },
    });
    const views = await reader.filterViewTitles("Campaigns");
    expect(views).toEqual(["Yoav only", "Profitable only"]);
  });

  it("defaults to the first sheet when no title is given", async () => {
    const reader = new InMemoryReader({
      sheets: { First: {}, Second: {} },
      sheetMeta: {
        First: { filterViewTitles: ["from-first"] },
        Second: { filterViewTitles: ["from-second"] },
      },
    });
    expect(await reader.filterViewTitles()).toEqual(["from-first"]);
    expect(await reader.filterViewTitles("Second")).toEqual(["from-second"]);
  });

  it("returns empty arrays for sheets with no metadata configured", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: {} },
    });
    expect(await reader.conditionalFormats("Campaigns")).toEqual([]);
    expect(await reader.protectedRanges("Campaigns")).toEqual([]);
    expect(await reader.filterViewTitles("Campaigns")).toEqual([]);
  });

  it("returns null when a cell is not the anchor of any pivot table", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: { K1: { value: "no pivot here" } } },
    });
    expect(await reader.cellPivotTable("K1")).toBe(null);
  });

  it("returns the pivot definition when a cell is the anchor", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          K1: {
            pivotTable: {
              source: "Campaigns!A1:G61",
              rows: [
                { sourceColumn: 1, showTotals: true, label: null }, // Buyer
              ],
              columns: [
                { sourceColumn: 3, showTotals: true, label: null }, // Platform
              ],
              values: [
                {
                  summarize: "SUM",
                  sourceColumn: 6,
                  name: "Total Revenue",
                  formula: null,
                },
              ],
              filters: [],
              valueLayout: "HORIZONTAL",
            },
          },
        },
      },
    });
    const pt = await reader.cellPivotTable("K1");
    expect(pt).not.toBe(null);
    expect(pt?.source).toBe("Campaigns!A1:G61");
    expect(pt?.rows).toHaveLength(1);
    expect(pt?.rows[0]?.sourceColumn).toBe(1);
    expect(pt?.values[0]?.summarize).toBe("SUM");
    expect(pt?.values[0]?.sourceColumn).toBe(6);
    expect(pt?.valueLayout).toBe("HORIZONTAL");
    expect(pt?.filters).toEqual([]);
  });

  it("returns pivot filters when filterSpecs are set", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Campaigns: {
          K1: {
            pivotTable: {
              source: "Campaigns!A1:G61",
              rows: [{ sourceColumn: 1, showTotals: true, label: null }],
              columns: [],
              values: [
                {
                  summarize: "SUM",
                  sourceColumn: 6,
                  name: null,
                  formula: null,
                },
              ],
              filters: [
                {
                  sourceColumn: 4, // Country
                  visibleValues: ["DE", "UK"],
                  conditionType: null,
                  conditionValues: [],
                },
              ],
              valueLayout: "VERTICAL",
            },
          },
        },
      },
    });
    const pt = await reader.cellPivotTable("K1");
    expect(pt?.filters).toHaveLength(1);
    expect(pt?.filters[0]?.sourceColumn).toBe(4);
    expect(pt?.filters[0]?.visibleValues).toEqual(["DE", "UK"]);
    expect(pt?.valueLayout).toBe("VERTICAL");
  });

  it("returns an empty array when a cell has no smart chips", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: { A1: { value: "plain text" } } },
    });
    expect(await reader.cellChips("A1")).toEqual([]);
  });

  it("returns chip runs for a cell with a person chip", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          A1: {
            value: "Owner: @",
            chips: [
              {
                startIndex: 7,
                kind: "person",
                email: "yoav.cohen@flexelent.com",
                uri: null,
                mimeType: null,
              },
            ],
          },
        },
      },
    });
    const chips = await reader.cellChips("A1");
    expect(chips).toHaveLength(1);
    expect(chips[0]?.kind).toBe("person");
    expect(chips[0]?.email).toBe("yoav.cohen@flexelent.com");
  });

  it("returns rich-link chips with mimeType for file/place/finance chips", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          B2: {
            chips: [
              {
                startIndex: 0,
                kind: "rich-link",
                email: null,
                uri: "https://docs.google.com/spreadsheets/d/abc",
                mimeType: "application/vnd.google-apps.spreadsheet",
              },
            ],
          },
        },
      },
    });
    const chips = await reader.cellChips("B2");
    expect(chips[0]?.kind).toBe("rich-link");
    expect(chips[0]?.mimeType).toBe(
      "application/vnd.google-apps.spreadsheet",
    );
    expect(chips[0]?.uri).toContain("docs.google.com");
  });

  it("returns charts when a sheet has them configured", async () => {
    const reader = new InMemoryReader({
      sheets: { Campaigns: {} },
      sheetMeta: {
        Campaigns: {
          charts: [
            {
              chartId: 1234,
              family: "basic",
              basicChartType: "COLUMN",
              title: "Spend by Buyer",
              anchorSheet: "Campaigns",
              anchorCell: "K1",
              seriesCount: 2,
              legendPosition: "RIGHT_LEGEND",
            },
          ],
        },
      },
    });
    const charts = await reader.charts("Campaigns");
    expect(charts).toHaveLength(1);
    expect(charts[0]?.family).toBe("basic");
    expect(charts[0]?.basicChartType).toBe("COLUMN");
    expect(charts[0]?.anchorCell).toBe("K1");
  });

  it("returns an empty chart array when none are configured", async () => {
    const reader = new InMemoryReader({ sheets: { Campaigns: {} } });
    expect(await reader.charts("Campaigns")).toEqual([]);
  });

  it("returns file permissions when fixture provides them", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: {} },
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
          id: "external-perm",
          type: "user",
          role: "commenter",
          email: "auditor@external.com",
          domain: null,
          expirationTime: "2026-12-31T23:59:59Z",
          displayName: null,
        },
      ],
    });
    const perms = await reader.filePermissions();
    expect(perms).toHaveLength(2);
    expect(perms.find((p) => p.role === "owner")?.email).toBe(
      "info@flexelent.com",
    );
    expect(
      perms.find((p) => p.role === "commenter")?.expirationTime,
    ).toBe("2026-12-31T23:59:59Z");
  });

  it("returns empty file permissions array by default", async () => {
    const reader = new InMemoryReader({ sheets: { Sheet1: {} } });
    expect(await reader.filePermissions()).toEqual([]);
  });

  it("returns null when no Apps Script project is configured", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: {} },
    });
    expect(await reader.scriptContent()).toBe(null);
  });

  it("returns the bound Apps Script project when configured", async () => {
    const reader = new InMemoryReader({
      sheets: { Sheet1: {} },
      scriptProject: {
        scriptId: "script-abc",
        title: "Sheets Guide: apps-script-03-custom-functions",
        files: [
          {
            name: "appsscript",
            type: "JSON",
            source: '{"timeZone":"America/New_York"}',
            functions: [],
          },
          {
            name: "Lesson",
            type: "SERVER_JS",
            source:
              "function usdToILS(usd, rate) {\n  return usd * rate;\n}\n",
            functions: ["usdToILS"],
          },
        ],
      },
    });
    const project = await reader.scriptContent();
    expect(project).not.toBe(null);
    expect(project?.scriptId).toBe("script-abc");
    expect(project?.files).toHaveLength(2);
    const lesson = project?.files.find((f) => f.name === "Lesson");
    expect(lesson?.type).toBe("SERVER_JS");
    expect(lesson?.functions).toEqual(["usdToILS"]);
    expect(lesson?.source).toContain("function usdToILS");
  });

  it("returns chips sorted by startIndex even when fixture is unsorted", async () => {
    const reader = new InMemoryReader({
      sheets: {
        Sheet1: {
          C3: {
            chips: [
              {
                startIndex: 12,
                kind: "person",
                email: "b@example.com",
                uri: null,
                mimeType: null,
              },
              {
                startIndex: 0,
                kind: "person",
                email: "a@example.com",
                uri: null,
                mimeType: null,
              },
            ],
          },
        },
      },
    });
    const chips = await reader.cellChips("C3");
    expect(chips.map((c) => c.startIndex)).toEqual([0, 12]);
    expect(chips[0]?.email).toBe("a@example.com");
  });
});
