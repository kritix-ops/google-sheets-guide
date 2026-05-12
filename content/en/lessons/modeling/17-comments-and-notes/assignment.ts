import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 17 grades cell notes the learner adds via Insert → Note (Ctrl+Alt+M)
// in the Sheets UI. The seed provisions a clean copy of CAMPAIGNS_LARGE on the
// "Campaigns" tab. The learner adds three header notes documenting source,
// definition, and timezone. The grader reads each note via the cellNote method
// on SheetReader and asserts a case-insensitive substring match.
//
// Three rules:
//   Campaigns!A1 (Date header)    -> note must contain "UTC"
//   Campaigns!F1 (Spend header)   -> note must contain "IMPORTRANGE"
//   Campaigns!G1 (Revenue header) -> note must contain "net"
//
// Notes (Insert → Note) are distinct from threaded comments. The Sheets API
// exposes notes directly on the cell; threaded comments live on the Drive
// Comments API surface and are not read by this grader. The body of the lesson
// covers the distinction in detail.

function noteContains(note: string | null, needle: string): boolean {
  if (note == null) return false;
  return note.toLowerCase().includes(needle.toLowerCase());
}

const dateHeaderTimezoneNote: Rule = {
  id: "campaigns-a1-date-timezone-note",
  label: "Campaigns!A1 has a note documenting the date column's timezone",
  labelHe:
    "התא Campaigns!A1 מחזיק note שמתעדת את אזור הזמן של עמודת התאריכים",
  answer:
    'Insert → Note on Campaigns!A1: "Dates in UTC; convert to GMT+3 for the team office hours view."',
  async run(sheet) {
    const note = await sheet.cellNote("Campaigns!A1");
    if (note == null || note.trim().length === 0) {
      return {
        passed: false,
        detail:
          "Campaigns!A1 has no note. Open Insert → Note (Ctrl+Alt+M) and document the timezone the Date column uses, e.g. \"Dates in UTC; convert to GMT+3 for the team office hours view.\" The note must include the substring `UTC` so a future maintainer knows what timezone the values are in.",
        detailHe:
          "אין note על Campaigns!A1. פותחים Insert → Note (Ctrl+Alt+M) ומתעדים את אזור הזמן של עמודת Date, לדוגמה \"Dates in UTC; convert to GMT+3 for the team office hours view.\" ה-note חייבת לכלול את ה-substring `UTC` כדי שמי שיתחזק את הקובץ בעתיד ידע באיזה אזור זמן הערכים.",
      };
    }
    if (!noteContains(note, "UTC")) {
      return {
        passed: false,
        detail: `Campaigns!A1 has a note (\`${note}\`) but it doesn't mention \`UTC\`. The Date column's note must name the timezone explicitly so a future maintainer doesn't have to guess. Add the substring \`UTC\` (any casing) to the note.`,
        detailHe: `יש note על Campaigns!A1 (\`${note}\`) אבל היא לא מזכירה \`UTC\`. ה-note של עמודת Date חייבת לציין את אזור הזמן במפורש כדי שמי שיתחזק את הקובץ לא יצטרך לנחש. מוסיפים את ה-substring \`UTC\` (כל casing) ל-note.`,
      };
    }
    return { passed: true };
  },
};

