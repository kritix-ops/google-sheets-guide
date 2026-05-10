"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SpikeResult = {
  spreadsheetId: string;
  spreadsheetUrl: string;
  scriptId: string;
  iframeUrl: string;
};

export default function SpikePage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SpikeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/spike-sidebar", { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      setResult((await r.json()) as SpikeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12" dir="ltr">
      <h1 className="text-2xl font-semibold tracking-tight">Sidebar spike</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Phase 1 of <code className="font-mono text-xs">_plans/2026-05-10-option-b-sidebar.md</code>.
        Click <strong>Run spike</strong> to provision a fresh spreadsheet with a bound
        Apps Script that opens a sidebar iframing <code className="font-mono text-xs">/en/test-sidebar</code>.
      </p>

      <Button type="button" className="mt-6" onClick={run} disabled={busy}>
        {busy ? "Running..." : result ? "Run spike again" : "Run spike"}
      </Button>

      {error ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/5 p-4 font-mono text-xs text-destructive">
          {error}
        </pre>
      ) : null}

      {result ? (
        <section className="mt-6 space-y-4 rounded-md border bg-card p-6 shadow-1">
          <p className="text-sm">
            Sheet provisioned. Open it, then in the sheet click{" "}
            <strong>Lesson → Show sidebar</strong>.
          </p>
          <a
            href={result.spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Open the spreadsheet ↗
          </a>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Details</summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-surface-elevated p-3 font-mono text-[11px]">
{JSON.stringify(result, null, 2)}
            </pre>
          </details>
          <ol className="ms-4 list-decimal space-y-1 text-xs text-muted-foreground">
            <li>Open the spreadsheet (link above).</li>
            <li>On first menu use, Google asks you to authorize the bound script. Approve.</li>
            <li>Click <code>Lesson → Show sidebar</code>.</li>
            <li>The sidebar should show <strong>iframe is alive</strong> with a <code>Ping localhost</code> button.</li>
            <li>Click <code>Ping localhost</code> — should print a 200 response with timestamp.</li>
          </ol>
        </section>
      ) : null}
    </div>
  );
}
