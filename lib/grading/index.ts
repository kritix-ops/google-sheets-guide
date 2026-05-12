import { runClaudeJudge, type JudgeClient } from "./claudeJudge";
import { runRules } from "./runRules";
import type { AssignmentSpec, GradeResult, SheetReader } from "./types";

export type GradeAttemptOptions = {
  passThreshold?: number;
  client?: JudgeClient;
};

export async function gradeAttempt(
  assignment: AssignmentSpec,
  sheet: SheetReader,
  options: GradeAttemptOptions = {},
): Promise<GradeResult> {
  const rulesResult = await runRules(assignment.rules, sheet, {
    passThreshold: options.passThreshold,
  });

  const judge = assignment.judge;
  if (!judge) return rulesResult;

  const shouldRunJudge =
    judge.trigger === "always" ||
    (judge.trigger === "on-rules-pass" && rulesResult.passed) ||
    (judge.trigger === "on-rules-fail" && !rulesResult.passed);

  if (!shouldRunJudge) return rulesResult;

  const judgeResult = await runClaudeJudge(
    { assignment, rulesResult, sheet },
    { client: options.client },
  );

  const checksWithNotes = rulesResult.feedback.checks.map((check) => {
    const note = judgeResult.output.perCheckNotes.find(
      (n) => n.ruleId === check.ruleId,
    );
    if (!note) return check;
    return {
      ...check,
      detail: check.detail
        ? `${check.detail}\n\nJudge note: ${note.note}`
        : `Judge note: ${note.note}`,
    };
  });

  // The judge can write commentary but cannot decide the grade. We assemble
  // the recorded result here using rulesResult.score / rulesResult.passed
  // exclusively. If a future refactor accidentally reads
  // judgeResult.output.overall.passed into the final result, that's a
  // grading-bypass bug — keep this layered explicitly.
  return {
    score: rulesResult.score,
    passed: rulesResult.passed,
    gradedBy: "both",
    feedback: {
      summary: judgeResult.output.overall.summary,
      checks: checksWithNotes,
    },
  };
}

export { runRules } from "./runRules";
export { runClaudeJudge } from "./claudeJudge";
export { InMemoryReader } from "./sheetReader";
export type {
  AssignmentSpec,
  CellValue,
  CheckOutcome,
  GradeResult,
  JudgeSpec,
  JudgeTrigger,
  Rule,
  RuleResult,
  SheetReader,
} from "./types";
