import type { drive_v3, script_v1, sheets_v4 } from "googleapis";

import type {
  AppsScriptFile,
  AppsScriptProject,
  CellValue,
  ChartSpec,
  ConditionalFormatRule,
  DataValidationRule,
  DrivePermission,
  NumberFormat,
  PivotTable,
  ProtectedRange,
  SheetReader,
  SmartChip,
} from "@/lib/grading/types";

type Meta = {
  sheetTitles: string[];
  namedRangeNames: Set<string>;
};

type SheetMeta = {
  conditionalFormats: ConditionalFormatRule[];
  protectedRanges: ProtectedRange[];
  filterViewTitles: string[];
  charts: ChartSpec[];
};

type CellMeta = {
  validation: DataValidationRule | null;
  numberFormat: NumberFormat | null;
  note: string | null;
  pivotTable: PivotTable | null;
  chips: SmartChip[];
};

export class GoogleSheetsReader implements SheetReader {
  private metaPromise: Promise<Meta> | null = null;
  private valueCache = new Map<string, CellValue[][]>();
  private formulaCache = new Map<string, (string | null)[][]>();
  private sheetMetaCache = new Map<string, SheetMeta>();
  private cellMetaCache = new Map<string, CellMeta>();

  // The Drive and Apps Script clients are optional. When `drive` is omitted,
  // `filePermissions()` throws instead of returning empty (which would
  // silently fail any sharing-rules grader). When `script` or `scriptId` is
  // omitted, `scriptContent()` returns null — the same shape as a
  // spreadsheet without a bound script.
  constructor(
    private readonly sheets: sheets_v4.Sheets,
    private readonly spreadsheetId: string,
    private readonly drive?: drive_v3.Drive,
    private readonly script?: script_v1.Script,
    private readonly scriptId?: string | null,
  ) {}

  private filePermissionsPromise: Promise<DrivePermission[]> | null = null;
  private scriptContentPromise: Promise<AppsScriptProject | null> | null = null;

