import type { ComponentType } from "react";

import { assignment as appsScriptEditor } from "@/content/en/lessons/apps-script/01-editor-and-project/assignment";
import { assignment as appsScriptExecutionModel } from "@/content/en/lessons/apps-script/02-execution-model/assignment";
import { assignment as customFunctions } from "@/content/en/lessons/apps-script/03-custom-functions/assignment";
import { assignment as spreadsheetApp } from "@/content/en/lessons/apps-script/04-spreadsheetapp/assignment";
import { assignment as menusAndDialogs } from "@/content/en/lessons/apps-script/05-menus-and-dialogs/assignment";
import { assignment as macros } from "@/content/en/lessons/apps-script/06-macros/assignment";
import { assignment as simpleTriggers } from "@/content/en/lessons/apps-script/07-simple-triggers/assignment";
import { assignment as installableTriggers } from "@/content/en/lessons/apps-script/08-installable-triggers/assignment";
import { assignment as sidebarsAndDialogs } from "@/content/en/lessons/apps-script/09-sidebars-and-dialogs/assignment";
import { assignment as workspaceIntegrations } from "@/content/en/lessons/apps-script/10-workspace-integrations/assignment";
import { assignment as externalApis } from "@/content/en/lessons/apps-script/11-external-apis/assignment";
import { assignment as librariesAndDeployments } from "@/content/en/lessons/apps-script/12-libraries-and-deployments/assignment";
import { assignment as webApps } from "@/content/en/lessons/apps-script/13-web-apps/assignment";
import { assignment as loggingAndErrors } from "@/content/en/lessons/apps-script/14-logging-and-errors/assignment";
import { assignment as propertiesAndCache } from "@/content/en/lessons/apps-script/15-properties-and-cache/assignment";
import { assignment as quotasAndBatching } from "@/content/en/lessons/apps-script/16-quotas-and-batching/assignment";
import { assignment as advancedSheetsService } from "@/content/en/lessons/apps-script/17-advanced-sheets-service/assignment";

import { assignment as cellLimit } from "@/content/en/lessons/scale/01-cell-limit/assignment";
import { assignment as whyItsSlow } from "@/content/en/lessons/scale/02-why-its-slow/assignment";
import { assignment as importrangePatterns } from "@/content/en/lessons/scale/03-importrange-patterns/assignment";
import { assignment as splittingWorkbook } from "@/content/en/lessons/scale/03b-splitting-workbook/assignment";
import { assignment as connectedSheetsBigquery } from "@/content/en/lessons/scale/04-connected-sheets-bigquery/assignment";
import { assignment as timesfmForecasting } from "@/content/en/lessons/scale/05-timesfm-forecasting/assignment";
import { assignment as diagnosingRefNa } from "@/content/en/lessons/scale/06-diagnosing-ref-na/assignment";
import { assignment as diagnosingCircular } from "@/content/en/lessons/scale/07-diagnosing-circular/assignment";
import { assignment as diagnosingBrokenImportrange } from "@/content/en/lessons/scale/08-diagnosing-broken-importrange/assignment";
import { assignment as slowAppsScript } from "@/content/en/lessons/scale/09-slow-apps-script/assignment";
import { assignment as recoveryAndVersions } from "@/content/en/lessons/scale/10-recovery-and-versions/assignment";
import { assignment as brokenSheetClinic } from "@/content/en/lessons/scale/11-broken-sheet-clinic/assignment";

import { assignment as aiHowGeminiSeesSheets } from "@/content/en/lessons/ai-in-sheets/01-how-gemini-sees-sheets/assignment";
import { assignment as aiFunction } from "@/content/en/lessons/ai-in-sheets/02-ai-function/assignment";
import { assignment as fillWithGemini } from "@/content/en/lessons/ai-in-sheets/03-fill-with-gemini/assignment";
import { assignment as buildAndEdit } from "@/content/en/lessons/ai-in-sheets/04-build-and-edit/assignment";
import { assignment as aiAnalysis } from "@/content/en/lessons/ai-in-sheets/05-ai-analysis/assignment";
import { assignment as whenNotToUseAi } from "@/content/en/lessons/ai-in-sheets/06-when-not-to-use/assignment";

import { assignment as buyerDashboardCapstone } from "@/content/en/lessons/capstone/01-buyer-dashboard/assignment";

import { assignment as advancedLookups } from "@/content/en/lessons/formulas/22-advanced-lookups/assignment";
import { assignment as aggregation } from "@/content/en/lessons/formulas/06-aggregation/assignment";
import { assignment as commentsAndNotes } from "@/content/en/lessons/modeling/17-comments-and-notes/assignment";
import { assignment as chartsChoosing } from "@/content/en/lessons/modeling/09-charts-choosing/assignment";
import { assignment as chartsCustomization } from "@/content/en/lessons/modeling/10-charts-customization/assignment";
import { assignment as chartsForReports } from "@/content/en/lessons/modeling/11-charts-for-reports/assignment";
import { assignment as conditionalFormatting } from "@/content/en/lessons/modeling/06-conditional-formatting/assignment";
import { assignment as dataCleanupRecipes } from "@/content/en/lessons/modeling/14-data-cleanup-recipes/assignment";
import { assignment as dataValidation } from "@/content/en/lessons/modeling/04-data-validation/assignment";
import { assignment as filterViews } from "@/content/en/lessons/modeling/08-filter-views/assignment";
import { assignment as formsSheetsPipeline } from "@/content/en/lessons/modeling/13-forms-sheets-pipeline/assignment";
import { assignment as numberFormatting } from "@/content/en/lessons/modeling/15-number-formatting/assignment";
import { assignment as performanceHygiene } from "@/content/en/lessons/modeling/18-performance-hygiene/assignment";
import { assignment as pivotTablesBasics } from "@/content/en/lessons/modeling/02-pivot-tables-basics/assignment";
import { assignment as pivotTablesInDepth } from "@/content/en/lessons/modeling/03-pivot-tables-in-depth/assignment";
import { assignment as protectedRanges } from "@/content/en/lessons/modeling/07-protected-ranges/assignment";
import { assignment as sharingPermissions } from "@/content/en/lessons/modeling/12-sharing-permissions/assignment";
import { assignment as sheetLinking } from "@/content/en/lessons/modeling/16-sheet-linking/assignment";
import { assignment as smartChips } from "@/content/en/lessons/modeling/05-smart-chips/assignment";
import { assignment as workbookStructure } from "@/content/en/lessons/modeling/01-workbook-structure/assignment";

import { assignment as arrayFormulaBasics } from "@/content/en/lessons/formulas/10-arrayformula-basics/assignment";
import { assignment as comingFromExcel } from "@/content/en/lessons/formulas/02-coming-from-excel/assignment";
import { assignment as conditionalLogic } from "@/content/en/lessons/formulas/05-conditional-logic/assignment";
import { assignment as crossSheetIndirect } from "@/content/en/lessons/formulas/25-cross-sheet-indirect/assignment";
import { assignment as datesAndTime } from "@/content/en/lessons/formulas/08-dates-and-time/assignment";
import { assignment as errorHandling } from "@/content/en/lessons/formulas/09-error-handling/assignment";
import { assignment as filterSortUnique } from "@/content/en/lessons/formulas/14-filter-sort-unique/assignment";
import { assignment as financial } from "@/content/en/lessons/formulas/24-financial/assignment";
import { assignment as gridModel } from "@/content/en/lessons/formulas/01-grid-model/assignment";
import { assignment as importFamily } from "@/content/en/lessons/formulas/27-import-family/assignment";
import { assignment as lambda } from "@/content/en/lessons/formulas/18-lambda/assignment";
import { assignment as lambdaHelpers } from "@/content/en/lessons/formulas/19-lambda-helpers/assignment";
import { assignment as letFn } from "@/content/en/lessons/formulas/20-let/assignment";
import { assignment as lookups } from "@/content/en/lessons/formulas/04-lookups/assignment";
import { assignment as mathTextDateLogical } from "@/content/en/lessons/formulas/03-math-text-date-logical/assignment";
import { assignment as namedFunctions } from "@/content/en/lessons/formulas/21-named-functions/assignment";
import { assignment as performance } from "@/content/en/lessons/formulas/28-performance/assignment";
import { assignment as queryFundamentals } from "@/content/en/lessons/formulas/12-query-fundamentals/assignment";
import { assignment as queryInDepth } from "@/content/en/lessons/formulas/13-query-in-depth/assignment";
import { assignment as regex } from "@/content/en/lessons/formulas/16-regex/assignment";
import { assignment as sequenceRandarray } from "@/content/en/lessons/formulas/11-sequence-randarray/assignment";
import { assignment as sparkline } from "@/content/en/lessons/formulas/26-sparkline/assignment";
import { assignment as splitJoinTextjoin } from "@/content/en/lessons/formulas/15-split-join-textjoin/assignment";
import { assignment as statistical } from "@/content/en/lessons/formulas/23-statistical/assignment";
import { assignment as tables } from "@/content/en/lessons/formulas/17-tables/assignment";
import { assignment as textManipulation } from "@/content/en/lessons/formulas/07-text-manipulation/assignment";
import type { Locale } from "@/lib/i18n/routing";
import type { AssignmentSpec } from "@/lib/grading/types";

