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
