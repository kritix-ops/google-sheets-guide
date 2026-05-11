import type { script_v1 } from "googleapis";

import type { SeedScriptFile } from "@/lib/grading/types";

// Provisions a container-bound Apps Script project that hosts the
// in-sheet sidebar for a given assignment attempt. The sidebar HTML
// is a thin shell that iframes our Next.js sidebar route at
// `/{locale}/sidebar/{lessonId}?attemptId=...`. See
// _plans/2026-05-10-option-b-sidebar.md.
//
// Track 3 (Apps Script) lessons can also pass `seedScript` to seed the
// bound project with starter JavaScript files the learner edits in the
// Apps Script editor. Those files coexist with the sidebar shell in the
// same project — same scriptId — so one round of auth covers both.

const APPSSCRIPT_MANIFEST = {
  timeZone: "America/New_York",
  exceptionLogging: "STACKDRIVER",
  runtimeVersion: "V8",
  oauthScopes: [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.scriptapp",
  ],
};

// Simple `onOpen` runs without auth and can't call showSidebar(). So on the
// first menu click we install an *installable* onOpen trigger (auth'd) that
// auto-opens the sidebar on every subsequent open. First open of each new
// sheet still costs one menu click + one consent prompt.
const CODE_GS = `function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Lesson')
    .addItem('Show sidebar', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  ensureAutoOpenTrigger_();
  openSidebar_();
}

function autoShowSidebar() {
  openSidebar_();
}

function openSidebar_() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Sheets Guide');
  SpreadsheetApp.getUi().showSidebar(html);
}

function ensureAutoOpenTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'autoShowSidebar' &&
        triggers[i].getEventType() === ScriptApp.EventType.ON_OPEN) {
      return;
    }
  }
  ScriptApp.newTrigger('autoShowSidebar')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();
}
`;

function sidebarHtml(iframeUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body, html { margin: 0; padding: 0; height: 100%; background: #18181b; }
      iframe { width: 100%; height: 100vh; border: 0; display: block; }
    </style>
  </head>
  <body>
    <iframe src="${iframeUrl}"></iframe>
  </body>
</html>`;
}

export type ProvisionedSidebarScript = {
  scriptId: string;
};

export async function provisionLessonSidebar(args: {
  script: script_v1.Script;
  sheetId: string;
  attemptId: number;
  lessonAssignmentId: string;
  locale: string;
  baseUrl: string;
  // Optional starter files for Track 3 lessons. Files with names that
  // collide with the sidebar shell ("Code", "Sidebar", "appsscript") are
  // ignored to keep the sidebar working — Track 3 lessons should use
  // their own file name (e.g. "Lesson.gs").
  seedScript?: SeedScriptFile[];
}): Promise<ProvisionedSidebarScript> {
  const {
    script,
    sheetId,
    attemptId,
    lessonAssignmentId,
    locale,
    baseUrl,
    seedScript,
  } = args;

  const project = await script.projects.create({
    requestBody: {
      title: `Sheets Guide — ${lessonAssignmentId}`,
      parentId: sheetId,
    },
  });
  const scriptId = project.data.scriptId;
  if (!scriptId) {
    throw new Error("Apps Script create response missing scriptId");
  }

  const iframeUrl =
    `${baseUrl}/${locale}/sidebar/${lessonAssignmentId}` +
    `?attemptId=${attemptId}`;

  const reservedNames = new Set(["Code", "Sidebar", "appsscript"]);
  const seedFiles = (seedScript ?? []).filter(
    (f) => !reservedNames.has(f.name),
  );

  await script.projects.updateContent({
    scriptId,
    requestBody: {
      files: [
        {
          name: "appsscript",
          type: "JSON",
          source: JSON.stringify(APPSSCRIPT_MANIFEST, null, 2),
        },
        { name: "Code", type: "SERVER_JS", source: CODE_GS },
        { name: "Sidebar", type: "HTML", source: sidebarHtml(iframeUrl) },
        ...seedFiles.map((f) => ({
          name: f.name,
          type: f.type,
          source: f.source,
        })),
      ],
    },
  });

  return { scriptId };
}
