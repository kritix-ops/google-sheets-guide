import type { AssignmentSpec, Rule, SeedScriptFile } from "@/lib/grading/types";

// This lesson has a different shape from the rest of Track 3. The
// learner edits TWO files: the `Lesson.gs` body and the `appsscript`
// manifest in the same project. The provisioner ships a default
// manifest the learner edits in place: we don't seed our own (the
// reserved-names list in lib/google/script.ts blocks that anyway).
//
// The starter `Lesson.gs` declares `callSharedHelper` as a stub. The
// learner's job:
//   1. Open the manifest editor and add a `dependencies.libraries`
//      entry with a non-placeholder `userSymbol`, a `libraryId`, and a
//      `version`.
//   2. Write the `callSharedHelper` body to call the library via
//      `<userSymbol>.someFunction(...)`.
//
// The grader cross-references the manifest's `userSymbol` against the
// source so the two halves of the assignment are tied together.

const STARTER_LESSON_GS = `/**
 * Call a function from an imported Apps Script library. In a real
 * project, the library hosts shared utilities like normalizeBuyer,
 * countryToRegion, roiBucket: and every workbook in the team imports
 * the same library so a fix in one place propagates everywhere.
 *
 * Step 1: Open the appsscript manifest (the file at the top of the
 * editor's file picker) and add a dependencies.libraries entry. The
 * shape is:
 *   "dependencies": {
 *     "libraries": [{
 *       "userSymbol": "Shared",
 *       "libraryId": "1abc...placeholder",
 *       "version": "1",
 *       "developmentMode": false
 *     }]
 *   }
 *
 * Step 2: Replace the body below to call <userSymbol>.someFunction(...).
 * The test doesn't run the library: there is no real library bound to
 * this assignment: it only checks that the shape is right.
 */
function callSharedHelper() {
  // TODO: return Shared.normalizeBuyer("Yoav Cohen") (or whatever
  // userSymbol you chose in the manifest, followed by a dot and a
  // function call).
  return null;
}
`;

const seedScript: SeedScriptFile[] = [
  { name: "Lesson", type: "SERVER_JS", source: STARTER_LESSON_GS },
];

// Helper: parse the appsscript manifest JSON safely. The provisioner
// always writes valid JSON, but a learner editing the manifest can
// easily break it (trailing comma, missing quote). Returning null
// signals "manifest is broken" so the rule can produce a useful hint.
type ManifestLibrary = {
  userSymbol?: unknown;
  libraryId?: unknown;
  version?: unknown;
  developmentMode?: unknown;
};

type Manifest = {
  dependencies?: {
    libraries?: unknown;
  };
};

function parseManifest(source: string): Manifest | null {
  try {
    const parsed = JSON.parse(source);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Manifest)
      : null;
  } catch {
    return null;
  }
}

function firstLibraryEntry(manifest: Manifest): ManifestLibrary | null {
  const libs = manifest.dependencies?.libraries;
  if (!Array.isArray(libs) || libs.length === 0) return null;
  const first = libs[0];
  return typeof first === "object" && first !== null
    ? (first as ManifestLibrary)
    : null;
}

