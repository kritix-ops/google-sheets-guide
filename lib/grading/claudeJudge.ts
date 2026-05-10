import Anthropic from "@anthropic-ai/sdk";

import { JUDGE_SYSTEM_PROMPT } from "./judgePrompt";
import type {
  AssignmentSpec,
  GradeResult,
  JudgeSpec,
  SheetReader,
} from "./types";

type JudgeModel = NonNullable<JudgeSpec["model"]>;

const MODEL_IDS: Record<JudgeModel, string> = {
  "claude-sonnet-4-6": "claude-sonnet-4-6",
  "claude-opus-4-7": "claude-opus-4-7",
  "claude-haiku-4-5": "claude-haiku-4-5",
};

const JUDGE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    overall: {
      type: "object",
      properties: {
        summary: { type: "string" },
        passed: { type: "boolean" },
      },
      required: ["summary", "passed"],
      additionalProperties: false,
    },
    perCheckNotes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ruleId: { type: "string" },
          note: { type: "string" },
        },
        required: ["ruleId", "note"],
        additionalProperties: false,
      },
    },
  },
  required: ["overall", "perCheckNotes"],
  additionalProperties: false,
} as const;

export type JudgeOutput = {
  overall: { summary: string; passed: boolean };
  perCheckNotes: Array<{ ruleId: string; note: string }>;
};

export type JudgeUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
};

export type JudgeRunResult = {
  output: JudgeOutput;
  usage: JudgeUsage;
};

export type JudgeContext = {
  assignment: AssignmentSpec;
  rulesResult: GradeResult;
  sheet: SheetReader;
};

export type JudgeClient = {
  messages: {
    create(
      params: Anthropic.MessageCreateParamsNonStreaming,
    ): Promise<Anthropic.Message>;
  };
};

export type JudgeRunOptions = {
  client?: JudgeClient;
};

export async function runClaudeJudge(
  ctx: JudgeContext,
  options: JudgeRunOptions = {},
): Promise<JudgeRunResult> {
  const { assignment, rulesResult } = ctx;
  if (!assignment.judge) {
    throw new Error(
      `assignment ${assignment.id} has no judge spec; gate the call with assignment.judge before invoking runClaudeJudge`,
    );
  }

  const client = options.client ?? new Anthropic();
  const model = MODEL_IDS[assignment.judge.model ?? "claude-sonnet-4-6"];
  const userMessage = buildUserMessage(ctx, assignment.judge);

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: JUDGE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: JUDGE_OUTPUT_SCHEMA },
    },
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude judge returned no text block");
  }

  let parsed: JudgeOutput;
  try {
    parsed = JSON.parse(textBlock.text) as JudgeOutput;
  } catch (err) {
    throw new Error(
      `Claude judge response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  validateJudgeOutput(parsed);

  return {
    output: parsed,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    },
  };
}

function buildUserMessage(ctx: JudgeContext, judge: JudgeSpec): string {
  const { assignment, rulesResult } = ctx;
  const checksSummary = rulesResult.feedback.checks.map((c) => ({
    ruleId: c.ruleId,
    name: c.name,
    passed: c.passed,
    detail: c.detail,
  }));

  return [
    `Assignment: ${assignment.lessonSlug} / ${assignment.id}`,
    `Deterministic verdict: score=${rulesResult.score}, passed=${rulesResult.passed}`,
    "",
    "Deterministic check results:",
    JSON.stringify(checksSummary, null, 2),
    "",
    "Lesson author's judge prompt:",
    judge.prompt,
    "",
    "Return JSON matching the schema. Skip per-check notes for any rule where the deterministic detail is already sufficient. Be specific.",
  ].join("\n");
}

function validateJudgeOutput(value: unknown): asserts value is JudgeOutput {
  if (!value || typeof value !== "object") {
    throw new Error("judge output is not an object");
  }
  const v = value as Record<string, unknown>;
  if (!v.overall || typeof v.overall !== "object") {
    throw new Error("judge output missing 'overall'");
  }
  const overall = v.overall as Record<string, unknown>;
  if (typeof overall.summary !== "string") {
    throw new Error("judge output 'overall.summary' is not a string");
  }
  if (typeof overall.passed !== "boolean") {
    throw new Error("judge output 'overall.passed' is not a boolean");
  }
  if (!Array.isArray(v.perCheckNotes)) {
    throw new Error("judge output 'perCheckNotes' is not an array");
  }
  for (const note of v.perCheckNotes) {
    if (!note || typeof note !== "object") {
      throw new Error("judge output 'perCheckNotes' item is not an object");
    }
    const n = note as Record<string, unknown>;
    if (typeof n.ruleId !== "string" || typeof n.note !== "string") {
      throw new Error(
        "judge output 'perCheckNotes' item missing ruleId or note",
      );
    }
  }
}
