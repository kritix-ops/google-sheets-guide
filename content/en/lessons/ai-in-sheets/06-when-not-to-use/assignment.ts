import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, CellValue } from "@/lib/grading/types";

function asString(value: CellValue): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return String(value);
}

// The lesson is a four-rule decision framework. Each rule grades a literal
// "decision rule" string the learner writes. The grader looks for the
// concept keywords that make the rule operational, not the prose.

const a1AuditRule: Rule = {
  id: "a1-audit-rule",
  label: "A1 captures the audit-trail rule (don't use AI() for audit-sensitive numbers)",
  labelHe: "התא A1 לוכד את חוק ה-audit-trail (לא להשתמש ב-AI() למספרים שדורשים audit)",
  answer:
    '"Don\'t use AI() for audit-sensitive calculations: outputs are not reproducible and leave no audit trail"',
  async run(sheet) {
    const value = await sheet.cellValue("A1");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'A1 is empty. Write the literal decision rule: when should AI be avoided for audit-sensitive work? The rule must contain `audit` and either `reproducible` or `trail`. Example: `Don\'t use AI() for audit-sensitive calculations: outputs are not reproducible and leave no audit trail.`',
        detailHe:
          'התא A1 ריק. כותבים את כלל ההחלטה הספרותי: מתי נמנעים מ-AI לעבודה שדורשת audit? הכלל חייב להכיל `audit` וגם `reproducible` או `trail`. דוגמה: `Don\'t use AI() for audit-sensitive calculations: outputs are not reproducible and leave no audit trail.`',
      };
    }
    const lower = str.toLowerCase();
    const hasAudit = lower.includes("audit");
    const hasReproducibleOrTrail =
      lower.includes("reproducible") || lower.includes("trail");
    if (!hasAudit || !hasReproducibleOrTrail) {
      const missing: string[] = [];
      if (!hasAudit) missing.push("`audit`");
      if (!hasReproducibleOrTrail) missing.push("`reproducible` or `trail`");
      return {
        passed: false,
        detail: `A1 reads \`${str}\` and is missing: ${missing.join(", ")}. The audit rule names the two operational facts: outputs are non-deterministic so they can't be reproduced, and they leave no formula trace.`,
        detailHe: `התא A1 מכיל \`${str}\` וחסר: ${missing.join(", ")}. כלל ה-audit מציין את שתי העובדות התפעוליות: ה-outputs אינם דטרמיניסטיים אז לא ניתן לשחזרם, ואינם משאירים עקבות נוסחה.`,
      };
    }
    return { passed: true };
  },
};

const a2VolumeRule: Rule = {
  id: "a2-volume-rule",
  label: "A2 captures the high-volume rule (cost/quota per row burns fast)",
  labelHe: "התא A2 לוכד את חוק הנפח הגבוה (cost/quota פר-row נגמר מהר)",
  answer:
    '"Don\'t use AI() per row on large datasets: 50K rows means 50K paid calls and quota burn"',
  async run(sheet) {
    const value = await sheet.cellValue("A2");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'A2 is empty. Write the decision rule for high-volume AI() use. The rule must contain `quota` or `cost`, and the word `row`. Example: `Don\'t use AI() per row on large datasets: 50K rows means 50K paid calls and quota burn.`',
        detailHe:
          'התא A2 ריק. כותבים את כלל ההחלטה לשימוש ב-AI() בנפח גבוה. הכלל חייב להכיל `quota` או `cost`, וגם את המילה `row`. דוגמה: `Don\'t use AI() per row on large datasets: 50K rows means 50K paid calls and quota burn.`',
      };
    }
    const lower = str.toLowerCase();
    const hasQuotaOrCost = lower.includes("quota") || lower.includes("cost");
    const hasRow = lower.includes("row");
    if (!hasQuotaOrCost || !hasRow) {
      const missing: string[] = [];
      if (!hasQuotaOrCost) missing.push("`quota` or `cost`");
      if (!hasRow) missing.push("`row`");
      return {
        passed: false,
        detail: `A2 reads \`${str}\` and is missing: ${missing.join(", ")}. The volume rule has to name the unit: per-row AI calls multiply, and so does the bill.`,
        detailHe: `התא A2 מכיל \`${str}\` וחסר: ${missing.join(", ")}. כלל הנפח חייב לציין את היחידה: קריאות AI פר-row מכפילות את עצמן, וכך גם החשבון.`,
      };
    }
    return { passed: true };
  },
};

