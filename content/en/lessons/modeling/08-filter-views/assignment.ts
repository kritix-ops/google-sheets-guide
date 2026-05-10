import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule } from "@/lib/grading/types";

// Lesson 8 grades two filter views the learner creates via Data → Create a
// filter view in the Sheets UI on the Campaigns tab. The grader reads the
// view titles back via SheetReader.filterViewTitles("Campaigns"). The actual
// filter conditions inside each view aren't yet exposed by the reader, so the
// rules check title presence (case-sensitive exact match). The lesson body
// teaches the full pattern; the grader enforces the team's naming convention.

const YOAV_VIEW_TITLE = "Yoav only";
const PROFITABLE_VIEW_TITLE = "Profitable only";

const yoavOnlyView: Rule = {
  id: "campaigns-filter-view-yoav-only",
  label: 'Campaigns has a filter view titled exactly "Yoav only"',
  labelHe: 'לגיליון Campaigns יש filter view בשם המדויק "Yoav only"',
  answer:
    'Data → Create a filter view → Name: "Yoav only" → Filter column B to "Yoav Cohen" only',
  async run(sheet) {
    const titles = await sheet.filterViewTitles("Campaigns");
    if (titles.length === 0) {
      return {
        passed: false,
        detail:
          'No filter views found on the Campaigns tab. Open Data → Create a filter view, name it `Yoav only` exactly (Title Case, one space), and filter column B to `Yoav Cohen` only.',
        detailHe:
          'לא נמצאו filter views על גיליון Campaigns. פותחים את Data → Create a filter view, נותנים לו שם מדויק `Yoav only` (Title Case, רווח אחד), ומסננים את עמודה B ל-`Yoav Cohen` בלבד.',
      };
    }
    if (!titles.includes(YOAV_VIEW_TITLE)) {
      const closeMatch = titles.find(
        (t) => t.toLowerCase() === YOAV_VIEW_TITLE.toLowerCase(),
      );
      if (closeMatch != null) {
        return {
          passed: false,
          detail: `Found a filter view named \`${closeMatch}\` but the team convention is Title Case: \`Yoav only\` (capital Y, lowercase o-n-l-y, one space). Rename it via Data → Filter views → triangle icon → Rename.`,
          detailHe: `נמצא filter view בשם \`${closeMatch}\` אבל מוסכמת הצוות היא Title Case: \`Yoav only\` (Y גדולה, o-n-l-y קטנות, רווח אחד). משנים את השם דרך Data → Filter views → אייקון המשולש → Rename.`,
        };
      }
      return {
        passed: false,
        detail: `Campaigns has filter views (\`${titles.join("`, `")}\`) but none titled \`Yoav only\`. Add one via Data → Create a filter view, then filter column B (Buyer) to \`Yoav Cohen\` only.`,
        detailHe: `לגיליון Campaigns יש filter views (\`${titles.join("`, `")}\`) אבל אף אחד לא בשם \`Yoav only\`. מוסיפים אחד דרך Data → Create a filter view, ואז מסננים את עמודה B (Buyer) ל-\`Yoav Cohen\` בלבד.`,
      };
    }
    return { passed: true };
  },
};

const profitableOnlyView: Rule = {
  id: "campaigns-filter-view-profitable-only",
  label: 'Campaigns has a filter view titled exactly "Profitable only"',
  labelHe:
    'לגיליון Campaigns יש filter view בשם המדויק "Profitable only"',
  answer:
    'Data → Create a filter view → Name: "Profitable only" → Filter column G with custom formula =G2>F2',
  async run(sheet) {
    const titles = await sheet.filterViewTitles("Campaigns");
    if (titles.length === 0) {
      return {
        passed: false,
        detail:
          "No filter views found on the Campaigns tab. Add one named `Profitable only` and filter column G (Revenue) with a custom formula `=G2>F2` so it shows only rows where revenue beat spend.",
        detailHe:
          "לא נמצאו filter views על גיליון Campaigns. מוסיפים אחד בשם `Profitable only` ומסננים את עמודה G (Revenue) עם custom formula `=G2>F2` כך שיוצגו רק שורות שבהן revenue עוקף spend.",
      };
    }
    if (!titles.includes(PROFITABLE_VIEW_TITLE)) {
      const closeMatch = titles.find(
        (t) => t.toLowerCase() === PROFITABLE_VIEW_TITLE.toLowerCase(),
      );
      if (closeMatch != null) {
        return {
          passed: false,
          detail: `Found a filter view named \`${closeMatch}\` but the team convention is Title Case: \`Profitable only\` (capital P, lowercase o-n-l-y, one space). Rename it via Data → Filter views → triangle icon → Rename.`,
          detailHe: `נמצא filter view בשם \`${closeMatch}\` אבל מוסכמת הצוות היא Title Case: \`Profitable only\` (P גדולה, o-n-l-y קטנות, רווח אחד). משנים את השם דרך Data → Filter views → אייקון המשולש → Rename.`,
        };
      }
      return {
        passed: false,
        detail: `Campaigns has filter views (\`${titles.join("`, `")}\`) but none titled \`Profitable only\`. Add one via Data → Create a filter view, then filter column G (Revenue) with the custom formula \`=G2>F2\` so only profitable rows show.`,
        detailHe: `לגיליון Campaigns יש filter views (\`${titles.join("`, `")}\`) אבל אף אחד לא בשם \`Profitable only\`. מוסיפים אחד דרך Data → Create a filter view, ואז מסננים את עמודה G (Revenue) עם ה-custom formula \`=G2>F2\` כך שרק שורות רווחיות יוצגו.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "modeling-08-filter-views",
  lessonSlug: "modeling/08-filter-views",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [
      ...dataToCells(CAMPAIGNS_LARGE),
      // Quick-reference labels next to the data, in column I, so the learner
      // can see the two filter views to create without leaving the sheet.
      { a1: "I1", value: "→ Create two filter views via Data → Create a filter view:" },
      { a1: "I2", value: "1. Name: Yoav only, filter column B to Yoav Cohen" },
      { a1: "I3", value: "2. Name: Profitable only, filter column G with =G2>F2" },
    ],
  },
  rules: [yoavOnlyView, profitableOnlyView],
};
