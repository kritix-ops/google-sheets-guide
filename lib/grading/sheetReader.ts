import type {
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
} from "./types";

export type InMemoryCell = {
  value?: CellValue;
  formula?: string;
  validation?: DataValidationRule;
  numberFormat?: NumberFormat;
  note?: string;
  pivotTable?: PivotTable;
  chips?: SmartChip[];
};

export type InMemorySheetMetadata = {
  conditionalFormats?: ConditionalFormatRule[];
  protectedRanges?: ProtectedRange[];
  filterViewTitles?: string[];
  charts?: ChartSpec[];
};

export type InMemoryFixture = {
  defaultSheet?: string;
  sheets: Record<string, Record<string, InMemoryCell>>;
  // Optional per-sheet metadata, keyed by the same sheet titles used in `sheets`.
  sheetMeta?: Record<string, InMemorySheetMetadata>;
  namedRanges?: Record<string, { sheet: string; range: string }>;
  // Optional Drive-level permissions on the underlying file.
  filePermissions?: DrivePermission[];
  // Optional bound Apps Script project. When omitted, scriptContent() returns
  // null — same shape as a real spreadsheet without a bound script.
  scriptProject?: AppsScriptProject;
};

function colToNum(col: string): number {
  let n = 0;
  for (const c of col.toUpperCase()) {
    n = n * 26 + (c.charCodeAt(0) - 64);
  }
  return n;
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

type ParsedA1 = {
  sheet: string | null;
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
};

function parseA1(a1: string): ParsedA1 {
  const cleaned = a1.replace(/\s+/g, "");
  const bang = cleaned.indexOf("!");
  let sheet: string | null = null;
  let ref = cleaned;
  if (bang >= 0) {
    sheet = cleaned.slice(0, bang).replace(/^'|'$/g, "");
    ref = cleaned.slice(bang + 1);
  }
  const match = ref.match(/^\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/i);
  if (!match) {
    throw new Error(`Invalid A1 reference: ${a1}`);
  }
  const startCol = colToNum(match[1]);
  const startRow = Number(match[2]);
  const endCol = match[3] ? colToNum(match[3]) : startCol;
  const endRow = match[4] ? Number(match[4]) : startRow;
  return { sheet, startCol, startRow, endCol, endRow };
}

function canonicalCellRef(col: number, row: number): string {
  return `${numToCol(col)}${row}`;
}

export class InMemoryReader implements SheetReader {
  private readonly fixture: InMemoryFixture;
  private readonly defaultSheet: string;

  constructor(fixture: InMemoryFixture) {
    this.fixture = fixture;
    const sheetTitles = Object.keys(fixture.sheets);
    if (sheetTitles.length === 0) {
      throw new Error("InMemoryReader requires at least one sheet");
    }
    this.defaultSheet = fixture.defaultSheet ?? sheetTitles[0];
    if (!fixture.sheets[this.defaultSheet]) {
      throw new Error(`Default sheet "${this.defaultSheet}" not found in fixture`);
    }
  }

  private resolveSheet(parsed: ParsedA1): string {
    const sheet = parsed.sheet ?? this.defaultSheet;
    if (!this.fixture.sheets[sheet]) {
      throw new Error(`Sheet "${sheet}" not found`);
    }
    return sheet;
  }

  private cellAt(sheet: string, col: number, row: number): InMemoryCell {
    return this.fixture.sheets[sheet][canonicalCellRef(col, row)] ?? {};
  }

  async cellValue(a1: string): Promise<CellValue> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    return this.cellAt(sheet, parsed.startCol, parsed.startRow).value ?? null;
  }

  async cellFormula(a1: string): Promise<string | null> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    return this.cellAt(sheet, parsed.startCol, parsed.startRow).formula ?? null;
  }

  async rangeValues(a1: string): Promise<CellValue[][]> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    const result: CellValue[][] = [];
    for (let row = parsed.startRow; row <= parsed.endRow; row++) {
      const rowOut: CellValue[] = [];
      for (let col = parsed.startCol; col <= parsed.endCol; col++) {
        rowOut.push(this.cellAt(sheet, col, row).value ?? null);
      }
      result.push(rowOut);
    }
    return result;
  }

  async rangeFormulas(a1: string): Promise<(string | null)[][]> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    const result: (string | null)[][] = [];
    for (let row = parsed.startRow; row <= parsed.endRow; row++) {
      const rowOut: (string | null)[] = [];
      for (let col = parsed.startCol; col <= parsed.endCol; col++) {
        rowOut.push(this.cellAt(sheet, col, row).formula ?? null);
      }
      result.push(rowOut);
    }
    return result;
  }

  async namedRange(name: string): Promise<{ a1: string; values: CellValue[][] } | null> {
    const named = this.fixture.namedRanges?.[name];
    if (!named) return null;
    const a1 = `${named.sheet}!${named.range}`;
    return { a1, values: await this.rangeValues(a1) };
  }

  async sheetTitles(): Promise<string[]> {
    return Object.keys(this.fixture.sheets);
  }

  async cellValidation(a1: string): Promise<DataValidationRule | null> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    return (
      this.cellAt(sheet, parsed.startCol, parsed.startRow).validation ?? null
    );
  }

  async cellNumberFormat(a1: string): Promise<NumberFormat | null> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    return (
      this.cellAt(sheet, parsed.startCol, parsed.startRow).numberFormat ?? null
    );
  }

  async cellNote(a1: string): Promise<string | null> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    return this.cellAt(sheet, parsed.startCol, parsed.startRow).note ?? null;
  }

  async conditionalFormats(
    sheetTitle?: string,
  ): Promise<ConditionalFormatRule[]> {
    const sheet = sheetTitle ?? this.defaultSheet;
    return this.fixture.sheetMeta?.[sheet]?.conditionalFormats ?? [];
  }

  async protectedRanges(sheetTitle?: string): Promise<ProtectedRange[]> {
    const sheet = sheetTitle ?? this.defaultSheet;
    return this.fixture.sheetMeta?.[sheet]?.protectedRanges ?? [];
  }

  async filterViewTitles(sheetTitle?: string): Promise<string[]> {
    const sheet = sheetTitle ?? this.defaultSheet;
    return this.fixture.sheetMeta?.[sheet]?.filterViewTitles ?? [];
  }

  async cellPivotTable(a1: string): Promise<PivotTable | null> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    return (
      this.cellAt(sheet, parsed.startCol, parsed.startRow).pivotTable ?? null
    );
  }

  async cellChips(a1: string): Promise<SmartChip[]> {
    const parsed = parseA1(a1);
    const sheet = this.resolveSheet(parsed);
    const chips =
      this.cellAt(sheet, parsed.startCol, parsed.startRow).chips ?? [];
    return [...chips].sort((a, b) => a.startIndex - b.startIndex);
  }

  async charts(sheetTitle?: string): Promise<ChartSpec[]> {
    const sheet = sheetTitle ?? this.defaultSheet;
    return this.fixture.sheetMeta?.[sheet]?.charts ?? [];
  }

  async filePermissions(): Promise<DrivePermission[]> {
    return this.fixture.filePermissions ?? [];
  }

  async scriptContent(): Promise<AppsScriptProject | null> {
    return this.fixture.scriptProject ?? null;
  }
}