const a3PiiRule: Rule = {
  id: "a3-pii-rule",
  label: "A3 captures the PII rule (check privacy/Workspace plan before sending PII)",
  labelHe: "התא A3 לוכד את חוק ה-PII (לבדוק privacy/Workspace plan לפני ששולחים PII)",
  answer:
    '"Don\'t send PII through AI() without checking your Workspace plan\'s data-handling terms"',
  async run(sheet) {
    const value = await sheet.cellValue("A3");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'A3 is empty. Write the decision rule for PII. The rule must contain the literal `PII` and one of `privacy`, `Workspace`, or `plan`. Example: `Don\'t send PII through AI() without checking your Workspace plan\'s data-handling terms.`',
        detailHe:
          'התא A3 ריק. כותבים את כלל ההחלטה ל-PII. הכלל חייב להכיל את `PII` הספרותי, ואחד מ-`privacy`, `Workspace`, או `plan`. דוגמה: `Don\'t send PII through AI() without checking your Workspace plan\'s data-handling terms.`',
      };
    }
    // PII is case-sensitive in usage (uppercase). The grader checks for the
    // literal token (case-insensitive in code, but the lesson teaches the
    // uppercase form). Other terms are case-insensitive.
    const lower = str.toLowerCase();
    const hasPii = lower.includes("pii");
    const hasPrivacyOrWorkspaceOrPlan =
      lower.includes("privacy") ||
      lower.includes("workspace") ||
      lower.includes("plan");
    if (!hasPii || !hasPrivacyOrWorkspaceOrPlan) {
      const missing: string[] = [];
      if (!hasPii) missing.push("`PII`");
      if (!hasPrivacyOrWorkspaceOrPlan)
        missing.push("`privacy`, `Workspace`, or `plan`");
      return {
        passed: false,
        detail: `A3 reads \`${str}\` and is missing: ${missing.join(", ")}. The PII rule has to name the data type and the gating question: which Workspace plan is in use and what does it allow.`,
        detailHe: `התא A3 מכיל \`${str}\` וחסר: ${missing.join(", ")}. כלל ה-PII חייב לציין את סוג הנתונים ואת שאלת השער: איזה Workspace plan בשימוש ומה הוא מאפשר.`,
      };
    }
    return { passed: true };
  },
};

const a4DeterministicRule: Rule = {
  id: "a4-deterministic-rule",
  label:
    "A4 captures the deterministic-transform rule (use a formula when one will do)",
  labelHe:
    "התא A4 לוכד את חוק הטרנספורמציה הדטרמיניסטית (משתמשים בנוסחה כשנוסחה תעשה את העבודה)",
  answer:
    '"If a deterministic formula like SUBSTITUTE or REGEXEXTRACT works, use it instead of AI()"',
  async run(sheet) {
    const value = await sheet.cellValue("A4");
    const str = asString(value);
    if (str == null || str.trim() === "") {
      return {
        passed: false,
        detail:
          'A4 is empty. Write the decision rule for deterministic transforms. The rule must contain `deterministic` or `formula`, and one of `SUBSTITUTE`, `REGEXEXTRACT`, or the phrase `specific formula`. Example: `If a deterministic formula like SUBSTITUTE or REGEXEXTRACT works, use it instead of AI().`',
        detailHe:
          'התא A4 ריק. כותבים את כלל ההחלטה לטרנספורמציות דטרמיניסטיות. הכלל חייב להכיל `deterministic` או `formula`, ואחד מ-`SUBSTITUTE`, `REGEXEXTRACT`, או הביטוי `specific formula`. דוגמה: `If a deterministic formula like SUBSTITUTE or REGEXEXTRACT works, use it instead of AI().`',
      };
    }
    const lower = str.toLowerCase();
    const hasDeterministicOrFormula =
      lower.includes("deterministic") || lower.includes("formula");
    const hasNamedFormula =
      lower.includes("substitute") ||
      lower.includes("regexextract") ||
      lower.includes("specific formula");
    if (!hasDeterministicOrFormula || !hasNamedFormula) {
      const missing: string[] = [];
      if (!hasDeterministicOrFormula) missing.push("`deterministic` or `formula`");
      if (!hasNamedFormula)
        missing.push("`SUBSTITUTE`, `REGEXEXTRACT`, or `specific formula`");
      return {
        passed: false,
        detail: `A4 reads \`${str}\` and is missing: ${missing.join(", ")}. The rule has to point at the cheaper alternative. "Use a formula instead" works only if you name a specific candidate.`,
        detailHe: `התא A4 מכיל \`${str}\` וחסר: ${missing.join(", ")}. הכלל חייב להצביע על האלטרנטיבה הזולה יותר. "Use a formula instead" עובד רק אם מצביעים על מועמד ספציפי.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "ai-06-when-not-to-use",
  lessonSlug: "ai-in-sheets/06-when-not-to-use",
  templateSheetId: null,
  seed: {
    tabTitle: "Decisions",
    cells: [
      // Pre-seed CAMPAIGNS_LARGE on the same tab so the learner has the data
      // present while writing decision rules about it. Start at column C so
      // columns A and B stay free for the four rule strings (A1:A4) and an
      // optional column-B label set the learner can ignore.
      ...dataToCells(CAMPAIGNS_LARGE, 3, 1),
      { a1: "B1", value: "Rule: audit-trail" },
      { a1: "B2", value: "Rule: high-volume" },
      { a1: "B3", value: "Rule: PII" },
      { a1: "B4", value: "Rule: deterministic transform" },
    ],
  },
  rules: [a1AuditRule, a2VolumeRule, a3PiiRule, a4DeterministicRule],
};
