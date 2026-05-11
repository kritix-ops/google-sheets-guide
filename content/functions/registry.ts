// Canonical reference for every Sheets function the curriculum teaches.
// One source of truth: a lesson uses <FunctionRef name="X" /> and the
// component looks the spec up here. Update a parameter description here
// and every lesson that mentions the function is updated everywhere.
//
// Every entry must be verified against the official Google Sheets help
// page (see `docsUrl`). Specs are author-curated; never accept
// generated content without checking the live docs.

import type { Locale } from "@/lib/i18n/routing";

export type FunctionCategory =
  | "lookup"
  | "array"
  | "logical"
  | "text"
  | "math"
  | "date"
  | "aggregation"
  | "query"
  | "info"
  | "filter"
  | "regex"
  | "lambda";

export type FunctionParam = {
  name: string;
  type: string;
  optional?: boolean;
  // Shown next to the type for optional parameters.
  default?: string;
  // For parameters with enumerated values (e.g. XLOOKUP match_mode).
  // Each `value` maps to a per-locale meaning shown under the table.
  accepts?: Array<{ value: string; description: { en: string; he: string } }>;
  description: { en: string; he: string };
};

export type FunctionSpec = {
  name: string;
  category: FunctionCategory;
  summary: { en: string; he: string };
  syntax: string;
  params: FunctionParam[];
  returns: { en: string; he: string };
  docsUrl: string;
};