  private async meta(): Promise<Meta> {
    if (!this.metaPromise) {
      this.metaPromise = (async () => {
        const r = await this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
          includeGridData: false,
          fields: "sheets(properties(title)),namedRanges(name)",
        });
        const sheetTitles: string[] = [];
        for (const s of r.data.sheets ?? []) {
          if (s.properties?.title) sheetTitles.push(s.properties.title);
        }
        const namedRangeNames = new Set<string>();
        for (const nr of r.data.namedRanges ?? []) {
          if (nr.name) namedRangeNames.add(nr.name);
        }
        return { sheetTitles, namedRangeNames };
      })();
    }
    return this.metaPromise;
  }

  async sheetTitles(): Promise<string[]> {
    return (await this.meta()).sheetTitles;
  }

  async cellValue(a1: string): Promise<CellValue> {
    const values = await this.rangeValues(a1);
    return values[0]?.[0] ?? null;
  }

  async cellFormula(a1: string): Promise<string | null> {
    const formulas = await this.rangeFormulas(a1);
    return formulas[0]?.[0] ?? null;
  }

  async rangeValues(a1: string): Promise<CellValue[][]> {
    const cached = this.valueCache.get(a1);
    if (cached) return cached;
    const r = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: a1,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const values = (r.data.values ?? []) as CellValue[][];
    this.valueCache.set(a1, values);
    return values;
  }

  async rangeFormulas(a1: string): Promise<(string | null)[][]> {
    const cached = this.formulaCache.get(a1);
    if (cached) return cached;
    const r = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: a1,
      valueRenderOption: "FORMULA",
    });
    // valueRenderOption FORMULA returns the literal formula string for cells
    // that have one; cells with a static value come back as the value itself.
    // We treat a leading "=" as the discriminator.
    const raw = (r.data.values ?? []) as unknown[][];
    const formulas: (string | null)[][] = raw.map((row) =>
      row.map((cell) =>
        typeof cell === "string" && cell.startsWith("=") ? cell : null,
      ),
    );
    this.formulaCache.set(a1, formulas);
    return formulas;
  }

  async namedRange(
    name: string,
  ): Promise<{ a1: string; values: CellValue[][] } | null> {
    const m = await this.meta();
    if (!m.namedRangeNames.has(name)) return null;
    // Pass the named range's name directly as the range parameter; Google
    // resolves it server-side, which avoids reconstructing A1 from the stored
    // GridRange (different sheets can have unexpected sheetId values).
    const r = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: name,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const values = (r.data.values ?? []) as CellValue[][];
    return { a1: name, values };
  }

  // -------------------------------------------------------------------------
  // Cell-level metadata: validation, number format, note. Fetched together
  // because they all live under the same `sheets.data.rowData[].values[]`
  // path and one round-trip beats three.
  // -------------------------------------------------------------------------

  private async cellMeta(a1: string): Promise<CellMeta> {
    const cached = this.cellMetaCache.get(a1);
    if (cached) return cached;
    const m = await this.meta();
    // The pivot's source range is a GridRange referencing some sheet by
    // sheetId; we need a sheetId→title map to render it as A1. Fetch the
    // map alongside the cell data so the mapping helper has it.
    const sheetTitlesById = await this.sheetTitlesById();
    const r = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      ranges: [a1],
      // includeGridData=true is required for the data.rowData path to populate;
      // the fields filter keeps the response slim.
      includeGridData: true,
      fields:
        "sheets(data(rowData(values(dataValidation,note,userEnteredFormat(numberFormat),effectiveFormat(numberFormat),pivotTable(source,rows,columns,values,filterSpecs,valueLayout),chipRuns(startIndex,chip(personProperties(email),richLinkProperties(uri,mimeType)))))))",
    });
    void m;
    const cell =
      r.data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0] ?? null;

    const validation = cell?.dataValidation
      ? mapValidation(cell.dataValidation)
      : null;
    const fmt =
      cell?.userEnteredFormat?.numberFormat ??
      cell?.effectiveFormat?.numberFormat ??
      null;
    const numberFormat: NumberFormat | null = fmt
      ? { type: fmt.type ?? "NUMBER", pattern: fmt.pattern ?? "" }
      : null;
    const note = cell?.note ?? null;
    const pivotTable = cell?.pivotTable
      ? mapPivotTable(cell.pivotTable, sheetTitlesById)
      : null;
    const chips: SmartChip[] = (cell?.chipRuns ?? [])
      .map(mapChipRun)
      .sort((a, b) => a.startIndex - b.startIndex);

    const meta: CellMeta = { validation, numberFormat, note, pivotTable, chips };
    this.cellMetaCache.set(a1, meta);
    return meta;
  }

  private sheetIdMapPromise: Promise<Map<number, string>> | null = null;
  private async sheetTitlesById(): Promise<Map<number, string>> {
    if (!this.sheetIdMapPromise) {
      this.sheetIdMapPromise = (async () => {
        const r = await this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
          fields: "sheets(properties(sheetId,title))",
        });
        const map = new Map<number, string>();
        for (const s of r.data.sheets ?? []) {
          if (s.properties?.sheetId != null && s.properties?.title) {
            map.set(s.properties.sheetId, s.properties.title);
          }
        }
        return map;
      })();
    }
    return this.sheetIdMapPromise;
  }

  async cellValidation(a1: string): Promise<DataValidationRule | null> {
    return (await this.cellMeta(a1)).validation;
  }

  async cellNumberFormat(a1: string): Promise<NumberFormat | null> {
    return (await this.cellMeta(a1)).numberFormat;
  }

  async cellNote(a1: string): Promise<string | null> {
    return (await this.cellMeta(a1)).note;
  }

  async cellPivotTable(a1: string): Promise<PivotTable | null> {
    return (await this.cellMeta(a1)).pivotTable;
  }

  async cellChips(a1: string): Promise<SmartChip[]> {
    return (await this.cellMeta(a1)).chips;
  }

  // -------------------------------------------------------------------------
  // Sheet-level metadata: conditional formats, protected ranges, filter views.
  // One round-trip per sheet, cached.
  // -------------------------------------------------------------------------

  private async sheetMeta(sheetTitle?: string): Promise<SheetMeta> {
    const m = await this.meta();
    const title = sheetTitle ?? m.sheetTitles[0];
    if (!title) {
      return {
        conditionalFormats: [],
        protectedRanges: [],
        filterViewTitles: [],
        charts: [],
      };
    }
    const cached = this.sheetMetaCache.get(title);
    if (cached) return cached;
    const sheetTitlesById = await this.sheetTitlesById();
    const r = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields:
        "sheets(properties(sheetId,title),conditionalFormats(ranges,booleanRule,gradientRule),protectedRanges(range,description,warningOnly,editors(users)),filterViews(title),charts(chartId,position,spec(title,basicChart(chartType,legendPosition,series),pieChart(legendPosition,series),bubbleChart,scorecardChart,treemapChart,candlestickChart,histogramChart,waterfallChart,orgChart)))",
    });
    const sheet =
      r.data.sheets?.find((s) => s.properties?.title === title) ?? null;

    const conditionalFormats: ConditionalFormatRule[] = (
      sheet?.conditionalFormats ?? []
    ).map((cf) => mapConditionalFormat(cf, title));
    const protectedRanges: ProtectedRange[] = (
      sheet?.protectedRanges ?? []
    ).map((p) => mapProtectedRange(p, title));
    const filterViewTitles: string[] = (sheet?.filterViews ?? [])
      .map((fv) => fv.title ?? "")
      .filter((t) => t.length > 0);
    const charts: ChartSpec[] = (sheet?.charts ?? []).map((c) =>
      mapChart(c, sheetTitlesById),
    );

    const meta: SheetMeta = {
      conditionalFormats,
      protectedRanges,
      filterViewTitles,
      charts,
    };
    this.sheetMetaCache.set(title, meta);
    return meta;
  }

  async conditionalFormats(
    sheetTitle?: string,
  ): Promise<ConditionalFormatRule[]> {
    return (await this.sheetMeta(sheetTitle)).conditionalFormats;
  }

  async protectedRanges(sheetTitle?: string): Promise<ProtectedRange[]> {
    return (await this.sheetMeta(sheetTitle)).protectedRanges;
  }

  async filterViewTitles(sheetTitle?: string): Promise<string[]> {
    return (await this.sheetMeta(sheetTitle)).filterViewTitles;
  }

  async charts(sheetTitle?: string): Promise<ChartSpec[]> {
    return (await this.sheetMeta(sheetTitle)).charts;
  }

  async filePermissions(): Promise<DrivePermission[]> {
    if (!this.drive) {
      throw new Error(
        "GoogleSheetsReader was constructed without a Drive client; " +
          "filePermissions() requires the Drive scope. Pass `clients.drive` to the constructor.",
      );
    }
    if (!this.filePermissionsPromise) {
      const drive = this.drive;
      this.filePermissionsPromise = (async () => {
        const all: DrivePermission[] = [];
        let pageToken: string | undefined = undefined;
        do {
          const r: { data: drive_v3.Schema$PermissionList } =
            await drive.permissions.list({
              fileId: this.spreadsheetId,
              fields:
                "nextPageToken,permissions(id,type,role,emailAddress,domain,expirationTime,displayName)",
              pageSize: 100,
              pageToken,
            });
          for (const p of r.data.permissions ?? []) {
            all.push(mapPermission(p));
          }
          pageToken = r.data.nextPageToken ?? undefined;
        } while (pageToken);
        return all;
      })();
    }
    return this.filePermissionsPromise;
  }

  // -------------------------------------------------------------------------
  // Apps Script project content for the bound script. Two endpoints are
  // fetched in parallel because `projects.getContent` returns the file
  // sources but not the project title, while `projects.get` returns the
  // title but not the files.
  // -------------------------------------------------------------------------

  async scriptContent(): Promise<AppsScriptProject | null> {
    if (!this.script || !this.scriptId) return null;
    if (!this.scriptContentPromise) {
      const script = this.script;
      const scriptId = this.scriptId;
      this.scriptContentPromise = (async () => {
        const [contentRes, metaRes] = await Promise.all([
          script.projects.getContent({ scriptId }),
          script.projects.get({ scriptId }),
        ]);
        const files: AppsScriptFile[] = (contentRes.data.files ?? []).map(
          mapAppsScriptFile,
        );
        return {
          scriptId,
          title: metaRes.data.title ?? null,
          files,
        };
      })();
    }
    return this.scriptContentPromise;
  }
}

