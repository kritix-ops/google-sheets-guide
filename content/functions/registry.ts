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

  SUM: {
    name: "SUM",
    category: "math",
    summary: {
      en: "Adds every numeric value across one or more ranges or literal numbers. The everyday total at the top of a spend, revenue, clicks, or impressions column.",
      he: "מסכם כל ערך מספרי על פני טווח אחד או יותר או מספרים מילוליים. הסכום היומיומי שיושב בראש עמודות של spend, revenue, clicks או impressions.",
    },
    syntax: "SUM(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "number | range",
        description: {
          en: "The first number or range to add. Text values inside a range are ignored; a text literal passed directly returns #VALUE!.",
          he: "המספר הראשון או הטווח הראשון שמסכמים. ערכי טקסט בתוך טווח מתעלמים מהם; טקסט מילולי שמועבר ישירות מחזיר #VALUE!.",
        },
      },
      {
        name: "value2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional numbers or ranges. Sheets supports an effectively unlimited number of arguments.",
          he: "מספרים או טווחים נוספים. Sheets תומך במספר בלתי מוגבל למעשה של arguments.",
        },
      },
    ],
    returns: {
      en: "A single number: the sum of every numeric value across the inputs. Empty cells and text inside ranges contribute 0.",
      he: "מספר יחיד: סכום כל הערכים המספריים על פני הקלטים. תאים ריקים וטקסט בתוך טווחים תורמים 0.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093669?hl=en",
  },

  AVERAGE: {
    name: "AVERAGE",
    category: "math",
    summary: {
      en: "Returns the arithmetic mean of the numeric values in one or more ranges or literal numbers. Text values inside a range are skipped, not counted as zero.",
      he: "מחזיר את הממוצע החשבוני של הערכים המספריים בטווח אחד או יותר או מספרים מילוליים. ערכי טקסט בתוך טווח מתעלמים מהם, ולא נספרים כאפס.",
    },
    syntax: "AVERAGE(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "number | range",
        description: {
          en: "The first value or range whose mean to compute.",
          he: "הערך הראשון או הטווח הראשון שלהם רוצים לחשב את הממוצע.",
        },
      },
      {
        name: "value2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional values or ranges to include in the mean.",
          he: "ערכים או טווחים נוספים שייכללו בממוצע.",
        },
      },
    ],
    returns: {
      en: "A single number: the mean of the numeric inputs. Returns #DIV/0! if no numeric values are found.",
      he: "מספר יחיד: הממוצע של הקלטים המספריים. מחזיר #DIV/0! אם לא נמצאו ערכים מספריים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093615?hl=en",
  },

  ROUND: {
    name: "ROUND",
    category: "math",
    summary: {
      en: "Rounds a number to a given number of decimal places. Negative places round to tens, hundreds, and so on. Standard half-away-from-zero rounding.",
      he: "מעגל מספר למספר נתון של מקומות עשרוניים. מקומות שליליים מעגלים לעשרות, מאות וכן הלאה. עיגול סטנדרטי של חצי-מתרחק-מאפס.",
    },
    syntax: "ROUND(value, [places])",
    params: [
      {
        name: "value",
        type: "number",
        description: {
          en: "The number to round.",
          he: "המספר שמעגלים.",
        },
      },
      {
        name: "places",
        type: "number",
        optional: true,
        default: "0",
        description: {
          en: "How many decimal places to keep. Positive rounds to the right of the decimal, 0 rounds to a whole number, negative rounds to the left (e.g. -2 rounds to the nearest hundred).",
          he: "כמה מקומות עשרוניים לשמור. חיובי מעגל מימין לעשרוני, 0 מעגל למספר שלם, שלילי מעגל משמאל (למשל -2 מעגל למאה הקרובה).",
        },
      },
    ],
    returns: {
      en: "A number rounded to the requested places.",
      he: "מספר מעוגל למספר המקומות המבוקש.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093440?hl=en",
  },

  ABS: {
    name: "ABS",
    category: "math",
    summary: {
      en: "Returns the absolute (non-negative) value of a number. Strips the sign and keeps the magnitude.",
      he: "מחזיר את הערך המוחלט (אי-שלילי) של מספר. מסיר את הסימן ושומר על הגודל.",
    },
    syntax: "ABS(value)",
    params: [
      {
        name: "value",
        type: "number",
        description: {
          en: "The number whose absolute value to return.",
          he: "המספר שרוצים להחזיר את הערך המוחלט שלו.",
        },
      },
    ],
    returns: {
      en: "The input number with any negative sign removed.",
      he: "המספר המוקלט עם הסרת סימן השלילי, אם היה.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093459?hl=en",
  },

  MOD: {
    name: "MOD",
    category: "math",
    summary: {
      en: "Returns the remainder after dividing one number by another. The classic use is detecting evenness (MOD(n, 2) = 0) or banding rows by a cycle length.",
      he: "מחזיר את השארית של חלוקה בין שני מספרים. השימוש הקלאסי הוא לזהות זוגיות (MOD(n, 2) = 0) או לחלק שורות לקבוצות לפי אורך מחזור.",
    },
    syntax: "MOD(dividend, divisor)",
    params: [
      {
        name: "dividend",
        type: "number",
        description: {
          en: "The number to divide.",
          he: "המספר שמחלקים.",
        },
      },
      {
        name: "divisor",
        type: "number",
        description: {
          en: "The number to divide by. Returns #DIV/0! if zero. Floating-point inputs can give surprising remainders; wrap in ROUND for safety.",
          he: "המספר שמחלקים בו. מחזיר #DIV/0! אם הוא 0. קלטים של floating-point יכולים לתת שאריות מפתיעות; עוטפים ב-ROUND לבטחון.",
        },
      },
    ],
    returns: {
      en: "The remainder of dividend / divisor. Carries the sign of the divisor in Sheets.",
      he: "השארית של dividend חלקי divisor. נושאת את הסימן של ה-divisor ב-Sheets.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093497?hl=en",
  },

  IF: {
    name: "IF",
    category: "logical",
    summary: {
      en: "Returns one value when a condition is TRUE and another when it is FALSE. The workhorse of every conditional column: profit flags, status labels, thresholds.",
      he: "מחזיר ערך אחד כשתנאי הוא TRUE ועוד אחד כשהוא FALSE. סוס-העבודה של כל עמודה מותנית: דגלי רווח, תוויות סטטוס, ספים.",
    },
    syntax: "IF(logical_expression, value_if_true, [value_if_false])",
    params: [
      {
        name: "logical_expression",
        type: "boolean | expression",
        description: {
          en: "An expression that resolves to TRUE or FALSE. A comparison (A2>10), a function (ISBLANK(B2)), or a cell holding a boolean.",
          he: "ביטוי שמתפענח ל-TRUE או FALSE. השוואה (A2>10), פונקציה (ISBLANK(B2)), או תא שמחזיק boolean.",
        },
      },
      {
        name: "value_if_true",
        type: "any",
        description: {
          en: "What to return when the condition is TRUE. Can be a literal, a cell reference, or another formula.",
          he: "מה להחזיר כשהתנאי הוא TRUE. יכול להיות ערך מילולי, reference לתא, או נוסחה אחרת.",
        },
      },
      {
        name: "value_if_false",
        type: "any",
        optional: true,
        default: "FALSE",
        description: {
          en: "What to return when the condition is FALSE. If omitted, the function returns FALSE.",
          he: "מה להחזיר כשהתנאי הוא FALSE. אם משמיטים, הפונקציה מחזירה FALSE.",
        },
      },
    ],
    returns: {
      en: "Whichever branch matches the condition. Can be any type, even a range or array if the branch returns one.",
      he: "הסעיף שמתאים לתנאי. יכול להיות כל סוג, אפילו טווח או מערך אם הסעיף מחזיר כזה.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093364?hl=en",
  },

  AND: {
    name: "AND",
    category: "logical",
    summary: {
      en: "Returns TRUE only when every argument is TRUE. The standard way to combine conditions: profitable AND high-volume, in-budget AND on-target.",
      he: "מחזיר TRUE רק כשכל ה-arguments הם TRUE. הדרך הסטנדרטית לשלב תנאים: רווחי AND עם נפח גבוה, בתקציב AND על-יעד.",
    },
    syntax: "AND(logical_expression1, [logical_expression2, ...])",
    params: [
      {
        name: "logical_expression1",
        type: "boolean | expression",
        description: {
          en: "The first condition to evaluate. Anything that resolves to TRUE or FALSE, including numbers (0 is FALSE, anything else is TRUE).",
          he: "התנאי הראשון שמחושב. כל דבר שמתפענח ל-TRUE או FALSE, כולל מספרים (0 הוא FALSE, כל דבר אחר הוא TRUE).",
        },
      },
      {
        name: "logical_expression2, ...",
        type: "boolean | expression",
        optional: true,
        description: {
          en: "Additional conditions. All must evaluate to TRUE for AND to return TRUE.",
          he: "תנאים נוספים. כולם חייבים להתפענח ל-TRUE כדי ש-AND יחזיר TRUE.",
        },
      },
    ],
    returns: {
      en: "TRUE when every argument is TRUE, otherwise FALSE.",
      he: "TRUE כשכל ה-arguments הם TRUE, אחרת FALSE.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093301?hl=en",
  },

  OR: {
    name: "OR",
    category: "logical",
    summary: {
      en: "Returns TRUE when at least one argument is TRUE. The complement to AND: any condition matching is enough.",
      he: "מחזיר TRUE כששלפחות argument אחד הוא TRUE. ההשלמה ל-AND: מספיק שתנאי אחד מתקיים.",
    },
    syntax: "OR(logical_expression1, [logical_expression2, ...])",
    params: [
      {
        name: "logical_expression1",
        type: "boolean | expression",
        description: {
          en: "The first condition. Numbers are coerced to booleans (0 is FALSE, any other number is TRUE).",
          he: "התנאי הראשון. מספרים מומרים ל-boolean (0 הוא FALSE, כל מספר אחר הוא TRUE).",
        },
      },
      {
        name: "logical_expression2, ...",
        type: "boolean | expression",
        optional: true,
        description: {
          en: "Additional conditions. If any one is TRUE, OR returns TRUE.",
          he: "תנאים נוספים. אם לפחות אחד מהם TRUE, ה-OR מחזיר TRUE.",
        },
      },
    ],
    returns: {
      en: "TRUE when any argument is TRUE, FALSE when all are FALSE.",
      he: "TRUE כשלפחות argument אחד הוא TRUE, FALSE כשכולם FALSE.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093306?hl=en",
  },

  NOT: {
    name: "NOT",
    category: "logical",
    summary: {
      en: "Inverts a boolean: TRUE becomes FALSE, FALSE becomes TRUE. Often used to invert an IS-check like NOT(ISBLANK(A2)).",
      he: "הופך boolean: TRUE הופך ל-FALSE, FALSE הופך ל-TRUE. שימושי בעיקר להפיכת בדיקות IS כמו NOT(ISBLANK(A2)).",
    },
    syntax: "NOT(logical_expression)",
    params: [
      {
        name: "logical_expression",
        type: "boolean | expression",
        description: {
          en: "The value to invert. Non-numeric, non-boolean inputs return #VALUE!.",
          he: "הערך להפיכה. קלטים שאינם מספריים או boolean מחזירים #VALUE!.",
        },
      },
    ],
    returns: {
      en: "The opposite boolean of the input.",
      he: "ה-boolean ההפוך של הקלט.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093305?hl=en",
  },

  UPPER: {
    name: "UPPER",
    category: "text",
    summary: {
      en: "Converts every letter in a string to uppercase. Non-letter characters (digits, spaces, punctuation) are left alone.",
      he: "ממיר כל אות במחרוזת לאותיות גדולות. תווים שאינם אותיות (ספרות, רווחים, פיסוק) נשארים כמו שהם.",
    },
    syntax: "UPPER(text)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The string to convert to uppercase. Accepts a literal or a cell reference.",
          he: "המחרוזת להמיר לאותיות גדולות. מקבל ערך מילולי או reference לתא.",
        },
      },
    ],
    returns: {
      en: "The input string with all letters uppercased.",
      he: "המחרוזת המקורית עם כל האותיות מומרות לאותיות גדולות.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094219?hl=en",
  },

  LOWER: {
    name: "LOWER",
    category: "text",
    summary: {
      en: "Converts every letter in a string to lowercase. Useful for normalizing data before comparison: case-insensitive joins, deduping by email, matching across IMPORTRANGE sources.",
      he: "ממיר כל אות במחרוזת לאותיות קטנות. שימושי לנירמול מידע לפני השוואה: joins חסרי-רגישות לאותיות, deduping לפי email, התאמה בין מקורות של IMPORTRANGE.",
    },
    syntax: "LOWER(text)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The string to lowercase. Accepts a literal or a cell reference.",
          he: "המחרוזת להמיר לאותיות קטנות. מקבל ערך מילולי או reference לתא.",
        },
      },
    ],
    returns: {
      en: "The input string with all letters lowercased.",
      he: "המחרוזת המקורית עם כל האותיות מומרות לאותיות קטנות.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094083?hl=en",
  },

  PROPER: {
    name: "PROPER",
    category: "text",
    summary: {
      en: "Capitalizes the first letter of each word and lowercases the rest. Useful for cleaning names typed inconsistently across sources.",
      he: "ממיר את האות הראשונה של כל מילה לגדולה ואת השאר לקטנות. שימושי לניקוי שמות שהוקלדו בצורה לא עקבית בין מקורות.",
    },
    syntax: "PROPER(text_to_capitalize)",
    params: [
      {
        name: "text_to_capitalize",
        type: "string",
        description: {
          en: "The string to capitalize word-by-word.",
          he: "המחרוזת שעוברת היפוך case מילה-אחר-מילה.",
        },
      },
    ],
    returns: {
      en: "A title-cased version of the input.",
      he: "גרסת title-case של הקלט.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094133?hl=en",
  },

  LEN: {
    name: "LEN",
    category: "text",
    summary: {
      en: "Returns the number of characters in a string. Counts every character including spaces and non-printing characters.",
      he: "מחזיר את מספר התווים במחרוזת. סופר כל תו כולל רווחים ותווים שאינם ניתנים להדפסה.",
    },
    syntax: "LEN(text)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The string to measure. A cell reference works the same as a literal.",
          he: "המחרוזת למדידה. reference לתא עובד באותו אופן כמו ערך מילולי.",
        },
      },
    ],
    returns: {
      en: "A number: the character count of the input string.",
      he: "מספר: ספירת התווים של מחרוזת הקלט.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094081?hl=en",
  },

  TRIM: {
    name: "TRIM",
    category: "text",
    summary: {
      en: "Removes leading, trailing, and repeated internal spaces from a string. The first defense against silent lookup misses caused by stray whitespace in IMPORTRANGE'd data.",
      he: "מסיר רווחים בהתחלה, בסוף ובאמצע (חוזרים) של מחרוזת. ההגנה הראשונה מפני misses שקטים של lookup שנגרמים מ-whitespace תועה במידע שמוייבא ב-IMPORTRANGE.",
    },
    syntax: "TRIM(text)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The string to trim. TRIM only handles regular spaces; non-breaking spaces (U+00A0) survive and need SUBSTITUTE first.",
          he: "המחרוזת לחיתוך. TRIM מטפל רק ברווחים רגילים; non-breaking spaces (U+00A0) שורדים וצריך לפניהם SUBSTITUTE.",
        },
      },
    ],
    returns: {
      en: "The input string with edge whitespace removed and internal whitespace collapsed to single spaces.",
      he: "המחרוזת המקורית עם הסרת whitespace בקצוות וצמצום whitespace פנימי לרווח יחיד.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094140?hl=en",
  },

  SUBSTITUTE: {
    name: "SUBSTITUTE",
    category: "text",
    summary: {
      en: "Replaces occurrences of one substring with another. By default it replaces every match; pass an occurrence_number to swap just one.",
      he: "מחליף מופעים של מחרוזת אחת באחרת. כברירת מחדל מחליף את כל ההתאמות; אפשר להעביר occurrence_number כדי להחליף רק אחד.",
    },
    syntax: "SUBSTITUTE(text_to_search, search_for, replace_with, [occurrence_number])",
    params: [
      {
        name: "text_to_search",
        type: "string",
        description: {
          en: "The string to scan.",
          he: "המחרוזת שסורקים.",
        },
      },
      {
        name: "search_for",
        type: "string",
        description: {
          en: "The substring to replace. Case-sensitive. Matches partial words: 'vent' also matches the 'vent' inside 'eventual'.",
          he: "המחרוזת להחלפה. רגישה לאותיות. מתאימה גם לחלקי מילים: 'vent' גם מתאים ל-'vent' שבתוך 'eventual'.",
        },
      },
      {
        name: "replace_with",
        type: "string",
        description: {
          en: "What to put in place of each match. Pass an empty string to delete the search_for substring.",
          he: "מה לשים במקום כל התאמה. אפשר להעביר מחרוזת ריקה כדי למחוק את ה-search_for.",
        },
      },
      {
        name: "occurrence_number",
        type: "number",
        optional: true,
        default: "all",
        description: {
          en: "Which occurrence to replace (1 = first, 2 = second). Omit to replace every occurrence.",
          he: "איזה מופע להחליף (1 = ראשון, 2 = שני). אפשר להשמיט כדי להחליף את כל המופעים.",
        },
      },
    ],
    returns: {
      en: "A new string with the replacement applied. The original cell is not modified.",
      he: "מחרוזת חדשה עם ההחלפה. התא המקורי לא משתנה.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094215?hl=en",
  },

  DATE: {
    name: "DATE",
    category: "date",
    summary: {
      en: "Builds a date from year, month, and day numbers. Overflow rolls over (month 13 = January of the next year), which makes month arithmetic painless.",
      he: "בונה תאריך מתוך מספרי שנה, חודש ויום. עודף מתגלגל (חודש 13 = ינואר של השנה הבאה), מה שהופך את חשבון החודשים לפשוט.",
    },
    syntax: "DATE(year, month, day)",
    params: [
      {
        name: "year",
        type: "number",
        description: {
          en: "The year component. 1900-9999 used as-is; 0-1899 add 1900 (so DATE(119, 2, 1) = Feb 1, 2019); outside that range returns #NUM!.",
          he: "רכיב השנה. 1900-9999 משמש כפי שהוא; 0-1899 מוסיף 1900 (אז DATE(119, 2, 1) = 1 בפברואר 2019); מחוץ לטווח הזה מחזיר #NUM!.",
        },
      },
      {
        name: "month",
        type: "number",
        description: {
          en: "The month number (1-12). Values outside the range roll over: month 13 becomes January of the next year.",
          he: "מספר החודש (1-12). ערכים מחוץ לטווח מתגלגלים: חודש 13 הופך לינואר של השנה הבאה.",
        },
      },
      {
        name: "day",
        type: "number",
        description: {
          en: "The day number. Like month, overflow rolls over to the next month.",
          he: "מספר היום. כמו ה-month, עודף מתגלגל לחודש הבא.",
        },
      },
    ],
    returns: {
      en: "A date value (which Sheets stores as a number of days since 1899-12-30).",
      he: "ערך תאריך (ש-Sheets שומר כמספר ימים מ-30 בדצמבר 1899).",
    },
    docsUrl: "https://support.google.com/docs/answer/3092969?hl=en",
  },

  TODAY: {
    name: "TODAY",
    category: "date",
    summary: {
      en: "Returns today's date (with no time). Volatile: recalculates on every edit, so heavy use on big sheets slows the workbook.",
      he: "מחזיר את התאריך של היום (בלי שעה). פונקציה תנודתית: מחושבת מחדש בכל עריכה, אז שימוש כבד בגיליונות גדולים מאט את ה-workbook.",
    },
    syntax: "TODAY()",
    params: [],
    returns: {
      en: "Today's date as a date value. Changes overnight; recomputes on every recalc.",
      he: "תאריך היום כערך תאריך. משתנה בלילה; מחושב מחדש בכל recalc.",
    },
    docsUrl: "https://support.google.com/docs/answer/3092984?hl=en",
  },

  VLOOKUP: {
    name: "VLOOKUP",
    category: "lookup",
    summary: {
      en: "Looks for a key in the first column of a range and returns the value in a specified column of the matching row. The legacy lookup workhorse; XLOOKUP is the modern replacement.",
      he: "מחפש מפתח בעמודה הראשונה של טווח ומחזיר את הערך בעמודה מסוימת של השורה התואמת. סוס-העבודה הישן של lookups; XLOOKUP הוא ההחלפה המודרנית.",
    },
    syntax: "VLOOKUP(search_key, range, index, [is_sorted])",
    params: [
      {
        name: "search_key",
        type: "value",
        description: {
          en: "The value to search for. Must appear in the first column of `range`.",
          he: "הערך לחיפוש. חייב להופיע בעמודה הראשונה של ה-range.",
        },
      },
      {
        name: "range",
        type: "range",
        description: {
          en: "The table to look in. The first column is where the search happens; the rest hold values to return.",
          he: "הטבלה שבה מחפשים. העמודה הראשונה היא היכן שמתבצע החיפוש; השאר מחזיקות את הערכים להחזרה.",
        },
      },
      {
        name: "index",
        type: "number",
        description: {
          en: "Which column to return the value from. Counted from 1 starting at the first column of `range`. Returns #VALUE! if outside the range.",
          he: "איזו עמודה להחזיר ערך ממנה. נספרת מ-1 החל בעמודה הראשונה של ה-range. מחזיר #VALUE! אם מחוץ לטווח.",
        },
      },
      {
        name: "is_sorted",
        type: "boolean",
        optional: true,
        default: "TRUE",
        accepts: [
          {
            value: "FALSE",
            description: {
              en: "Exact match. The safe default for unsorted data; returns #N/A if no exact match.",
              he: "התאמה מדויקת. ברירת המחדל הבטוחה למידע לא ממוין; מחזיר #N/A אם אין התאמה מדויקת.",
            },
          },
          {
            value: "TRUE",
            description: {
              en: "Approximate match. Requires the first column sorted ascending. Returns the row with the largest value <= search_key.",
              he: "התאמה מקורבת. דורש שהעמודה הראשונה תהיה ממוינת בסדר עולה. מחזיר את השורה עם הערך הגדול ביותר <= search_key.",
            },
          },
        ],
        description: {
          en: "Whether the first column is sorted. Pass FALSE almost always; the TRUE default is the source of the classic 'wrong row returned' bug.",
          he: "האם העמודה הראשונה ממוינת. כדאי להעביר FALSE כמעט תמיד; ברירת המחדל TRUE היא המקור של הבאג הקלאסי של 'הוחזרה שורה לא נכונה'.",
        },
      },
    ],
    returns: {
      en: "The value in the matching row at the requested column. #N/A on no exact match when is_sorted is FALSE.",
      he: "הערך בשורה התואמת בעמודה המבוקשת. #N/A כשאין התאמה מדויקת כאשר is_sorted הוא FALSE.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093318?hl=en",
  },

  HLOOKUP: {
    name: "HLOOKUP",
    category: "lookup",
    summary: {
      en: "The horizontal twin of VLOOKUP: searches the first row of a range, returns a value from a specified row of the matching column. Rarely used today; XLOOKUP covers both directions.",
      he: "התאום האופקי של VLOOKUP: מחפש בשורה הראשונה של טווח, מחזיר ערך משורה מסוימת של העמודה התואמת. כמעט לא בשימוש היום; XLOOKUP מכסה את שני הכיוונים.",
    },
    syntax: "HLOOKUP(search_key, range, index, [is_sorted])",
    params: [
      {
        name: "search_key",
        type: "value",
        description: {
          en: "The value to look for. Must appear in the first row of `range`.",
          he: "הערך לחיפוש. חייב להופיע בשורה הראשונה של ה-range.",
        },
      },
      {
        name: "range",
        type: "range",
        description: {
          en: "The table to search. The first row is the search row; the rest hold values to return.",
          he: "הטבלה שמחפשים בה. השורה הראשונה היא שורת החיפוש; השאר מחזיקות את הערכים להחזרה.",
        },
      },
      {
        name: "index",
        type: "number",
        description: {
          en: "Which row to return from (1-based from the top of `range`).",
          he: "איזו שורה להחזיר ממנה (1-based מהראש של ה-range).",
        },
      },
      {
        name: "is_sorted",
        type: "boolean",
        optional: true,
        default: "TRUE",
        description: {
          en: "TRUE = approximate match on a sorted first row; FALSE = exact match. Pass FALSE in almost every real case.",
          he: "TRUE = התאמה מקורבת על שורה ראשונה ממוינת; FALSE = התאמה מדויקת. כדאי להעביר FALSE כמעט בכל מקרה אמיתי.",
        },
      },
    ],
    returns: {
      en: "The value from the matching column at the requested row.",
      he: "הערך מהעמודה התואמת בשורה המבוקשת.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093375?hl=en",
  },

  INDEX: {
    name: "INDEX",
    category: "lookup",
    summary: {
      en: "Returns the value at a given row and column inside a range. Paired with MATCH, it builds dynamic lookups that survive column reordering, unlike VLOOKUP.",
      he: "מחזיר את הערך בשורה ובעמודה נתונות בתוך טווח. בשילוב עם MATCH, בונה lookups דינמיים ששורדים שינוי סדר עמודות, בניגוד ל-VLOOKUP.",
    },
    syntax: "INDEX(reference, [row], [column])",
    params: [
      {
        name: "reference",
        type: "range",
        description: {
          en: "The range to read from.",
          he: "הטווח שקוראים ממנו.",
        },
      },
      {
        name: "row",
        type: "number",
        optional: true,
        default: "0",
        description: {
          en: "The row offset inside `reference` (1-based). 0 means 'return every row' (the whole column).",
          he: "ה-offset של השורה בתוך reference (1-based). 0 משמעו 'החזר כל שורה' (העמודה השלמה).",
        },
      },
      {
        name: "column",
        type: "number",
        optional: true,
        default: "0",
        description: {
          en: "The column offset (1-based). 0 means 'return every column' (the whole row).",
          he: "ה-offset של העמודה (1-based). 0 משמעו 'החזר כל עמודה' (השורה השלמה).",
        },
      },
    ],
    returns: {
      en: "The cell at (row, column) inside reference. When row or column is 0, returns the full perpendicular slice.",
      he: "התא ב-(row, column) בתוך reference. כשrow או column הוא 0, מחזיר את החיתוך המאונך המלא.",
    },
    docsUrl: "https://support.google.com/docs/answer/3098242?hl=en",
  },

  MATCH: {
    name: "MATCH",
    category: "lookup",
    summary: {
      en: "Returns the position of a search key inside a one-dimensional range. Paired with INDEX, it replaces VLOOKUP with a more flexible, column-order-independent lookup.",
      he: "מחזיר את המיקום של מפתח חיפוש בתוך טווח חד-ממדי. בשילוב עם INDEX, מחליף VLOOKUP בlookup גמיש יותר שלא תלוי בסדר עמודות.",
    },
    syntax: "MATCH(search_key, range, [search_type])",
    params: [
      {
        name: "search_key",
        type: "value",
        description: {
          en: "The value to look for.",
          he: "הערך לחיפוש.",
        },
      },
      {
        name: "range",
        type: "range",
        description: {
          en: "A one-dimensional range (single row or single column). #N/A if multi-dimensional.",
          he: "טווח חד-ממדי (שורה אחת או עמודה אחת). #N/A אם רב-ממדי.",
        },
      },
      {
        name: "search_type",
        type: "number",
        optional: true,
        default: "1",
        accepts: [
          {
            value: "1",
            description: {
              en: "Range must be ascending; returns position of largest value <= search_key.",
              he: "הטווח חייב להיות בסדר עולה; מחזיר את המיקום של הערך הגדול ביותר <= search_key.",
            },
          },
          {
            value: "0",
            description: {
              en: "Exact match. The safe choice for unsorted data.",
              he: "התאמה מדויקת. הבחירה הבטוחה למידע לא ממוין.",
            },
          },
          {
            value: "-1",
            description: {
              en: "Range must be descending; returns position of smallest value >= search_key.",
              he: "הטווח חייב להיות בסדר יורד; מחזיר את המיקום של הערך הקטן ביותר >= search_key.",
            },
          },
        ],
        description: {
          en: "Whether the range is sorted and how to match. Use 0 for safe exact-match lookups.",
          he: "האם הטווח ממוין ואיך להתאים. כדאי להשתמש ב-0 ל-lookups בטוחים של התאמה מדויקת.",
        },
      },
    ],
    returns: {
      en: "A 1-based position number. #N/A when the key isn't found (or when sort assumptions break).",
      he: "מספר מיקום 1-based. #N/A כשהמפתח לא נמצא (או כשההנחות על מיון לא מתקיימות).",
    },
    docsUrl: "https://support.google.com/docs/answer/3093378?hl=en",
  },

  IFS: {
    name: "IFS",
    category: "logical",
    summary: {
      en: "Evaluates condition / value pairs in order and returns the value paired with the first TRUE condition. Replaces stacked IF expressions with a flat, scannable list.",
      he: "מעריך זוגות של תנאי / ערך בסדר ומחזיר את הערך שמשויך לתנאי הראשון שהוא TRUE. מחליף ביטויי IF מצטברים ברשימה שטוחה וקריאה.",
    },
    syntax: "IFS(condition1, value1, [condition2, value2, ...])",
    params: [
      {
        name: "condition1",
        type: "boolean | expression",
        description: {
          en: "The first condition to evaluate.",
          he: "התנאי הראשון להערכה.",
        },
      },
      {
        name: "value1",
        type: "any",
        description: {
          en: "What to return when condition1 is TRUE.",
          he: "מה להחזיר כש-condition1 הוא TRUE.",
        },
      },
      {
        name: "condition2, value2, ...",
        type: "pairs",
        optional: true,
        description: {
          en: "Additional condition/value pairs. Evaluated left to right; first TRUE wins. End with TRUE as a catch-all to avoid #N/A.",
          he: "זוגות נוספים של condition/value. מוערכים שמאל לימין; הראשון שהוא TRUE מנצח. סיימו ב-TRUE כברירת מחדל כדי להימנע מ-#N/A.",
        },
      },
    ],
    returns: {
      en: "The value paired with the first TRUE condition. #N/A if no condition matches.",
      he: "הערך שמשויך לתנאי הראשון שהוא TRUE. #N/A אם אף תנאי לא מתאים.",
    },
    docsUrl: "https://support.google.com/docs/answer/7014145?hl=en",
  },

  SWITCH: {
    name: "SWITCH",
    category: "logical",
    summary: {
      en: "Tests an expression against discrete cases and returns the value paired with the first match. The equality-check cousin of IFS; great for translating platform / status / region codes.",
      he: "בודק ביטוי מול מקרים בדידים ומחזיר את הערך שמשויך להתאמה הראשונה. בן-הדוד של IFS להשוואות שוויון; מצוין לתרגום קודי פלטפורמה / סטטוס / אזור.",
    },
    syntax: "SWITCH(expression, case1, value1, [case2, value2, ...], [default])",
    params: [
      {
        name: "expression",
        type: "any",
        description: {
          en: "The value to compare against each case. Equality only; no >= / <= here.",
          he: "הערך להשוואה מול כל case. שוויון בלבד; אין פה >= / <=.",
        },
      },
      {
        name: "case1",
        type: "any",
        description: {
          en: "The first case to test for equality with the expression.",
          he: "ה-case הראשון לבדיקת שוויון מול ה-expression.",
        },
      },
      {
        name: "value1",
        type: "any",
        description: {
          en: "What to return when case1 matches.",
          he: "מה להחזיר כש-case1 מתאים.",
        },
      },
      {
        name: "case2, value2, ...",
        type: "pairs",
        optional: true,
        description: {
          en: "Additional case/value pairs.",
          he: "זוגות נוספים של case/value.",
        },
      },
      {
        name: "default",
        type: "any",
        optional: true,
        default: "#N/A",
        description: {
          en: "The fallback when no case matches. Without it, no-match returns #N/A.",
          he: "ערך ה-fallback כשאף case לא מתאים. בלעדיו, אי-התאמה מחזירה #N/A.",
        },
      },
    ],
    returns: {
      en: "The value paired with the first matching case, or the default if no case matched.",
      he: "הערך שמשויך ל-case הראשון שמתאים, או ה-default אם אף אחד לא מתאים.",
    },
    docsUrl: "https://support.google.com/docs/answer/7013690?hl=en",
  },

  COUNT: {
    name: "COUNT",
    category: "aggregation",
    summary: {
      en: "Counts how many cells in a range hold numeric values. Text, booleans, and empty cells are skipped.",
      he: "סופר כמה תאים בטווח מחזיקים ערכים מספריים. טקסט, booleans ותאים ריקים מדולגים.",
    },
    syntax: "COUNT(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "number | range",
        description: {
          en: "The first value or range to count numeric cells in.",
          he: "הערך או הטווח הראשון לספירה של תאים מספריים.",
        },
      },
      {
        name: "value2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional values or ranges.",
          he: "ערכים או טווחים נוספים.",
        },
      },
    ],
    returns: {
      en: "A whole number: the count of numeric cells across all inputs.",
      he: "מספר שלם: הספירה של תאים מספריים על פני כל הקלטים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093620?hl=en",
  },

  COUNTA: {
    name: "COUNTA",
    category: "aggregation",
    summary: {
      en: "Counts every non-empty cell in a range: numbers, text, booleans, errors, even cells holding an empty string. Use when you want 'how many rows actually have something here', not just numbers.",
      he: "סופר כל תא שאינו ריק בטווח: מספרים, טקסט, booleans, שגיאות, אפילו תאים שמחזיקים מחרוזת ריקה. שימושי כשרוצים 'בכמה שורות באמת יש משהו פה', לא רק מספרים.",
    },
    syntax: "COUNTA(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "any | range",
        description: {
          en: "The first value or range to count non-empty cells in.",
          he: "הערך או הטווח הראשון לספירה של תאים לא ריקים.",
        },
      },
      {
        name: "value2, ...",
        type: "any | range",
        optional: true,
        description: {
          en: "Additional values or ranges.",
          he: "ערכים או טווחים נוספים.",
        },
      },
    ],
    returns: {
      en: "A whole number: the count of non-empty cells. Includes empty-string cells (a formula that returned \"\"), which can surprise.",
      he: "מספר שלם: הספירה של תאים לא ריקים. כולל תאים עם מחרוזת ריקה (נוסחה שהחזירה \"\"), מה שיכול להפתיע.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093991?hl=en",
  },

  COUNTIF: {
    name: "COUNTIF",
    category: "aggregation",
    summary: {
      en: "Counts cells in a range that match a single criterion. The criterion can be an exact value, a comparison like \">400\", or a wildcard pattern like \"Yoav*\".",
      he: "סופר תאים בטווח שמתאימים לקריטריון יחיד. הקריטריון יכול להיות ערך מדויק, השוואה כמו \">400\", או תבנית wildcard כמו \"Yoav*\".",
    },
    syntax: "COUNTIF(range, criterion)",
    params: [
      {
        name: "range",
        type: "range",
        description: {
          en: "The range to scan.",
          he: "הטווח לסריקה.",
        },
      },
      {
        name: "criterion",
        type: "string | number | expression",
        description: {
          en: "What to match. Numbers match exactly; strings enclose comparison operators (\">400\") or wildcards (? for one char, * for any sequence). Case-insensitive for text.",
          he: "מה להתאים. מספרים מתאימים במדויק; מחרוזות עוטפות אופרטורי השוואה (\">400\") או wildcards (? לתו אחד, * לרצף כלשהו). חסרי-רגישות לאותיות בטקסט.",
        },
      },
    ],
    returns: {
      en: "A whole number: how many cells matched.",
      he: "מספר שלם: כמה תאים התאימו.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093480?hl=en",
  },

  SUMIF: {
    name: "SUMIF",
    category: "aggregation",
    summary: {
      en: "Sums cells matching a single criterion. With two arguments, sums the same range it scans; with three, sums a parallel range. The argument order is the opposite of SUMIFS; mixing them up is the classic trap.",
      he: "מסכם תאים שמתאימים לקריטריון יחיד. עם שני arguments, מסכם את אותו טווח שהוא סורק; עם שלושה, מסכם טווח מקביל. סדר ה-arguments הפוך מ-SUMIFS; בלבול ביניהם הוא המלכודת הקלאסית.",
    },
    syntax: "SUMIF(range, criterion, [sum_range])",
    params: [
      {
        name: "range",
        type: "range",
        description: {
          en: "The range to scan for matches.",
          he: "הטווח לסריקה אחר התאמות.",
        },
      },
      {
        name: "criterion",
        type: "string | number | expression",
        description: {
          en: "The match pattern. Same rules as COUNTIF: exact values, comparison strings, wildcards.",
          he: "תבנית ההתאמה. אותם כללים כמו ב-COUNTIF: ערכים מדויקים, מחרוזות השוואה, wildcards.",
        },
      },
      {
        name: "sum_range",
        type: "range",
        optional: true,
        description: {
          en: "The range to sum when the criterion matches. If omitted, the same range is summed. Must be the same size as `range`.",
          he: "הטווח לסכימה כשהקריטריון מתאים. אם משמיטים, אותו טווח מסוכם. חייב להיות באותו גודל כמו ה-range.",
        },
      },
    ],
    returns: {
      en: "A number: the total of matching cells.",
      he: "מספר: הסכום של התאים התואמים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093583?hl=en",
  },

  COUNTIFS: {
    name: "COUNTIFS",
    category: "aggregation",
    summary: {
      en: "Counts cells matching multiple criteria across parallel ranges. The workhorse 'how many campaigns match all of these conditions' function.",
      he: "סופר תאים שמתאימים למספר קריטריונים על פני טווחים מקבילים. פונקציית סוס-העבודה של 'כמה קמפיינים מתאימים לכל התנאים האלה'.",
    },
    syntax: "COUNTIFS(criteria_range1, criterion1, [criteria_range2, criterion2, ...])",
    params: [
      {
        name: "criteria_range1",
        type: "range",
        description: {
          en: "The first range to test.",
          he: "הטווח הראשון לבדיקה.",
        },
      },
      {
        name: "criterion1",
        type: "string | number | expression",
        description: {
          en: "The pattern to test against criteria_range1.",
          he: "התבנית לבדיקה מול criteria_range1.",
        },
      },
      {
        name: "criteria_range2, criterion2, ...",
        type: "pairs",
        optional: true,
        description: {
          en: "Additional range/criterion pairs. Every range must have the same dimensions as the first.",
          he: "זוגות נוספים של range/criterion. כל טווח חייב להיות באותם מימדים כמו הראשון.",
        },
      },
    ],
    returns: {
      en: "A whole number: how many rows matched every criterion.",
      he: "מספר שלם: כמה שורות התאימו לכל קריטריון.",
    },
    docsUrl: "https://support.google.com/docs/answer/3256550?hl=en",
  },

  SUMIFS: {
    name: "SUMIFS",
    category: "aggregation",
    summary: {
      en: "Sums a range filtered by multiple criteria across parallel ranges. The single most-used aggregation function in business spreadsheets: every buyer-vs-platform pivot is SUMIFS.",
      he: "מסכם טווח שמסונן לפי מספר קריטריונים על פני טווחים מקבילים. פונקציית האגרגציה הכי בשימוש ב-spreadsheets עסקיים: כל pivot של buyer-מול-platform זה SUMIFS.",
    },
    syntax: "SUMIFS(sum_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])",
    params: [
      {
        name: "sum_range",
        type: "range",
        description: {
          en: "The range to sum. First argument, unlike SUMIF where it's last.",
          he: "הטווח לסכימה. argument ראשון, בניגוד ל-SUMIF שבו הוא אחרון.",
        },
      },
      {
        name: "criteria_range1",
        type: "range",
        description: {
          en: "The first range to filter on.",
          he: "הטווח הראשון לסינון.",
        },
      },
      {
        name: "criterion1",
        type: "string | number | expression",
        description: {
          en: "The pattern to apply to criteria_range1.",
          he: "התבנית להחיל על criteria_range1.",
        },
      },
      {
        name: "criteria_range2, criterion2, ...",
        type: "pairs",
        optional: true,
        description: {
          en: "Additional range/criterion pairs. Each range must match sum_range's dimensions.",
          he: "זוגות נוספים של range/criterion. כל טווח חייב להתאים למימדי sum_range.",
        },
      },
    ],
    returns: {
      en: "A number: the total of cells in sum_range whose parallel cells matched every criterion.",
      he: "מספר: הסכום של תאים ב-sum_range שתאיהם המקבילים התאימו לכל קריטריון.",
    },
    docsUrl: "https://support.google.com/docs/answer/3238496?hl=en",
  },

  AVERAGEIFS: {
    name: "AVERAGEIFS",
    category: "aggregation",
    summary: {
      en: "Averages a range filtered by multiple criteria. Same argument shape as SUMIFS.",
      he: "מחשב ממוצע של טווח שמסונן לפי מספר קריטריונים. אותה צורת arguments כמו SUMIFS.",
    },
    syntax: "AVERAGEIFS(average_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])",
    params: [
      {
        name: "average_range",
        type: "range",
        description: {
          en: "The range to average.",
          he: "הטווח לחישוב הממוצע.",
        },
      },
      {
        name: "criteria_range1",
        type: "range",
        description: {
          en: "The first range to filter on.",
          he: "הטווח הראשון לסינון.",
        },
      },
      {
        name: "criterion1",
        type: "string | number | expression",
        description: {
          en: "The pattern to apply to criteria_range1.",
          he: "התבנית להחיל על criteria_range1.",
        },
      },
      {
        name: "criteria_range2, criterion2, ...",
        type: "pairs",
        optional: true,
        description: {
          en: "Additional range/criterion pairs.",
          he: "זוגות נוספים של range/criterion.",
        },
      },
    ],
    returns: {
      en: "A number: the average of matching cells. #DIV/0! if nothing matched.",
      he: "מספר: הממוצע של תאים תואמים. #DIV/0! אם שום דבר לא התאים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3256534?hl=en",
  },

  MAX: {
    name: "MAX",
    category: "aggregation",
    summary: {
      en: "Returns the largest number across one or more ranges or values. Text cells inside ranges are skipped; bare text arguments error.",
      he: "מחזיר את המספר הגדול ביותר על פני טווח אחד או יותר או ערכים. תאי טקסט בתוך טווחים מדולגים; argument של טקסט חשוף מחזיר שגיאה.",
    },
    syntax: "MAX(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "number | range",
        description: {
          en: "The first value or range.",
          he: "הערך או הטווח הראשון.",
        },
      },
      {
        name: "value2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional values or ranges.",
          he: "ערכים או טווחים נוספים.",
        },
      },
    ],
    returns: {
      en: "The maximum numeric value found.",
      he: "הערך המספרי הגדול ביותר שנמצא.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094013?hl=en",
  },

  MIN: {
    name: "MIN",
    category: "aggregation",
    summary: {
      en: "Returns the smallest number across one or more ranges or values. The mirror of MAX.",
      he: "מחזיר את המספר הקטן ביותר על פני טווח אחד או יותר או ערכים. המראה של MAX.",
    },
    syntax: "MIN(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "number | range",
        description: {
          en: "The first value or range.",
          he: "הערך או הטווח הראשון.",
        },
      },
      {
        name: "value2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional values or ranges.",
          he: "ערכים או טווחים נוספים.",
        },
      },
    ],
    returns: {
      en: "The minimum numeric value found.",
      he: "הערך המספרי הקטן ביותר שנמצא.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094017?hl=en",
  },

  LEFT: {
    name: "LEFT",
    category: "text",
    summary: {
      en: "Returns the leftmost N characters of a string. The standard way to grab a known-length prefix like a 2-letter buyer code or a 3-letter country code.",
      he: "מחזיר את N התווים השמאליים של מחרוזת. הדרך הסטנדרטית לתפוס prefix באורך ידוע כמו קוד buyer בן 2 אותיות או קוד מדינה בן 3 אותיות.",
    },
    syntax: "LEFT(string, [number_of_characters])",
    params: [
      {
        name: "string",
        type: "string",
        description: {
          en: "The source text.",
          he: "מחרוזת המקור.",
        },
      },
      {
        name: "number_of_characters",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "How many characters to return from the left. 0 returns an empty string; a count larger than the string returns the whole string.",
          he: "כמה תווים להחזיר מהשמאל. 0 מחזיר מחרוזת ריקה; ספירה גדולה מהמחרוזת מחזירה את כל המחרוזת.",
        },
      },
    ],
    returns: {
      en: "A substring containing the first N characters of the input.",
      he: "תת-מחרוזת שמכילה את N התווים הראשונים של הקלט.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094079?hl=en",
  },

  RIGHT: {
    name: "RIGHT",
    category: "text",
    summary: {
      en: "Returns the rightmost N characters of a string. The mirror of LEFT; useful for suffixes like the team's mandatory ' PR' tag on vertical names.",
      he: "מחזיר את N התווים הימניים של מחרוזת. המראה של LEFT; שימושי ל-suffixes כמו תג ה-' PR' שחובה בסוף שמות verticals של הצוות.",
    },
    syntax: "RIGHT(string, [number_of_characters])",
    params: [
      {
        name: "string",
        type: "string",
        description: {
          en: "The source text.",
          he: "מחרוזת המקור.",
        },
      },
      {
        name: "number_of_characters",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "How many characters to return from the right.",
          he: "כמה תווים להחזיר מהימין.",
        },
      },
    ],
    returns: {
      en: "A substring containing the last N characters.",
      he: "תת-מחרוזת שמכילה את N התווים האחרונים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094087?hl=en",
  },

  MID: {
    name: "MID",
    category: "text",
    summary: {
      en: "Returns a substring of given length starting at a 1-indexed position. The tool for slicing the middle of a campaign code at known offsets.",
      he: "מחזיר תת-מחרוזת באורך נתון שמתחילה במיקום 1-indexed. הכלי לחיתוך האמצע של campaign code ב-offsets ידועים.",
    },
    syntax: "MID(string, starting_at, extract_length)",
    params: [
      {
        name: "string",
        type: "string",
        description: {
          en: "The source text.",
          he: "מחרוזת המקור.",
        },
      },
      {
        name: "starting_at",
        type: "number",
        description: {
          en: "Where to start (1 = first character). Values past the string's end return empty.",
          he: "היכן להתחיל (1 = התו הראשון). ערכים שמעבר לסוף המחרוזת מחזירים ריק.",
        },
      },
      {
        name: "extract_length",
        type: "number",
        description: {
          en: "How many characters to take. If you run past the end, MID returns whatever remains.",
          he: "כמה תווים לקחת. אם רצים מעבר לסוף, MID מחזיר את מה שנשאר.",
        },
      },
    ],
    returns: {
      en: "The requested middle slice.",
      he: "החיתוך האמצעי המבוקש.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094129?hl=en",
  },

  FIND: {
    name: "FIND",
    category: "text",
    summary: {
      en: "Returns the 1-indexed position where a substring first appears inside text. Case-sensitive; SEARCH is the case-insensitive cousin. Errors with #VALUE! when no match exists.",
      he: "מחזיר את המיקום 1-indexed שבו תת-מחרוזת מופיעה לראשונה בתוך טקסט. רגיש לאותיות; SEARCH הוא בן-הדוד שלא רגיש לאותיות. נכשל עם #VALUE! כשאין התאמה.",
    },
    syntax: "FIND(search_for, text_to_search, [starting_at])",
    params: [
      {
        name: "search_for",
        type: "string",
        description: {
          en: "The substring to look for. Case-sensitive: 'PR' will not match 'pr'.",
          he: "התת-מחרוזת לחיפוש. רגישה לאותיות: 'PR' לא יתאים ל-'pr'.",
        },
      },
      {
        name: "text_to_search",
        type: "string",
        description: {
          en: "The string to scan.",
          he: "המחרוזת לסריקה.",
        },
      },
      {
        name: "starting_at",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "Where in text_to_search to begin scanning. Useful for finding the second occurrence by starting just after the first.",
          he: "היכן ב-text_to_search להתחיל לסרוק. שימושי למציאת המופע השני על ידי התחלה ממש אחרי הראשון.",
        },
      },
    ],
    returns: {
      en: "The 1-indexed position of the first match. #VALUE! if not found: wrap in IFERROR for production safety.",
      he: "המיקום 1-indexed של ההתאמה הראשונה. #VALUE! אם לא נמצא: עוטפים ב-IFERROR לבטיחות ב-production.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094126?hl=en",
  },

  SEARCH: {
    name: "SEARCH",
    category: "text",
    summary: {
      en: "The case-insensitive twin of FIND. Returns the 1-indexed position of the first match. Supports the same ? and * wildcards as COUNTIF criteria.",
      he: "התאום של FIND שלא רגיש לאותיות. מחזיר את המיקום 1-indexed של ההתאמה הראשונה. תומך באותם wildcards של ? ו-* כמו קריטריונים של COUNTIF.",
    },
    syntax: "SEARCH(search_for, text_to_search, [starting_at])",
    params: [
      {
        name: "search_for",
        type: "string",
        description: {
          en: "The substring or wildcard pattern to look for. Not case-sensitive.",
          he: "התת-מחרוזת או תבנית ה-wildcard לחיפוש. לא רגיש לאותיות.",
        },
      },
      {
        name: "text_to_search",
        type: "string",
        description: {
          en: "The string to scan.",
          he: "המחרוזת לסריקה.",
        },
      },
      {
        name: "starting_at",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "1-indexed starting position.",
          he: "מיקום התחלה 1-indexed.",
        },
      },
    ],
    returns: {
      en: "The 1-indexed position of the first match. #VALUE! if not found.",
      he: "המיקום 1-indexed של ההתאמה הראשונה. #VALUE! אם לא נמצא.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094154?hl=en",
  },

  NOW: {
    name: "NOW",
    category: "date",
    summary: {
      en: "Returns the current date and time. Volatile: recalculates on every edit, so heavy use on big sheets is expensive. The date-and-time twin of TODAY.",
      he: "מחזיר את התאריך והשעה הנוכחיים. תנודתית: מחושבת מחדש בכל עריכה, אז שימוש כבד בגיליונות גדולים יקר. התאום של TODAY עם תאריך-ושעה.",
    },
    syntax: "NOW()",
    params: [],
    returns: {
      en: "The current date and time as a date-time value.",
      he: "התאריך והשעה הנוכחיים כערך date-time.",
    },
    docsUrl: "https://support.google.com/docs/answer/3092981?hl=en",
  },

  EOMONTH: {
    name: "EOMONTH",
    category: "date",
    summary: {
      en: "Returns the last day of the month offset by N months from a start date. The canonical way to compute billing-period ends and cohort buckets.",
      he: "מחזיר את היום האחרון של חודש שהוא ב-offset של N חודשים מתאריך התחלה. הדרך הקנונית לחשב סופי תקופות חיוב ו-cohort buckets.",
    },
    syntax: "EOMONTH(start_date, months)",
    params: [
      {
        name: "start_date",
        type: "date",
        description: {
          en: "The starting date. Must be a real date value, not a text string. IMPORTRANGE'd text dates need DATEVALUE first.",
          he: "תאריך ההתחלה. חייב להיות ערך תאריך אמיתי, לא מחרוזת טקסט. תאריכי טקסט מ-IMPORTRANGE צריכים DATEVALUE קודם.",
        },
      },
      {
        name: "months",
        type: "number",
        description: {
          en: "Offset in months. 0 = end of the start_date's own month. Positive moves forward, negative moves backward. Decimals are truncated.",
          he: "Offset בחודשים. 0 = סוף חודש ה-start_date עצמו. חיובי קדימה, שלילי אחורה. עשרוניים נחתכים.",
        },
      },
    ],
    returns: {
      en: "A date value (the last day of the resulting month). Format the cell as Date or you'll see the serial number.",
      he: "ערך תאריך (היום האחרון של החודש שמתקבל). עצבו את התא כתאריך או שתראו את המספר הסידורי.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093044?hl=en",
  },

  NETWORKDAYS: {
    name: "NETWORKDAYS",
    category: "date",
    summary: {
      en: "Counts working days (Mon-Fri) between two dates, inclusive on both ends. Optional holidays range gets subtracted too. The foundation of every budget pacing alert.",
      he: "סופר ימי עבודה (שני-שישי) בין שני תאריכים, כולל את שני הקצוות. טווח holidays אופציונלי גם מופחת. הבסיס של כל alert של pacing תקציב.",
    },
    syntax: "NETWORKDAYS(start_date, end_date, [holidays])",
    params: [
      {
        name: "start_date",
        type: "date",
        description: {
          en: "The first day of the range. Must be a date value, not a text string.",
          he: "היום הראשון בטווח. חייב להיות ערך תאריך, לא מחרוזת טקסט.",
        },
      },
      {
        name: "end_date",
        type: "date",
        description: {
          en: "The last day of the range, inclusive.",
          he: "היום האחרון בטווח, כולל.",
        },
      },
      {
        name: "holidays",
        type: "range | array",
        optional: true,
        description: {
          en: "A range or array of dates to also exclude. Reference a named range from a Config sheet so every NETWORKDAYS in the workbook uses the same calendar.",
          he: "טווח או מערך של תאריכים גם להחריג. הפנו ל-named range מגיליון Config כדי שכל NETWORKDAYS ב-workbook ישתמש באותו לוח שנה.",
        },
      },
    ],
    returns: {
      en: "A whole number: working days in the range. Use NETWORKDAYS.INTL for non-Mon-Fri workweeks.",
      he: "מספר שלם: ימי עבודה בטווח. השתמשו ב-NETWORKDAYS.INTL לשבועות עבודה שאינם שני-שישי.",
    },
    docsUrl: "https://support.google.com/docs/answer/3092979?hl=en",
  },

  DATEDIF: {
    name: "DATEDIF",
    category: "date",
    summary: {
      en: "Returns the difference between two dates in years, months, or days based on a unit code. The tool for tenure, age, time-to-deadline calculations.",
      he: "מחזיר את ההפרש בין שני תאריכים בשנים, חודשים או ימים על בסיס קוד יחידה. הכלי לחישובי tenure, גיל, זמן-עד-deadline.",
    },
    syntax: "DATEDIF(start_date, end_date, unit)",
    params: [
      {
        name: "start_date",
        type: "date",
        description: {
          en: "The earlier date.",
          he: "התאריך המוקדם יותר.",
        },
      },
      {
        name: "end_date",
        type: "date",
        description: {
          en: "The later date. Must be >= start_date or DATEDIF returns #NUM!.",
          he: "התאריך המאוחר יותר. חייב להיות >= start_date או ש-DATEDIF מחזיר #NUM!.",
        },
      },
      {
        name: "unit",
        type: "string",
        accepts: [
          { value: '"Y"', description: { en: "Whole years between the dates.", he: "שנים שלמות בין התאריכים." } },
          { value: '"M"', description: { en: "Whole months.", he: "חודשים שלמים." } },
          { value: '"D"', description: { en: "Days.", he: "ימים." } },
          { value: '"YM"', description: { en: "Months remaining after subtracting whole years. Useful with 'Y' for 'X years and Y months' output.", he: "חודשים שנותרו לאחר חיסור שנים שלמות. שימושי עם 'Y' לפלט של 'X שנים ו-Y חודשים'." } },
          { value: '"YD"', description: { en: "Days elapsed assuming dates fall within one year.", he: "ימים שעברו בהנחה שהתאריכים נופלים בתוך שנה אחת." } },
          { value: '"MD"', description: { en: "Days after subtracting whole months. Has documented edge cases; avoid in production.", he: "ימים לאחר חיסור חודשים שלמים. יש מקרי קצה מתועדים; להימנע בפרודקשן." } },
        ],
        description: {
          en: "The unit code (string in quotes) for the result.",
          he: "קוד היחידה (מחרוזת במרכאות) לתוצאה.",
        },
      },
    ],
    returns: {
      en: "A whole number in the requested unit. Always rounds down.",
      he: "מספר שלם ביחידה המבוקשת. תמיד מעגל למטה.",
    },
    docsUrl: "https://support.google.com/docs/answer/6055612?hl=en",
  },

  IFERROR: {
    name: "IFERROR",
    category: "logical",
    summary: {
      en: "Returns the value of an expression, or a fallback if the expression errors. The catch-all error wrapper: convenient, but a sledgehammer that hides every error type at once.",
      he: "מחזיר את הערך של ביטוי, או fallback אם הביטוי שוגה. ה-wrapper הכללי לשגיאות: נוח, אבל הוא פטיש שמסתיר כל סוג שגיאה בבת אחת.",
    },
    syntax: "IFERROR(value, [value_if_error])",
    params: [
      {
        name: "value",
        type: "expression",
        description: {
          en: "The expression to try.",
          he: "הביטוי לנסות.",
        },
      },
      {
        name: "value_if_error",
        type: "any",
        optional: true,
        default: "blank",
        description: {
          en: "What to return if `value` is any error. Omitting it makes errors render as blank, which often creates downstream surprises.",
          he: "מה להחזיר אם value הוא איזושהי שגיאה. השמטה גורמת לשגיאות להופיע כריקות, מה שיוצר לעיתים קרובות הפתעות במורד הזרם.",
        },
      },
    ],
    returns: {
      en: "The original value when no error, otherwise the fallback.",
      he: "הערך המקורי כשאין שגיאה, אחרת ה-fallback.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093304?hl=en",
  },

  IFNA: {
    name: "IFNA",
    category: "logical",
    summary: {
      en: "Returns the value of an expression, or a fallback when the expression is specifically #N/A. Lets every other error type pass through so real failures stay visible.",
      he: "מחזיר את הערך של ביטוי, או fallback כשהביטוי הוא ספציפית #N/A. נותן לכל סוג שגיאה אחר לעבור כדי שכישלונות אמיתיים יישארו גלויים.",
    },
    syntax: "IFNA(value, value_if_na)",
    params: [
      {
        name: "value",
        type: "expression",
        description: {
          en: "The expression to evaluate.",
          he: "הביטוי להערכה.",
        },
      },
      {
        name: "value_if_na",
        type: "any",
        description: {
          en: "What to return when value is #N/A. Required argument: IFNA does not default to blank like IFERROR.",
          he: "מה להחזיר כש-value הוא #N/A. argument חובה: IFNA לא נופל לברירת מחדל של ריק כמו IFERROR.",
        },
      },
    ],
    returns: {
      en: "The original value if not #N/A; the fallback if #N/A; the original error otherwise (#REF!, #VALUE!, etc. pass through).",
      he: "הערך המקורי אם לא #N/A; ה-fallback אם #N/A; השגיאה המקורית אחרת (#REF!, #VALUE! וכו' עוברים).",
    },
    docsUrl: "https://support.google.com/docs/answer/9365944?hl=en",
  },

  ISERROR: {
    name: "ISERROR",
    category: "info",
    summary: {
      en: "Returns TRUE if a value is any error (#N/A, #REF!, #DIV/0!, etc.), FALSE otherwise. Use inside IF to branch on whether a formula succeeded.",
      he: "מחזיר TRUE אם ערך הוא כל שגיאה (#N/A, #REF!, #DIV/0! וכו'), FALSE אחרת. שימושי בתוך IF להסתעפות לפי אם נוסחה הצליחה.",
    },
    syntax: "ISERROR(value)",
    params: [
      {
        name: "value",
        type: "any",
        description: {
          en: "The value or formula result to test. ISERR is the variant that returns FALSE for #N/A.",
          he: "הערך או תוצאת הנוסחה לבדיקה. ISERR הוא הווריאנט שמחזיר FALSE עבור #N/A.",
        },
      },
    ],
    returns: {
      en: "TRUE if the value is any error type; FALSE otherwise.",
      he: "TRUE אם הערך הוא כל סוג שגיאה; FALSE אחרת.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093349?hl=en",
  },

  SEQUENCE: {
    name: "SEQUENCE",
    category: "array",
    summary: {
      en: "Generates a spilled grid of consecutive numbers. With one argument, a single column; with two, a rectangle. Optional start and step control the values.",
      he: "מייצר טבלת מספרים רציפים שזורמת. עם argument אחד, עמודה יחידה; עם שניים, מלבן. start ו-step אופציונליים שולטים בערכים.",
    },
    syntax: "SEQUENCE(rows, [columns], [start], [step])",
    params: [
      {
        name: "rows",
        type: "number",
        description: {
          en: "How many rows to generate.",
          he: "כמה שורות לייצר.",
        },
      },
      {
        name: "columns",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "How many columns. Omit for a single column.",
          he: "כמה עמודות. השמיטו לעמודה יחידה.",
        },
      },
      {
        name: "start",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "The first number in the sequence.",
          he: "המספר הראשון ברצף.",
        },
      },
      {
        name: "step",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "How much to add between consecutive values. Can be negative to count down.",
          he: "כמה להוסיף בין ערכים רצופים. יכול להיות שלילי כדי לספור למטה.",
        },
      },
    ],
    returns: {
      en: "A spilled rows × columns grid of consecutive numbers. Array-aware: no ARRAYFORMULA needed.",
      he: "טבלה שזורמת בגודל rows × columns של מספרים רצופים. מודע-מערכים: לא צריך ARRAYFORMULA.",
    },
    docsUrl: "https://support.google.com/docs/answer/9368244?hl=en",
  },

  RANDARRAY: {
    name: "RANDARRAY",
    category: "array",
    summary: {
      en: "Returns a spilled grid of random decimals between 0 and 1. Volatile (recalculates on every change). Sheets' RANDARRAY is intentionally simpler than Excel's: no min, max, or integer options.",
      he: "מחזיר טבלה שזורמת של מספרים עשרוניים אקראיים בין 0 ל-1. תנודתית (מחושבת מחדש בכל שינוי). RANDARRAY של Sheets פשוטה במכוון יותר מזו של Excel: אין אופציות של min, max או שלמים.",
    },
    syntax: "RANDARRAY([rows], [columns])",
    params: [
      {
        name: "rows",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "How many rows. Must be supplied if columns is supplied.",
          he: "כמה שורות. חייב להיות מסופק אם columns מסופק.",
        },
      },
      {
        name: "columns",
        type: "number",
        optional: true,
        default: "1",
        description: {
          en: "How many columns. Omit for a single column.",
          he: "כמה עמודות. השמיטו לעמודה יחידה.",
        },
      },
    ],
    returns: {
      en: "A spilled grid of decimals in [0, 1). For integers or a custom range, wrap with arithmetic: ROUND(min + RANDARRAY(...) * (max-min), 0).",
      he: "טבלה שזורמת של עשרוניים ב-[0, 1). למספרים שלמים או טווח מותאם, עוטפים בחשבון: ROUND(min + RANDARRAY(...) * (max-min), 0).",
    },
    docsUrl: "https://support.google.com/docs/answer/9211904?hl=en",
  },

  MAKEARRAY: {
    name: "MAKEARRAY",
    category: "lambda",
    summary: {
      en: "Builds a spilled grid by calling a LAMBDA once per cell with the row and column indices. The functional-programming way to generate derived data.",
      he: "בונה טבלה שזורמת על ידי קריאה ל-LAMBDA פעם אחת לכל תא עם ה-indexes של שורה ועמודה. הדרך התכנותית-פונקציונלית לייצר מידע נגזר.",
    },
    syntax: "MAKEARRAY(rows, columns, LAMBDA(row_index, column_index, formula))",
    params: [
      {
        name: "rows",
        type: "number",
        description: {
          en: "Number of rows.",
          he: "מספר שורות.",
        },
      },
      {
        name: "columns",
        type: "number",
        description: {
          en: "Number of columns.",
          he: "מספר עמודות.",
        },
      },
      {
        name: "LAMBDA",
        type: "lambda(row_index, column_index)",
        description: {
          en: "A LAMBDA that takes two arguments (1-indexed row and column) and returns a single value. Array-returning lambdas are not allowed.",
          he: "LAMBDA שמקבל שני arguments (שורה ועמודה 1-indexed) ומחזיר ערך יחיד. lambdas שמחזירים מערך אסורים.",
        },
      },
    ],
    returns: {
      en: "A spilled rows × columns grid where each cell holds the lambda's output for its (row_index, column_index).",
      he: "טבלה שזורמת בגודל rows × columns שבה כל תא מחזיק את הפלט של ה-lambda עבור ה-(row_index, column_index) שלו.",
    },
    docsUrl: "https://support.google.com/docs/answer/12569202?hl=en",
  },

  FILTER: {
    name: "FILTER",
    category: "filter",
    summary: {
      en: "Returns the rows of a range where every provided boolean condition is TRUE. Spilled and array-aware: no ARRAYFORMULA wrapper needed. The lightweight cousin of QUERY when you don't need projection or grouping.",
      he: "מחזיר את שורות הטווח שבהן כל תנאי boolean שסופק הוא TRUE. זורם ומודע למערכים: לא צריך ARRAYFORMULA. בן-הדוד הקל יותר של QUERY כשלא צריך projection או grouping.",
    },
    syntax: "FILTER(range, condition1, [condition2, ...])",
    params: [
      {
        name: "range",
        type: "range",
        description: {
          en: "The data to filter. All columns are returned for every passing row.",
          he: "המידע לסינון. כל העמודות מוחזרות לכל שורה עוברת.",
        },
      },
      {
        name: "condition1",
        type: "boolean array",
        description: {
          en: "A boolean array (TRUE/FALSE) the same length as range, one entry per row.",
          he: "מערך boolean (TRUE/FALSE) באותו אורך כמו range, ערך אחד לכל שורה.",
        },
      },
      {
        name: "condition2, ...",
        type: "boolean array",
        optional: true,
        description: {
          en: "Additional conditions ANDed with the first. For OR logic, add the boolean arrays with +: (B = 'Yoav') + (B = 'Sarah').",
          he: "תנאים נוספים שמשולבים ב-AND עם הראשון. ללוגיקת OR, מחברים את מערכי ה-boolean עם +: (B = 'Yoav') + (B = 'Sarah').",
        },
      },
    ],
    returns: {
      en: "The matching rows of range. #N/A when no rows match: wrap in IFNA with a fallback for production sheets.",
      he: "השורות התואמות של range. #N/A כשלא נמצאו שורות תואמות: עוטפים ב-IFNA עם fallback לגיליונות פרודקשן.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093197?hl=en",
  },

  SORT: {
    name: "SORT",
    category: "filter",
    summary: {
      en: "Returns a range sorted by one or more columns. Spilled output. The simple alternative to QUERY's ORDER BY when you don't need projection.",
      he: "מחזיר טווח ממוין לפי עמודה אחת או יותר. פלט זורם. החלופה הפשוטה ל-ORDER BY של QUERY כשלא צריך projection.",
    },
    syntax: "SORT(range, sort_column, is_ascending, [sort_column2, is_ascending2, ...])",
    params: [
      {
        name: "range",
        type: "range",
        description: {
          en: "The data to sort.",
          he: "המידע למיון.",
        },
      },
      {
        name: "sort_column",
        type: "number | range",
        description: {
          en: "Column number WITHIN the range (1-indexed) or a parallel single-column range holding the sort keys.",
          he: "מספר עמודה בתוך ה-range (1-indexed) או טווח מקביל של עמודה יחידה שמחזיק את מפתחות המיון.",
        },
      },
      {
        name: "is_ascending",
        type: "boolean",
        description: {
          en: "TRUE for ascending, FALSE for descending.",
          he: "TRUE לסדר עולה, FALSE לסדר יורד.",
        },
      },
      {
        name: "sort_column2, is_ascending2, ...",
        type: "pairs",
        optional: true,
        description: {
          en: "Additional sort keys for tie-breaking, in priority order.",
          he: "מפתחות מיון נוספים לקביעת tiebreaker, בסדר עדיפויות.",
        },
      },
    ],
    returns: {
      en: "The range with rows reordered. Other columns keep their original sequence relative to the sort keys.",
      he: "ה-range עם שורות מסודרות מחדש. עמודות אחרות שומרות על הסדר המקורי שלהן יחסית למפתחות המיון.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093150?hl=en",
  },

  UNIQUE: {
    name: "UNIQUE",
    category: "filter",
    summary: {
      en: "Returns the distinct rows of a range, preserving order of first appearance. On a single column, distinct values; on multiple columns, distinct row combinations.",
      he: "מחזיר את השורות הייחודיות של טווח, שומר על סדר ההופעה הראשונה. בעמודה יחידה, ערכים ייחודיים; בכמה עמודות, צירופי שורות ייחודיים.",
    },
    syntax: "UNIQUE(range, [by_column], [exactly_once])",
    params: [
      {
        name: "range",
        type: "range",
        description: {
          en: "The data to dedupe.",
          he: "המידע לדה-דופליקציה.",
        },
      },
      {
        name: "by_column",
        type: "boolean",
        optional: true,
        default: "FALSE",
        description: {
          en: "FALSE = dedupe rows (default). TRUE = dedupe columns.",
          he: "FALSE = דה-דופליקציה של שורות (ברירת מחדל). TRUE = דה-דופליקציה של עמודות.",
        },
      },
      {
        name: "exactly_once",
        type: "boolean",
        optional: true,
        default: "FALSE",
        description: {
          en: "TRUE = keep only values that appeared exactly once in the source. Useful for spotting duplicates indirectly.",
          he: "TRUE = שומר רק ערכים שהופיעו פעם אחת בדיוק במקור. שימושי לזיהוי כפילויות בעקיפין.",
        },
      },
    ],
    returns: {
      en: "Distinct rows in order of first appearance. Watch out: whitespace and case differences are treated as distinct.",
      he: "שורות ייחודיות בסדר ההופעה הראשונה. שימו לב: הבדלי whitespace ו-case מטופלים כשונים.",
    },
    docsUrl: "https://support.google.com/docs/answer/10522653?hl=en",
  },

  SPLIT: {
    name: "SPLIT",
    category: "text",
    summary: {
      en: "Breaks a string into separate cells by a delimiter. Spills horizontally by default. The standard tool for unpacking the team's campaign codes (Platform_Vertical_Audience_Period) into parsed columns.",
      he: "מפצל מחרוזת לתאים נפרדים לפי מפריד. זורם אופקית כברירת מחדל. הכלי הסטנדרטי לפירוק קודי הקמפיין של הצוות (Platform_Vertical_Audience_Period) לעמודות מפורסרות.",
    },
    syntax: "SPLIT(text, delimiter, [split_by_each], [remove_empty_text])",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The string to split.",
          he: "המחרוזת לפיצול.",
        },
      },
      {
        name: "delimiter",
        type: "string",
        description: {
          en: "The character(s) to split on. With split_by_each = TRUE (the default), each character of the delimiter is its own splitter.",
          he: "התווים לפיצול עליהם. עם split_by_each = TRUE (ברירת המחדל), כל תו של המפריד הוא מפצל בפני עצמו.",
        },
      },
      {
        name: "split_by_each",
        type: "boolean",
        optional: true,
        default: "TRUE",
        description: {
          en: "TRUE = split by each character. FALSE = treat the delimiter as a single multi-character separator. Pass FALSE for multi-char separators like ', '.",
          he: "TRUE = פצל לפי כל תו. FALSE = להתייחס למפריד כאל מפריד יחיד רב-תווי. העבירו FALSE למפרידים רב-תווים כמו ', '.",
        },
      },
      {
        name: "remove_empty_text",
        type: "boolean",
        optional: true,
        default: "TRUE",
        description: {
          en: "TRUE = skip empty values from consecutive delimiters. FALSE = keep empty cells in the output.",
          he: "TRUE = דלג על ערכים ריקים ממפרידים רצופים. FALSE = השאר תאים ריקים בפלט.",
        },
      },
    ],
    returns: {
      en: "A spilled row of the split pieces. Array-aware: no ARRAYFORMULA needed.",
      he: "שורה זורמת של החתיכות. מודע למערכים: לא צריך ARRAYFORMULA.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094136?hl=en",
  },

  JOIN: {
    name: "JOIN",
    category: "text",
    summary: {
      en: "Concatenates the values of one or more one-dimensional arrays into a single string with a delimiter between each. The legacy version; TEXTJOIN is the modern replacement.",
      he: "משרשר את הערכים של מערך חד-ממדי אחד או יותר למחרוזת אחת עם מפריד בין כל אחד. הגרסה הישנה; TEXTJOIN הוא ההחלפה המודרנית.",
    },
    syntax: "JOIN(delimiter, value_or_array1, [value_or_array2, ...])",
    params: [
      {
        name: "delimiter",
        type: "string",
        description: {
          en: "The string to put between each value. Pass \"\" for no separator (same as CONCATENATE).",
          he: "המחרוזת לשים בין כל ערך. העבירו \"\" לאיפה ללא מפריד (כמו CONCATENATE).",
        },
      },
      {
        name: "value_or_array1",
        type: "value | range",
        description: {
          en: "The first value or 1D range to include.",
          he: "הערך או הטווח החד-ממדי הראשון לכלול.",
        },
      },
      {
        name: "value_or_array2, ...",
        type: "value | range",
        optional: true,
        description: {
          en: "Additional values or arrays to append. JOIN errors on 2D ranges.",
          he: "ערכים או מערכים נוספים להוסיף. JOIN שוגה על טווחים דו-ממדיים.",
        },
      },
    ],
    returns: {
      en: "A single string with the values concatenated.",
      he: "מחרוזת יחידה עם הערכים משורשרים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094077?hl=en",
  },

  TEXTJOIN: {
    name: "TEXTJOIN",
    category: "text",
    summary: {
      en: "Modern replacement for JOIN: concatenates strings with a delimiter and can skip empty cells. The go-to for building comma lists from a column, like 'buyers on this platform: Yoav, Sarah, David'.",
      he: "החלפה מודרנית ל-JOIN: משרשר מחרוזות עם מפריד ויכול לדלג על תאים ריקים. הבחירה הטבעית לבנייה של רשימות מופרדות-בפסיק מעמודה, כמו 'buyers on this platform: Yoav, Sarah, David'.",
    },
    syntax: "TEXTJOIN(delimiter, ignore_empty, text1, [text2, ...])",
    params: [
      {
        name: "delimiter",
        type: "string",
        description: {
          en: "The string between each joined piece.",
          he: "המחרוזת בין כל חתיכה משורשרת.",
        },
      },
      {
        name: "ignore_empty",
        type: "boolean",
        description: {
          en: "TRUE = skip empty cells. FALSE = keep them, producing gaps in the output.",
          he: "TRUE = דלג על תאים ריקים. FALSE = שמור עליהם, יוצר פערים בפלט.",
        },
      },
      {
        name: "text1",
        type: "string | range",
        description: {
          en: "The first value or range to include. Unlike JOIN, can be 2D.",
          he: "הערך או הטווח הראשון לכלול. בניגוד ל-JOIN, יכול להיות דו-ממדי.",
        },
      },
      {
        name: "text2, ...",
        type: "string | range",
        optional: true,
        description: {
          en: "Additional values or ranges to include.",
          he: "ערכים או טווחים נוספים לכלול.",
        },
      },
    ],
    returns: {
      en: "A single string. Cell size limit (50,000 characters) applies; TEXTJOIN over very large ranges can hit it.",
      he: "מחרוזת יחידה. מגבלת גודל תא (50,000 תווים) חלה; TEXTJOIN על טווחים גדולים יכול להגיע אליה.",
    },
    docsUrl: "https://support.google.com/docs/answer/7013992?hl=en",
  },

  FLATTEN: {
    name: "FLATTEN",
    category: "array",
    summary: {
      en: "Collapses one or more 2D ranges into a single column, row by row. The bridge between grid-shaped data and column-shaped helpers like UNIQUE, FILTER, or QUERY that expect a single column.",
      he: "מקפל טווח דו-ממדי אחד או יותר לעמודה יחידה, שורה אחר שורה. הגשר בין נתונים בצורת רשת לעוזרים בצורת עמודה כמו UNIQUE, FILTER, או QUERY שמצפים לעמודה אחת.",
    },
    syntax: "FLATTEN(range1, [range2, ...])",
    params: [
      {
        name: "range1",
        type: "range | value",
        description: {
          en: "The first range, literal value, or array to flatten. A 2D range is read in row-major order (entire first row before the second row).",
          he: "הטווח, הערך הליטרלי, או המערך הראשון לקפל. טווח דו-ממדי נקרא בסדר row-major (כל השורה הראשונה לפני השנייה).",
        },
      },
      {
        name: "range2, ...",
        type: "range | value",
        optional: true,
        description: {
          en: "Additional ranges or values to append to the output. Each is flattened and appended to the column.",
          he: "טווחים או ערכים נוספים להוסיף לפלט. כל אחד מקופל ומוצמד לעמודה.",
        },
      },
    ],
    returns: {
      en: "A single spilled column containing every value from the input ranges. Empty cells are preserved; wrap with FILTER to drop them. Array-aware: no ARRAYFORMULA needed.",
      he: "עמודה זורמת יחידה שמכילה כל ערך מטווחי הקלט. תאים ריקים נשמרים; עוטפים ב-FILTER כדי להוריד אותם. מודע למערכים: לא צריך ARRAYFORMULA.",
    },
    docsUrl: "https://support.google.com/docs/answer/10307761?hl=en",
  },

  REGEXMATCH: {
    name: "REGEXMATCH",
    category: "regex",
    summary: {
      en: "Returns TRUE/FALSE for whether a string matches an RE2 regex pattern. The fastest way to validate that a campaign code follows the team's naming convention.",
      he: "מחזיר TRUE/FALSE על האם מחרוזת מתאימה לתבנית regex של RE2. הדרך המהירה ביותר לאמת ש-campaign code עוקב אחרי קונבנציית השמות של הצוות.",
    },
    syntax: "REGEXMATCH(text, regular_expression)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The text to test. Numeric cells need TEXT(...) wrapping first.",
          he: "הטקסט לבדיקה. תאים מספריים צריכים עטיפת TEXT(...) קודם.",
        },
      },
      {
        name: "regular_expression",
        type: "string (RE2)",
        description: {
          en: "An RE2 regex. Backslashes must be doubled in the formula: \\\\d for digit, \\\\w for word character. No lookarounds, no backreferences. Anchor with ^ and $ for full-string matches.",
          he: "ביטוי רגולרי של RE2. backslashes חייבים להיות כפולים בנוסחה: \\\\d לספרה, \\\\w לתו מילה. אין lookarounds, אין backreferences. עוגנים עם ^ ו-$ להתאמות של כל המחרוזת.",
        },
      },
    ],
    returns: {
      en: "TRUE if the pattern matches anywhere in text (anchor with ^/$ for full match); FALSE otherwise.",
      he: "TRUE אם התבנית מתאימה איפשהו ב-text (עוגנים עם ^/$ להתאמה מלאה); FALSE אחרת.",
    },
    docsUrl: "https://support.google.com/docs/answer/3098292?hl=en",
  },

  REGEXEXTRACT: {
    name: "REGEXEXTRACT",
    category: "regex",
    summary: {
      en: "Extracts the first substring of text that matches an RE2 regex. With capture groups (parentheses), returns just the captured portion. The right tool when LEFT/MID/FIND aren't expressive enough.",
      he: "מחלץ את תת-המחרוזת הראשונה של text שמתאימה ל-RE2 regex. עם capture groups (סוגריים), מחזיר רק את החלק שנתפס. הכלי הנכון כש-LEFT/MID/FIND לא מספיק חזקים.",
    },
    syntax: "REGEXEXTRACT(text, regular_expression)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The text to scan.",
          he: "הטקסט לסריקה.",
        },
      },
      {
        name: "regular_expression",
        type: "string (RE2)",
        description: {
          en: "The pattern. Without parentheses, returns the whole match. With one or more capture groups, returns the captured groups (spilled across columns if multiple).",
          he: "התבנית. בלי סוגריים, מחזיר את ההתאמה השלמה. עם capture group אחד או יותר, מחזיר את הקבוצות שנתפסו (זורמות לאורך עמודות אם יש כמה).",
        },
      },
    ],
    returns: {
      en: "The first match or its capture group(s). #N/A if no match: wrap in IFERROR for safety.",
      he: "ההתאמה הראשונה או ה-capture groups שלה. #N/A אם אין התאמה: עוטפים ב-IFERROR לבטיחות.",
    },
    docsUrl: "https://support.google.com/docs/answer/3098244?hl=en",
  },

  REGEXREPLACE: {
    name: "REGEXREPLACE",
    category: "regex",
    summary: {
      en: "Replaces every match of an RE2 regex with a replacement string. Use $1, $2, etc. in the replacement to reference capture groups. The most powerful normalization tool for messy text.",
      he: "מחליף כל התאמה של RE2 regex במחרוזת החלפה. השתמשו ב-$1, $2 וכו' בהחלפה כדי להפנות ל-capture groups. כלי הנירמול הכי חזק לטקסט מבולגן.",
    },
    syntax: "REGEXREPLACE(text, regular_expression, replacement)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The source text.",
          he: "טקסט המקור.",
        },
      },
      {
        name: "regular_expression",
        type: "string (RE2)",
        description: {
          en: "The pattern to replace. Every non-overlapping match is replaced.",
          he: "התבנית להחלפה. כל התאמה שאינה חופפת מוחלפת.",
        },
      },
      {
        name: "replacement",
        type: "string",
        description: {
          en: "What to put in place of each match. Use $1, $2, $3 to reference capture groups from the pattern. To insert a literal $, write $$.",
          he: "מה לשים במקום כל התאמה. השתמשו ב-$1, $2, $3 כדי להפנות ל-capture groups מהתבנית. כדי לשים $ מילולי, כתבו $$.",
        },
      },
    ],
    returns: {
      en: "A new string with every match replaced. The original cell is not modified.",
      he: "מחרוזת חדשה עם כל התאמה מוחלפת. התא המקורי לא משתנה.",
    },
    docsUrl: "https://support.google.com/docs/answer/3098245?hl=en",
  },

  LAMBDA: {
    name: "LAMBDA",
    category: "lambda",
    summary: {
      en: "Defines an anonymous function inline: a list of parameter names followed by a body expression. Almost never used alone; the value of LAMBDA is composing it with LET (lesson 20), MAP/REDUCE (lesson 19), or saving it as a named function (lesson 21).",
      he: "מגדיר פונקציה אנונימית inline: רשימת שמות פרמטרים ואחריהם ביטוי גוף. כמעט אף פעם לא בשימוש לבדה; הערך של LAMBDA הוא בהרכבה עם LET (שיעור 20), MAP/REDUCE (שיעור 19), או בשמירה כפונקציה named (שיעור 21).",
    },
    syntax: "LAMBDA(name1, [name2, ...], formula_expression)",
    params: [
      {
        name: "name1, name2, ...",
        type: "identifier",
        description: {
          en: "One or more parameter names. Local to the body. Cannot be ranges (no \"A1\") or start with digits; underscores and dots allowed.",
          he: "שם פרמטר אחד או יותר. מקומי לגוף. לא יכול להיות טווח (לא \"A1\") או להתחיל בספרה; קוים תחתונים ונקודות מותרים.",
        },
      },
      {
        name: "formula_expression",
        type: "expression",
        description: {
          en: "The body. A single expression that uses the parameter names. To structure it, wrap with LET (lesson 20) for intermediate names.",
          he: "הגוף. ביטוי יחיד שמשתמש בשמות הפרמטרים. כדי לבנות אותו, עוטפים ב-LET (שיעור 20) לשמות ביניים.",
        },
      },
    ],
    returns: {
      en: "A callable function. A bare LAMBDA in a cell shows #CALC! because it hasn't been called; invoke it with (args) or pass it to MAP/REDUCE/SCAN/BYROW/BYCOL/MAKEARRAY.",
      he: "פונקציה ניתנת לקריאה. LAMBDA חשופה בתא מציגה #CALC! כי לא קראו לה; קוראים לה עם (args) או מעבירים ל-MAP/REDUCE/SCAN/BYROW/BYCOL/MAKEARRAY.",
    },
    docsUrl: "https://support.google.com/docs/answer/12508718?hl=en",
  },

  MAP: {
    name: "MAP",
    category: "lambda",
    summary: {
      en: "Applies a LAMBDA to every cell of one or more arrays of the same shape, returning an array of the results. The functional equivalent of ARRAYFORMULA over a custom body.",
      he: "מחיל LAMBDA על כל תא של מערך אחד או יותר באותה צורה, מחזיר מערך של התוצאות. המקבילה הפונקציונלית ל-ARRAYFORMULA על גוף מותאם.",
    },
    syntax: "MAP(array1, [array2, ...], LAMBDA)",
    params: [
      {
        name: "array1",
        type: "range",
        description: {
          en: "The first input array.",
          he: "מערך הקלט הראשון.",
        },
      },
      {
        name: "array2, ...",
        type: "range",
        optional: true,
        description: {
          en: "Additional arrays of the same shape. Each LAMBDA invocation gets one value from each array.",
          he: "מערכים נוספים באותה צורה. כל קריאת LAMBDA מקבלת ערך אחד מכל מערך.",
        },
      },
      {
        name: "LAMBDA",
        type: "lambda",
        description: {
          en: "A LAMBDA with one name argument per input array. Body returns the value for the current cell.",
          he: "LAMBDA עם name argument אחד לכל מערך קלט. הגוף מחזיר את הערך לתא הנוכחי.",
        },
      },
    ],
    returns: {
      en: "A spilled array the same shape as the inputs, where each cell is the LAMBDA's result for the corresponding inputs.",
      he: "מערך זורם באותה צורה כמו הקלטים, שבו כל תא הוא תוצאת ה-LAMBDA עבור הקלטים המתאימים.",
    },
    docsUrl: "https://support.google.com/docs/answer/12568985?hl=en",
  },

  REDUCE: {
    name: "REDUCE",
    category: "lambda",
    summary: {
      en: "Walks an array left-to-right, threading an accumulator through a LAMBDA, and returns the final accumulator. The most general aggregation primitive: SUM, COUNT, MAX, MIN are all special cases.",
      he: "עובר על מערך משמאל לימין, מעביר accumulator דרך LAMBDA, ומחזיר את ה-accumulator הסופי. הפרימיטיב הכי כללי של אגרגציה: SUM, COUNT, MAX, MIN כולם מקרים פרטיים.",
    },
    syntax: "REDUCE(initial_value, array_or_range, LAMBDA(accumulator, current_value, formula))",
    params: [
      {
        name: "initial_value",
        type: "any",
        description: {
          en: "The starting accumulator. Its type determines the result type (number, string, array).",
          he: "ה-accumulator ההתחלתי. הסוג שלו קובע את סוג התוצאה (מספר, מחרוזת, מערך).",
        },
      },
      {
        name: "array_or_range",
        type: "range",
        description: {
          en: "The values to walk.",
          he: "הערכים לעבור עליהם.",
        },
      },
      {
        name: "LAMBDA",
        type: "lambda(accumulator, current_value)",
        description: {
          en: "A LAMBDA with exactly two name arguments: accumulator (the running total) and current_value (the current element).",
          he: "LAMBDA עם בדיוק שני name arguments: accumulator (הסכום הרץ) ו-current_value (האלמנט הנוכחי).",
        },
      },
    ],
    returns: {
      en: "The final value of the accumulator after walking every element.",
      he: "הערך הסופי של ה-accumulator אחרי מעבר על כל האלמנטים.",
    },
    docsUrl: "https://support.google.com/docs/answer/12568597?hl=en",
  },

  SCAN: {
    name: "SCAN",
    category: "lambda",
    summary: {
      en: "Like REDUCE but returns every intermediate accumulator value, not just the final one. The standard tool for running totals, cumulative spend, day-by-day budget burn.",
      he: "כמו REDUCE אבל מחזיר כל ערך ביניים של ה-accumulator, לא רק את הסופי. הכלי הסטנדרטי לסכומים רצים, spend מצטבר, שריפת תקציב יום-יום.",
    },
    syntax: "SCAN(initial_value, array_or_range, LAMBDA(accumulator, current_value, formula))",
    params: [
      {
        name: "initial_value",
        type: "any",
        description: {
          en: "The starting accumulator.",
          he: "ה-accumulator ההתחלתי.",
        },
      },
      {
        name: "array_or_range",
        type: "range",
        description: {
          en: "The values to walk.",
          he: "הערכים לעבור עליהם.",
        },
      },
      {
        name: "LAMBDA",
        type: "lambda(accumulator, current_value)",
        description: {
          en: "Same signature as REDUCE's LAMBDA.",
          he: "אותה חתימה כמו של ה-LAMBDA של REDUCE.",
        },
      },
    ],
    returns: {
      en: "A spilled array the same length as input: the accumulator value after each step.",
      he: "מערך זורם באותו אורך כמו הקלט: ערך ה-accumulator אחרי כל צעד.",
    },
    docsUrl: "https://support.google.com/docs/answer/12569094?hl=en",
  },

  BYROW: {
    name: "BYROW",
    category: "lambda",
    summary: {
      en: "Applies a LAMBDA to each row of a range, collapsing the row to a single value. Returns a one-column result. Useful for per-row aggregates over multiple input columns.",
      he: "מחיל LAMBDA על כל שורה של טווח, מצמצם את השורה לערך יחיד. מחזיר תוצאה של עמודה אחת. שימושי לאגרגטים פר-שורה על פני מספר עמודות קלט.",
    },
    syntax: "BYROW(array_or_range, LAMBDA(row, formula))",
    params: [
      {
        name: "array_or_range",
        type: "range",
        description: {
          en: "The data to process row by row.",
          he: "המידע לעיבוד שורה-אחר-שורה.",
        },
      },
      {
        name: "LAMBDA",
        type: "lambda(row)",
        description: {
          en: "A LAMBDA with exactly one name argument. The body must return a single value (no arrays).",
          he: "LAMBDA עם בדיוק שם argument אחד. הגוף חייב להחזיר ערך יחיד (לא מערכים).",
        },
      },
    ],
    returns: {
      en: "A single-column spilled array: one value per input row.",
      he: "מערך זורם בעמודה יחידה: ערך אחד לכל שורת קלט.",
    },
    docsUrl: "https://support.google.com/docs/answer/12570930?hl=en",
  },

  BYCOL: {
    name: "BYCOL",
    category: "lambda",
    summary: {
      en: "The vertical twin of BYROW: applies a LAMBDA to each column, returning a single-row result. Used for column-wise summaries like 'average of each metric'.",
      he: "התאום האנכי של BYROW: מחיל LAMBDA על כל עמודה, מחזיר תוצאה של שורה יחידה. בשימוש לסיכומים פר-עמודה כמו 'ממוצע של כל מטריקה'.",
    },
    syntax: "BYCOL(array_or_range, LAMBDA(column, formula))",
    params: [
      {
        name: "array_or_range",
        type: "range",
        description: {
          en: "The data to process column by column.",
          he: "המידע לעיבוד עמודה-אחר-עמודה.",
        },
      },
      {
        name: "LAMBDA",
        type: "lambda(column)",
        description: {
          en: "A LAMBDA with exactly one name argument. Must return a single value per column.",
          he: "LAMBDA עם בדיוק שם argument אחד. חייב להחזיר ערך יחיד לכל עמודה.",
        },
      },
    ],
    returns: {
      en: "A single-row spilled array: one value per input column.",
      he: "מערך זורם בשורה יחידה: ערך אחד לכל עמודת קלט.",
    },
    docsUrl: "https://support.google.com/docs/answer/12571032?hl=en",
  },

  LET: {
    name: "LET",
    category: "logical",
    summary: {
      en: "Names intermediate values inside a formula. Each name is computed once and reused, which turns nested formulas readable and avoids recomputing slow subexpressions like QUERY or IMPORTRANGE.",
      he: "נותן שמות לערכי ביניים בתוך נוסחה. כל שם מחושב פעם אחת ונעשה בו שימוש חוזר, מה שהופך נוסחאות מקוננות לקריאות ומונע חישוב חוזר של תת-ביטויים איטיים כמו QUERY או IMPORTRANGE.",
    },
    syntax: "LET(name1, value_expression1, [name2, value_expression2, ...], formula_expression)",
    params: [
      {
        name: "name1, name2, ...",
        type: "identifier",
        description: {
          en: "A local name (case-insensitive). Cannot shadow built-in function names. A later binding can reference earlier ones; no forward references.",
          he: "שם מקומי (לא רגיש לאותיות). לא יכול לחפוף לשמות פונקציה מובנים. binding מאוחר יכול להפנות למוקדם; אין forward references.",
        },
      },
      {
        name: "value_expression1, value_expression2, ...",
        type: "expression",
        description: {
          en: "Each name's value. Evaluated once, even if the body uses the name many times.",
          he: "הערך של כל שם. מחושב פעם אחת, גם אם הגוף משתמש בשם הרבה פעמים.",
        },
      },
      {
        name: "formula_expression",
        type: "expression",
        description: {
          en: "The final body that uses the names. Must be exactly one expression. Wrap nested LETs inside if you need more structure.",
          he: "הגוף הסופי שמשתמש בשמות. חייב להיות בדיוק ביטוי אחד. עוטפים LETs מקוננים בפנים אם צריך יותר מבנה.",
        },
      },
    ],
    returns: {
      en: "Whatever the formula_expression evaluates to. The names exist only inside the LET.",
      he: "מה שה-formula_expression מתפענח אליו. השמות קיימים רק בתוך ה-LET.",
    },
    docsUrl: "https://support.google.com/docs/answer/13190740?hl=en",
  },

  MEDIAN: {
    name: "MEDIAN",
    category: "aggregation",
    summary: {
      en: "Returns the middle value of a numeric dataset (interpolates for even counts). The outlier-resistant cousin of AVERAGE. If MEDIAN is much smaller than AVERAGE, you have a long-tail distribution.",
      he: "מחזיר את הערך האמצעי של דאטה-סט מספרי (מבצע אינטרפולציה לספירות זוגיות). בן-הדוד עמיד-במגזרים-קיצוניים של AVERAGE. אם MEDIAN קטן בהרבה מ-AVERAGE, יש לכם התפלגות בעלת זנב ארוך.",
    },
    syntax: "MEDIAN(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "number | range",
        description: {
          en: "The first value or range. Text inside ranges is ignored.",
          he: "הערך או הטווח הראשון. טקסט בתוך טווחים מתעלמים ממנו.",
        },
      },
      {
        name: "value2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional values or ranges.",
          he: "ערכים או טווחים נוספים.",
        },
      },
    ],
    returns: {
      en: "The median value. For an even-sized dataset, the average of the two middle values: so the result may not be an actual data point.",
      he: "ערך החציון. לדאטה-סט בגודל זוגי, הממוצע של שני ערכי האמצע: התוצאה יכולה להיות לא נקודת מידע אמיתית.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094025?hl=en",
  },

  PERCENTILE: {
    name: "PERCENTILE",
    category: "aggregation",
    summary: {
      en: "Returns the value at a given percentile of a dataset (interpolating between data points). PERCENTILE(range, 0.9) is the threshold above which the top 10% sit; standard tool for automatic winners/losers thresholds.",
      he: "מחזיר את הערך באחוזון נתון של דאטה-סט (מבצע אינטרפולציה בין נקודות מידע). PERCENTILE(range, 0.9) הוא הסף שמעליו יושבים ה-10% העליונים; הכלי הסטנדרטי לספים אוטומטיים של מנצחים/מפסידים.",
    },
    syntax: "PERCENTILE(data, percentile)",
    params: [
      {
        name: "data",
        type: "range",
        description: {
          en: "The dataset to analyze.",
          he: "הדאטה-סט לניתוח.",
        },
      },
      {
        name: "percentile",
        type: "number",
        description: {
          en: "A value between 0 and 1. 0.5 = median; 0.9 = 90th percentile; 0 = min; 1 = max.",
          he: "ערך בין 0 ל-1. 0.5 = חציון; 0.9 = אחוזון 90; 0 = מינימום; 1 = מקסימום.",
        },
      },
    ],
    returns: {
      en: "The interpolated value at the requested percentile. PERCENTILE(data, 0.5) equals MEDIAN(data).",
      he: "הערך עם אינטרפולציה באחוזון המבוקש. PERCENTILE(data, 0.5) שווה ל-MEDIAN(data).",
    },
    docsUrl: "https://support.google.com/docs/answer/3094093?hl=en",
  },

  RANK: {
    name: "RANK",
    category: "aggregation",
    summary: {
      en: "Returns the position of a value within a dataset (1 = highest by default). Ties get the same rank, then the next value skips: two campaigns tied for #1 both rank 1, the next is #3.",
      he: "מחזיר את המיקום של ערך בתוך דאטה-סט (1 = הגבוה ביותר כברירת מחדל). שווי-ערכים מקבלים את אותו דירוג, אז הערך הבא מדלג: שני קמפיינים שווים במקום #1 שניהם מקבלים 1, הבא הוא #3.",
    },
    syntax: "RANK(value, data, [is_ascending])",
    params: [
      {
        name: "value",
        type: "number",
        description: {
          en: "The value to rank. Must exist in `data`; otherwise returns #N/A.",
          he: "הערך לדירוג. חייב להופיע ב-data; אחרת מחזיר #N/A.",
        },
      },
      {
        name: "data",
        type: "range",
        description: {
          en: "The dataset to rank within.",
          he: "הדאטה-סט לדרג בתוכו.",
        },
      },
      {
        name: "is_ascending",
        type: "boolean | number",
        optional: true,
        default: "0",
        description: {
          en: "0 / FALSE = highest gets rank 1 (default). 1 / TRUE = lowest gets rank 1.",
          he: "0 / FALSE = הגבוה ביותר מקבל דירוג 1 (ברירת מחדל). 1 / TRUE = הנמוך ביותר מקבל דירוג 1.",
        },
      },
    ],
    returns: {
      en: "The integer rank. Use RANK.AVG to average ties instead of skipping.",
      he: "הדירוג השלם. השתמשו ב-RANK.AVG כדי לחשב ממוצע על שווי-ערכים במקום לדלג.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094098?hl=en",
  },

  LARGE: {
    name: "LARGE",
    category: "aggregation",
    summary: {
      en: "Returns the Nth-largest value in a dataset. LARGE(range, 1) is the max; LARGE(range, 3) is the third-highest. The right tool for top-N reports without sorting the data.",
      he: "מחזיר את הערך ה-N הגדול ביותר בדאטה-סט. LARGE(range, 1) הוא המקסימום; LARGE(range, 3) הוא השלישי בגובהו. הכלי הנכון לדוחות top-N בלי למיין את המידע.",
    },
    syntax: "LARGE(data, n)",
    params: [
      {
        name: "data",
        type: "range",
        description: {
          en: "The dataset.",
          he: "הדאטה-סט.",
        },
      },
      {
        name: "n",
        type: "number",
        description: {
          en: "Which rank to return (1 = largest, 2 = second-largest, etc.).",
          he: "איזה דירוג להחזיר (1 = הגדול ביותר, 2 = השני בגודלו וכו').",
        },
      },
    ],
    returns: {
      en: "The Nth-largest value. SMALL is the mirror for the Nth-smallest.",
      he: "הערך ה-N הגדול ביותר. SMALL הוא המראה ל-N הקטן ביותר.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094008?hl=en",
  },

  CORREL: {
    name: "CORREL",
    category: "aggregation",
    summary: {
      en: "Returns the Pearson correlation coefficient between two parallel ranges. Values range from -1 (perfect inverse) to +1 (perfect positive); 0 means no linear relationship. Use for spend-vs-revenue, ROI-vs-time, and other hypothesis checks.",
      he: "מחזיר את מקדם המתאם של Pearson בין שני טווחים מקבילים. ערכים נעים בין -1 (הפוך מושלם) ל-+1 (חיובי מושלם); 0 משמעו אין קשר ליניארי. שימוש לבדיקות hypothesis של spend-מול-revenue, ROI-מול-זמן ועוד.",
    },
    syntax: "CORREL(data_y, data_x)",
    params: [
      {
        name: "data_y",
        type: "range",
        description: {
          en: "The dependent variable's values (the 'effect').",
          he: "הערכים של המשתנה התלוי ('האפקט').",
        },
      },
      {
        name: "data_x",
        type: "range",
        description: {
          en: "The independent variable's values (the 'cause'), same length as data_y.",
          he: "הערכים של המשתנה הבלתי-תלוי ('הסיבה'), באותו אורך כמו data_y.",
        },
      },
    ],
    returns: {
      en: "A number in [-1, 1]. Synonym for the PEARSON function. Correlation does not imply causation.",
      he: "מספר ב-[-1, 1]. מילה נרדפת לפונקציית PEARSON. מתאם לא משמעו סיבתיות.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093990?hl=en",
  },

  STDEV: {
    name: "STDEV",
    category: "aggregation",
    summary: {
      en: "Returns the sample standard deviation of a numeric dataset (divides by n-1). The everyday spread metric. Use STDEVP for the full-population version (rare in adtech, where you almost always have a sample).",
      he: "מחזיר את הסטיית התקן של מדגם של דאטה-סט מספרי (מחלק ב-n-1). מדד הפיזור היומיומי. השתמשו ב-STDEVP לגרסה של אוכלוסיה מלאה (נדיר באדטק, שם כמעט תמיד יש מדגם).",
    },
    syntax: "STDEV(value1, [value2, ...])",
    params: [
      {
        name: "value1",
        type: "number | range",
        description: {
          en: "The first value or range of the sample.",
          he: "הערך או הטווח הראשון של המדגם.",
        },
      },
      {
        name: "value2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional values or ranges.",
          he: "ערכים או טווחים נוספים.",
        },
      },
    ],
    returns: {
      en: "The sample standard deviation. Returns #DIV/0! if fewer than 2 numeric values are provided.",
      he: "סטיית התקן של המדגם. מחזיר #DIV/0! אם יש פחות מ-2 ערכים מספריים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3094054?hl=en",
  },

  NPV: {
    name: "NPV",
    category: "math",
    summary: {
      en: "Discounts a series of future cash flows back to today's value at a given rate. The standard 'is this investment worth it' calculator. Watch the gotcha: Sheets discounts every cash flow, so the period-0 outflow must be added separately.",
      he: "מפחית סדרה של תזרימי מזומנים עתידיים לערכם של היום בקצב נתון. המחשבון הסטנדרטי של 'האם ההשקעה הזאת שווה'. שימו לב למלכודת: Sheets מפחית כל תזרים, אז ה-outflow של תקופה-0 חייב להתווסף בנפרד.",
    },
    syntax: "NPV(discount, cashflow1, [cashflow2, ...])",
    params: [
      {
        name: "discount",
        type: "number",
        description: {
          en: "The per-period discount rate (annual rate / periods per year). 0.10 = 10% per period.",
          he: "קצב ההיוון לתקופה (קצב שנתי / תקופות בשנה). 0.10 = 10% לתקופה.",
        },
      },
      {
        name: "cashflow1",
        type: "number | range",
        description: {
          en: "The first cash flow (period 1, NOT period 0). Positive for income, negative for payments. Sheets discounts this by one period right away.",
          he: "התזרים הראשון (תקופה 1, לא תקופה 0). חיובי להכנסה, שלילי לתשלום. Sheets מפחית את זה בתקופה אחת מיד.",
        },
      },
      {
        name: "cashflow2, ...",
        type: "number | range",
        optional: true,
        description: {
          en: "Additional cash flows for subsequent periods. For irregular dates, use XNPV.",
          he: "תזרימים נוספים לתקופות מאוחרות. לתאריכים לא סדירים, השתמשו ב-XNPV.",
        },
      },
    ],
    returns: {
      en: "The discounted value of the future cash flows. Add the un-discounted period-0 outflow separately: =NPV(rate, future_flows) + period_0_outlay.",
      he: "הערך המהוון של התזרימים העתידיים. הוסיפו את ה-outflow של תקופה-0 בלי היוון בנפרד: =NPV(rate, future_flows) + period_0_outlay.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093184?hl=en",
  },

  IRR: {
    name: "IRR",
    category: "math",
    summary: {
      en: "Returns the discount rate at which NPV equals zero: the implicit annual return of a cash-flow stream. Use to compare campaigns' or acquisition strategies' implicit ROI on equal terms.",
      he: "מחזיר את קצב ההיוון שבו NPV שווה לאפס: התשואה השנתית המשתמעת של זרם תזרימים. שימוש להשוואת ROI מובלע של קמפיינים או אסטרטגיות רכישה בתנאים שווים.",
    },
    syntax: "IRR(cashflow_amounts, [rate_guess])",
    params: [
      {
        name: "cashflow_amounts",
        type: "range",
        description: {
          en: "The cash flows. Must include at least one negative (outflow) and one positive (inflow); otherwise IRR returns #NUM!.",
          he: "התזרימים. חייב לכלול לפחות אחד שלילי (outflow) ואחד חיובי (inflow); אחרת IRR מחזיר #NUM!.",
        },
      },
      {
        name: "rate_guess",
        type: "number",
        optional: true,
        default: "0.1",
        description: {
          en: "Initial guess for the rate. Tweak if IRR fails to converge on multi-sign-change cash flows.",
          he: "ניחוש התחלתי לקצב. כווננו אם IRR לא מתכנס על תזרימים עם שינויי סימן מרובים.",
        },
      },
    ],
    returns: {
      en: "The internal rate of return as a decimal. Compare to your hurdle rate; above is acceptable, below is not.",
      he: "ה-IRR כעשרוני. השוו לקצב הסף שלכם; מעל מקובל, מתחת לא.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093231?hl=en",
  },

  INDIRECT: {
    name: "INDIRECT",
    category: "lookup",
    summary: {
      en: "Builds a cell reference from a text string. The standard way to do dynamic sheet selection driven by a dropdown. Volatile: recalculates on every change, so use sparingly: one INDIRECT per dashboard, not per cell.",
      he: "בונה reference לתא ממחרוזת טקסט. הדרך הסטנדרטית לבחירה דינמית של גיליון על ידי dropdown. תנודתית: מחושבת מחדש בכל שינוי, אז להשתמש בחיסכון: INDIRECT אחד ל-dashboard, לא לתא.",
    },
    syntax: "INDIRECT(cell_reference_as_string, [is_A1_notation])",
    params: [
      {
        name: "cell_reference_as_string",
        type: "string",
        description: {
          en: "A string that evaluates to a valid reference. Common pattern: \"'\" & B1 & \"'!E2:E100\" to build a cross-tab reference from a dropdown in B1.",
          he: "מחרוזת שמתפענחת ל-reference תקין. תבנית נפוצה: \"'\" & B1 & \"'!E2:E100\" כדי לבנות reference בין-טאב מ-dropdown ב-B1.",
        },
      },
      {
        name: "is_A1_notation",
        type: "boolean",
        optional: true,
        default: "TRUE",
        description: {
          en: "TRUE = A1 notation (default). FALSE = R1C1 notation. Almost always leave as TRUE.",
          he: "TRUE = סימון A1 (ברירת מחדל). FALSE = סימון R1C1. כמעט תמיד משאירים TRUE.",
        },
      },
    ],
    returns: {
      en: "The value(s) at the resolved reference. #REF! if the string doesn't resolve. Wrap in IFERROR for production safety.",
      he: "הערכים ב-reference שנבנה. #REF! אם המחרוזת לא מתפענחת. עוטפים ב-IFERROR לבטיחות ב-production.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093377?hl=en",
  },

  OFFSET: {
    name: "OFFSET",
    category: "lookup",
    summary: {
      en: "Returns a range reference offset from a starting cell by a number of rows and columns, with optional height and width. Volatile: prefer INDEX when you can, since INDEX is non-volatile and almost always equivalent.",
      he: "מחזיר reference לטווח עם offset מתא התחלה במספר שורות ועמודות, עם height ו-width אופציונליים. תנודתית: עדיפים INDEX כשאפשר, כי INDEX לא תנודתי וכמעט תמיד שקול.",
    },
    syntax: "OFFSET(cell_reference, offset_rows, offset_columns, [height], [width])",
    params: [
      {
        name: "cell_reference",
        type: "range",
        description: {
          en: "The anchor cell or range.",
          he: "התא או הטווח של העוגן.",
        },
      },
      {
        name: "offset_rows",
        type: "number",
        description: {
          en: "How many rows to shift. Negative shifts up. Decimals truncate.",
          he: "כמה שורות להזיז. שלילי מזיז למעלה. עשרוניים נחתכים.",
        },
      },
      {
        name: "offset_columns",
        type: "number",
        description: {
          en: "How many columns to shift. Negative shifts left.",
          he: "כמה עמודות להזיז. שלילי מזיז שמאלה.",
        },
      },
      {
        name: "height",
        type: "number",
        optional: true,
        description: {
          en: "The number of rows in the returned range. Default matches cell_reference's height.",
          he: "מספר השורות בטווח המוחזר. ברירת המחדל מתאימה לגובה של cell_reference.",
        },
      },
      {
        name: "width",
        type: "number",
        optional: true,
        description: {
          en: "The number of columns in the returned range.",
          he: "מספר העמודות בטווח המוחזר.",
        },
      },
    ],
    returns: {
      en: "A shifted (and possibly resized) range reference. #REF! if the shift goes off-sheet.",
      he: "reference לטווח שהוזז (ואולי שונה בגודלו). #REF! אם ההזזה יוצאת מהגיליון.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093379?hl=en",
  },

  IMPORTRANGE: {
    name: "IMPORTRANGE",
    category: "info",
    summary: {
      en: "Imports a range of cells from another Google Sheet. The single most-used and most-broken formula in cross-team adtech workbooks. Requires explicit auth between source and destination on first use.",
      he: "מייבא טווח תאים מ-Google Sheet אחר. הנוסחה הכי בשימוש ושבירה ב-workbooks חוצי-צוות באדטק. דורש auth מפורש בין מקור ליעד בשימוש ראשון.",
    },
    syntax: "IMPORTRANGE(spreadsheet_url, range_string)",
    params: [
      {
        name: "spreadsheet_url",
        type: "string",
        description: {
          en: "The full URL or just the file ID (between /d/ and /edit) of the source sheet, in quotes.",
          he: "ה-URL המלא או רק ה-file ID (בין /d/ ל-/edit) של גיליון המקור, במרכאות.",
        },
      },
      {
        name: "range_string",
        type: "string",
        description: {
          en: "The range to import, prefixed by the tab name and !. Example: \"Campaigns!A1:F100\" or \"Campaigns!A:F\". Named ranges and table references work too.",
          he: "הטווח לייבוא, עם prefix של שם הטאב ו-!. דוגמה: \"Campaigns!A1:F100\" או \"Campaigns!A:F\". Named ranges ו-references לטבלאות עובדים גם כן.",
        },
      },
    ],
    returns: {
      en: "A spilled 2D array of the imported cells. #REF! on first use until the connection is authorized; after that, caches results with TTL roughly one hour. Cap of ~10MB per import.",
      he: "מערך 2D זורם של התאים המיובאים. #REF! בשימוש ראשון עד ש-החיבור אושר; אחר כך, מאחסן תוצאות עם TTL של בערך שעה. תקרה של ~10MB לייבוא.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093340?hl=en",
  },

  SPARKLINE: {
    name: "SPARKLINE",
    category: "info",
    summary: {
      en: "Draws a tiny chart inside a single cell. Used for per-row trend columns in dashboards: 50 rows × 1 mini-chart = an at-a-glance dashboard without separate chart objects.",
      he: "מצייר גרף זעיר בתוך תא יחיד. בשימוש לעמודות מגמה פר-שורה ב-dashboards: 50 שורות × 1 mini-chart = dashboard למבט מהיר בלי אובייקטי גרף נפרדים.",
    },
    syntax: "SPARKLINE(data, [options])",
    params: [
      {
        name: "data",
        type: "range",
        description: {
          en: "The range of numeric values to chart. Must be a 1D row or column, not a 2D grid.",
          he: "טווח הערכים המספריים לגרף. חייב להיות שורה או עמודה חד-ממדית, לא רשת דו-ממדית.",
        },
      },
      {
        name: "options",
        type: "array",
        optional: true,
        description: {
          en: "A 2-column array of option/value pairs. Common options: charttype (line/column/bar/winloss), color, color1/color2, linewidth, ymin/ymax, axis. Separate pairs with ; and option from value with ,.",
          he: "מערך של 2 עמודות עם זוגות option/value. אפשרויות נפוצות: charttype (line/column/bar/winloss), color, color1/color2, linewidth, ymin/ymax, axis. הפרידו זוגות ב-; ו-option מ-value ב-,.",
        },
      },
    ],
    returns: {
      en: "A miniature chart rendered inside the formula cell. Renders best when the cell has appropriate row height and column width.",
      he: "גרף מיני שמתרנדר בתוך תא הנוסחה. רנדור הכי טוב כשלתא יש גובה שורה ורוחב עמודה מתאימים.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093289?hl=en",
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

  HYPERLINK: {
    name: "HYPERLINK",
    category: "info",
    summary: {
      en: "Turns a cell into a clickable link. The URL can be external (https://...), a mailto:, or an internal anchor (#gid=...&range=A1) that jumps to another tab in the same workbook.",
      he: "הופך תא ללינק שניתן ללחוץ עליו. ה-URL יכול להיות חיצוני (https://...), mailto:, או anchor פנימי (#gid=...&range=A1) שקופץ לגיליון אחר באותו workbook.",
    },
    syntax: "HYPERLINK(url, [link_label])",
    params: [
      {
        name: "url",
        type: "string",
        description: {
          en: "The link target. A literal URL in quotes, or a cell reference holding a URL. Supports http://, https://, mailto:, ftp://, and the internal #gid=ID&range=A1 anchor form. If no protocol is given, Sheets prepends http://.",
          he: "יעד הקישור. URL מילולי במירכאות, או reference לתא שמכיל URL. תומך ב-http://, https://, mailto:, ftp://, ובצורת ה-anchor הפנימי #gid=ID&range=A1. בלי protocol, Sheets מוסיף http:// אוטומטית.",
        },
      },
      {
        name: "link_label",
        type: "string",
        optional: true,
        default: "the URL itself",
        description: {
          en: "The visible text in the cell. A literal string in quotes, a cell reference, or any expression that returns a string. Pass an empty string to render the cell empty but still clickable.",
          he: "הטקסט הגלוי בתא. מחרוזת מילולית במירכאות, reference לתא, או כל ביטוי שמחזיר מחרוזת. אפשר להעביר מחרוזת ריקה כדי שהתא ייראה ריק אבל עדיין יהיה ניתן ללחיצה.",
        },
      },
    ],
    returns: {
      en: "A clickable cell whose underlying value is the label. Reading the cell programmatically returns the label, not the URL; the URL lives in the cell's formula.",
      he: "תא ניתן ללחיצה שהערך הבסיסי שלו הוא ה-label. קריאת התא תכנותית מחזירה את ה-label, לא את ה-URL; ה-URL חי בנוסחת התא.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093313?hl=en",
  },

  VALUE: {
    name: "VALUE",
    category: "text",
    summary: {
      en: "Coerces a text string that looks like a number, date, or time into a real numeric value. The fix for imports and CSV pastes that arrive with quotes around numbers (\"187.25\") so SUM silently skips them.",
      he: "כופה המרה של מחרוזת טקסט שנראית כמספר, תאריך, או זמן לערך מספרי אמיתי. התיקון לייבוא ולהדבקת CSV שמגיעים עם מירכאות סביב מספרים (\"187.25\") כך ש-SUM מדלג עליהם בשקט.",
    },
    syntax: "VALUE(text)",
    params: [
      {
        name: "text",
        type: "string",
        description: {
          en: "The string to convert. Plain numeric strings (\"187.25\"), date strings (\"2026-05-01\"), and time strings (\"14:30\") all work. Currency-prefixed strings (\"$380.20\") often work on the locale's currency. A string Sheets cannot parse returns #VALUE!. An empty string returns 0.",
          he: "המחרוזת להמרה. מחרוזות מספריות פשוטות (\"187.25\"), מחרוזות תאריך (\"2026-05-01\"), ומחרוזות שעה (\"14:30\") עובדות. מחרוזות עם prefix של מטבע (\"$380.20\") עובדות לרוב על המטבע של ה-locale. מחרוזת ש-Sheets לא יכול לפענח מחזירה #VALUE!. מחרוזת ריקה מחזירה 0.",
        },
      },
    ],
    returns: {
      en: "A number. The inverse operation of TEXT. Pair with IFERROR to keep bad rows from poisoning a SUM: IFERROR(VALUE(E2), 0).",
      he: "מספר. הפעולה ההפוכה של TEXT. כדאי לשלב עם IFERROR כדי שמשורות גרועות לא יקלקלו SUM: IFERROR(VALUE(E2), 0).",
    },
    docsUrl: "https://support.google.com/docs/answer/3094220?hl=en",
  },

  DATEVALUE: {
    name: "DATEVALUE",
    category: "date",
    summary: {
      en: "Parses a date string into a real date serial number. The everyday fix when IMPORTRANGE, a CSV upload, or a form response delivers a date as text and a date format does nothing.",
      he: "מפענח מחרוזת תאריך למספר סידורי של תאריך. התיקון היומיומי כש-IMPORTRANGE, העלאת CSV, או תגובת form מספקת תאריך כטקסט ופורמט תאריך לא עוזר.",
    },
    syntax: "DATEVALUE(date_string)",
    params: [
      {
        name: "date_string",
        type: "string",
        description: {
          en: "The text representation of a date. Any format the spreadsheet's locale would auto-parse on direct entry (\"2026-05-01\", \"5/1/2026\", \"May 1, 2026\"). Locale-sensitive: \"5/1/2026\" is May 1 on a US locale and January 5 on most others.",
          he: "ייצוג טקסטואלי של תאריך. כל פורמט שה-locale של ה-spreadsheet היה מפענח אוטומטית בהקלדה ישירה (\"2026-05-01\", \"5/1/2026\", \"May 1, 2026\"). תלוי-locale: \"5/1/2026\" הוא 1 במאי ב-locale אמריקאי, ו-5 בינואר ברוב האחרים.",
        },
      },
    ],
    returns: {
      en: "An integer: the date's serial number (days since 1899-12-30). To display as a date, format the cell as DATE. #VALUE! if the string cannot be parsed.",
      he: "מספר שלם: המספר הסידורי של התאריך (ימים מ-30 בדצמבר 1899). כדי להציג כתאריך, יש לפרמט את התא כ-DATE. #VALUE! אם לא ניתן לפענח את המחרוזת.",
    },
    docsUrl: "https://support.google.com/docs/answer/3093039?hl=en",
  },

  SUMPRODUCT: {
    name: "SUMPRODUCT",
    category: "math",
    summary: {
      en: "Multiplies corresponding cells across equally-shaped ranges and sums the products. The array-aware workhorse for weighted totals, conditional sums without SUMIF's single-condition limit, and coercing text-to-number across a range in one shot.",
      he: "מכפיל תאים תואמים על פני טווחים בעלי צורה זהה ומסכם את המכפלות. סוס העבודה מודע-המערכים לסכומים משוקללים, סכומים מותנים בלי ההגבלה של תנאי-יחיד של SUMIF, וכפיית טקסט-למספר על פני טווח במכה אחת.",
    },
    syntax: "SUMPRODUCT(array1, [array2, ...])",
    params: [
      {
        name: "array1",
        type: "range | array",
        description: {
          en: "The first range or array. All arrays must share the same shape; mismatched shapes return #VALUE!. Non-numeric cells inside a range contribute 0.",
          he: "הטווח או המערך הראשון. כל המערכים חייבים אותה צורה; צורות לא תואמות מחזירות #VALUE!. תאים לא-מספריים בתוך טווח תורמים 0.",
        },
      },
      {
        name: "array2, ...",
        type: "range | array",
        optional: true,
        default: "{1, 1, 1, ...}",
        description: {
          en: "Additional ranges multiplied element-wise with the first. Omitted: each element of array1 is multiplied by 1, so SUMPRODUCT(A2:A14) is just the sum.",
          he: "טווחים נוספים שמוכפלים איבר-איבר עם הראשון. אם מושמט: כל איבר של array1 מוכפל ב-1, אז SUMPRODUCT(A2:A14) זה פשוט הסכום.",
        },
      },
    ],
    returns: {
      en: "A single number: the sum of the element-wise products. Common patterns: weighted average (SUMPRODUCT(weights, values) / SUM(weights)), conditional sum (SUMPRODUCT((A2:A14=\"DE\") * F2:F14)), and text-to-number coercion (SUMPRODUCT(IFERROR(VALUE(E2:E14), 0))).",
      he: "מספר יחיד: סכום המכפלות איבר-איבר. דפוסים נפוצים: ממוצע משוקלל (SUMPRODUCT(weights, values) / SUM(weights)), סכום מותנה (SUMPRODUCT((A2:A14=\"DE\") * F2:F14)), וכפיית טקסט-למספר (SUMPRODUCT(IFERROR(VALUE(E2:E14), 0))).",
    },
    docsUrl: "https://support.google.com/docs/answer/3094294?hl=en",
  },

  AI: {
    name: "AI",
    category: "info",
    summary: {
      en: "Sends a prompt to Gemini and returns the model's text response. The only spreadsheet function whose output is non-deterministic, slow (seconds per call), and billed against your Workspace plan; use it where fuzzy classification or summarization is the right tool and reach for plain formulas everywhere else.",
      he: "שולח prompt ל-Gemini ומחזיר את תגובת המודל כטקסט. הפונקציה היחידה בגיליון שהפלט שלה לא דטרמיניסטי, איטית (שניות לקריאה) ומחויבת תחת ה-Workspace plan שלכם; משתמשים בה במקום בו סיווג מטושטש או סיכום הם הכלי הנכון, ובכל מקום אחר חוזרים לנוסחאות רגילות.",
    },
    syntax: "AI(prompt, [range])",
    params: [
      {
        name: "prompt",
        type: "string",
        description: {
          en: "The instruction text Gemini reads. Constrained prompts (\"label as low, medium, or high\") return useful column values; open-ended prompts (\"explain this campaign\") return prose that varies between calls.",
          he: "טקסט ההוראה ש-Gemini קורא. prompts מצומצמים (\"label as low, medium, or high\") מחזירים ערכי עמודה שימושיים; prompts פתוחים (\"explain this campaign\") מחזירים פרוזה שמשתנה בין קריאות.",
        },
      },
      {
        name: "range",
        type: "range",
        optional: true,
        description: {
          en: "An optional cell or bounded range that grounds the answer. A bounded range like A1:G61 is far better than a column reference like A:G, which wastes context budget and rarely fits the model's window on large sheets.",
          he: "תא או טווח חסום אופציונליים שמקרקעים את התשובה. טווח חסום כמו A1:G61 הרבה יותר טוב מ-reference לעמודה שלמה כמו A:G, שמבזבז context ולרוב לא נכנס לחלון של המודל בגיליונות גדולים.",
        },
      },
    ],
    returns: {
      en: "A text string from Gemini, after you click Generate and insert in the cell. Output is non-deterministic between calls, capped at text only (no numbers, dates, arrays), and limited to 350 generated cells per multi-cell run.",
      he: "מחרוזת טקסט מ-Gemini, אחרי לחיצה על Generate and insert בתא. הפלט אינו דטרמיניסטי בין קריאות, מוגבל לטקסט בלבד (לא מספרים, לא תאריכים, לא arrays), ומוגבל ל-350 תאים בריצה רב-תאית.",
    },
    docsUrl: "https://support.google.com/docs/answer/15820999?hl=en",
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