export type Track =
  | "formulas"
  | "modeling"
  | "apps-script"
  | "scale"
  | "ai-in-sheets"
  | "capstone";

export const TRACKS: Array<{ id: Track; label: string; tagline: string }> = [
  {
    id: "formulas",
    label: "Formulas",
    tagline: "References, lookups, arrays, REGEX, LAMBDA, Tables.",
  },
  {
    id: "modeling",
    label: "Data modeling",
    tagline: "Pivot tables, charts, validation, sharing, forms.",
  },
  {
    id: "apps-script",
    label: "Apps Script",
    tagline: "Custom functions, triggers, sidebars, external APIs.",
  },
  {
    id: "scale",
    label: "Scale & debugging",
    tagline: "Million-row sheets, IMPORTRANGE, BigQuery, TimesFM, broken sheets.",
  },
  {
    id: "ai-in-sheets",
    label: "AI in Sheets",
    tagline: "Gemini, =AI(), Fill with Gemini, calibrated trust.",
  },
  {
    id: "capstone",
    label: "Capstone",
    tagline: "Build a dashboard end-to-end across every track.",
  },
];

export type LessonInfo = {
  assignmentId: string;
  track: Track;
  order: number;
  title: string;
};

const LESSON_INFO: LessonInfo[] = [
  {
    assignmentId: "formulas-01-grid-model",
    track: "formulas",
    order: 1,
    title: "The grid model",
  },
  {
    assignmentId: "formulas-02-coming-from-excel",
    track: "formulas",
    order: 2,
    title: "Coming from Excel",
  },
  {
    assignmentId: "formulas-03-math-text-date-logical",
    track: "formulas",
    order: 3,
    title: "Math, text, date, and logical functions",
  },
  {
    assignmentId: "formulas-04-lookups",
    track: "formulas",
    order: 4,
    title: "Lookups: VLOOKUP, INDEX/MATCH, XLOOKUP",
  },
  {
    assignmentId: "formulas-05-conditional-logic",
    track: "formulas",
    order: 5,
    title: "Conditional logic: IF, IFS, SWITCH, AND, OR",
  },
  {
    assignmentId: "formulas-06-aggregation",
    track: "formulas",
    order: 6,
    title: "Aggregation: SUM, AVERAGE, COUNTIF, SUMIF",
  },
  {
    assignmentId: "formulas-07-text-manipulation",
    track: "formulas",
    order: 7,
    title: "Text manipulation: LEFT, RIGHT, MID, FIND, SUBSTITUTE",
  },
  {
    assignmentId: "formulas-08-dates-and-time",
    track: "formulas",
    order: 8,
    title: "Dates and time: TODAY, EOMONTH, NETWORKDAYS, DATEDIF",
  },
  {
    assignmentId: "formulas-09-error-handling",
    track: "formulas",
    order: 9,
    title: "Error handling: IFERROR, IFNA, ISNA",
  },
  {
    assignmentId: "formulas-10-arrayformula-basics",
    track: "formulas",
    order: 10,
    title: "Array formulas: ARRAYFORMULA basics",
  },
  {
    assignmentId: "formulas-11-sequence-randarray",
    track: "formulas",
    order: 11,
    title: "Dynamic array generators: SEQUENCE, RANDARRAY, MAKEARRAY",
  },
  {
    assignmentId: "formulas-12-query-fundamentals",
    track: "formulas",
    order: 12,
    title: "QUERY: SQL-in-Sheets fundamentals",
  },
  {
    assignmentId: "formulas-13-query-in-depth",
    track: "formulas",
    order: 13,
    title: "QUERY in depth: GROUP BY, PIVOT, LABEL",
  },
  {
    assignmentId: "formulas-14-filter-sort-unique",
    track: "formulas",
    order: 14,
    title: "FILTER, SORT, UNIQUE",
  },
  {
    assignmentId: "formulas-15-split-join-textjoin",
    track: "formulas",
    order: 15,
    title: "SPLIT, JOIN, TEXTJOIN, FLATTEN",
  },
  {
    assignmentId: "formulas-16-regex",
    track: "formulas",
    order: 16,
    title: "REGEX in depth: REGEXMATCH, REGEXEXTRACT, REGEXREPLACE",
  },
  {
    assignmentId: "formulas-17-tables",
    track: "formulas",
    order: 17,
    title: "Tables: structured ranges that don't break",
  },
  {
    assignmentId: "formulas-18-lambda",
    track: "formulas",
    order: 18,
    title: "LAMBDA: define your own functions inside a formula",
  },
  {
    assignmentId: "formulas-19-lambda-helpers",
    track: "formulas",
    order: 19,
    title: "MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY",
  },
  {
    assignmentId: "formulas-20-let",
    track: "formulas",
    order: 20,
    title: "LET: name intermediate values inside a formula",
  },
  {
    assignmentId: "formulas-21-named-functions",
    track: "formulas",
    order: 21,
    title: "Named functions: build your team's vocabulary",
  },
  {
    assignmentId: "formulas-22-advanced-lookups",
    track: "formulas",
    order: 22,
    title: "Advanced lookups: two-way, dynamic, and beyond VLOOKUP",
  },
  {
    assignmentId: "formulas-23-statistical",
    track: "formulas",
    order: 23,
    title: "Statistical functions: see past the average",
  },
  {
    assignmentId: "formulas-24-financial",
    track: "formulas",
    order: 24,
    title: "Financial functions: NPV, IRR, PMT, and friends",
  },
  {
    assignmentId: "formulas-25-cross-sheet-indirect",
    track: "formulas",
    order: 25,
    title: "Cross-sheet references and INDIRECT",
  },
  {
    assignmentId: "formulas-26-sparkline",
    track: "formulas",
    order: 26,
    title: "SPARKLINE: charts inside cells",
  },
  {
    assignmentId: "formulas-27-import-family",
    track: "formulas",
    order: 27,
    title: "IMPORTRANGE and the IMPORT family",
  },
  {
    assignmentId: "formulas-28-performance",
    track: "formulas",
    order: 28,
    title: "Formula performance: making slow workbooks fast",
  },
  {
    assignmentId: "modeling-01-workbook-structure",
    track: "modeling",
    order: 1,
    title: "Structuring a workbook for clarity",
  },
  {
    assignmentId: "modeling-02-pivot-tables-basics",
    track: "modeling",
    order: 2,
    title: "Pivot tables: rows, columns, values, calculated fields",
  },
  {
    assignmentId: "modeling-03-pivot-tables-in-depth",
    track: "modeling",
    order: 3,
    title: "Pivot tables in depth: filters, multi-value, calculated fields",
  },
  {
    assignmentId: "modeling-04-data-validation",
    track: "modeling",
    order: 4,
    title: "Data validation: lists, conditions, custom formulas",
  },
  {
    assignmentId: "modeling-05-smart-chips",
    track: "modeling",
    order: 5,
    title: "Drop-downs and smart chips",
  },
  {
    assignmentId: "modeling-06-conditional-formatting",
    track: "modeling",
    order: 6,
    title: "Conditional formatting: rule-based and formula-based",
  },
  {
    assignmentId: "modeling-07-protected-ranges",
    track: "modeling",
    order: 7,
    title: "Protected ranges and sheet-level protection",
  },
  {
    assignmentId: "modeling-08-filter-views",
    track: "modeling",
    order: 8,
    title: "Filter views: per-user filters",
  },
  {
    assignmentId: "modeling-09-charts-choosing",
    track: "modeling",
    order: 9,
    title: "Charts: choosing the right chart type",
  },
  {
    assignmentId: "modeling-10-charts-customization",
    track: "modeling",
    order: 10,
    title: "Charts: customizing axes, labels, and secondary series",
  },
  {
    assignmentId: "modeling-11-charts-for-reports",
    track: "modeling",
    order: 11,
    title: "Charts for reports: export-ready formatting",
  },
  {
    assignmentId: "modeling-12-sharing-permissions",
    track: "modeling",
    order: 12,
    title: "Sharing and permissions",
  },
  {
    assignmentId: "modeling-13-forms-sheets-pipeline",
    track: "modeling",
    order: 13,
    title: "Forms → Sheets pipeline",
  },
  {
    assignmentId: "modeling-14-data-cleanup-recipes",
    track: "modeling",
    order: 14,
    title: "Data cleanup recipes",
  },
  {
    assignmentId: "modeling-15-number-formatting",
    track: "modeling",
    order: 15,
    title: "Number formatting: custom formats, locale gotchas",
  },
  {
    assignmentId: "modeling-16-sheet-linking",
    track: "modeling",
    order: 16,
    title: "Sheet linking: cross-tab navigation and HYPERLINK",
  },
  {
    assignmentId: "modeling-17-comments-and-notes",
    track: "modeling",
    order: 17,
    title: "Comments, suggestions, and review workflows",
  },
  {
    assignmentId: "modeling-18-performance-hygiene",
    track: "modeling",
    order: 18,
    title: "Workbook performance hygiene",
  },
  {
    assignmentId: "apps-script-01-editor-and-project",
    track: "apps-script",
    order: 1,
    title: "The Apps Script editor and project structure",
  },
  {
    assignmentId: "apps-script-02-execution-model",
    track: "apps-script",
    order: 2,
    title: "The execution model: V8, services, quotas, scopes",
  },
  {
    assignmentId: "apps-script-03-custom-functions",
    track: "apps-script",
    order: 3,
    title: "Custom functions: writing, naming, autocomplete metadata",
  },
  {
    assignmentId: "apps-script-04-spreadsheetapp",
    track: "apps-script",
    order: 4,
    title: "Reading and writing the spreadsheet via SpreadsheetApp",
  },
  {
    assignmentId: "apps-script-05-menus-and-dialogs",
    track: "apps-script",
    order: 5,
    title: "Custom menus and dialogs",
  },
  {
    assignmentId: "apps-script-06-macros",
    track: "apps-script",
    order: 6,
    title: "Macros: record, edit, share",
  },
  {
    assignmentId: "apps-script-07-simple-triggers",
    track: "apps-script",
    order: 7,
    title: "Simple triggers: onOpen, onEdit, onSelectionChange",
  },
  {
    assignmentId: "apps-script-08-installable-triggers",
    track: "apps-script",
    order: 8,
    title: "Installable triggers: time-driven, edit-driven with auth",
  },
  {
    assignmentId: "apps-script-09-sidebars-and-dialogs",
    track: "apps-script",
    order: 9,
    title: "Sidebars and modal dialogs (HtmlService)",
  },
  {
    assignmentId: "apps-script-10-workspace-integrations",
    track: "apps-script",
    order: 10,
    title: "Workspace integrations: Drive, Calendar, Gmail",
  },
  {
    assignmentId: "apps-script-11-external-apis",
    track: "apps-script",
    order: 11,
    title: "External APIs from Apps Script: UrlFetchApp, OAuth, Slack / Linear / GitHub",
  },
  {
    assignmentId: "apps-script-12-libraries-and-deployments",
    track: "apps-script",
    order: 12,
    title: "Apps Script libraries and deployments",
  },
  {
    assignmentId: "apps-script-13-web-apps",
    track: "apps-script",
    order: 13,
    title: "Web apps from Apps Script: doGet/doPost, deployment URLs",
  },
  {
    assignmentId: "apps-script-14-logging-and-errors",
    track: "apps-script",
    order: 14,
    title: "Logging, error handling, and Cloud Logging",
  },
  {
    assignmentId: "apps-script-15-properties-and-cache",
    track: "apps-script",
    order: 15,
    title: "PropertiesService and CacheService",
  },
  {
    assignmentId: "apps-script-16-quotas-and-batching",
    track: "apps-script",
    order: 16,
    title: "Quotas and batching best practices",
  },
  {
    assignmentId: "apps-script-17-advanced-sheets-service",
    track: "apps-script",
    order: 17,
    title: "Apps Script + the Sheets advanced service",
  },
  {
    assignmentId: "scale-01-cell-limit",
    track: "scale",
    order: 1,
    title: "The 10M cell limit and what hits it",
  },
  {
    assignmentId: "scale-02-why-its-slow",
    track: "scale",
    order: 2,
    title: "Why your sheet is slow",
  },
  {
    assignmentId: "scale-03-importrange-patterns",
    track: "scale",
    order: 3,
    title: "IMPORTRANGE patterns and pitfalls",
  },
  {
    assignmentId: "scale-03b-splitting-workbook",
    track: "scale",
    order: 3.5,
    title: "Splitting a workbook before it hits the wall",
  },
  {
    assignmentId: "scale-04-connected-sheets-bigquery",
    track: "scale",
    order: 4,
    title: "Connected Sheets and BigQuery",
  },
  {
    assignmentId: "scale-05-timesfm-forecasting",
    track: "scale",
    order: 5,
    title: "Forecasting in Connected Sheets with TimesFM",
  },
  {
    assignmentId: "scale-06-diagnosing-ref-na",
    track: "scale",
    order: 6,
    title: "Diagnosing #REF! and #N/A",
  },
  {
    assignmentId: "scale-07-diagnosing-circular",
    track: "scale",
    order: 7,
    title: "Diagnosing circular references",
  },
  {
    assignmentId: "scale-08-diagnosing-broken-importrange",
    track: "scale",
    order: 8,
    title: "Diagnosing broken IMPORTRANGE",
  },
  {
    assignmentId: "scale-09-slow-apps-script",
    track: "scale",
    order: 9,
    title: "Diagnosing slow Apps Script",
  },
  {
    assignmentId: "scale-10-recovery-and-versions",
    track: "scale",
    order: 10,
    title: "Recovering from breakage: version history",
  },
  {
    assignmentId: "scale-11-broken-sheet-clinic",
    track: "scale",
    order: 11,
    title: "A broken-sheet clinic",
  },
  {
    assignmentId: "ai-01-how-gemini-sees-sheets",
    track: "ai-in-sheets",
    order: 1,
    title: "How Gemini sees a spreadsheet",
  },
  {
    assignmentId: "ai-02-ai-function",
    track: "ai-in-sheets",
    order: 2,
    title: "The =AI() function",
  },
  {
    assignmentId: "ai-03-fill-with-gemini",
    track: "ai-in-sheets",
    order: 3,
    title: "Fill with Gemini",
  },
  {
    assignmentId: "ai-04-build-and-edit",
    track: "ai-in-sheets",
    order: 4,
    title: "Building and editing sheets with Gemini",
  },
  {
    assignmentId: "ai-05-ai-analysis",
    track: "ai-in-sheets",
    order: 5,
    title: "AI-assisted analysis",
  },
  {
    assignmentId: "ai-06-when-not-to-use",
    track: "ai-in-sheets",
    order: 6,
    title: "When NOT to use AI in Sheets",
  },
  {
    assignmentId: "capstone-01-buyer-dashboard",
    track: "capstone",
    order: 1,
    title: "The buyer dashboard capstone: building a workbook end-to-end",
  },
];

