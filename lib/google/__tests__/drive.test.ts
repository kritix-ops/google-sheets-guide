import type { drive_v3, sheets_v4 } from "googleapis";
import { describe, expect, it, vi } from "vitest";

import { provisionAssignmentSheet } from "../drive";
import type { AssignmentSpec } from "@/lib/grading/types";

function makeDriveMock(copyResponse: unknown = { data: { id: "copied-id" } }) {
  const copy = vi.fn().mockResolvedValue(copyResponse);
  const drive = { files: { copy } } as unknown as drive_v3.Drive;
  return { drive, copy };
}

function makeSheetsMock(opts: {
  createResponse?: unknown;
  valuesBatchUpdateResponse?: unknown;
  batchUpdateResponse?: unknown;
} = {}) {
  const create = vi.fn().mockResolvedValue(
    opts.createResponse ?? {
      data: {
        spreadsheetId: "fresh-id",
        sheets: [{ properties: { sheetId: 0, title: "Scores" } }],
      },
    },
  );
  const valuesBatchUpdate = vi.fn().mockResolvedValue(
    opts.valuesBatchUpdateResponse ?? { data: {} },
  );
  const batchUpdate = vi.fn().mockResolvedValue(
    opts.batchUpdateResponse ?? { data: {} },
  );
  const sheets = {
    spreadsheets: {
      create,
      batchUpdate,
      values: { batchUpdate: valuesBatchUpdate },
    },
  } as unknown as sheets_v4.Sheets;
  return { sheets, create, valuesBatchUpdate, batchUpdate };
}

const seedAssignment: AssignmentSpec = {
  id: "test-seed",
  lessonSlug: "test/seed",
  templateSheetId: null,
  rules: [],
  seed: {
    tabTitle: "Scores",
    cells: [
      { a1: "A1", value: "Name" },
      { a1: "B1", value: "Score" },
      { a1: "B2", value: 91 },
      { a1: "B3", formula: "=SUM(B2:B2)" },
    ],
    namedRanges: [{ name: "scores", range: "Scores!B2:B3" }],
  },
};

const templateAssignment: AssignmentSpec = {
  id: "test-template",
  lessonSlug: "test/template",
  templateSheetId: "TEMPLATE_ABC",
  rules: [],
};

describe("provisionAssignmentSheet", () => {
  it("copies via Drive when templateSheetId is set", async () => {
    const { drive, copy } = makeDriveMock();
    const { sheets } = makeSheetsMock();
    const result = await provisionAssignmentSheet({
      drive,
      sheets,
      assignment: templateAssignment,
      userLabel: "yoav@example.com",
    });
    expect(copy).toHaveBeenCalledOnce();
    const args = copy.mock.calls[0][0];
    expect(args.fileId).toBe("TEMPLATE_ABC");
    expect(args.requestBody.name).toContain("test/template");
    expect(args.requestBody.name).toContain("yoav@example.com");
    expect(result.sheetId).toBe("copied-id");
    expect(result.sheetUrl).toBe(
      "https://docs.google.com/spreadsheets/d/copied-id/edit",
    );
  });

  it("creates a fresh spreadsheet from the seed when there is no template", async () => {
    const { drive } = makeDriveMock();
    const { sheets, create, valuesBatchUpdate, batchUpdate } = makeSheetsMock();
    const result = await provisionAssignmentSheet({
      drive,
      sheets,
      assignment: seedAssignment,
    });

    expect(create).toHaveBeenCalledOnce();
    const createArgs = create.mock.calls[0][0];
    expect(createArgs.requestBody.sheets[0].properties.title).toBe("Scores");

    expect(valuesBatchUpdate).toHaveBeenCalledOnce();
    const batchArgs = valuesBatchUpdate.mock.calls[0][0];
    expect(batchArgs.requestBody.valueInputOption).toBe("USER_ENTERED");
    expect(batchArgs.requestBody.data).toHaveLength(4);
    const rangesWritten = batchArgs.requestBody.data.map(
      (d: { range: string }) => d.range,
    );
    expect(rangesWritten).toContain("Scores!A1");
    expect(rangesWritten).toContain("Scores!B3");
    const formulaCell = batchArgs.requestBody.data.find(
      (d: { range: string }) => d.range === "Scores!B3",
    );
    expect(formulaCell.values[0][0]).toBe("=SUM(B2:B2)");

    expect(batchUpdate).toHaveBeenCalledOnce();
    const namedReq = batchUpdate.mock.calls[0][0].requestBody.requests[0];
    expect(namedReq.addNamedRange.namedRange.name).toBe("scores");
    expect(namedReq.addNamedRange.namedRange.range).toEqual({
      sheetId: 0,
      startRowIndex: 1,
      endRowIndex: 3,
      startColumnIndex: 1,
      endColumnIndex: 2,
    });

    expect(result.sheetId).toBe("fresh-id");
  });

  it("skips the named-range request when the seed has none", async () => {
    const { drive } = makeDriveMock();
    const { sheets, batchUpdate } = makeSheetsMock();
    const noNames: AssignmentSpec = {
      ...seedAssignment,
      seed: { ...seedAssignment.seed!, namedRanges: undefined },
    };
    await provisionAssignmentSheet({ drive, sheets, assignment: noNames });
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it("throws when the assignment has neither a template nor a seed", async () => {
    const { drive } = makeDriveMock();
    const { sheets } = makeSheetsMock();
    const broken: AssignmentSpec = {
      id: "broken",
      lessonSlug: "x",
      templateSheetId: null,
      rules: [],
    };
    await expect(
      provisionAssignmentSheet({ drive, sheets, assignment: broken }),
    ).rejects.toThrow(/neither templateSheetId nor seed/);
  });
});
