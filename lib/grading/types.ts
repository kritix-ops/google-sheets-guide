export type CellValue = string | number | boolean | null;

// ---------------------------------------------------------------------------
// Cell- and sheet-level metadata exposed by SheetReader for Track 2 lessons.
// Shapes are slimmed views over what the Google Sheets API returns; just
// enough surface area for graders to assert "this validation rule exists on
// this cell", "this range is protected", "this column has a number format
// of type CURRENCY", etc.
// ---------------------------------------------------------------------------

export type DataValidationRule = {
  // Coarse type label for grading assertions. See the value list in the
  // Sheets API ConditionType reference. Common values:
  //   ONE_OF_LIST, ONE_OF_RANGE, NUMBER_BETWEEN, NUMBER_GREATER, DATE_AFTER,
  //   DATE_BEFORE, DATE_BETWEEN, TEXT_CONTAINS, TEXT_IS_EMAIL, BOOLEAN,
  //   CUSTOM_FORMULA.
  type: string;
  // Raw user-condition values. For ONE_OF_LIST the dropdown options live
  // here; for NUMBER_BETWEEN the bounds; for CUSTOM_FORMULA the formula sits
  // in `customFormula` instead.
  values: string[];
  customFormula: string | null;
  inputMessage: string | null;
  // True = reject invalid input; false = warn only.
  strict: boolean;
};

export type NumberFormat = {
  // One of: TEXT, NUMBER, PERCENT, CURRENCY, DATE, TIME, DATE_TIME, SCIENTIFIC.
  type: string;
  // The pattern string itself (e.g. "$#,##0.00", "0.00%", "yyyy-mm-dd").
  pattern: string;
};

export type ConditionalFormatRule = {
  // A1 ranges this rule applies to (one rule can target many ranges).
  ranges: string[];
  variant: "boolean" | "gradient";
  // For boolean variant: the condition type ("TEXT_CONTAINS", "NUMBER_GREATER",
  // "CUSTOM_FORMULA", etc.). Null for gradient variant.
  conditionType: string | null;
  // Raw condition values. For TEXT_CONTAINS this is the substring; for
  // CUSTOM_FORMULA this is the formula. Empty for gradient.
  conditionValues: string[];
};

export type ProtectedRange = {
  // A1 form. Empty string means the entire sheet is protected.
  range: string;
  description: string | null;
  // Warning-only protection lets editors override; strict protection blocks.
  warningOnly: boolean;
  // Editor email allowlist. Empty array = only the owner can edit (or
  // anyone, depending on warningOnly).
  editorEmails: string[];
};

// ---------------------------------------------------------------------------
// Pivot tables. Slim view of the Sheets API PivotTable resource. The pivot
// definition lives on the anchor cell; the rest of the pivot's footprint
// holds the computed result values in their `effectiveValue` fields, which
// graders can read with `cellValue` for output-cell assertions.
// ---------------------------------------------------------------------------

export type PivotGroup = {
  // 0-indexed offset into the source range. column 0 is the first column of source.
  sourceColumn: number;
  showTotals: boolean;
  // Optional display label override.
  label: string | null;
};

export type PivotValue = {
  // PivotValueSummarizeFunction. Common values: SUM, COUNT, COUNTA, AVERAGE,
  // MIN, MAX, MEDIAN, COUNTUNIQUE, STDEV, VAR, PRODUCT. `CUSTOM` indicates
  // that `formula` is set instead. `NONE` means already-summarized values.
  summarize: string;
  // 0-indexed column offset into the source range. -1 when the value comes
  // from a formula instead of a column.
  sourceColumn: number;
  // Optional display name (e.g. "Total Spend").
  name: string | null;
  // Custom formula, if `summarize === "CUSTOM"`. Otherwise null.
  formula: string | null;
};

export type PivotFilter = {
  // 0-indexed column offset into the source range. -1 when the filter
  // references a connected data source column instead.
  sourceColumn: number;
  // For "show only these values" filters: the explicit visible value list.
  // Empty when the filter is condition-based.
  visibleValues: string[];
  // For condition-based filters: the BooleanCondition type
  // (TEXT_CONTAINS, NUMBER_GREATER, CUSTOM_FORMULA, etc.). Null when the
  // filter is a `visibleValues` allowlist.
  conditionType: string | null;
  // For condition-based filters: the raw condition values. Empty when
  // `conditionType` is null.
  conditionValues: string[];
};

export type PivotTable = {
  // Source range in A1 form (e.g. "Campaigns!A1:G61"). Empty when the pivot
  // reads from a connected data source rather than a grid range.
  source: string;
  rows: PivotGroup[];
  columns: PivotGroup[];
  values: PivotValue[];
  // Filters applied to source columns BEFORE the pivot aggregates.
  filters: PivotFilter[];
  // Whether values are listed as columns (HORIZONTAL) or as rows (VERTICAL).
  valueLayout: "HORIZONTAL" | "VERTICAL";
};