const ASSIGNMENTS: Record<string, AssignmentSpec> = {
  [gridModel.id]: gridModel,
  [comingFromExcel.id]: comingFromExcel,
  [mathTextDateLogical.id]: mathTextDateLogical,
  [lookups.id]: lookups,
  [conditionalLogic.id]: conditionalLogic,
  [aggregation.id]: aggregation,
  [textManipulation.id]: textManipulation,
  [datesAndTime.id]: datesAndTime,
  [errorHandling.id]: errorHandling,
  [arrayFormulaBasics.id]: arrayFormulaBasics,
  [sequenceRandarray.id]: sequenceRandarray,
  [queryFundamentals.id]: queryFundamentals,
  [queryInDepth.id]: queryInDepth,
  [filterSortUnique.id]: filterSortUnique,
  [splitJoinTextjoin.id]: splitJoinTextjoin,
  [regex.id]: regex,
  [tables.id]: tables,
  [lambda.id]: lambda,
  [lambdaHelpers.id]: lambdaHelpers,
  [letFn.id]: letFn,
  [namedFunctions.id]: namedFunctions,
  [advancedLookups.id]: advancedLookups,
  [statistical.id]: statistical,
  [financial.id]: financial,
  [crossSheetIndirect.id]: crossSheetIndirect,
  [sparkline.id]: sparkline,
  [importFamily.id]: importFamily,
  [performance.id]: performance,
  [workbookStructure.id]: workbookStructure,
  [pivotTablesBasics.id]: pivotTablesBasics,
  [pivotTablesInDepth.id]: pivotTablesInDepth,
  [dataValidation.id]: dataValidation,
  [smartChips.id]: smartChips,
  [conditionalFormatting.id]: conditionalFormatting,
  [protectedRanges.id]: protectedRanges,
  [filterViews.id]: filterViews,
  [chartsChoosing.id]: chartsChoosing,
  [chartsCustomization.id]: chartsCustomization,
  [chartsForReports.id]: chartsForReports,
  [sharingPermissions.id]: sharingPermissions,
  [formsSheetsPipeline.id]: formsSheetsPipeline,
  [dataCleanupRecipes.id]: dataCleanupRecipes,
  [numberFormatting.id]: numberFormatting,
  [sheetLinking.id]: sheetLinking,
  [commentsAndNotes.id]: commentsAndNotes,
  [performanceHygiene.id]: performanceHygiene,
  [appsScriptEditor.id]: appsScriptEditor,
  [appsScriptExecutionModel.id]: appsScriptExecutionModel,
  [customFunctions.id]: customFunctions,
  [spreadsheetApp.id]: spreadsheetApp,
  [menusAndDialogs.id]: menusAndDialogs,
  [macros.id]: macros,
  [simpleTriggers.id]: simpleTriggers,
  [installableTriggers.id]: installableTriggers,
  [sidebarsAndDialogs.id]: sidebarsAndDialogs,
  [workspaceIntegrations.id]: workspaceIntegrations,
  [externalApis.id]: externalApis,
  [librariesAndDeployments.id]: librariesAndDeployments,
  [webApps.id]: webApps,
  [loggingAndErrors.id]: loggingAndErrors,
  [propertiesAndCache.id]: propertiesAndCache,
  [quotasAndBatching.id]: quotasAndBatching,
  [advancedSheetsService.id]: advancedSheetsService,
  [cellLimit.id]: cellLimit,
  [whyItsSlow.id]: whyItsSlow,
  [importrangePatterns.id]: importrangePatterns,
  [splittingWorkbook.id]: splittingWorkbook,
  [connectedSheetsBigquery.id]: connectedSheetsBigquery,
  [timesfmForecasting.id]: timesfmForecasting,
  [diagnosingRefNa.id]: diagnosingRefNa,
  [diagnosingCircular.id]: diagnosingCircular,
  [diagnosingBrokenImportrange.id]: diagnosingBrokenImportrange,
  [slowAppsScript.id]: slowAppsScript,
  [recoveryAndVersions.id]: recoveryAndVersions,
  [brokenSheetClinic.id]: brokenSheetClinic,
  [aiHowGeminiSeesSheets.id]: aiHowGeminiSeesSheets,
  [aiFunction.id]: aiFunction,
  [fillWithGemini.id]: fillWithGemini,
  [buildAndEdit.id]: buildAndEdit,
  [aiAnalysis.id]: aiAnalysis,
  [whenNotToUseAi.id]: whenNotToUseAi,
  [buyerDashboardCapstone.id]: buyerDashboardCapstone,
};