// Rule 1: the manifest has at least one library entry with all three
// required fields. The userSymbol can be anything, but it has to be a
// real-looking identifier (non-empty and not a placeholder string the
// learner copy-pasted without editing).
const manifestHasLibraryEntry: Rule = {
  id: "manifest-has-library-entry",
  label:
    "The appsscript manifest has a `dependencies.libraries` entry with `userSymbol`, `libraryId`, and `version`",
  labelHe:
    "המניפסט appsscript מכיל רשומה ב-`dependencies.libraries` עם `userSymbol`, `libraryId`, ו-`version`",
  answer:
    '{\n  "dependencies": {\n    "libraries": [{\n      "userSymbol": "Shared",\n      "libraryId": "1abc...placeholder",\n      "version": "1",\n      "developmentMode": false\n    }]\n  }\n}',
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
    const manifestFile = project.files.find((f) => f.name === "appsscript");
    if (!manifestFile) {
      return {
        passed: false,
        detail:
          "The `appsscript` manifest file is missing from the project. Every Apps Script project has one: if you can't find it in the editor's file list, click the gear icon and enable \"Show appsscript.json manifest file in editor\".",
        detailHe:
          "קובץ המניפסט `appsscript` חסר בפרויקט. לכל פרויקט Apps Script יש אחד. אם לא רואים אותו ברשימת הקבצים בעורך, לוחצים על אייקון הגלגל ומפעילים את \"Show appsscript.json manifest file in editor\".",
      };
    }
    const manifest = parseManifest(manifestFile.source);
    if (!manifest) {
      return {
        passed: false,
        detail:
          "The `appsscript` manifest is not valid JSON. Check for a missing comma, an unclosed brace, or a stray comma after the last item in an array: these are the three most common breakages when editing the manifest by hand.",
        detailHe:
          "המניפסט `appsscript` הוא לא JSON תקין. בודקים פסיק חסר, סוגריים שלא נסגרו, או פסיק נדוד אחרי הפריט האחרון ב-array. אלה שלוש התקלות הנפוצות בעריכה ידנית של המניפסט.",
      };
    }
    const lib = firstLibraryEntry(manifest);
    if (!lib) {
      return {
        passed: false,
        detail:
          "The manifest doesn't have a `dependencies.libraries` array (or the array is empty). Add this object to the top level: `\"dependencies\": { \"libraries\": [{ \"userSymbol\": \"Shared\", \"libraryId\": \"1abc...placeholder\", \"version\": \"1\", \"developmentMode\": false }] }`.",
        detailHe:
          "במניפסט אין array של `dependencies.libraries` (או שה-array ריק). מוסיפים את ה-object הזה לרמה העליונה: `\"dependencies\": { \"libraries\": [{ \"userSymbol\": \"Shared\", \"libraryId\": \"1abc...placeholder\", \"version\": \"1\", \"developmentMode\": false }] }`.",
      };
    }
    const missing: string[] = [];
    if (typeof lib.userSymbol !== "string" || !lib.userSymbol.trim()) {
      missing.push("userSymbol");
    }
    if (typeof lib.libraryId !== "string" || !lib.libraryId.trim()) {
      missing.push("libraryId");
    }
    if (
      (typeof lib.version !== "string" || !lib.version.trim()) &&
      typeof lib.version !== "number"
    ) {
      missing.push("version");
    }
    if (missing.length > 0) {
      return {
        passed: false,
        detail: `The library entry is missing required fields: ${missing.join(", ")}. All three (\`userSymbol\`, \`libraryId\`, \`version\`) are required for Apps Script to resolve the library at call time.`,
        detailHe: `ב-library entry חסרים שדות נדרשים: ${missing.join(", ")}. כל השלושה (\`userSymbol\`, \`libraryId\`, \`version\`) נדרשים כדי ש-Apps Script יוכל לפתור את הספרייה ברגע הקריאה.`,
      };
    }
    return { passed: true };
  },
};

// Rule 2: `callSharedHelper` is declared and the body actually calls
// the library via the manifest's userSymbol. We pull the symbol out of
// the manifest and check the source for `<symbol>.<something>(`. This
// ties the two halves of the assignment together: if the learner edited
// the manifest with `userSymbol: "Shared"`, the source must say
// `Shared.someFunction(...)`.
const definesCallSharedHelper: Rule = {
  id: "script-defines-callsharedhelper",
  label:
    "Lesson.gs defines `callSharedHelper()` and the body calls a library function via the manifest's `userSymbol`",
  labelHe:
    "הקובץ Lesson.gs מגדיר `callSharedHelper()` והגוף קורא ל-function בספרייה דרך ה-`userSymbol` מהמניפסט",
  answer:
    'function callSharedHelper() {\n  return Shared.normalizeBuyer("Yoav Cohen");\n}',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
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
    if (!lesson.functions.includes("callSharedHelper")) {
      return {
        passed: false,
        detail: `Lesson.gs is missing a top-level \`function callSharedHelper()\`. The functions Apps Script saw are: ${lesson.functions.join(", ") || "(none)"}.`,
        detailHe: `ל-Lesson.gs חסר \`function callSharedHelper()\` ברמה העליונה. הפונקציות ש-Apps Script זיהה הן: ${lesson.functions.join(", ") || "(אין)"}.`,
      };
    }
    const stripped = lesson.source.replace(/\s+/g, "");
    if (stripped.includes("returnnull")) {
      return {
        passed: false,
        detail:
          "`callSharedHelper` is declared but still returns `null` without doing anything. Replace the stub with `return <userSymbol>.<functionName>(...)`: for example, `return Shared.normalizeBuyer(\"Yoav Cohen\");`.",
        detailHe:
          "`callSharedHelper` מוכרזת אבל עדיין מחזירה `null` בלי לעשות כלום. מחליפים את ה-stub ב-`return <userSymbol>.<functionName>(...)`, לדוגמה `return Shared.normalizeBuyer(\"Yoav Cohen\");`.",
      };
    }
    const manifestFile = project.files.find((f) => f.name === "appsscript");
    const manifest = manifestFile ? parseManifest(manifestFile.source) : null;
    const lib = manifest ? firstLibraryEntry(manifest) : null;
    const userSymbol =
      lib && typeof lib.userSymbol === "string" ? lib.userSymbol.trim() : null;
    if (!userSymbol) {
      // The manifest rule already explains this; just pass here so the
      // learner sees one failure for the root cause.
      return { passed: true };
    }
    // Source must contain the userSymbol followed by `.` and an
    // identifier, which is the dot-notation library call pattern.
    const callPattern = new RegExp(
      `\\b${userSymbol.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\.[A-Za-z_][\\w$]*\\s*\\(`,
    );
    if (!callPattern.test(lesson.source)) {
      return {
        passed: false,
        detail: `\`callSharedHelper\` doesn't call \`${userSymbol}.<something>(...)\`. The manifest declared the library with \`userSymbol: "${userSymbol}"\`, so the call shape has to be \`${userSymbol}.functionName(...)\`. If you wanted a different symbol, change it in the manifest first.`,
        detailHe: `\`callSharedHelper\` לא קוראת ל-\`${userSymbol}.<something>(...)\`. המניפסט הצהיר על הספרייה עם \`userSymbol: "${userSymbol}"\`, אז צורת הקריאה חייבת להיות \`${userSymbol}.functionName(...)\`. אם רציתם symbol אחר, משנים אותו במניפסט קודם.`,
      };
    }
    return { passed: true };
  },
};