// ---------------------------------------------------------------------------
// Mapping helpers from Sheets API shapes to grading-friendly shapes.
// ---------------------------------------------------------------------------

function mapValidation(
  v: sheets_v4.Schema$DataValidationRule,
): DataValidationRule {
  const type = v.condition?.type ?? "";
  const rawValues = v.condition?.values ?? [];
  const values: string[] = [];
  let customFormula: string | null = null;
  for (const cv of rawValues) {
    const s = cv.userEnteredValue ?? "";
    if (type === "CUSTOM_FORMULA") {
      customFormula = s;
    } else {
      values.push(s);
    }
  }
  return {
    type,
    values,
    customFormula,
    inputMessage: v.inputMessage ?? null,
    strict: v.strict ?? false,
  };
}

function mapConditionalFormat(
  cf: sheets_v4.Schema$ConditionalFormatRule,
  sheetTitle: string,
): ConditionalFormatRule {
  const ranges = (cf.ranges ?? []).map((gr) =>
    gridRangeToA1(gr, sheetTitle),
  );
  if (cf.booleanRule) {
    const condType = cf.booleanRule.condition?.type ?? null;
    const condValues = (cf.booleanRule.condition?.values ?? [])
      .map((v) => v.userEnteredValue ?? "")
      .filter((s) => s.length > 0);
    return {
      ranges,
      variant: "boolean",
      conditionType: condType,
      conditionValues: condValues,
    };
  }
  return {
    ranges,
    variant: "gradient",
    conditionType: null,
    conditionValues: [],
  };
}