type LessonModuleLoader = () => Promise<{ default: ComponentType }>;

const LESSON_MODULES_EN: Record<string, LessonModuleLoader> = {
  "formulas-01-grid-model": () =>
    import("@/content/en/lessons/formulas/01-grid-model/lesson.mdx"),
  "formulas-02-coming-from-excel": () =>
    import("@/content/en/lessons/formulas/02-coming-from-excel/lesson.mdx"),
  "formulas-03-math-text-date-logical": () =>
    import("@/content/en/lessons/formulas/03-math-text-date-logical/lesson.mdx"),
  "formulas-04-lookups": () =>
    import("@/content/en/lessons/formulas/04-lookups/lesson.mdx"),
  "formulas-05-conditional-logic": () =>
    import("@/content/en/lessons/formulas/05-conditional-logic/lesson.mdx"),
  "formulas-06-aggregation": () =>
    import("@/content/en/lessons/formulas/06-aggregation/lesson.mdx"),
  "formulas-07-text-manipulation": () =>
    import("@/content/en/lessons/formulas/07-text-manipulation/lesson.mdx"),
  "formulas-08-dates-and-time": () =>
    import("@/content/en/lessons/formulas/08-dates-and-time/lesson.mdx"),
  "formulas-09-error-handling": () =>
    import("@/content/en/lessons/formulas/09-error-handling/lesson.mdx"),
  "formulas-10-arrayformula-basics": () =>
    import("@/content/en/lessons/formulas/10-arrayformula-basics/lesson.mdx"),
  "formulas-11-sequence-randarray": () =>
    import("@/content/en/lessons/formulas/11-sequence-randarray/lesson.mdx"),
  "formulas-12-query-fundamentals": () =>
    import("@/content/en/lessons/formulas/12-query-fundamentals/lesson.mdx"),
  "formulas-13-query-in-depth": () =>
    import("@/content/en/lessons/formulas/13-query-in-depth/lesson.mdx"),
  "formulas-14-filter-sort-unique": () =>
    import("@/content/en/lessons/formulas/14-filter-sort-unique/lesson.mdx"),
  "formulas-15-split-join-textjoin": () =>
    import("@/content/en/lessons/formulas/15-split-join-textjoin/lesson.mdx"),
  "formulas-16-regex": () =>
    import("@/content/en/lessons/formulas/16-regex/lesson.mdx"),
  "formulas-17-tables": () =>
    import("@/content/en/lessons/formulas/17-tables/lesson.mdx"),
  "formulas-18-lambda": () =>
    import("@/content/en/lessons/formulas/18-lambda/lesson.mdx"),
  "formulas-19-lambda-helpers": () =>
    import("@/content/en/lessons/formulas/19-lambda-helpers/lesson.mdx"),
  "formulas-20-let": () =>
    import("@/content/en/lessons/formulas/20-let/lesson.mdx"),
  "formulas-21-named-functions": () =>
    import("@/content/en/lessons/formulas/21-named-functions/lesson.mdx"),
  "formulas-22-advanced-lookups": () =>
    import("@/content/en/lessons/formulas/22-advanced-lookups/lesson.mdx"),
  "formulas-23-statistical": () =>
    import("@/content/en/lessons/formulas/23-statistical/lesson.mdx"),
  "formulas-24-financial": () =>
    import("@/content/en/lessons/formulas/24-financial/lesson.mdx"),
  "formulas-25-cross-sheet-indirect": () =>
    import("@/content/en/lessons/formulas/25-cross-sheet-indirect/lesson.mdx"),
  "formulas-26-sparkline": () =>
    import("@/content/en/lessons/formulas/26-sparkline/lesson.mdx"),
  "formulas-27-import-family": () =>
    import("@/content/en/lessons/formulas/27-import-family/lesson.mdx"),
  "formulas-28-performance": () =>
    import("@/content/en/lessons/formulas/28-performance/lesson.mdx"),
  "modeling-01-workbook-structure": () =>
    import("@/content/en/lessons/modeling/01-workbook-structure/lesson.mdx"),
  "modeling-02-pivot-tables-basics": () =>
    import("@/content/en/lessons/modeling/02-pivot-tables-basics/lesson.mdx"),
  "modeling-03-pivot-tables-in-depth": () =>
    import("@/content/en/lessons/modeling/03-pivot-tables-in-depth/lesson.mdx"),
  "modeling-04-data-validation": () =>
    import("@/content/en/lessons/modeling/04-data-validation/lesson.mdx"),
  "modeling-05-smart-chips": () =>
    import("@/content/en/lessons/modeling/05-smart-chips/lesson.mdx"),
  "modeling-06-conditional-formatting": () =>
    import("@/content/en/lessons/modeling/06-conditional-formatting/lesson.mdx"),
  "modeling-07-protected-ranges": () =>
    import("@/content/en/lessons/modeling/07-protected-ranges/lesson.mdx"),
  "modeling-08-filter-views": () =>
    import("@/content/en/lessons/modeling/08-filter-views/lesson.mdx"),
  "modeling-09-charts-choosing": () =>
    import("@/content/en/lessons/modeling/09-charts-choosing/lesson.mdx"),
  "modeling-10-charts-customization": () =>
    import("@/content/en/lessons/modeling/10-charts-customization/lesson.mdx"),
  "modeling-11-charts-for-reports": () =>
    import("@/content/en/lessons/modeling/11-charts-for-reports/lesson.mdx"),
  "modeling-12-sharing-permissions": () =>
    import("@/content/en/lessons/modeling/12-sharing-permissions/lesson.mdx"),
  "modeling-13-forms-sheets-pipeline": () =>
    import("@/content/en/lessons/modeling/13-forms-sheets-pipeline/lesson.mdx"),
  "modeling-14-data-cleanup-recipes": () =>
    import("@/content/en/lessons/modeling/14-data-cleanup-recipes/lesson.mdx"),
  "modeling-15-number-formatting": () =>
    import("@/content/en/lessons/modeling/15-number-formatting/lesson.mdx"),
  "modeling-16-sheet-linking": () =>
    import("@/content/en/lessons/modeling/16-sheet-linking/lesson.mdx"),
  "modeling-17-comments-and-notes": () =>
    import("@/content/en/lessons/modeling/17-comments-and-notes/lesson.mdx"),
  "modeling-18-performance-hygiene": () =>
    import("@/content/en/lessons/modeling/18-performance-hygiene/lesson.mdx"),
  "apps-script-01-editor-and-project": () =>
    import("@/content/en/lessons/apps-script/01-editor-and-project/lesson.mdx"),
  "apps-script-02-execution-model": () =>
    import("@/content/en/lessons/apps-script/02-execution-model/lesson.mdx"),
  "apps-script-03-custom-functions": () =>
    import("@/content/en/lessons/apps-script/03-custom-functions/lesson.mdx"),
  "apps-script-04-spreadsheetapp": () =>
    import("@/content/en/lessons/apps-script/04-spreadsheetapp/lesson.mdx"),
  "apps-script-05-menus-and-dialogs": () =>
    import("@/content/en/lessons/apps-script/05-menus-and-dialogs/lesson.mdx"),
  "apps-script-06-macros": () =>
    import("@/content/en/lessons/apps-script/06-macros/lesson.mdx"),
  "apps-script-07-simple-triggers": () =>
    import("@/content/en/lessons/apps-script/07-simple-triggers/lesson.mdx"),
  "apps-script-08-installable-triggers": () =>
    import("@/content/en/lessons/apps-script/08-installable-triggers/lesson.mdx"),
  "apps-script-09-sidebars-and-dialogs": () =>
    import("@/content/en/lessons/apps-script/09-sidebars-and-dialogs/lesson.mdx"),
  "apps-script-10-workspace-integrations": () =>
    import("@/content/en/lessons/apps-script/10-workspace-integrations/lesson.mdx"),
  "apps-script-11-external-apis": () =>
    import("@/content/en/lessons/apps-script/11-external-apis/lesson.mdx"),
  "apps-script-12-libraries-and-deployments": () =>
    import("@/content/en/lessons/apps-script/12-libraries-and-deployments/lesson.mdx"),
  "apps-script-13-web-apps": () =>
    import("@/content/en/lessons/apps-script/13-web-apps/lesson.mdx"),
  "apps-script-14-logging-and-errors": () =>
    import("@/content/en/lessons/apps-script/14-logging-and-errors/lesson.mdx"),
  "apps-script-15-properties-and-cache": () =>
    import("@/content/en/lessons/apps-script/15-properties-and-cache/lesson.mdx"),
  "apps-script-16-quotas-and-batching": () =>
    import("@/content/en/lessons/apps-script/16-quotas-and-batching/lesson.mdx"),
  "apps-script-17-advanced-sheets-service": () =>
    import("@/content/en/lessons/apps-script/17-advanced-sheets-service/lesson.mdx"),
  "scale-01-cell-limit": () =>
    import("@/content/en/lessons/scale/01-cell-limit/lesson.mdx"),
  "scale-02-why-its-slow": () =>
    import("@/content/en/lessons/scale/02-why-its-slow/lesson.mdx"),
  "scale-03-importrange-patterns": () =>
    import("@/content/en/lessons/scale/03-importrange-patterns/lesson.mdx"),
  "scale-03b-splitting-workbook": () =>
    import("@/content/en/lessons/scale/03b-splitting-workbook/lesson.mdx"),
  "scale-04-connected-sheets-bigquery": () =>
    import("@/content/en/lessons/scale/04-connected-sheets-bigquery/lesson.mdx"),
  "scale-05-timesfm-forecasting": () =>
    import("@/content/en/lessons/scale/05-timesfm-forecasting/lesson.mdx"),
  "scale-06-diagnosing-ref-na": () =>
    import("@/content/en/lessons/scale/06-diagnosing-ref-na/lesson.mdx"),
  "scale-07-diagnosing-circular": () =>
    import("@/content/en/lessons/scale/07-diagnosing-circular/lesson.mdx"),
  "scale-08-diagnosing-broken-importrange": () =>
    import("@/content/en/lessons/scale/08-diagnosing-broken-importrange/lesson.mdx"),
  "scale-09-slow-apps-script": () =>
    import("@/content/en/lessons/scale/09-slow-apps-script/lesson.mdx"),
  "scale-10-recovery-and-versions": () =>
    import("@/content/en/lessons/scale/10-recovery-and-versions/lesson.mdx"),
  "scale-11-broken-sheet-clinic": () =>
    import("@/content/en/lessons/scale/11-broken-sheet-clinic/lesson.mdx"),
  "ai-01-how-gemini-sees-sheets": () =>
    import("@/content/en/lessons/ai-in-sheets/01-how-gemini-sees-sheets/lesson.mdx"),
  "ai-02-ai-function": () =>
    import("@/content/en/lessons/ai-in-sheets/02-ai-function/lesson.mdx"),
  "ai-03-fill-with-gemini": () =>
    import("@/content/en/lessons/ai-in-sheets/03-fill-with-gemini/lesson.mdx"),
  "ai-04-build-and-edit": () =>
    import("@/content/en/lessons/ai-in-sheets/04-build-and-edit/lesson.mdx"),
  "ai-05-ai-analysis": () =>
    import("@/content/en/lessons/ai-in-sheets/05-ai-analysis/lesson.mdx"),
  "ai-06-when-not-to-use": () =>
    import("@/content/en/lessons/ai-in-sheets/06-when-not-to-use/lesson.mdx"),
  "capstone-01-buyer-dashboard": () =>
    import("@/content/en/lessons/capstone/01-buyer-dashboard/lesson.mdx"),
};

