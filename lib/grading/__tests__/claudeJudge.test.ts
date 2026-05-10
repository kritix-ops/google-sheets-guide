import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";

import { runClaudeJudge, type JudgeClient } from "../claudeJudge";
import { InMemoryReader } from "../sheetReader";
import type { AssignmentSpec, GradeResult } from "../types";

function makeAnthropicMessage(
  text: string,
  usage: Partial<Anthropic.Usage> = {},
): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-4-6",
    stop_reason: "end_turn",
    stop_sequence: null,
    content: [{ type: "text", text, citations: null }],
    usage: {
      input_tokens: 1200,
      output_tokens: 320,
      cache_read_input_tokens: 1100,
      cache_creation_input_tokens: 0,
      ...usage,
    },
  } as Anthropic.Message;
}

function makeMockClient(
  message: Anthropic.Message,
): { client: JudgeClient; create: ReturnType<typeof vi.fn> } {
  const create = vi.fn().mockResolvedValue(message);
  return {
    client: { messages: { create } } as JudgeClient,
    create,
  };
}

const sheet = new InMemoryReader({ sheets: { Sheet1: {} } });

const baseAssignment: AssignmentSpec = {
  id: "test-assignment",
  lessonSlug: "formulas/01-grid-model",
  templateSheetId: null,
  rules: [],
  judge: {
    prompt: "Confirm the learner used absolute references where filling down requires it.",
    trigger: "always",
  },
};

const baseRulesResult: GradeResult = {
  score: 75,
  passed: false,
  gradedBy: "rules",
  feedback: {
    summary: "3 of 4 checks need attention.",
    checks: [
      { ruleId: "e1-relative-ref", name: "E1 relative", passed: true, weight: 1 },
      {
        ruleId: "e2-absolute-ref",
        name: "E2 absolute",
        passed: false,
        weight: 1,
        detail: "E2 contains `=B5` not `=$B$5`.",
      },
    ],
  },
};

describe("runClaudeJudge", () => {
  it("sends a cached system prompt and parses a valid JSON response", async () => {
    const judgeJson = {
      overall: {
        summary:
          "Your relative reference in E1 is correct. The absolute reference in E2 needs `$` on both column and row.",
        passed: false,
      },
      perCheckNotes: [
        {
          ruleId: "e2-absolute-ref",
          note: "Replace E2 with `=$B$5`.",
        },
      ],
    };
    const { client, create } = makeMockClient(
      makeAnthropicMessage(JSON.stringify(judgeJson)),
    );

    const result = await runClaudeJudge(
      { assignment: baseAssignment, rulesResult: baseRulesResult, sheet },
      { client },
    );

    expect(create).toHaveBeenCalledOnce();
    const params = create.mock.calls[0][0];
    expect(params.model).toBe("claude-sonnet-4-6");
    expect(Array.isArray(params.system)).toBe(true);
    expect(params.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(params.output_config?.format?.type).toBe("json_schema");

    expect(result.output.overall.passed).toBe(false);
    expect(result.output.perCheckNotes).toHaveLength(1);
    expect(result.usage.cacheReadTokens).toBe(1100);
    expect(result.usage.outputTokens).toBe(320);
  });

  it("uses the assignment-specified model when provided", async () => {
    const { client, create } = makeMockClient(
      makeAnthropicMessage(
        JSON.stringify({
          overall: { summary: "ok", passed: true },
          perCheckNotes: [],
        }),
      ),
    );

    await runClaudeJudge(
      {
        assignment: { ...baseAssignment, judge: { ...baseAssignment.judge!, model: "claude-opus-4-7" } },
        rulesResult: baseRulesResult,
        sheet,
      },
      { client },
    );

    expect(create.mock.calls[0][0].model).toBe("claude-opus-4-7");
  });

  it("throws when the response is not valid JSON", async () => {
    const { client } = makeMockClient(makeAnthropicMessage("not json at all"));
    await expect(
      runClaudeJudge(
        { assignment: baseAssignment, rulesResult: baseRulesResult, sheet },
        { client },
      ),
    ).rejects.toThrow(/not valid JSON/);
  });

  it("throws when the response shape is wrong", async () => {
    const { client } = makeMockClient(
      makeAnthropicMessage(
        JSON.stringify({ overall: { summary: "missing passed" }, perCheckNotes: [] }),
      ),
    );
    await expect(
      runClaudeJudge(
        { assignment: baseAssignment, rulesResult: baseRulesResult, sheet },
        { client },
      ),
    ).rejects.toThrow(/overall.passed/);
  });

  it("throws when the assignment has no judge spec", async () => {
    const { client } = makeMockClient(makeAnthropicMessage("{}"));
    await expect(
      runClaudeJudge(
        {
          assignment: { ...baseAssignment, judge: undefined },
          rulesResult: baseRulesResult,
          sheet,
        },
        { client },
      ),
    ).rejects.toThrow(/no judge spec/);
  });
});
