"use client";

import { HyperFormula } from "hyperformula";
import { useEffect, useMemo, useRef, useState } from "react";

const LICENSE = "gpl-v3";

export type CellPrimitive = string | number | boolean | null;
export type SheetData = CellPrimitive[][];

export type SheetCell = {
  value: CellPrimitive;
  formula: string | null;
};

export type SheetEngine = {
  getCell(a1: string): SheetCell;
  setCell(a1: string, value: CellPrimitive): void;
  rows: number;
  cols: number;
  generation: number;
};

function colToNum(col: string): number {
  let n = 0;
  for (const c of col.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
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

export function a1ToCoords(a1: string): { col: number; row: number } {
  const m = a1.match(/^\$?([A-Z]+)\$?(\d+)$/i);
  if (!m) throw new Error(`Invalid A1 reference: ${a1}`);
  return { col: colToNum(m[1]) - 1, row: Number(m[2]) - 1 };
}

export function coordsToA1(col: number, row: number): string {
  return `${numToCol(col + 1)}${row + 1}`;
}

function isPlainCellValue(v: unknown): v is CellPrimitive {
  return (
    v == null ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  );
}

function normalizeData(data: SheetData): CellPrimitive[][] {
  return data.map((row) => row.map((c) => (c == null ? "" : c)));
}

export function useSheetEngine(data: SheetData): SheetEngine {
  const hfRef = useRef<HyperFormula | null>(null);
  const dimsRef = useRef({
    rows: data.length,
    cols: Math.max(0, ...data.map((r) => r.length)),
  });
  const isFirstSyncRef = useRef(true);
  const [generation, setGeneration] = useState(0);

  if (hfRef.current === null) {
    hfRef.current = HyperFormula.buildFromArray(normalizeData(data), {
      licenseKey: LICENSE,
    });
  }

  useEffect(() => {
    return () => {
      hfRef.current?.destroy();
      hfRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false;
      return;
    }
    const hf = hfRef.current;
    if (!hf) return;
    const targetRows = data.length;
    const targetCols = Math.max(0, ...data.map((r) => r.length));
    const currentDims = hf.getSheetDimensions(0);
    hf.batch(() => {
      for (let r = 0; r < targetRows; r++) {
        const row = data[r] ?? [];
        for (let c = 0; c < targetCols; c++) {
          const v = row[c];
          hf.setCellContents(
            { sheet: 0, col: c, row: r },
            v == null ? "" : String(v),
          );
        }
      }
      for (let r = targetRows; r < currentDims.height; r++) {
        for (let c = 0; c < currentDims.width; c++) {
          hf.setCellContents({ sheet: 0, col: c, row: r }, "");
        }
      }
    });
    dimsRef.current = { rows: targetRows, cols: targetCols };
    setGeneration((g) => g + 1);
  }, [data]);

  return useMemo<SheetEngine>(
    () => ({
      getCell(a1) {
        const hf = hfRef.current;
        if (!hf) return { value: null, formula: null };
        const { col, row } = a1ToCoords(a1);
        const raw = hf.getCellValue({ sheet: 0, col, row });
        const formula = hf.getCellFormula({ sheet: 0, col, row }) ?? null;
        const value = isPlainCellValue(raw) ? raw : String(raw);
        return { value, formula };
      },
      setCell(a1, value) {
        const hf = hfRef.current;
        if (!hf) return;
        const { col, row } = a1ToCoords(a1);
        hf.setCellContents(
          { sheet: 0, col, row },
          value == null ? "" : String(value),
        );
        const dims = hf.getSheetDimensions(0);
        dimsRef.current = { rows: dims.height, cols: dims.width };
        setGeneration((g) => g + 1);
      },
      get rows() {
        return dimsRef.current.rows;
      },
      get cols() {
        return dimsRef.current.cols;
      },
      generation,
    }),
    [generation],
  );
}