// Hebrew lesson modules. Entries get added one at a time as each lesson is
// translated. Missing entries fall back to English and the UI shows a
// "translation in progress" badge for that lesson.
const LESSON_MODULES_HE: Record<string, LessonModuleLoader> = {
  "formulas-01-grid-model": () =>
    import("@/content/he/lessons/formulas/01-grid-model/lesson.mdx"),
  "formulas-02-coming-from-excel": () =>
    import("@/content/he/lessons/formulas/02-coming-from-excel/lesson.mdx"),
  "formulas-03-math-text-date-logical": () =>
    import("@/content/he/lessons/formulas/03-math-text-date-logical/lesson.mdx"),
  "formulas-04-lookups": () =>
    import("@/content/he/lessons/formulas/04-lookups/lesson.mdx"),
  "formulas-05-conditional-logic": () =>
    import("@/content/he/lessons/formulas/05-conditional-logic/lesson.mdx"),
  "formulas-06-aggregation": () =>
    import("@/content/he/lessons/formulas/06-aggregation/lesson.mdx"),
  "formulas-07-text-manipulation": () =>
    import("@/content/he/lessons/formulas/07-text-manipulation/lesson.mdx"),
  "formulas-08-dates-and-time": () =>
    import("@/content/he/lessons/formulas/08-dates-and-time/lesson.mdx"),
  "formulas-09-error-handling": () =>
    import("@/content/he/lessons/formulas/09-error-handling/lesson.mdx"),
  "formulas-10-arrayformula-basics": () =>
    import("@/content/he/lessons/formulas/10-arrayformula-basics/lesson.mdx"),
  "formulas-11-sequence-randarray": () =>
    import("@/content/he/lessons/formulas/11-sequence-randarray/lesson.mdx"),
  "formulas-12-query-fundamentals": () =>
    import("@/content/he/lessons/formulas/12-query-fundamentals/lesson.mdx"),
  "formulas-13-query-in-depth": () =>
    import("@/content/he/lessons/formulas/13-query-in-depth/lesson.mdx"),
  "formulas-14-filter-sort-unique": () =>
    import("@/content/he/lessons/formulas/14-filter-sort-unique/lesson.mdx"),
  "formulas-15-split-join-textjoin": () =>
    import("@/content/he/lessons/formulas/15-split-join-textjoin/lesson.mdx"),
  "formulas-16-regex": () =>
    import("@/content/he/lessons/formulas/16-regex/lesson.mdx"),
  "formulas-17-tables": () =>
    import("@/content/he/lessons/formulas/17-tables/lesson.mdx"),
  "formulas-18-lambda": () =>
    import("@/content/he/lessons/formulas/18-lambda/lesson.mdx"),
  "formulas-19-lambda-helpers": () =>
    import("@/content/he/lessons/formulas/19-lambda-helpers/lesson.mdx"),
  "formulas-20-let": () =>
    import("@/content/he/lessons/formulas/20-let/lesson.mdx"),
  "formulas-21-named-functions": () =>
    import("@/content/he/lessons/formulas/21-named-functions/lesson.mdx"),
  "formulas-22-advanced-lookups": () =>
    import("@/content/he/lessons/formulas/22-advanced-lookups/lesson.mdx"),
  "formulas-23-statistical": () =>
    import("@/content/he/lessons/formulas/23-statistical/lesson.mdx"),
  "formulas-24-financial": () =>
    import("@/content/he/lessons/formulas/24-financial/lesson.mdx"),
  "formulas-25-cross-sheet-indirect": () =>
    import("@/content/he/lessons/formulas/25-cross-sheet-indirect/lesson.mdx"),
  "formulas-26-sparkline": () =>
    import("@/content/he/lessons/formulas/26-sparkline/lesson.mdx"),
  "formulas-27-import-family": () =>
    import("@/content/he/lessons/formulas/27-import-family/lesson.mdx"),
  "formulas-28-performance": () =>
    import("@/content/he/lessons/formulas/28-performance/lesson.mdx"),
  "modeling-01-workbook-structure": () =>
    import("@/content/he/lessons/modeling/01-workbook-structure/lesson.mdx"),
  "modeling-02-pivot-tables-basics": () =>
    import("@/content/he/lessons/modeling/02-pivot-tables-basics/lesson.mdx"),
  "modeling-03-pivot-tables-in-depth": () =>
    import("@/content/he/lessons/modeling/03-pivot-tables-in-depth/lesson.mdx"),
  "modeling-04-data-validation": () =>
    import("@/content/he/lessons/modeling/04-data-validation/lesson.mdx"),
  "modeling-05-smart-chips": () =>
    import("@/content/he/lessons/modeling/05-smart-chips/lesson.mdx"),
  "modeling-06-conditional-formatting": () =>
    import("@/content/he/lessons/modeling/06-conditional-formatting/lesson.mdx"),
  "modeling-07-protected-ranges": () =>
    import("@/content/he/lessons/modeling/07-protected-ranges/lesson.mdx"),
  "modeling-08-filter-views": () =>
    import("@/content/he/lessons/modeling/08-filter-views/lesson.mdx"),
  "modeling-09-charts-choosing": () =>
    import("@/content/he/lessons/modeling/09-charts-choosing/lesson.mdx"),
  "modeling-10-charts-customization": () =>
    import("@/content/he/lessons/modeling/10-charts-customization/lesson.mdx"),
  "modeling-11-charts-for-reports": () =>
    import("@/content/he/lessons/modeling/11-charts-for-reports/lesson.mdx"),
  "modeling-12-sharing-permissions": () =>
    import("@/content/he/lessons/modeling/12-sharing-permissions/lesson.mdx"),
  "modeling-13-forms-sheets-pipeline": () =>
    import("@/content/he/lessons/modeling/13-forms-sheets-pipeline/lesson.mdx"),
  "modeling-14-data-cleanup-recipes": () =>
    import("@/content/he/lessons/modeling/14-data-cleanup-recipes/lesson.mdx"),
  "modeling-15-number-formatting": () =>
    import("@/content/he/lessons/modeling/15-number-formatting/lesson.mdx"),
  "modeling-16-sheet-linking": () =>
    import("@/content/he/lessons/modeling/16-sheet-linking/lesson.mdx"),
  "modeling-17-comments-and-notes": () =>
    import("@/content/he/lessons/modeling/17-comments-and-notes/lesson.mdx"),
  "modeling-18-performance-hygiene": () =>
    import("@/content/he/lessons/modeling/18-performance-hygiene/lesson.mdx"),
  "apps-script-01-editor-and-project": () =>
    import("@/content/he/lessons/apps-script/01-editor-and-project/lesson.mdx"),
  "apps-script-02-execution-model": () =>
    import("@/content/he/lessons/apps-script/02-execution-model/lesson.mdx"),
  "apps-script-03-custom-functions": () =>
    import("@/content/he/lessons/apps-script/03-custom-functions/lesson.mdx"),
  "apps-script-04-spreadsheetapp": () =>
    import("@/content/he/lessons/apps-script/04-spreadsheetapp/lesson.mdx"),
  "apps-script-05-menus-and-dialogs": () =>
    import("@/content/he/lessons/apps-script/05-menus-and-dialogs/lesson.mdx"),
  "apps-script-06-macros": () =>
    import("@/content/he/lessons/apps-script/06-macros/lesson.mdx"),
  "apps-script-07-simple-triggers": () =>
    import("@/content/he/lessons/apps-script/07-simple-triggers/lesson.mdx"),
  "apps-script-08-installable-triggers": () =>
    import("@/content/he/lessons/apps-script/08-installable-triggers/lesson.mdx"),
  "apps-script-09-sidebars-and-dialogs": () =>
    import("@/content/he/lessons/apps-script/09-sidebars-and-dialogs/lesson.mdx"),
  "apps-script-10-workspace-integrations": () =>
    import("@/content/he/lessons/apps-script/10-workspace-integrations/lesson.mdx"),
  "apps-script-11-external-apis": () =>
    import("@/content/he/lessons/apps-script/11-external-apis/lesson.mdx"),
  "apps-script-12-libraries-and-deployments": () =>
    import("@/content/he/lessons/apps-script/12-libraries-and-deployments/lesson.mdx"),
  "apps-script-13-web-apps": () =>
    import("@/content/he/lessons/apps-script/13-web-apps/lesson.mdx"),
  "apps-script-14-logging-and-errors": () =>
    import("@/content/he/lessons/apps-script/14-logging-and-errors/lesson.mdx"),
  "apps-script-15-properties-and-cache": () =>
    import("@/content/he/lessons/apps-script/15-properties-and-cache/lesson.mdx"),
  "apps-script-16-quotas-and-batching": () =>
    import("@/content/he/lessons/apps-script/16-quotas-and-batching/lesson.mdx"),
  "apps-script-17-advanced-sheets-service": () =>
    import("@/content/he/lessons/apps-script/17-advanced-sheets-service/lesson.mdx"),
  "scale-01-cell-limit": () =>
    import("@/content/he/lessons/scale/01-cell-limit/lesson.mdx"),
  "scale-02-why-its-slow": () =>
    import("@/content/he/lessons/scale/02-why-its-slow/lesson.mdx"),
  "scale-03-importrange-patterns": () =>
    import("@/content/he/lessons/scale/03-importrange-patterns/lesson.mdx"),
  "scale-03b-splitting-workbook": () =>
    import("@/content/he/lessons/scale/03b-splitting-workbook/lesson.mdx"),
  "scale-04-connected-sheets-bigquery": () =>
    import("@/content/he/lessons/scale/04-connected-sheets-bigquery/lesson.mdx"),
  "scale-05-timesfm-forecasting": () =>
    import("@/content/he/lessons/scale/05-timesfm-forecasting/lesson.mdx"),
  "scale-06-diagnosing-ref-na": () =>
    import("@/content/he/lessons/scale/06-diagnosing-ref-na/lesson.mdx"),
  "scale-07-diagnosing-circular": () =>
    import("@/content/he/lessons/scale/07-diagnosing-circular/lesson.mdx"),
  "scale-08-diagnosing-broken-importrange": () =>
    import("@/content/he/lessons/scale/08-diagnosing-broken-importrange/lesson.mdx"),
  "scale-09-slow-apps-script": () =>
    import("@/content/he/lessons/scale/09-slow-apps-script/lesson.mdx"),
  "scale-10-recovery-and-versions": () =>
    import("@/content/he/lessons/scale/10-recovery-and-versions/lesson.mdx"),
  "scale-11-broken-sheet-clinic": () =>
    import("@/content/he/lessons/scale/11-broken-sheet-clinic/lesson.mdx"),
  "ai-01-how-gemini-sees-sheets": () =>
    import("@/content/he/lessons/ai-in-sheets/01-how-gemini-sees-sheets/lesson.mdx"),
  "ai-02-ai-function": () =>
    import("@/content/he/lessons/ai-in-sheets/02-ai-function/lesson.mdx"),
  "ai-03-fill-with-gemini": () =>
    import("@/content/he/lessons/ai-in-sheets/03-fill-with-gemini/lesson.mdx"),
  "ai-04-build-and-edit": () =>
    import("@/content/he/lessons/ai-in-sheets/04-build-and-edit/lesson.mdx"),
  "ai-05-ai-analysis": () =>
    import("@/content/he/lessons/ai-in-sheets/05-ai-analysis/lesson.mdx"),
  "ai-06-when-not-to-use": () =>
    import("@/content/he/lessons/ai-in-sheets/06-when-not-to-use/lesson.mdx"),
  "capstone-01-buyer-dashboard": () =>
    import("@/content/he/lessons/capstone/01-buyer-dashboard/lesson.mdx"),
};

