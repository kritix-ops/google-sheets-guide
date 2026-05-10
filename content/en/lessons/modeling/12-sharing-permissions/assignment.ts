import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, DrivePermission, Rule } from "@/lib/grading/types";

// Lesson 12 grades Drive-level sharing permissions on the spreadsheet file.
// Sharing is a property of the file, not the data, and the grader reads back
// the permission list via SheetReader.filePermissions(), which mirrors the
// Drive API permissions.list endpoint. The seed provisions CAMPAIGNS_LARGE
// on a "Campaigns" tab so the workbook has real content worth sharing.

const AUDITOR_EMAIL = "auditor@external.com";
const TEAM_LEADS_EMAIL = "team-leads@flexelent.com";

function emailMatches(perm: DrivePermission, target: string): boolean {
  return (perm.email ?? "").toLowerCase() === target.toLowerCase();
}

const auditorCommenterShare: Rule = {
  id: "permissions-auditor-commenter-expiring",
  label:
    "auditor@external.com has commenter access with an expiration set in the future",
  labelHe:
    "ל-auditor@external.com יש גישת commenter עם expiration שמוגדר לעתיד",
  answer:
    "File → Share → add auditor@external.com → role: Commenter → Add expiration (any future date)",
  async run(sheet) {
    const perms = await sheet.filePermissions();
    const auditorPerms = perms.filter(
      (p) => p.type === "user" && emailMatches(p, AUDITOR_EMAIL),
    );
    if (auditorPerms.length === 0) {
      return {
        passed: false,
        detail: `No user permission for \`${AUDITOR_EMAIL}\` is set on the file. Open File → Share, add the auditor by email, set their role to Commenter, and use Add expiration to set a future date. External auditors get commenter (read + comment, no edit), and every external share carries an expiration so it can't outlive the engagement.`,
        detailHe: `אין הרשאת user עבור \`${AUDITOR_EMAIL}\` על הקובץ. פותחים File → Share, מוסיפים את ה-auditor לפי אימייל, מגדירים את התפקיד שלו ל-Commenter, ומשתמשים ב-Add expiration כדי לקבוע תאריך עתידי. auditors חיצוניים מקבלים commenter (קריאה והערות, בלי עריכה), ולכל שיתוף חיצוני יש expiration כך שהוא לא חי מעבר להתקשרות.`,
      };
    }
    const commenterPerm = auditorPerms.find((p) => p.role === "commenter");
    if (!commenterPerm) {
      const actualRole = auditorPerms[0]!.role;
      return {
        passed: false,
        detail: `\`${AUDITOR_EMAIL}\` is currently set as \`${actualRole}\`, not \`commenter\`. External auditors should be able to read the data and leave comments, but never change values. Change the role to Commenter in the share dialog.`,
        detailHe: `\`${AUDITOR_EMAIL}\` מוגדר כרגע כ-\`${actualRole}\`, לא כ-\`commenter\`. auditors חיצוניים אמורים לקרוא נתונים ולהשאיר תגובות, אבל לעולם לא לשנות ערכים. משנים את התפקיד ל-Commenter בדיאלוג השיתוף.`,
      };
    }
    if (commenterPerm.expirationTime == null) {
      return {
        passed: false,
        detail: `\`${AUDITOR_EMAIL}\` is a commenter, but has no expiration set. Every external share gets an expirationTime. Without one, the access lives forever, including past the end of the engagement. Click Add expiration in the share dialog and pick a future date (30 days is the team default).`,
        detailHe: `\`${AUDITOR_EMAIL}\` הוא commenter, אבל אין expiration מוגדר. לכל שיתוף חיצוני יש expirationTime. בלעדיו, הגישה חיה לנצח, כולל אחרי סוף ההתקשרות. לוחצים על Add expiration בדיאלוג השיתוף ובוחרים תאריך עתידי (30 ימים זאת ברירת המחדל של הצוות).`,
      };
    }
    return { passed: true };
  },
};

const teamLeadsWriterShare: Rule = {
  id: "permissions-team-leads-writer",
  label: "team-leads@flexelent.com has editor (writer) access",
  labelHe: "ל-team-leads@flexelent.com יש גישת editor (writer)",
  answer:
    "File → Share → add team-leads@flexelent.com → role: Editor (no expiration needed for an internal Group)",
  async run(sheet) {
    const perms = await sheet.filePermissions();
    const teamLeadPerms = perms.filter(
      (p) => p.type === "user" && emailMatches(p, TEAM_LEADS_EMAIL),
    );
    if (teamLeadPerms.length === 0) {
      return {
        passed: false,
        detail: `No user permission for \`${TEAM_LEADS_EMAIL}\` is set on the file. Open File → Share, add the team-leads address by email, and set the role to Editor. This is an internal Google Group, so no expiration is needed. When a team lead leaves, IT removes their account and the share drops automatically.`,
        detailHe: `אין הרשאת user עבור \`${TEAM_LEADS_EMAIL}\` על הקובץ. פותחים File → Share, מוסיפים את כתובת ה-team-leads לפי אימייל, ומגדירים את התפקיד ל-Editor. זה Google Group פנימי, אז לא צריך expiration. כשראש צוות עוזב, IT מסיר את החשבון והשיתוף נופל אוטומטית.`,
      };
    }
    const writerPerm = teamLeadPerms.find((p) => p.role === "writer");
    if (!writerPerm) {
      const actualRole = teamLeadPerms[0]!.role;
      return {
        passed: false,
        detail: `\`${TEAM_LEADS_EMAIL}\` is currently set as \`${actualRole}\`, not \`writer\`. The team-leads Group needs Editor access to maintain operational workbooks. Change the role to Editor in the share dialog (the Drive API value is \`writer\`).`,
        detailHe: `\`${TEAM_LEADS_EMAIL}\` מוגדר כרגע כ-\`${actualRole}\`, לא כ-\`writer\`. ל-Group של team-leads צריכה להיות גישת Editor כדי לתחזק את ה-spreadsheets התפעוליים. משנים את התפקיד ל-Editor בדיאלוג השיתוף (הערך ב-Drive API הוא \`writer\`).`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-12-sharing-permissions",
  lessonSlug: "modeling/12-sharing-permissions",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      { a1: "L1", value: "→ Open File → Share, then add:" },
      { a1: "L2", value: "auditor@external.com as Commenter, with an expiration in the future" },
      { a1: "L3", value: "team-leads@flexelent.com as Editor (no expiration needed)" },
    ],
  },
  rules: [auditorCommenterShare, teamLeadsWriterShare],
};
