import { CAMPAIGNS_LARGE, dataToCells } from "@/content/datasets/adtech";
import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// The lesson teaches the cache → properties → default pattern. There's no
// cell to grade here; the result of `getOrFetchRate()` returns a number to
// the caller. All three rules run against the source. Fixture seeds the
// Campaigns log so the Lesson.gs the learner writes has realistic context
// (the team's USD/ILS conversion lives on top of this dataset).

const STARTER_LESSON_GS = `/**
 * Return the USD-to-ILS rate using the three-tier pattern:
 *   1. Check CacheService.getDocumentCache() at key "usdIlsRate".
 *      Hit → return the cached value as a number.
 *   2. Miss → check PropertiesService.getDocumentProperties() at the same key.
 *      Hit → write it back to the cache with a 1-hour TTL (3600 seconds),
 *      then return it as a number.
 *   3. Miss in both → return the hardcoded default 3.7.
 *
 * The pattern matters: Cache is fast but evicts. Properties is durable but
 * slower. The default keeps the trigger working even when both stores are
 * empty on first run.
 */
function getOrFetchRate() {
  // TODO: implement the three-tier lookup.
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Rule 1. Source touches CacheService and reads from the cache.
const usesCacheService: Rule = {
  id: "script-uses-cacheservice",
  label: "`getOrFetchRate` reads from CacheService before falling back",
  labelHe: "`getOrFetchRate` קוראת מ-CacheService לפני שהיא נופלת ל-fallback",
  answer:
    'const cache = CacheService.getDocumentCache();\nconst cached = cache.get("usdIlsRate");\nif (cached !== null) return Number(cached);',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found. Open the sheet and choose Extensions → Apps Script to launch the editor, then re-run grading.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר. פותחים את ה-spreadsheet ובוחרים Extensions → Apps Script כדי להפעיל את העורך, ואז מריצים grading שוב.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail:
          "The starter file `Lesson.gs` is missing from the bound project. If you renamed it, rename it back to `Lesson`.",
        detailHe:
          "קובץ ה-starter `Lesson.gs` חסר בפרויקט המקושר. אם שיניתם לו שם, מחזירים אותו ל-`Lesson`.",
      };
    }
    if (!lesson.functions.includes("getOrFetchRate")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function getOrFetchRate()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}. The name has to match exactly so the caller can invoke it.`,
        detailHe: `ל-Lesson.gs חסר \`function getOrFetchRate()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}. השם צריך להיות מדויק כדי שהקורא יוכל להפעיל אותה.`,
      };
    }
    const src = lesson.source;
    // Accept any of the three scopes. The lesson examples use document
    // cache but the team also uses script cache in places. Script cache,
    // user cache, and document cache all teach the same idea.
    const hasCacheGetter =
      /CacheService\.getDocumentCache/.test(src) ||
      /CacheService\.getScriptCache/.test(src) ||
      /CacheService\.getUserCache/.test(src);
    if (!hasCacheGetter) {
      return {
        passed: false,
        detail:
          "`getOrFetchRate` doesn't call `CacheService.getDocumentCache()` (or `.getScriptCache()` / `.getUserCache()`). The cache is the first tier of the pattern: try the fast store before the durable one. Start the body with `const cache = CacheService.getDocumentCache();`.",
        detailHe:
          "`getOrFetchRate` לא קוראת ל-`CacheService.getDocumentCache()` (או `.getScriptCache()` / `.getUserCache()`). ה-cache הוא ה-tier הראשון בדפוס: מנסים את ה-store המהיר לפני זה הקבוע. מתחילים את הגוף עם `const cache = CacheService.getDocumentCache();`.",
      };
    }
    if (!/cache\.get\s*\(/.test(src) && !/\.get\s*\(\s*["']usdIlsRate["']/.test(src)) {
      return {
        passed: false,
        detail:
          "`getOrFetchRate` grabs the cache object but never calls `cache.get(\"usdIlsRate\")`. The whole point of the cache lookup is the `.get` call; without it you're declaring a variable you never read.",
        detailHe:
          "`getOrFetchRate` משיגה את ה-cache אבל לא קוראת ל-`cache.get(\"usdIlsRate\")`. כל הנקודה של ה-cache lookup היא הקריאה ל-`.get`; בלעדיה הצהרתם על משתנה שאתם לא קוראים.",
      };
    }
    return { passed: true };
  },
};

// Rule 2. Source touches PropertiesService and reads a property.
const usesPropertiesService: Rule = {
  id: "script-uses-propertiesservice",
  label:
    "`getOrFetchRate` reads from PropertiesService when the cache misses",
  labelHe:
    "`getOrFetchRate` קוראת מ-PropertiesService כש-ה-cache לא מוצא",
  answer:
    'const props = PropertiesService.getDocumentProperties();\nconst stored = props.getProperty("usdIlsRate");',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't check the source. Open the sheet and choose Extensions → Apps Script.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לבדוק את המקור. פותחים את ה-spreadsheet ובוחרים Extensions → Apps Script.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail: "`Lesson.gs` is missing. Restore it and re-run grading.",
        detailHe: "`Lesson.gs` חסר. משחזרים אותו ומריצים grading שוב.",
      };
    }
    const src = lesson.source;
    const hasPropsGetter =
      /PropertiesService\.getDocumentProperties/.test(src) ||
      /PropertiesService\.getScriptProperties/.test(src) ||
      /PropertiesService\.getUserProperties/.test(src);
    if (!hasPropsGetter) {
      return {
        passed: false,
        detail:
          "`getOrFetchRate` doesn't call `PropertiesService.getDocumentProperties()` (or the script / user equivalents). Properties is the second tier: durable storage for config that survives cache eviction. Add `const props = PropertiesService.getDocumentProperties();` after the cache check.",
        detailHe:
          "`getOrFetchRate` לא קוראת ל-`PropertiesService.getDocumentProperties()` (או המקבילות ב-script / user). Properties הוא ה-tier השני: אחסון קבוע לקונפיגורציה ששורד eviction מה-cache. מוסיפים `const props = PropertiesService.getDocumentProperties();` אחרי בדיקת ה-cache.",
      };
    }
    if (!/getProperty\s*\(/.test(src)) {
      return {
        passed: false,
        detail:
          "`getOrFetchRate` reaches PropertiesService but never calls `.getProperty(\"usdIlsRate\")`. The read is what completes the second tier of the pattern.",
        detailHe:
          "`getOrFetchRate` מגיעה ל-PropertiesService אבל לא קוראת ל-`.getProperty(\"usdIlsRate\")`. הקריאה היא מה שמשלים את ה-tier השני בדפוס.",
      };
    }
    return { passed: true };
  },
};