const LESSON_MODULES_BY_LOCALE: Record<Locale, Record<string, LessonModuleLoader>> = {
  en: LESSON_MODULES_EN,
  he: LESSON_MODULES_HE,
};

export function getAssignment(id: string): AssignmentSpec | null {
  return ASSIGNMENTS[id] ?? null;
}

// Serializable task summary derived from an assignment's rules. Used by the
// in-sheet sidebar companion to render the per-task checklist before any
// grading has run. Excludes the rule.run() function since that's not
// transferable to a client component.
export type TaskSummary = {
  ruleId: string;
  label: string;
  labelHe?: string;
  answer?: string;
};

export function getAssignmentTasks(id: string): TaskSummary[] | null {
  const assignment = ASSIGNMENTS[id];
  if (!assignment) return null;
  return assignment.rules.map((r) => ({
    ruleId: r.id,
    label: r.label,
    ...(r.labelHe ? { labelHe: r.labelHe } : {}),
    ...(r.answer ? { answer: r.answer } : {}),
  }));
}

export function listAssignments(): AssignmentSpec[] {
  return Object.values(ASSIGNMENTS);
}

export function getLessonInfo(assignmentId: string): LessonInfo | null {
  return LESSON_INFO.find((l) => l.assignmentId === assignmentId) ?? null;
}