const REGISTRY = {
  ARRAYFORMULA: {
    name: "ARRAYFORMULA",
    category: "array",
    summary: {
      en: "Broadcasts an expression across an entire range so a single formula returns an array of values that spills into adjacent cells.",
      he: "מבצע הרחבה (broadcast) של ביטוי על פני טווח שלם, ככה שנוסחה אחת מחזירה מערך של ערכים שזורם (spills) לתאים הסמוכים.",
    },
    syntax: "ARRAYFORMULA(array_formula)",
    params: [
      {
        name: "array_formula",
        type: "range | expression | function",
        description: {
          en: "A range, a math expression that uses one or more equally-sized ranges, or a function that returns more than one cell. The wrapped expression is evaluated element-by-element across the implied output shape.",
          he: "טווח, ביטוי מתמטי שמשתמש בטווח אחד או יותר באותו גודל, או פונקציה שמחזירה יותר מתא אחד. הביטוי העטוף מחושב איבר-איבר על פני צורת הפלט המשתמעת.",
        },
      },
    ],
    returns: {
      en: "An array of values that spills into the cells adjacent to the formula cell, sized to match the input range.",
      he: "מערך של ערכים שזורם לתאים הסמוכים לתא הנוסחה, בגודל שמתאים לטווח הקלט.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093275?hl=en",
  },

  XLOOKUP: {
    name: "XLOOKUP",
    category: "lookup",
    summary: {
      en: "Looks up a key in one range and returns the value at the matching position from a second, parallel range. It replaces the older VLOOKUP/HLOOKUP pair with one symmetric, range-based function.",
      he: "מחפש מפתח בטווח אחד ומחזיר את הערך במיקום התואם מטווח שני מקביל. מחליף את הזוג הישן של VLOOKUP/HLOOKUP בפונקציה אחת סימטרית מבוססת-טווח.",
    },
    syntax:
      "XLOOKUP(search_key, lookup_range, result_range, [missing_value], [match_mode], [search_mode])",
    params: [
      {
        name: "search_key",
        type: "value",
        description: {
          en: "The value to search for. Can be a literal (number, text, boolean) or a cell reference.",
          he: "הערך שמחפשים. יכול להיות ערך מילולי (מספר, טקסט, boolean) או reference לתא.",
        },
      },
      {
        name: "lookup_range",
        type: "range",
        description: {
          en: "The single column or single row to search in. Must be one-dimensional.",
          he: "העמודה היחידה או השורה היחידה שבה מחפשים. חייב להיות חד-ממדי.",
        },
      },
      {
        name: "result_range",
        type: "range",
        description: {
          en: "The range whose value is returned when a match is found. Its row/column count must match the lookup_range.",
          he: "הטווח שהערך שלו מוחזר כשנמצאה התאמה. מספר השורות או העמודות שלו חייב להיות זהה ל-lookup_range.",
        },
      },
      {
        name: "missing_value",
        type: "value",
        optional: true,
        default: "#N/A",
        description: {
          en: "The value returned when no match is found. Provide a friendly default (e.g. 0 or \"not found\") to avoid #N/A noise downstream.",
          he: "הערך שמוחזר כשלא נמצאה התאמה. כדאי לתת ברירת מחדל ידידותית (למשל 0 או \"לא נמצא\") כדי להימנע מרעש #N/A במורד הזרם.",
        },
      },
      {
        name: "match_mode",
        type: "number",
        optional: true,
        default: "0",
        accepts: [
          {
            value: "0",
            description: {
              en: "Exact match (default).",
              he: "התאמה מדויקת (ברירת מחדל).",
            },
          },
          {
            value: "1",
            description: {
              en: "Exact match, or the next larger value if no exact match.",
              he: "התאמה מדויקת, או הערך הבא הגדול יותר אם אין התאמה מדויקת.",
            },
          },
          {
            value: "-1",
            description: {
              en: "Exact match, or the next smaller value if no exact match.",
              he: "התאמה מדויקת, או הערך הבא הקטן יותר אם אין התאמה מדויקת.",
            },
          },
          {
            value: "2",
            description: {
              en: "Wildcard match: ? matches one character, * matches any sequence.",
              he: "התאמה עם wildcards: ? מתאים לתו אחד, * מתאים לרצף כלשהו.",
            },
          },
        ],
        description: {
          en: "How to compare the search_key against lookup_range values.",
          he: "איך להשוות את ה-search_key מול ערכי lookup_range.",
        },
      },
      {
        name: "search_mode",
        type: "number",
        optional: true,
        default: "1",
        accepts: [
          {
            value: "1",
            description: {
              en: "Search first to last (default).",
              he: "חיפוש מהראשון לאחרון (ברירת מחדל).",
            },
          },
          {
            value: "-1",
            description: {
              en: "Search last to first. Useful when you want the most recent matching row.",
              he: "חיפוש מהאחרון לראשון. שימושי כשרוצים את השורה התואמת האחרונה.",
            },
          },
          {
            value: "2",
            description: {
              en: "Binary search on ascending-sorted data. Faster on large ranges, fails on unsorted data.",
              he: "חיפוש בינארי על מידע ממוין בסדר עולה. מהיר יותר על טווחים גדולים, נכשל על מידע לא ממוין.",
            },
          },
          {
            value: "-2",
            description: {
              en: "Binary search on descending-sorted data.",
              he: "חיפוש בינארי על מידע ממוין בסדר יורד.",
            },
          },
        ],
        description: {
          en: "The order and algorithm used to walk the lookup_range.",
          he: "הסדר והאלגוריתם שבהם מטיילים על lookup_range.",
        },
      },
    ],
    returns: {
      en: "The value (or values) at the matching position in result_range. If result_range is multi-column, returns the whole row.",
      he: "הערך (או הערכים) במיקום התואם ב-result_range. אם ה-result_range מרובה-עמודות, מחזיר את כל השורה.",
    },
    docsUrl: "https://support.google.com/docs/answer/12405947?hl=en",
  },

  QUERY: {
    name: "QUERY",
    category: "query",
    summary: {
      en: "Runs a SQL-like query (Google's Visualization API Query Language) over a range, returning the filtered, sorted, grouped, or pivoted result.",
      he: "מריץ query בסגנון SQL (שפת ה-Google Visualization API Query Language) על טווח, ומחזיר את התוצאה המסוננת, הממוינת, המקובצת או ה-pivot.",
    },
    syntax: "QUERY(data, query, [headers])",
    params: [
      {
        name: "data",
        type: "range",
        description: {
          en: "The range of cells to query. Each column must hold a single data type (number, string, date, boolean); mixed types pick the majority and null out the rest.",
          he: "טווח התאים שעליו עושים query. כל עמודה חייבת להכיל סוג מידע אחד (מספר, טקסט, תאריך, boolean); סוגים מעורבים בוחרים את הסוג הרוב ומאפסים את השאר.",
        },
      },
      {
        name: "query",
        type: "string",
        description: {
          en: "The query, written in Google Visualization API Query Language. Wrap it in quotes or reference a cell that holds it. Clauses include SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, LABEL, FORMAT.",
          he: "ה-query, כתוב בשפת ה-Google Visualization API Query Language. עוטפים אותו במירכאות או מצביעים לתא שמכיל אותו. הסעיפים כוללים SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, LABEL, FORMAT.",
        },
      },
      {
        name: "headers",
        type: "number",
        optional: true,
        default: "-1 (guess)",
        description: {
          en: "How many header rows are at the top of `data`. Omit or pass -1 to let Sheets guess based on content.",
          he: "כמה שורות headers יש בראש `data`. אפשר להשמיט או להעביר -1 כדי לתת ל-Sheets לנחש לפי התוכן.",
        },
      },
    ],
    returns: {
      en: "A spilled table of the query result. Shape depends on the query: SELECT * with WHERE returns matching rows; GROUP BY returns one row per group.",
      he: "טבלת תוצאות שזורמת (spills) לתאים. הצורה תלויה ב-query: SELECT * עם WHERE מחזיר את השורות התואמות; GROUP BY מחזיר שורה לכל קבוצה.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093343?hl=en",
  },
} as const satisfies Record<string, FunctionSpec>;

export type RegistryName = keyof typeof REGISTRY;

export function getFunctionSpec(name: string): FunctionSpec | null {
  return (REGISTRY as Record<string, FunctionSpec>)[name] ?? null;
}

export function listFunctionNames(): RegistryName[] {
  return Object.keys(REGISTRY) as RegistryName[];
}

// Locale-narrow helpers so the component doesn't sprinkle ternaries.
export function localized<T extends { en: string; he: string }>(
  field: T,
  locale: Locale,
): string {
  return locale === "he" ? field.he : field.en;
}