// Rule 3. Source includes the literal 3.7 default so the function works
// on the very first run when both the cache and properties are empty.
const fallsBackToDefault: Rule = {
  id: "script-falls-back-to-default",
  label: "`getOrFetchRate` returns the literal `3.7` when both stores miss",
  labelHe: "`getOrFetchRate` מחזירה את הליטרל `3.7` כששני ה-stores לא מוצאים",
  answer: "return 3.7;",
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) {
      return {
        passed: false,
        detail:
          "No bound Apps Script project found, so this rule can't check the source.",
        detailHe:
          "לא נמצא פרויקט Apps Script מקושר, אז הכלל לא יכול לבדוק את המקור.",
      };
    }
    const lesson = project.files.find((f) => f.name === "Lesson");
    if (!lesson) {
      return {
        passed: false,
        detail: "`Lesson.gs` is missing. Restore it and re-run grading.",
        detailHe: "`Lesson.gs` חסר. משחזרים אותו ומריצים grading שוב.",
      };
    }
    // Accept either `return 3.7` (the obvious shape) or just the literal
    // 3.7 anywhere in the source. A learner could legitimately declare
    // `const DEFAULT_RATE = 3.7;` at the top and return that.
    if (!/3\.7/.test(lesson.source)) {
      return {
        passed: false,
        detail:
          "`getOrFetchRate` has no fallback to `3.7`. The cache can be empty (first run, post-eviction) and properties can be empty (nothing's set the rate yet). Without a default the function returns `undefined` and the caller breaks. End the body with `return 3.7;`.",
        detailHe:
          "ל-`getOrFetchRate` אין fallback ל-`3.7`. ה-cache יכול להיות ריק (ריצה ראשונה, אחרי eviction) ו-Properties יכול להיות ריק (כלום עדיין לא הציב את השער). בלי ברירת מחדל ה-function מחזירה `undefined` והקורא נשבר. מסיימים את הגוף עם `return 3.7;`.",
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-15-properties-and-cache",
  lessonSlug: "apps-script/15-properties-and-cache",
  templateSheetId: null,
  seed: {
    tabTitle: "Campaigns",
    cells: [...dataToCells(CAMPAIGNS_LARGE)],
  },
  seedScript,
  rules: [usesCacheService, usesPropertiesService, fallsBackToDefault],
};