// Localized lesson titles. Keys not present here fall back to the English
// title in LESSON_INFO. Mirrors the locale-aware MDX loader: only lessons
// with full Hebrew content get translated titles for now.
const LESSON_TITLES_HE: Record<string, string> = {
  "formulas-01-grid-model": "המודל של הגיליון",
  "formulas-02-coming-from-excel": "מגיעים מ-Excel",
  "formulas-03-math-text-date-logical":
    "פונקציות מתמטיות, טקסט, תאריך ולוגיות",
  "formulas-04-lookups": "Lookups: VLOOKUP, INDEX/MATCH, XLOOKUP",
  "formulas-05-conditional-logic":
    "לוגיקה מותנית: IF, IFS, SWITCH, AND, OR",
  "formulas-06-aggregation": "אגרגציה: SUM, AVERAGE, COUNTIF, SUMIF",
  "formulas-07-text-manipulation":
    "מניפולציה של טקסט: LEFT, RIGHT, MID, FIND, SUBSTITUTE",
  "formulas-08-dates-and-time":
    "תאריכים וזמן: TODAY, EOMONTH, NETWORKDAYS, DATEDIF",
  "formulas-09-error-handling": "טיפול בשגיאות: IFERROR, IFNA, ISNA",
  "formulas-10-arrayformula-basics": "Array formulas: יסודות ARRAYFORMULA",
  "formulas-11-sequence-randarray":
    "מחוללי מערכים דינמיים: SEQUENCE, RANDARRAY, MAKEARRAY",
  "formulas-12-query-fundamentals": "QUERY: יסודות של SQL בתוך Sheets",
  "formulas-13-query-in-depth": "QUERY לעומק: GROUP BY, PIVOT, LABEL",
  "formulas-14-filter-sort-unique": "FILTER, SORT, UNIQUE",
  "formulas-15-split-join-textjoin": "SPLIT, JOIN, TEXTJOIN, FLATTEN",
  "formulas-16-regex": "REGEX לעומק: REGEXMATCH, REGEXEXTRACT, REGEXREPLACE",
  "formulas-17-tables": "Tables: טווחים מובנים שלא נשברים",
  "formulas-18-lambda": "LAMBDA: פונקציות משלכם בתוך נוסחה",
  "formulas-19-lambda-helpers": "MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY",
  "formulas-20-let": "LET: שם לערכי ביניים בתוך נוסחה",
  "formulas-21-named-functions":
    "Named functions: בונים את אוצר המילים של הצוות",
  "formulas-22-advanced-lookups":
    "Lookups מתקדמים: דו-כיווניים, דינמיים, ומעבר ל-VLOOKUP",
  "formulas-23-statistical": "פונקציות סטטיסטיות: לראות מעבר לממוצע",
  "formulas-24-financial": "פונקציות פיננסיות: NPV, IRR, PMT וחברים",
  "formulas-25-cross-sheet-indirect":
    "References בין-גיליונות ו-INDIRECT",
  "formulas-26-sparkline": "SPARKLINE: charts בתוך תאים",
  "formulas-27-import-family": "IMPORTRANGE ומשפחת ה-IMPORT",
  "formulas-28-performance":
    "ביצועי נוסחאות: spreadsheets איטיים שהופכים מהירים",
  "modeling-01-workbook-structure": "מבנה של spreadsheet: ברור מההתחלה",
  "modeling-02-pivot-tables-basics":
    "Pivot tables: rows, columns, values, calculated fields",
  "modeling-03-pivot-tables-in-depth":
    "Pivot tables לעומק: filters, multi-value, calculated fields",
  "modeling-04-data-validation":
    "Data validation: רשימות, תנאים, נוסחאות מותאמות",
  "modeling-05-smart-chips":
    "Drop-downs ו-smart chips: people, file, finance, date, place chips",
  "modeling-06-conditional-formatting":
    "Conditional formatting: כללי ונוסחתי",
  "modeling-07-protected-ranges":
    "טווחים מוגנים והגנה ברמת הגיליון",
  "modeling-08-filter-views":
    "Filter views: סינונים פרטיים בלי להפריע לאחרים",
  "modeling-09-charts-choosing":
    "Charts: בחירת סוג ה-chart הנכון",
  "modeling-10-charts-customization":
    "Charts: התאמת צירים, labels, וסדרה משנית",
  "modeling-11-charts-for-reports":
    "Charts לדוחות: עיצוב מוכן לייצוא",
  "modeling-12-sharing-permissions": "שיתוף והרשאות",
  "modeling-13-forms-sheets-pipeline": "Forms → Sheets pipeline",
  "modeling-14-data-cleanup-recipes": "מתכוני ניקוי נתונים",
  "modeling-15-number-formatting":
    "עיצוב מספרים: פורמטים מותאמים, מלכודות locale",
  "modeling-16-sheet-linking":
    "קישור בין גיליונות: ניווט וקישוריות HYPERLINK",
  "modeling-17-comments-and-notes":
    "הערות, הצעות, וזרמי סקירה",
  "modeling-18-performance-hygiene":
    "היגיינת ביצועים ב-spreadsheet",
  "apps-script-01-editor-and-project":
    "עורך Apps Script ומבנה הפרויקט",
  "apps-script-02-execution-model":
    "מודל ההרצה: V8, services, quotas, scopes",
  "apps-script-03-custom-functions":
    "Custom functions: כתיבה, שמות, ו-metadata להשלמה אוטומטית",
  "apps-script-04-spreadsheetapp":
    "SpreadsheetApp: קריאה וכתיבה ל-spreadsheet מהקוד",
  "apps-script-05-menus-and-dialogs":
    "תפריטים מותאמים ו-dialogs",
  "apps-script-06-macros":
    "Macros: הקלטה, עריכה, שיתוף",
  "apps-script-07-simple-triggers":
    "Simple triggers: onOpen, onEdit, onSelectionChange",
  "apps-script-08-installable-triggers":
    "Installable triggers: time-driven, edit-driven with auth",
  "apps-script-09-sidebars-and-dialogs":
    "Sidebars ו-modal dialogs (HtmlService)",
  "apps-script-10-workspace-integrations":
    "אינטגרציות Workspace: Drive, Calendar, Gmail",
  "apps-script-11-external-apis":
    "קריאה ל-APIs חיצוניים מ-Apps Script: UrlFetchApp, OAuth, ו-Slack / Linear / GitHub",
  "apps-script-12-libraries-and-deployments":
    "ספריות ו-deployments ב-Apps Script: HEAD לעומת versioned",
  "apps-script-13-web-apps":
    "Web apps מ-Apps Script: doGet / doPost ו-URLs של deployment",
  "apps-script-14-logging-and-errors":
    "Logging, טיפול בשגיאות, וסיפור Cloud Logging",
  "apps-script-15-properties-and-cache":
    "PropertiesService ו-CacheService",
  "apps-script-16-quotas-and-batching":
    "Quotas ו-batching: לעשות ש-Apps Script ישרוד על נתונים אמיתיים",
  "apps-script-17-advanced-sheets-service":
    "Apps Script + ה-Sheets advanced service",
  "scale-01-cell-limit":
    "מגבלת 10M התאים, ומה מגיע אליה",
  "scale-02-why-its-slow":
    "למה ה-spreadsheet שלך איטי",
  "scale-03-importrange-patterns":
    "IMPORTRANGE: דפוסים ומלכודות",
  "scale-03b-splitting-workbook":
    "פיצול workbook לפני שהוא פוגע בקיר",
  "scale-04-connected-sheets-bigquery":
    "Connected Sheets ו-BigQuery",
  "scale-05-timesfm-forecasting":
    "Forecasting עם TimesFM ב-Connected Sheets",
  "scale-06-diagnosing-ref-na":
    "אבחון `#REF!` ו-`#N/A`",
  "scale-07-diagnosing-circular":
    "אבחון references מעגליים",
  "scale-08-diagnosing-broken-importrange":
    "אבחון IMPORTRANGE שבור",
  "scale-09-slow-apps-script":
    "Apps Script איטי: profiles ו-batch ops",
  "scale-10-recovery-and-versions":
    "שחזור משבירה: היסטוריית גרסאות ו-named versions",
  "scale-11-broken-sheet-clinic":
    "הקליניקה של ה-spreadsheet השבור: capstone",
  "ai-01-how-gemini-sees-sheets":
    "איך Gemini רואה spreadsheet",
  "ai-02-ai-function":
    "הפונקציה `=AI()`",
  "ai-03-fill-with-gemini":
    "Fill with Gemini",
  "ai-04-build-and-edit":
    "בנייה ועריכה של spreadsheets עם Gemini",
  "ai-05-ai-analysis":
    "ניתוח בעזרת AI",
  "ai-06-when-not-to-use":
    "מתי לא להשתמש ב-AI ב-Sheets",
  "capstone-01-buyer-dashboard":
    "Capstone של dashboard לבאיירים: בנייה מקצה לקצה",
};