// ---------------------------------------------------------------------------
// Smart chips. The Sheets API exposes them as `chipRuns[]` on a cell. Each
// run has a `startIndex` plus a `Chip` that is either a person chip or a
// rich-link chip (which covers files, places, finance, calendar, YouTube
// — all distinguishable by `mimeType`).
// ---------------------------------------------------------------------------

export type SmartChip = {
  // 0-indexed character position in the cell text where this chip sits.
  startIndex: number;
  kind: "person" | "rich-link";
  // For person chips: the linked email address. Null otherwise.
  email: string | null;
  // For rich-link chips: the URI the chip resolves to. Null for person chips.
  uri: string | null;
  // For rich-link chips: the mimeType, which classifies the chip subtype:
  //   application/vnd.google-apps.spreadsheet → file (Sheet)
  //   application/vnd.google-apps.document    → file (Doc)
  //   application/vnd.google-apps.drive-sdk    → file (generic Drive)
  //   text/html                                → web link
  //   And bespoke values for place/finance/calendar/YouTube chips.
  // Null for person chips.
  mimeType: string | null;
};

// ---------------------------------------------------------------------------
// Charts. Slim view of the Sheets API EmbeddedChart resource. Anchor info
// helps graders assert "the chart sits at K1 on Campaigns" — the same
// pattern as pivot tables.
// ---------------------------------------------------------------------------

export type ChartSpec = {
  chartId: number;
  // The chart family. One of: "basic" | "pie" | "bubble" | "scorecard" |
  // "treemap" | "candlestick" | "histogram" | "waterfall" | "org" | "unknown".
  // Almost everything in adtech dashboards is "basic" or "pie".
  family: string;
  // For basic charts only: BAR | LINE | AREA | COLUMN | SCATTER | COMBO |
  // STEPPED_AREA. Null for non-basic charts.
  basicChartType: string | null;
  // Chart title text. Null when no title is set.
  title: string | null;
  // Sheet title where the chart is anchored (overlay position). Null when
  // the chart occupies its own dedicated sheet.
  anchorSheet: string | null;
  // Top-left anchor cell in A1 form (e.g. "K1") for overlay charts. Null for
  // own-sheet charts.
  anchorCell: string | null;
  // Number of data series (basic chart) or 1 (pie chart).
  seriesCount: number;
  // Legend position label. Common values: BOTTOM_LEGEND, RIGHT_LEGEND,
  // TOP_LEGEND, NO_LEGEND. Null when unset.
  legendPosition: string | null;
};

// ---------------------------------------------------------------------------
// Drive permissions. Slim view of the Drive API Permission resource. Used
// by lessons that grade sharing/permissions on the spreadsheet file itself
// (which Sheets API doesn't expose — permissions are file-level, in Drive).
// ---------------------------------------------------------------------------

export type DrivePermission = {
  id: string;
  // "user" | "group" | "domain" | "anyone".
  type: string;
  // "owner" | "writer" | "commenter" | "reader" | "organizer" | "fileOrganizer".
  role: string;
  // For user / group permissions. Null otherwise.
  email: string | null;
  // For domain permissions. Null otherwise.
  domain: string | null;
  // Optional expiration timestamp (RFC 3339 / ISO 8601). Null when the
  // permission has no expiration.
  expirationTime: string | null;
  // Optional display name. Useful for grader feedback messages, never used
  // for assertion logic.
  displayName: string | null;
};

// ---------------------------------------------------------------------------
// Apps Script projects. Track 3 lessons grade JavaScript source the learner
// edits in the bound Apps Script editor (the one Sheets exposes via
// Extensions > Apps Script). The Apps Script API exposes the project as an
// ordered list of files; each file is a Code.gs (SERVER_JS), a sidebar
// dialog HTML (HTML), or the project manifest (JSON, always named
// "appsscript"). Function names declared in SERVER_JS files are surfaced
// separately so graders can assert "the learner defined `usdToILS`" without
// re-implementing a JS parser.
// ---------------------------------------------------------------------------

export type AppsScriptFile = {
  // File name without the extension. The Apps Script editor shows the same
  // name. The manifest is always named "appsscript".
  name: string;
  // SERVER_JS = Code.gs, HTML = sidebar/dialog, JSON = appsscript manifest.
  type: "SERVER_JS" | "HTML" | "JSON";
  // Full text of the file. SERVER_JS files contain the JavaScript source
  // the learner is graded against.
  source: string;
  // Top-level function names declared in this file. Empty for HTML/JSON
  // files. Surfaced by the Apps Script API on the FunctionSet response;
  // graders use this to assert presence of a named function without
  // having to parse the JS source themselves.
  functions: string[];
};

export type AppsScriptProject = {
  scriptId: string;
  // The bound script's title. Apps Script API populates this on `projects.get`
  // but not on `projects.getContent`; the GoogleSheetsReader fetches both
  // together so this stays populated. May be null for InMemoryReader fixtures
  // that don't bother setting it.
  title: string | null;
  files: AppsScriptFile[];
};