function mapProtectedRange(
  p: sheets_v4.Schema$ProtectedRange,
  sheetTitle: string,
): ProtectedRange {
  const range = p.range ? gridRangeToA1(p.range, sheetTitle) : "";
  return {
    range,
    description: p.description ?? null,
    warningOnly: p.warningOnly ?? false,
    editorEmails: p.editors?.users ?? [],
  };
}

function mapPivotTable(
  pt: sheets_v4.Schema$PivotTable,
  sheetTitlesById: Map<number, string>,
): PivotTable {
  const sourceTitle = pt.source?.sheetId != null
    ? sheetTitlesById.get(pt.source.sheetId) ?? ""
    : "";
  const source = pt.source && sourceTitle
    ? gridRangeToA1(pt.source, sourceTitle)
    : "";
  return {
    source,
    rows: (pt.rows ?? []).map((g) => ({
      sourceColumn: g.sourceColumnOffset ?? -1,
      showTotals: g.showTotals ?? true,
      label: g.label ?? null,
    })),
    columns: (pt.columns ?? []).map((g) => ({
      sourceColumn: g.sourceColumnOffset ?? -1,
      showTotals: g.showTotals ?? true,
      label: g.label ?? null,
    })),
    values: (pt.values ?? []).map((v) => ({
      summarize: v.summarizeFunction ?? "NONE",
      sourceColumn: v.sourceColumnOffset ?? -1,
      name: v.name ?? null,
      formula: v.formula ?? null,
    })),
    filters: (pt.filterSpecs ?? []).map((spec) => {
      const fc = spec.filterCriteria ?? {};
      const condType = fc.condition?.type ?? null;
      const condValues = (fc.condition?.values ?? [])
        .map((v) => v.userEnteredValue ?? "")
        .filter((s) => s.length > 0);
      return {
        sourceColumn: spec.columnOffsetIndex ?? -1,
        visibleValues: fc.visibleValues ?? [],
        conditionType: condType,
        conditionValues: condValues,
      };
    }),
    valueLayout: pt.valueLayout === "VERTICAL" ? "VERTICAL" : "HORIZONTAL",
  };
}