const spendHeaderSourceNote: Rule = {
  id: "campaigns-f1-spend-source-note",
  label: "Campaigns!F1 has a note documenting the Spend column's data source",
  labelHe:
    "התא Campaigns!F1 מחזיק note שמתעדת את מקור הנתונים של עמודת Spend",
  answer:
    'Insert → Note on Campaigns!F1: "Pulled via IMPORTRANGE from Taboola export, refreshes hourly."',
  async run(sheet) {
    const note = await sheet.cellNote("Campaigns!F1");
    if (note == null || note.trim().length === 0) {
      return {
        passed: false,
        detail:
          "Campaigns!F1 has no note. The Spend column needs a lineage note: where it's pulled from and how often. Open Insert → Note (Ctrl+Alt+M) and write something like \"Pulled via IMPORTRANGE from Taboola export, refreshes hourly.\" The note must include the substring `IMPORTRANGE` so the source pipeline is visible at a glance.",
        detailHe:
          "אין note על Campaigns!F1. עמודת Spend צריכה note של מקור: מאיפה היא נמשכת וכל כמה זמן. פותחים Insert → Note (Ctrl+Alt+M) וכותבים משהו כמו \"Pulled via IMPORTRANGE from Taboola export, refreshes hourly.\" ה-note חייבת לכלול את ה-substring `IMPORTRANGE` כדי ש-pipeline המקור יהיה גלוי במבט.",
      };
    }
    if (!noteContains(note, "IMPORTRANGE")) {
      return {
        passed: false,
        detail: `Campaigns!F1 has a note (\`${note}\`) but it doesn't mention \`IMPORTRANGE\`. Lineage notes on imported columns name the import mechanism so debugging a broken cell starts in the right place. Add the substring \`IMPORTRANGE\` (any casing) to the note.`,
        detailHe: `יש note על Campaigns!F1 (\`${note}\`) אבל היא לא מזכירה \`IMPORTRANGE\`. notes של מקור על עמודות מיובאות מציינות את מנגנון הייבוא, כך ש-debug של תא שבור מתחיל במקום הנכון. מוסיפים את ה-substring \`IMPORTRANGE\` (כל casing) ל-note.`,
      };
    }
    return { passed: true };
  },
};

const revenueHeaderDefinitionNote: Rule = {
  id: "campaigns-g1-revenue-definition-note",
  label: "Campaigns!G1 has a note defining what the Revenue column means",
  labelHe:
    "התא Campaigns!G1 מחזיק note שמגדירה מה עמודת Revenue באמת מודדת",
  answer:
    'Insert → Note on Campaigns!G1: "Net revenue after platform fees."',
  async run(sheet) {
    const note = await sheet.cellNote("Campaigns!G1");
    if (note == null || note.trim().length === 0) {
      return {
        passed: false,
        detail:
          "Campaigns!G1 has no note. Revenue columns are ambiguous by default. Gross or net? Open Insert → Note (Ctrl+Alt+M) and write the definition, e.g. \"Net revenue after platform fees.\" The note must include the substring `net` so there's no doubt which side of platform fees the number sits on.",
        detailHe:
          "אין note על Campaigns!G1. עמודות revenue עמומות מטבען, gross או net? פותחים Insert → Note (Ctrl+Alt+M) וכותבים את ההגדרה, לדוגמה \"Net revenue after platform fees.\" ה-note חייבת לכלול את ה-substring `net` כדי שלא יהיה ספק באיזה צד של עמלות הפלטפורמה המספר יושב.",
      };
    }
    if (!noteContains(note, "net")) {
      return {
        passed: false,
        detail: `Campaigns!G1 has a note (\`${note}\`) but it doesn't mention \`net\`. Revenue without a gross-vs-net qualifier silently breaks every downstream ROI calculation that assumes one or the other. Add the substring \`net\` (any casing) to the note.`,
        detailHe: `יש note על Campaigns!G1 (\`${note}\`) אבל היא לא מזכירה \`net\`. revenue בלי הגדרה של gross מול net שובר בשקט כל חישוב ROI שמניח אחד מהם. מוסיפים את ה-substring \`net\` (כל casing) ל-note.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-17-comments-and-notes",
  lessonSlug: "modeling/17-comments-and-notes",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Inline reference labels live on the same Campaigns tab as a quick
      // reminder of which header cells need notes and what each note must
      // mention. The learner removes them once the actual notes are in place.
      { a1: "L1", value: "→ Add notes via Insert → Note (Ctrl+Alt+M):" },
      { a1: "L2", value: "A1 (Date): note must mention UTC (timezone)" },
      { a1: "L3", value: "F1 (Spend): note must mention IMPORTRANGE (source)" },
      { a1: "L4", value: "G1 (Revenue): note must mention net (definition)" },
    ],
  },
  rules: [
    dateHeaderTimezoneNote,
    spendHeaderSourceNote,
    revenueHeaderDefinitionNote,
  ],
};