export type SheetReader = {
  cellValue(a1: string): Promise<CellValue>;
  cellFormula(a1: string): Promise<string | null>;
  rangeValues(a1: string): Promise<CellValue[][]>;
  rangeFormulas(a1: string): Promise<(string | null)[][]>;
  namedRange(name: string): Promise<{ a1: string; values: CellValue[][] } | null>;
  sheetTitles(): Promise<string[]>;
  // Data validation rule on a single cell. Null when no rule is set.
  cellValidation(a1: string): Promise<DataValidationRule | null>;
  // Number format on a single cell. Null when the cell uses the default.
  cellNumberFormat(a1: string): Promise<NumberFormat | null>;
  // Cell note (the small inline annotation, distinct from threaded comments).
  cellNote(a1: string): Promise<string | null>;
  // All conditional-format rules on a sheet. Defaults to the first sheet.
  conditionalFormats(sheetTitle?: string): Promise<ConditionalFormatRule[]>;
  // All protected ranges on a sheet. Defaults to the first sheet.
  protectedRanges(sheetTitle?: string): Promise<ProtectedRange[]>;
  // Names of filter views defined on a sheet. Defaults to the first sheet.
  filterViewTitles(sheetTitle?: string): Promise<string[]>;
  // Pivot table anchored at the given cell (its top-left corner). Null
  // when the cell is not the anchor of any pivot.
  cellPivotTable(a1: string): Promise<PivotTable | null>;
  // Smart chip runs in the given cell, ordered by startIndex.
  cellChips(a1: string): Promise<SmartChip[]>;
  // All charts on a sheet. Defaults to the first sheet.
  charts(sheetTitle?: string): Promise<ChartSpec[]>;
  // All permissions on the spreadsheet's underlying Drive file. Permissions
  // are file-level (the Drive API surface), not sheet-level — that's why
  // this method takes no sheet argument.
  filePermissions(): Promise<DrivePermission[]>;
  // Source code of the Apps Script project bound to this spreadsheet.
  // Null when no script is bound (or when the reader was constructed
  // without a scriptId). Track 3 lessons grade against this content.
  scriptContent(): Promise<AppsScriptProject | null>;
};

export type RuleResult = {
  passed: boolean;
  detail?: string;
  // Optional Hebrew counterpart of `detail` — the same hint/correction
  // expressed in Hebrew per `lib/i18n/glossary.md`. The sidebar companion
  // picks `detail` or `detailHe` based on the active locale.
  detailHe?: string;
};

export type Rule = {
  id: string;
  label: string;
  // Optional Hebrew counterpart of `label`. Same precedence rules as
  // `detailHe` above.
  labelHe?: string;
  weight?: number;
  // Optional canonical answer surfaced via the in-sheet sidebar's
  // "Show answer" reveal. Author-time string — typically the expected
  // formula or value the rule grades for. Used by the sidebar companion;
  // ignored by the grader.
  answer?: string;
  run(sheet: SheetReader): Promise<RuleResult>;
};

export type JudgeTrigger = "always" | "on-rules-pass" | "on-rules-fail";

export type JudgeSpec = {
  prompt: string;
  trigger: JudgeTrigger;
  model?: "claude-sonnet-4-6" | "claude-opus-4-7" | "claude-haiku-4-5";
};

export type SheetSeedCell = {
  a1: string;
  value?: CellValue;
  formula?: string;
};

export type SheetSeedNamedRange = {
  name: string;
  range: string;
};

export type SheetSeed = {
  tabTitle?: string;
  cells: SheetSeedCell[];
  namedRanges?: SheetSeedNamedRange[];
};

// Track 3 (Apps Script) lessons can seed the bound script with starter
// JavaScript so the learner has a function stub to flesh out instead of a
// blank Code.gs. Only the SERVER_JS / HTML files the lesson cares about
// belong here — the manifest and the sidebar shell come from the standard
// provisioner. Files supplied here override files of the same name in the
// default bundle.
export type SeedScriptFile = {
  // File name without extension. Conventional name for the entry point is
  // "Lesson" so it doesn't collide with the sidebar shell at "Code".
  name: string;
  type: "SERVER_JS" | "HTML";
  source: string;
};

export type AssignmentSpec = {
  id: string;
  lessonSlug: string;
  templateSheetId: string | null;
  seed?: SheetSeed;
  // Optional bound-script starter files. Track 3 lessons set this; other
  // tracks leave it undefined and the bound script keeps the default
  // sidebar-only bundle.
  seedScript?: SeedScriptFile[];
  rules: Rule[];
  judge?: JudgeSpec;
};

export type CheckOutcome = {
  ruleId: string;
  name: string;
  // Optional Hebrew label for the rule (mirrors Rule.labelHe).
  nameHe?: string;
  passed: boolean;
  weight: number;
  detail?: string;
  // Optional Hebrew hint/correction for this rule outcome (mirrors RuleResult.detailHe).
  detailHe?: string;
};

export type GradeResult = {
  score: number;
  passed: boolean;
  gradedBy: "rules" | "claude" | "both";
  feedback: {
    summary: string;
    // Optional Hebrew counterpart of `summary`. The UI picks based on locale.
    summaryHe?: string;
    checks: CheckOutcome[];
    judgeNotes?: string;
  };
};
