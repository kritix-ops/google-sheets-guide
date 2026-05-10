import type { script_v1, sheets_v4 } from "googleapis";

// Phase-1 spike: prove the riskiest assumption in _plans/2026-05-10-option-b-sidebar.md.
// Provisions a throwaway spreadsheet, attaches a bound Apps Script project, and
// uploads a sidebar that iframes localhost. Throwaway after Phase 1 lands.

const APPSSCRIPT_MANIFEST = {
  timeZone: "America/New_York",
  exceptionLogging: "STACKDRIVER",
  runtimeVersion: "V8",
  oauthScopes: [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.container.ui",
  ],
};

const CODE_GS = `function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Lesson')
    .addItem('Show sidebar', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Sheets Guide — Spike');
  SpreadsheetApp.getUi().showSidebar(html);
}
`;

function sidebarHtml(iframeUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body, html { margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      iframe { width: 100%; height: 100vh; border: 0; display: block; background: #fff; }
      .fallback { padding: 16px; font-size: 13px; color: #444; }
      .fallback code { background: #f3f3f3; padding: 1px 4px; border-radius: 3px; }
    </style>
  </head>
  <body>
    <iframe src="${iframeUrl}"></iframe>
    <noscript><div class="fallback">JavaScript is required for the sidebar.</div></noscript>
  </body>
</html>`;
}

export type SpikeResult = {
  spreadsheetId: string;
  spreadsheetUrl: string;
  scriptId: string;
  iframeUrl: string;
};

export async function runSidebarSpike(args: {
  sheets: sheets_v4.Sheets;
  script: script_v1.Script;
  baseUrl: string;
  locale: string;
}): Promise<SpikeResult> {
  const { sheets, script, baseUrl, locale } = args;
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: `Sheets Guide — Sidebar Spike (${stamp})` },
      sheets: [{ properties: { title: "Spike", sheetId: 0 } }],
    },
    fields: "spreadsheetId",
  });
  const spreadsheetId = created.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error("Sheets create response missing spreadsheetId");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Spike!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["Sheets Guide sidebar spike"],
        ["Open the Lesson menu above and click \"Show sidebar\"."],
      ],
    },
  });

  const project = await script.projects.create({
    requestBody: { title: `Sheets Guide Sidebar Spike — ${stamp}`, parentId: spreadsheetId },
  });
  const scriptId = project.data.scriptId;
  if (!scriptId) {
    throw new Error("Apps Script create response missing scriptId");
  }

  const iframeUrl = `${baseUrl}/${locale}/test-sidebar?ts=${Date.now()}`;

  await script.projects.updateContent({
    scriptId,
    requestBody: {
      files: [
        { name: "appsscript", type: "JSON", source: JSON.stringify(APPSSCRIPT_MANIFEST, null, 2) },
        { name: "Code", type: "SERVER_JS", source: CODE_GS },
        { name: "Sidebar", type: "HTML", source: sidebarHtml(iframeUrl) },
      ],
    },
  });

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    scriptId,
    iframeUrl,
  };
}