// Rule 3: guard against the placeholder mistake. A learner who
// copy-pasted the manifest snippet but never changed `userSymbol` lands
// with something like "YOUR_SYMBOL" or "TODO" or "placeholder", which
// produces a working manifest but fails the lesson's point. The list
// is the obvious offenders; we keep the check loose to avoid false
// positives on real names like "Shared" or "Utils".
const PLACEHOLDER_SYMBOLS = new Set([
  "your_symbol",
  "your-symbol",
  "yoursymbol",
  "placeholder",
  "todo",
  "library",
  "libraryname",
  "symbol",
  "myalias",
]);

const libraryUserSymbolNotPlaceholder: Rule = {
  id: "library-usersymbol-not-placeholder",
  label:
    "The library's `userSymbol` in the manifest is a real name, not a placeholder",
  labelHe:
    "ה-`userSymbol` של הספרייה במניפסט הוא שם אמיתי, לא placeholder",
  answer: '"userSymbol": "Shared"',
  async run(sheet) {
    const project = await sheet.scriptContent();
    if (!project) return { passed: true };
    const manifestFile = project.files.find((f) => f.name === "appsscript");
    if (!manifestFile) return { passed: true };
    const manifest = parseManifest(manifestFile.source);
    if (!manifest) return { passed: true };
    const lib = firstLibraryEntry(manifest);
    if (!lib || typeof lib.userSymbol !== "string") return { passed: true };
    const symbol = lib.userSymbol.trim();
    if (symbol === "") {
      return {
        passed: false,
        detail:
          "The library entry has an empty `userSymbol`. Pick a real name like `Shared`, `Utils`, or `Adtech`: this is how you'll call the library's functions from your code (e.g., `Shared.normalizeBuyer(...)`).",
        detailHe:
          "ל-library entry יש `userSymbol` ריק. בוחרים שם אמיתי כמו `Shared`, `Utils`, או `Adtech`. ככה תקראו לפונקציות של הספרייה מהקוד שלכם (לדוגמה, `Shared.normalizeBuyer(...)`).",
      };
    }
    if (PLACEHOLDER_SYMBOLS.has(symbol.toLowerCase())) {
      return {
        passed: false,
        detail: `The library entry's \`userSymbol\` is \`"${symbol}"\`, which is a placeholder. Change it to a real name like \`"Shared"\` or \`"Utils"\`: the value is the local alias you'll use to call the library's functions, so it has to be a valid JS identifier you actually want to type.`,
        detailHe: `ה-\`userSymbol\` של ה-library entry הוא \`"${symbol}"\`, שזה placeholder. משנים לשם אמיתי כמו \`"Shared"\` או \`"Utils"\`. הערך הוא ה-alias המקומי שתשתמשו בו לקרוא לפונקציות של הספרייה, אז זה חייב להיות מזהה JS תקין שבאמת תרצו להקליד.`,
      };
    }
    // Final sanity: a valid JS identifier. Apps Script doesn't strictly
    // require this (the manifest will load anything), but a non-
    // identifier won't be callable as `<symbol>.foo()`, so we flag it.
    if (!/^[A-Za-z_$][\w$]*$/.test(symbol)) {
      return {
        passed: false,
        detail: `The library entry's \`userSymbol\` is \`"${symbol}"\`, which is not a valid JavaScript identifier. It needs to start with a letter, dollar sign, or underscore and contain only letters, digits, dollar signs, or underscores: otherwise you can't call it as \`${symbol}.foo()\`.`,
        detailHe: `ה-\`userSymbol\` של ה-library entry הוא \`"${symbol}"\`, שאינו מזהה JavaScript תקין. הוא צריך להתחיל באות, סימן דולר, או underscore ולהכיל רק אותיות, ספרות, סימני דולר, או underscores. אחרת אי אפשר לקרוא לו כ-\`${symbol}.foo()\`.`,
      };
    }
    return { passed: true };
  },
};

export const assignment: AssignmentSpec = {
  id: "apps-script-12-libraries-and-deployments",
  lessonSlug: "apps-script/12-libraries-and-deployments",
  templateSheetId: null,
  seed: {
    // No campaign data: this lesson is about the manifest and library
    // shape, not about reading or writing cells. A blank Sheet1 is all
    // the learner needs.
    tabTitle: "Sheet1",
    cells: [],
  },
  seedScript,
  rules: [
    manifestHasLibraryEntry,
    definesCallSharedHelper,
    libraryUserSymbolNotPlaceholder,
  ],
};
