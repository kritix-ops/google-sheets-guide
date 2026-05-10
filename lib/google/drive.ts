import type { drive_v3, sheets_v4 } from "googleapis";

import type {
  AssignmentSpec,
  SheetSeed,
  SheetSeedNamedRange,
} from "@/lib/grading/types";

export type ProvisionedSheet = {
  sheetId: string;
  sheetUrl: string;
};

export async function provisionAssignmentSheet(args: {
  drive: drive_v3.Drive;
  sheets: sheets_v4.Sheets;
  assignment: AssignmentSpec;
  userLabel?: string;
}): Promise<ProvisionedSheet> {
  const { drive, sheets, assignment, userLabel } = args;
  const title = buildTitle(assignment, userLabel);

  if (assignment.templateSheetId) {
    return copyTemplate(drive, assignment.templateSheetId, title);
  }
  if (!assignment.seed) {
    throw new Error(
      `assignment ${assignment.id} has neither templateSheetId nor seed; nothing to provision`,
    );
  }
  return createFromSeed(sheets, assignment.seed, title);
}

function buildTitle(assignment: AssignmentSpec, userLabel?: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `Sheets Guide — ${assignment.lessonSlug}`;
  return userLabel ? `${base} (${userLabel}, ${stamp})` : `${base} (${stamp})`;
}

async function copyTemplate(
  drive: drive_v3.Drive,
  templateSheetId: string,
  title: string,
): Promise<ProvisionedSheet> {
  const copy = await drive.files.copy({
    fileId: templateSheetId,
    requestBody: { name: title },
    fields: "id",
  });
  const sheetId = copy.data.id;
  if (!sheetId) {
    throw new Error("Drive copy response missing file id");
  }
  return { sheetId, sheetUrl: sheetUrl(sheetId) };
}

async function createFromSeed(
  sheets: sheets_v4.Sheets,
  seed: SheetSeed,
  title: string,
): Promise<ProvisionedSheet> {
  const tabTitle = seed.tabTitle ?? "Sheet1";
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: tabTitle, sheetId: 0 } }],
    },
    fields: "spreadsheetId,sheets(properties(sheetId,title))",
  });

  const sheetId = created.data.spreadsheetId;
  if (!sheetId) {
    throw new Error("Sheets create response missing spreadsheetId");
  }
  const tabId = created.data.sheets?.[0]?.properties?.sheetId ?? 0;

  if (seed.cells.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: seed.cells.map((c) => {
          const cellValue =
            c.formula !== undefined
              ? c.formula
              : c.value === undefined || c.value === null
                ? ""
                : c.value;
          return {
            range: `${tabTitle}!${c.a1}`,
            values: [[cellValue]],
          };
        }),
      },
    });
  }

  if (seed.namedRanges?.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: seed.namedRanges.map((nr) => ({
          addNamedRange: {
            namedRange: {
              name: nr.name,
              range: parseRangeToGrid(nr.range, tabId),
            },
          },
        })),
      },
    });
  }

  return { sheetId, sheetUrl: sheetUrl(sheetId) };
}

function sheetUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}

function parseRangeToGrid(
  rangeA1: string,
  defaultTabId: number,
): sheets_v4.Schema$GridRange {
  const ref = rangeA1.includes("!") ? rangeA1.split("!")[1] : rangeA1;
  const m = ref.match(/^\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/i);
  if (!m) {
    throw new Error(`bad named-range reference: ${rangeA1}`);
  }
  const startColumnIndex = colLettersToNum(m[1]) - 1;
  const startRowIndex = parseInt(m[2], 10) - 1;
  const endColumnIndex = colLettersToNum(m[3]);
  const endRowIndex = parseInt(m[4], 10);
  return {
    sheetId: defaultTabId,
    startRowIndex,
    endRowIndex,
    startColumnIndex,
    endColumnIndex,
  };
}

function colLettersToNum(col: string): number {
  let n = 0;
  for (const c of col.toUpperCase()) {
    n = n * 26 + (c.charCodeAt(0) - 64);
  }
  return n;
}

export const _internalForTests = {
  parseRangeToGrid,
  buildTitle,
};