function mapChart(
  ec: sheets_v4.Schema$EmbeddedChart,
  sheetTitlesById: Map<number, string>,
): ChartSpec {
  const spec = ec.spec ?? {};
  let family = "unknown";
  let basicChartType: string | null = null;
  let seriesCount = 0;
  let legendPosition: string | null = null;
  if (spec.basicChart) {
    family = "basic";
    basicChartType = spec.basicChart.chartType ?? null;
    seriesCount = spec.basicChart.series?.length ?? 0;
    legendPosition = spec.basicChart.legendPosition ?? null;
  } else if (spec.pieChart) {
    family = "pie";
    seriesCount = spec.pieChart.series ? 1 : 0;
    legendPosition = spec.pieChart.legendPosition ?? null;
  } else if (spec.bubbleChart) {
    family = "bubble";
  } else if (spec.scorecardChart) {
    family = "scorecard";
  } else if (spec.treemapChart) {
    family = "treemap";
  } else if (spec.candlestickChart) {
    family = "candlestick";
  } else if (spec.histogramChart) {
    family = "histogram";
  } else if (spec.waterfallChart) {
    family = "waterfall";
  } else if (spec.orgChart) {
    family = "org";
  }

  const overlay = ec.position?.overlayPosition;
  const anchorSheetId = overlay?.anchorCell?.sheetId;
  const anchorSheet =
    anchorSheetId != null ? sheetTitlesById.get(anchorSheetId) ?? null : null;
  const anchorRow = overlay?.anchorCell?.rowIndex;
  const anchorCol = overlay?.anchorCell?.columnIndex;
  const anchorCell =
    anchorRow != null && anchorCol != null
      ? `${numToCol(anchorCol + 1)}${anchorRow + 1}`
      : null;

  return {
    chartId: ec.chartId ?? -1,
    family,
    basicChartType,
    title: spec.title ?? null,
    anchorSheet,
    anchorCell,
    seriesCount,
    legendPosition,
  };
}

function mapPermission(p: drive_v3.Schema$Permission): DrivePermission {
  return {
    id: p.id ?? "",
    type: p.type ?? "",
    role: p.role ?? "",
    email: p.emailAddress ?? null,
    domain: p.domain ?? null,
    expirationTime: p.expirationTime ?? null,
    displayName: p.displayName ?? null,
  };
}

function mapAppsScriptFile(f: script_v1.Schema$File): AppsScriptFile {
  // The Apps Script API only sets functionSet on SERVER_JS files; for
  // HTML/JSON files the field is absent and we surface an empty array.
  const functions: string[] = (f.functionSet?.values ?? [])
    .map((fn) => fn.name ?? "")
    .filter((name) => name.length > 0);
  // Narrow the API's open `string` type to our union. Anything unexpected
  // gets passed through as JSON so the grader still sees something useful;
  // in practice only SERVER_JS / HTML / JSON ever come back.
  const type: AppsScriptFile["type"] =
    f.type === "SERVER_JS" || f.type === "HTML" || f.type === "JSON"
      ? f.type
      : "JSON";
  return {
    name: f.name ?? "",
    type,
    source: f.source ?? "",
    functions,
  };
}

function mapChipRun(cr: sheets_v4.Schema$ChipRun): SmartChip {
  const chip = cr.chip;
  if (chip?.personProperties) {
    return {
      startIndex: cr.startIndex ?? 0,
      kind: "person",
      email: chip.personProperties.email ?? null,
      uri: null,
      mimeType: null,
    };
  }
  // RichLink covers files, places, finance, calendar, YouTube — all
  // distinguished downstream by mimeType.
  return {
    startIndex: cr.startIndex ?? 0,
    kind: "rich-link",
    email: null,
    uri: chip?.richLinkProperties?.uri ?? null,
    mimeType: chip?.richLinkProperties?.mimeType ?? null,
  };
}

// Convert a Sheets API GridRange to a 1-indexed A1 string. The API uses
// 0-indexed half-open intervals; A1 is 1-indexed inclusive.
function gridRangeToA1(
  gr: sheets_v4.Schema$GridRange,
  sheetTitle: string,
): string {
  const startRow = (gr.startRowIndex ?? 0) + 1;
  const endRow = gr.endRowIndex ?? startRow;
  const startCol = (gr.startColumnIndex ?? 0) + 1;
  const endCol = gr.endColumnIndex ?? startCol;
  const startA = numToCol(startCol) + startRow;
  const endA = numToCol(endCol) + endRow;
  return `${sheetTitle}!${startA}:${endA}`;
}

function numToCol(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