export function getLocalizedLessonTitle(
  assignmentId: string,
  locale: Locale,
): string | null {
  if (locale === "he" && assignmentId in LESSON_TITLES_HE) {
    return LESSON_TITLES_HE[assignmentId]!;
  }
  return getLessonInfo(assignmentId)?.title ?? null;
}

export function isLessonTranslated(
  assignmentId: string,
  locale: Locale,
): boolean {
  if (locale === "en") return true;
  return assignmentId in LESSON_MODULES_BY_LOCALE[locale];
}

export function listLessonsByTrack(): Array<{
  track: Track;
  label: string;
  tagline: string;
  lessons: LessonInfo[];
}> {
  return TRACKS.map((t) => ({
    track: t.id,
    label: t.label,
    tagline: t.tagline,
    lessons: LESSON_INFO.filter((l) => l.track === t.id).sort(
      (a, b) => a.order - b.order,
    ),
  }));
}

export async function loadLessonComponent(
  assignmentId: string,
  locale: Locale,
): Promise<{
  Component: ComponentType;
  servedLocale: Locale;
} | null> {
  const localeMap = LESSON_MODULES_BY_LOCALE[locale];
  const fallbackMap = LESSON_MODULES_EN;
  const loader = localeMap[assignmentId] ?? fallbackMap[assignmentId];
  if (!loader) return null;
  const mod = await loader();
  const servedLocale: Locale =
    assignmentId in localeMap ? locale : "en";
  return { Component: mod.default, servedLocale };
}
