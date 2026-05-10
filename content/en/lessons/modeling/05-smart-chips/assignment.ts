import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 5 grades smart chips the learner inserts via the @-mention picker in
// the Sheets UI. The seed provisions a clean copy of CAMPAIGNS_LARGE on the
// "Campaigns" tab and seeds a few inline labels pointing the learner at the
// new "Owners" tab they create. The grader reads cellChips() back through the
// SheetReader interface and asserts shape per cell.
//
// Three rules:
//   Owners!A2 -> person chip for yoav.cohen@flexelent.com (case-insensitive)
//   Owners!A3 -> person chip for dina.dayan@flexelent.com (case-insensitive)
//   Owners!B2 -> rich-link (file) chip whose mimeType is in the
//                "application/vnd.google-apps.*" Drive family

const DRIVE_MIME_PREFIX = "application/vnd.google-apps";

function emailsMatch(actual: string | null, expected: string): boolean {
  if (actual == null) return false;
  return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

function personChipRule(
  ruleId: string,
  cell: string,
  expectedEmail: string,
  displayName: string,
): Rule {
  return {
    id: ruleId,
    label: `${cell} has a person chip for ${displayName} (${expectedEmail})`,
    labelHe: `התא ${cell} מחזיק person chip של ${displayName} (${expectedEmail})`,
    answer: `Type @${expectedEmail.split("@")[0]} in ${cell} and pick ${displayName} from the chip-picker`,
    async run(sheet) {
      const chips = await sheet.cellChips(cell);
      if (chips.length === 0) {
        return {
          passed: false,
          detail: `${cell} has no smart chip. Type \`@${displayName.split(" ")[0]}\` in the cell and pick ${displayName} from the chip-picker so the cell becomes a person chip linked to ${expectedEmail}.`,
          detailHe: `אין smart chip ב-${cell}. מקלידים \`@${displayName.split(" ")[0]}\` בתא ובוחרים את ${displayName} מה-chip-picker כדי שהתא יהפוך ל-person chip שמקושר ל-${expectedEmail}.`,
        };
      }
      const personChip = chips.find((c) => c.kind === "person");
      if (!personChip) {
        const kinds = chips.map((c) => c.kind).join(", ");
        return {
          passed: false,
          detail: `${cell} has a chip but it is a ${kinds} chip, not a person chip. Remove it and re-insert via \`@${displayName.split(" ")[0]}\` so the picker offers Workspace people, not files or links.`,
          detailHe: `יש chip ב-${cell}, אבל זה chip מסוג ${kinds}, לא person chip. מוחקים ומוסיפים מחדש דרך \`@${displayName.split(" ")[0]}\` כדי שה-picker יציע אנשי Workspace, לא קבצים או קישורים.`,
        };
      }
      if (!emailsMatch(personChip.email, expectedEmail)) {
        return {
          passed: false,
          detail: `${cell} has a person chip linked to \`${personChip.email ?? "(no email)"}\`. Replace it with the chip for ${displayName} (${expectedEmail}). The grader matches the email case-insensitively, but the address itself has to be exact.`,
          detailHe: `התא ${cell} מחזיק person chip שמקושר ל-\`${personChip.email ?? "(ללא מייל)"}\`. מחליפים ב-chip של ${displayName} (${expectedEmail}). ה-grader משווה את המייל בלי רגישות לאותיות גדולות/קטנות, אבל הכתובת עצמה חייבת להיות מדויקת.`,
        };
      }
      return { passed: true };
    },
  };
}

const yoavChip = personChipRule(
  "owners-a2-yoav-person",
  "Owners!A2",
  "yoav.cohen@flexelent.com",
  "Yoav Cohen",
);

const dinaChip = personChipRule(
  "owners-a3-dina-person",
  "Owners!A3",
  "dina.dayan@flexelent.com",
  "Dina Dayan",
);

const fileChip: Rule = {
  id: "owners-b2-file-chip",
  label: "Owners!B2 has a file chip pointing at a Google Drive file",
  labelHe: "התא Owners!B2 מחזיק file chip שמצביע על קובץ Google Drive",
  answer:
    "Type @ in Owners!B2 and pick any Sheet/Doc/Drive file you have access to (or paste a docs.google.com URL and accept the chip prompt)",
  async run(sheet) {
    const chips = await sheet.cellChips("Owners!B2");
    if (chips.length === 0) {
      return {
        passed: false,
        detail:
          "Owners!B2 has no smart chip. Type `@` in the cell and pick a file from the chip-picker, or paste a docs.google.com URL and accept the prompt that converts it to a chip.",
        detailHe:
          "אין smart chip ב-Owners!B2. מקלידים `@` בתא ובוחרים קובץ מה-chip-picker, או מדביקים URL של docs.google.com ומאשרים את ה-prompt שממיר אותו ל-chip.",
      };
    }
    const richLink = chips.find((c) => c.kind === "rich-link");
    if (!richLink) {
      return {
        passed: false,
        detail:
          "Owners!B2 has a chip, but it is a person chip, not a file chip. Owner attribution belongs in column A; column B is for the linked source file. Replace B2 with a file chip via `@` and pick a Sheet, Doc, or Drive folder.",
        detailHe:
          "יש chip ב-Owners!B2, אבל זה person chip, לא file chip. attribution של owner שייך לעמודה A, עמודה B היא לקובץ המקור המקושר. מחליפים את B2 ב-file chip דרך `@` ובוחרים Sheet, Doc או תיקיית Drive.",
      };
    }
    const mime = richLink.mimeType ?? "";
    if (!mime.includes(DRIVE_MIME_PREFIX)) {
      return {
        passed: false,
        detail: `Owners!B2 has a rich-link chip, but its mimeType is \`${mime || "(unset)"}\`. The lesson asks for a Google Drive file chip, whose mimeType lives in the \`${DRIVE_MIME_PREFIX}.*\` family (spreadsheet, document, folder, drive-sdk, etc.). Re-pick a Drive file from the @-picker rather than a generic web URL.`,
        detailHe: `יש ב-Owners!B2 chip מסוג rich-link, אבל ה-mimeType שלו הוא \`${mime || "(לא מוגדר)"}\`. השיעור מבקש file chip של Google Drive, שה-mimeType שלו ממשפחת \`${DRIVE_MIME_PREFIX}.*\` (spreadsheet, document, folder, drive-sdk וכו'). בוחרים מחדש קובץ Drive מתוך ה-@-picker, לא URL כללי של אתר.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-05-smart-chips",
  lessonSlug: "modeling/05-smart-chips",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // The Owners tab is created by the learner. We seed a quick reference
      // on the Campaigns tab so the task list is visible without flipping tabs.
      { a1: "I1", value: "→ Create a tab named 'Owners', then add:" },
      { a1: "I2", value: "A2: person chip for Yoav Cohen (yoav.cohen@flexelent.com)" },
      { a1: "I3", value: "A3: person chip for Dina Dayan (dina.dayan@flexelent.com)" },
      { a1: "I4", value: "B2: file chip pointing at any Drive file you have access to" },
    ],
  },
  rules: [yoavChip, dinaChip, fileChip],
};
