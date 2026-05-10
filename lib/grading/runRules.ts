import type {
  CheckOutcome,
  GradeResult,
  Rule,
  SheetReader,
} from "./types";

export type RunRulesOptions = {
  passThreshold?: number;
};

const DEFAULT_PASS_THRESHOLD = 0.8;

export async function runRules(
  rules: Rule[],
  sheet: SheetReader,
  options: RunRulesOptions = {},
): Promise<GradeResult> {
  const passThreshold = options.passThreshold ?? DEFAULT_PASS_THRESHOLD;

  const checks: CheckOutcome[] = [];
  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    let result: CheckOutcome;
    try {
      const ruleResult = await rule.run(sheet);
      result = {
        ruleId: rule.id,
        name: rule.label,
        ...(rule.labelHe ? { nameHe: rule.labelHe } : {}),
        passed: ruleResult.passed,
        weight,
        ...(ruleResult.detail !== undefined ? { detail: ruleResult.detail } : {}),
        ...(ruleResult.detailHe !== undefined ? { detailHe: ruleResult.detailHe } : {}),
      };
    } catch (err) {
      const detail =
        err instanceof Error
          ? `Rule errored: ${err.message}`
          : `Rule errored: ${String(err)}`;
      result = {
        ruleId: rule.id,
        name: rule.label,
        ...(rule.labelHe ? { nameHe: rule.labelHe } : {}),
        passed: false,
        weight,
        detail,
      };
    }
    checks.push(result);
  }

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks.reduce(
    (sum, c) => sum + (c.passed ? c.weight : 0),
    0,
  );
  const fraction = totalWeight === 0 ? 0 : earnedWeight / totalWeight;
  const score = Math.round(fraction * 100);
  const passed = totalWeight > 0 && fraction >= passThreshold;

  const failedCount = checks.filter((c) => !c.passed).length;
  const summary =
    totalWeight === 0
      ? "No rules ran."
      : passed
        ? `All ${checks.length} checks passed.`
        : `${failedCount} of ${checks.length} checks need attention.`;
  const summaryHe =
    totalWeight === 0
      ? "אף בדיקה לא רצה."
      : passed
        ? `כל ${checks.length} הבדיקות עברו.`
        : `${failedCount} מתוך ${checks.length} בדיקות דורשות תיקון.`;

  return {
    score,
    passed,
    gradedBy: "rules",
    feedback: { summary, summaryHe, checks },
  };
}
