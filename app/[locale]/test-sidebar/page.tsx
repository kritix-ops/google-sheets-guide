// Phase-1 sidebar spike target. Loaded inside an Apps Script HtmlService
// iframe at `googleusercontent.com` → `http://localhost:3000/{locale}/test-sidebar`.
// Public route (allowlisted in proxy.ts) so the iframe doesn't need a session.
// Intentionally minimal — purely a smoke test that:
//   1. The iframe loads
//   2. JS runs inside it
//   3. fetch() can reach our localhost API

const inlineStyles = `
  .spike-wrap { padding: 16px; font-size: 13px; line-height: 1.5; font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif; }
  .spike-wrap h1 { font-size: 14px; font-weight: 600; margin: 0 0 8px; }
  .spike-wrap p { margin: 0 0 8px; }
  .spike-wrap code { background: rgba(127,127,127,0.15); padding: 1px 4px; border-radius: 3px; font-family: var(--font-jetbrains-mono), monospace; font-size: 12px; }
  .spike-wrap button { display: inline-block; margin-top: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; border: 1px solid currentColor; border-radius: 4px; background: transparent; color: inherit; font-family: inherit; }
  .spike-wrap button:hover { background: rgba(127,127,127,0.1); }
  .spike-wrap pre { margin-top: 8px; padding: 8px; background: rgba(127,127,127,0.1); border-radius: 4px; font-size: 11px; white-space: pre-wrap; word-break: break-word; font-family: var(--font-jetbrains-mono), monospace; }
`;

const inlineScript = `
  (function () {
    var btn = document.getElementById('spike-ping');
    var out = document.getElementById('spike-out');
    if (!btn || !out) return;
    btn.addEventListener('click', async function () {
      out.textContent = 'Pinging...';
      try {
        var r = await fetch('/api/auth/session', { credentials: 'omit' });
        var body = await r.json();
        out.textContent = r.status + ' ' + r.statusText + '\\n\\n' + JSON.stringify(body, null, 2);
      } catch (err) {
        out.textContent = 'fetch threw: ' + (err && err.message ? err.message : String(err));
      }
    });
  })();
`;

export default function TestSidebarPage() {
  const renderedAt = new Date().toISOString();
  return (
    <div className="spike-wrap">
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
      <h1>iframe is alive</h1>
      <p>
        Server rendered at <code>{renderedAt}</code>.
      </p>
      <p>
        Click the button to verify <code>fetch</code> can reach{" "}
        <code>localhost:3000</code> from inside the Apps Script sandbox.
      </p>
      <button type="button" id="spike-ping">
        Ping localhost
      </button>
      <pre id="spike-out">Click the button to see the result here.</pre>
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
    </div>
  );
}
