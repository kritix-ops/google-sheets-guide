import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";

import { gradeAttempt } from "../index";
import type { JudgeClient } from "../claudeJudge";
import { InMemoryReader } from "../sheetReader";
import type { AssignmentSpec, Rule } from "../types";

function judgeResponse(text: string): Anthropic.Message {
  return {
    id: "msg_orch",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-4-6",
    stop_reason: "end_turn",
    stop_sequence: null,
    content: [{ type: "text", text, citations: null }],
    usage: {
      input_tokens: 800,
      output_tokens: 200,
      cache_read_input_tokens: 700,
      cache_creation_input_tokens: 0,
    },
  } as Anthropic.Message;
}

function mockClient(text: string): { client: JudgeClient; create: ReturnType<typeof vi.fn> } {
  const create = vi.fn().mockResolvedValue(judgeResponse(text));
  return { client: { messages: { create } } as JudgeClient, create };
}

const sheet = new InMemoryReader({ sheets: { Sheet1: {} } });

const passing: Rule = { id: "p", label: "p", async run() { return { passed: true }; } };
const failing: Rule = { id: "f", label: "f", async run() { return { passed: false, detail: "f failed" }; } };

describe("gradeAttempt", () => {
  it("returns rules-only result when assignment has no judge", async () => {
    const assignment: AssignmentSpec = {
      id: "no-judge",
      lessonSlug: "x",
      templateSheetId: null,
      rules: [passing, failing],
    };
    const { create } = mockClient("never called");
    const result = await gradeAttempt(assignment, sheet);
    expect(result.gradedBy).toBe("rules");
    expect(create).not.toHaveBeenCalled();
  });

  it("invokes the judge when trigger is 'always'", async () => {
    const assignment: AssignmentSpec = {
      id: "always",
      lessonSlug: "x",
      templateSheetId: null,
      rules: [passing, passing],
      judge: { prompt: "evaluate", trigger: "always" },
    };
    const { client, create } = mockClient(
      JSON.stringify({
        overall: { summary: "Solid work, especially on edge cases.", passed: true },
        perCheckNotes: [],
      }),
    );
    const result = await gradeAttempt(assignment, sheet, { client });
    expect(create).toHaveBeenCalledOnce();
    expect(result.gradedBy).toBe("both");
    expect(result.feedback.summary).toBe("Solid work, especially on edge cases.");
  });

  it("skips the judge when trigger is 'on-rules-fail' and rules pass", async () => {
    const assignment: AssignmentSpec = {
      id: "on-fail",
      lessonSlug: "x",
      templateSheetId: null,
      rules: [passing, passing],
      judge: { prompt: "explain failures", trigger: "on-rules-fail" },
    };
    const { client, create } = mockClient("never called");
    const result = await gradeAttempt(assignment, sheet, { client });
    expect(create).not.toHaveBeenCalled();
    expect(result.gradedBy).toBe("rules");
  });

  it("invokes the judge when trigger is 'on-rules-fail' and rules fail", async () => {
    const assignment: AssignmentSpec = {
      id: "on-fail",
      lessonSlug: "x",
      templateSheetId: null,
      rules: [failing, failing],
      judge: { prompt: "explain failures", trigger: "on-rules-fail" },
    };
    const { client, create } = mockClient(
      JSON.stringify({
        overall: { summary: "Two formulas point at the wrong column.", passed: false },
        perCheckNotes: [],
      }),
    );
    await gradeAttempt(assignment, sheet, { client });
    expect(create).toHaveBeenCalledOnce();
  });

  it("merges judge per-check notes into the matching check details", async () => {
    const assignment: AssignmentSpec = {
      id: "merge",
      lessonSlug: "x",
      templateSheetId: null,
      rules: [failing],
      judge: { prompt: "p", trigger: "always" },
    };
    const { client } = mockClient(
      JSON.stringify({
        overall: { summary: "summary", passed: false },
        perCheckNotes: [{ ruleId: "f", note: "Replace with `=$B$5`." }],
      }),
    );
    const result = await gradeAttempt(assignment, sheet, { client });
    const merged = result.feedback.checks.find((c) => c.ruleId === "f");
    expect(merged?.detail).toContain("f failed");
    expect(merged?.detail).toContain("Judge note: Replace with `=$B$5`.");
  });

  it("preserves the rules-layer pass/fail verdict even when the judge disagrees", async () => {
    const assignment: AssignmentSpec = {
      id: "disagree",
      lessonSlug: "x",
      templateSheetId: null,
      rules: [passing, passing],
      judge: { prompt: "p", trigger: "always" },
    };
    const { client } = mockClient(
      JSON.stringify({
        overall: { summary: "doesn't really get it", passed: false },
        perCheckNotes: [],
      }),
    );
    const result = await gradeAttempt(assignment, sheet, { client });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback.summary).toBe("doesn't really get it");
  });
});
